import { db } from "@database/postgres/client";
import {
	permissionsTable,
	role_permissionsTable,
	rolesTable,
} from "@database/postgres/schema";
import { inArray } from "drizzle-orm";

export const PERMISSION_GROUPS = ["user", "role", "permission"] as const;
export const PERMISSION_ACTIONS = [
	"list",
	"create",
	"detail",
	"edit",
	"delete",
] as const;
export const SEEDED_ROLES = ["superuser", "admin"] as const;

export const permissionCatalogue = PERMISSION_GROUPS.flatMap((group) =>
	PERMISSION_ACTIONS.map((action) => ({ name: `${group} ${action}`, group })),
);

/**
 * Idempotent: rows that exist are left alone, missing grants are added. The
 * grant read is scoped to the catalogue names, so a permission an operator
 * created later is never granted automatically.
 */
export const RBACSeeder = async (): Promise<void> => {
	await db
		.insert(permissionsTable)
		.values(permissionCatalogue)
		.onConflictDoNothing();
	await db
		.insert(rolesTable)
		.values(SEEDED_ROLES.map((name) => ({ name })))
		.onConflictDoNothing();

	const [permissions, roles] = await Promise.all([
		db
			.select({ id: permissionsTable.id })
			.from(permissionsTable)
			.where(
				inArray(
					permissionsTable.name,
					permissionCatalogue.map((permission) => permission.name),
				),
			),
		db
			.select({ id: rolesTable.id })
			.from(rolesTable)
			.where(inArray(rolesTable.name, [...SEEDED_ROLES])),
	]);

	const grants = roles.flatMap((role) =>
		permissions.map((permission) => ({
			roleId: role.id,
			permissionId: permission.id,
		})),
	);
	if (grants.length > 0) {
		await db.insert(role_permissionsTable).values(grants).onConflictDoNothing();
	}
};
