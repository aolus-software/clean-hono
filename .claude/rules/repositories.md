# Rule: Repositories (`src/libs/database/postgres/repositories/`)

Repositories are the **only** layer that talks to Drizzle. Services consume them; route handlers never
import `db`.

## Shape — factory function

```ts
export function RoleRepository(tx?: DbTransaction) {
	const dbClient = tx || db;

	return {
		async findById(id: string): Promise<{ id: string; name: string } | null> {
			const [role] = await dbClient
				.select({ id: rolesTable.id, name: rolesTable.name })
				.from(rolesTable)
				.where(eq(rolesTable.id, id))
				.limit(1);
			return role ?? null;
		},
	};
}
```

- Called each time: `await RoleRepository().findById(id)`, or `RoleRepository(tx)` inside
  `db.transaction(async (tx) => ...)`. Never cache an instance at module scope.
- `db` is the singleton from `src/libs/database/postgres/client.ts`. Never open another `Pool`
  or `drizzle(...)` client elsewhere.
- Select exactly the columns of the DTO in `@types` and map snake_case columns to camelCase keys
  (`created_at` → `createdAt`) before returning; never return a password hash from a method whose
  name does not say so (`findForAuth`, `findByEmail` used by login).

## Read methods return `null`, they do not throw

A miss is `null`. The service decides whether it is a 404 (`services-crud.md`).

## Soft delete

`User` is soft-deleted. **Every user read includes `deleted_at IS NULL`**, including the
`UserInformation` lookup, which also requires `status = 'active'`.

## Lists — allow-lists, never raw keys

Each list repository exports, next to the factory:

```ts
export const userSortableFields = ["id", "name", "email", "status", "createdAt", "updatedAt"] as const;
export const userFilterableFields: FilterField[] = [
	{ field: "status", enum: Object.values(UserStatus) },
	"name",
	"email",
	{ field: "roleId", kind: "id" },
	{ field: "createdAt", kind: "date" },
	{ field: "updatedAt", kind: "date" },
];
```

`findAll(query: DatatableType)`:

1. `DatatableToolkit.assertSort(...)`, `assertFilterKeys(...)`, `assertFilterEnums(...)` — unknown or
   out-of-range input is a `BadRequestError` (400). A raw `sort` value never reaches `orderBy`.
2. Build one `where` from the soft-delete filter, the `search` OR-group, and **every** filter ANDed
   together (never let one filter overwrite another).
3. Run `$count` and the select in `Promise.all`, `offset((page - 1) * perPage)`, `limit(perPage)`;
   the validated `sort` key is mapped to its column through the repository's orderable-columns map.
4. Return `{ data, meta: { page, limit: perPage, totalCount } }`.

### Filter kinds

| Kind          | Value                                  | Match                               |
| ------------- | -------------------------------------- | ----------------------------------- |
| enum          | one value or a comma list              | `inArray`, each value checked       |
| `id`          | one uuid or a comma list               | `inArray` (uuids validated, 400 if not) |
| `date`        | `YYYY-MM-DD` or `start,end`            | inclusive whole days in `APP_TIMEZONE` |
| plain         | any string; a comma is literal         | `ilike '%value%'`                   |

Search over an enum column (users' `status`) casts it first (`ilike(sql`${usersTable.status}::text`, ...)`);
`ilike` on the bare `user_status` enum is a Postgres error (500).

## What repositories should NOT do

- No `throw` for business rules, no `t()`.
- No cache reads or writes, no hashing, no JWT, no mail, no queues.
- No transaction the caller did not supply — accept `tx` and let the service open it.

## File layout

One repository per aggregate, `<entity>.repository.ts`, re-exported from
`src/libs/database/postgres/repositories/index.ts` and imported via `@database`.
