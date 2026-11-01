import type {
	DatatableType,
	FilterField,
	PaginationResponse,
	RoleDetail,
	RoleList,
} from "@types";
import { DatatableToolkit } from "@utils/hono/datatable";
import {
	and,
	asc,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	ne,
	SQL,
} from "drizzle-orm";

import { db } from "../client";
import { permissionsTable, role_permissionsTable, rolesTable } from "../schema";
import type { DbTransaction } from ".";

const roleOrderableColumns = {
	id: rolesTable.id,
	name: rolesTable.name,
	createdAt: rolesTable.createdAt,
	updatedAt: rolesTable.updatedAt,
};

export const roleSortableFields = [
	"id",
	"name",
	"createdAt",
	"updatedAt",
] as const satisfies readonly (keyof typeof roleOrderableColumns)[];

export const roleFilterableFields: FilterField[] = [
	"name",
	{ field: "createdAt", kind: "date" },
	{ field: "updatedAt", kind: "date" },
];

export const roleFilterExample: Record<string, string> = {
	name: "admin",
	createdAt: "2024-01-01,2024-12-31",
	updatedAt: "2024-01-01,2024-12-31",
};

const roleColumns = {
	id: rolesTable.id,
	name: rolesTable.name,
	createdAt: rolesTable.createdAt,
	updatedAt: rolesTable.updatedAt,
};

export function RoleRepository(tx?: DbTransaction) {
	const dbClient = tx || db;

	return {
		async findAll(query: DatatableType): Promise<PaginationResponse<RoleList>> {
			const { page, perPage, search, sort, sortDirection, filter } = query;

			DatatableToolkit.assertSort(sort, roleSortableFields);
			DatatableToolkit.assertFilterKeys(filter, roleFilterableFields);

			const conditions: (SQL | undefined)[] = [];
			if (search) {
				conditions.push(ilike(rolesTable.name, `%${search}%`));
			}
			if (filter?.name !== undefined) {
				conditions.push(ilike(rolesTable.name, `%${filter.name.toString()}%`));
			}
			if (filter?.createdAt !== undefined) {
				const { from, to } = DatatableToolkit.filterDateRange(
					filter.createdAt,
					"createdAt",
				);
				conditions.push(
					gte(rolesTable.createdAt, from),
					lte(rolesTable.createdAt, to),
				);
			}
			if (filter?.updatedAt !== undefined) {
				const { from, to } = DatatableToolkit.filterDateRange(
					filter.updatedAt,
					"updatedAt",
				);
				conditions.push(
					gte(rolesTable.updatedAt, from),
					lte(rolesTable.updatedAt, to),
				);
			}

			const where = and(...conditions);
			const orderColumn =
				roleOrderableColumns[sort as keyof typeof roleOrderableColumns];

			const [data, totalCount] = await Promise.all([
				dbClient
					.select(roleColumns)
					.from(rolesTable)
					.where(where)
					.orderBy(
						sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
					)
					.limit(perPage)
					.offset((page - 1) * perPage),
				dbClient.$count(rolesTable, where),
			]);

			return { data, meta: { page, limit: perPage, totalCount } };
		},

		async findById(id: string): Promise<RoleList | null> {
			const [role] = await dbClient
				.select(roleColumns)
				.from(rolesTable)
				.where(eq(rolesTable.id, id))
				.limit(1);
			return role ?? null;
		},

		async findByName(
			name: string,
			excludeId?: string,
		): Promise<{ id: string } | null> {
			const [role] = await dbClient
				.select({ id: rolesTable.id })
				.from(rolesTable)
				.where(
					and(
						eq(rolesTable.name, name),
						excludeId ? ne(rolesTable.id, excludeId) : undefined,
					),
				)
				.limit(1);
			return role ?? null;
		},

		async getDetail(id: string): Promise<RoleDetail | null> {
			const [role] = await dbClient
				.select(roleColumns)
				.from(rolesTable)
				.where(eq(rolesTable.id, id))
				.limit(1);
			if (!role) return null;

			const [assignedRows, allPermissions] = await Promise.all([
				dbClient
					.select({ permissionId: role_permissionsTable.permissionId })
					.from(role_permissionsTable)
					.where(eq(role_permissionsTable.roleId, id)),
				dbClient
					.select({
						id: permissionsTable.id,
						name: permissionsTable.name,
						group: permissionsTable.group,
					})
					.from(permissionsTable)
					.orderBy(asc(permissionsTable.group), asc(permissionsTable.name)),
			]);

			const assigned = new Set(assignedRows.map((row) => row.permissionId));
			const grouped = new Map<
				string,
				{ id: string; name: string; isAssigned: boolean }[]
			>();
			for (const permission of allPermissions) {
				const names = grouped.get(permission.group) ?? [];
				names.push({
					id: permission.id,
					name: permission.name,
					isAssigned: assigned.has(permission.id),
				});
				grouped.set(permission.group, names);
			}

			return {
				...role,
				permissions: Array.from(grouped.entries()).map(([group, names]) => ({
					group,
					names,
				})),
			};
		},

		async countByIds(ids: string[]): Promise<number> {
			if (ids.length === 0) return 0;
			return dbClient.$count(rolesTable, inArray(rolesTable.id, ids));
		},

		async findIdsByPermissionId(permissionId: string): Promise<string[]> {
			const rows = await dbClient
				.select({ roleId: role_permissionsTable.roleId })
				.from(role_permissionsTable)
				.where(eq(role_permissionsTable.permissionId, permissionId));
			return rows.map((row) => row.roleId);
		},

		async create(data: {
			name: string;
			permissionIds: string[];
		}): Promise<{ id: string }> {
			const [role] = await dbClient
				.insert(rolesTable)
				.values({ name: data.name })
				.returning({ id: rolesTable.id });

			const permissionIds = Array.from(new Set(data.permissionIds));
			if (permissionIds.length > 0) {
				await dbClient.insert(role_permissionsTable).values(
					permissionIds.map((permissionId) => ({
						roleId: role.id,
						permissionId,
					})),
				);
			}
			return role;
		},

		async update(
			id: string,
			data: { name: string; permissionIds: string[] },
		): Promise<void> {
			await dbClient
				.update(rolesTable)
				.set({ name: data.name, updatedAt: new Date() })
				.where(eq(rolesTable.id, id));
			await dbClient
				.delete(role_permissionsTable)
				.where(eq(role_permissionsTable.roleId, id));

			const permissionIds = Array.from(new Set(data.permissionIds));
			if (permissionIds.length > 0) {
				await dbClient
					.insert(role_permissionsTable)
					.values(
						permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
					);
			}
		},

		async delete(id: string): Promise<void> {
			await dbClient.delete(rolesTable).where(eq(rolesTable.id, id));
		},

		async getSelectOptions(): Promise<{ id: string; name: string }[]> {
			return dbClient
				.select({ id: rolesTable.id, name: rolesTable.name })
				.from(rolesTable)
				.where(ne(rolesTable.name, "superuser"))
				.orderBy(asc(rolesTable.name));
		},
	};
}
