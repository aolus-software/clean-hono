import type {
	DatatableType,
	FilterField,
	PaginationResponse,
	PermissionList,
	PermissionSelectOptions,
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
	or,
	SQL,
} from "drizzle-orm";

import { db } from "../client";
import { permissionsTable } from "../schema";
import type { DbTransaction } from ".";

const permissionOrderableColumns = {
	id: permissionsTable.id,
	name: permissionsTable.name,
	group: permissionsTable.group,
	createdAt: permissionsTable.createdAt,
	updatedAt: permissionsTable.updatedAt,
};

export const permissionSortableFields = [
	"id",
	"name",
	"group",
	"createdAt",
	"updatedAt",
] as const satisfies readonly (keyof typeof permissionOrderableColumns)[];

export const permissionFilterableFields: FilterField[] = [
	"name",
	"group",
	{ field: "createdAt", kind: "date" },
	{ field: "updatedAt", kind: "date" },
];

export const permissionFilterExample: Record<string, string> = {
	name: "user list",
	group: "user",
	createdAt: "2024-01-01,2024-12-31",
	updatedAt: "2024-01-01,2024-12-31",
};

const permissionColumns = {
	id: permissionsTable.id,
	name: permissionsTable.name,
	group: permissionsTable.group,
	createdAt: permissionsTable.createdAt,
	updatedAt: permissionsTable.updatedAt,
};

export function PermissionRepository(tx?: DbTransaction) {
	const dbClient = tx || db;

	return {
		async findAll(
			query: DatatableType,
		): Promise<PaginationResponse<PermissionList>> {
			const { page, perPage, search, sort, sortDirection, filter } = query;

			DatatableToolkit.assertSort(sort, permissionSortableFields);
			DatatableToolkit.assertFilterKeys(filter, permissionFilterableFields);

			const conditions: (SQL | undefined)[] = [];
			if (search) {
				conditions.push(
					or(
						ilike(permissionsTable.name, `%${search}%`),
						ilike(permissionsTable.group, `%${search}%`),
					),
				);
			}
			if (filter?.name !== undefined) {
				conditions.push(
					ilike(permissionsTable.name, `%${filter.name.toString()}%`),
				);
			}
			if (filter?.group !== undefined) {
				conditions.push(
					ilike(permissionsTable.group, `%${filter.group.toString()}%`),
				);
			}
			if (filter?.createdAt !== undefined) {
				const { from, to } = DatatableToolkit.filterDateRange(
					filter.createdAt,
					"createdAt",
				);
				conditions.push(
					gte(permissionsTable.createdAt, from),
					lte(permissionsTable.createdAt, to),
				);
			}
			if (filter?.updatedAt !== undefined) {
				const { from, to } = DatatableToolkit.filterDateRange(
					filter.updatedAt,
					"updatedAt",
				);
				conditions.push(
					gte(permissionsTable.updatedAt, from),
					lte(permissionsTable.updatedAt, to),
				);
			}

			const where = and(...conditions);
			const orderColumn =
				permissionOrderableColumns[
					sort as keyof typeof permissionOrderableColumns
				];

			const [data, totalCount] = await Promise.all([
				dbClient
					.select(permissionColumns)
					.from(permissionsTable)
					.where(where)
					.orderBy(
						sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
					)
					.limit(perPage)
					.offset((page - 1) * perPage),
				dbClient.$count(permissionsTable, where),
			]);

			return { data, meta: { page, limit: perPage, totalCount } };
		},

		async findById(id: string): Promise<PermissionList | null> {
			const [permission] = await dbClient
				.select(permissionColumns)
				.from(permissionsTable)
				.where(eq(permissionsTable.id, id))
				.limit(1);
			return permission ?? null;
		},

		async findByName(
			name: string,
			excludeId?: string,
		): Promise<{ id: string } | null> {
			const [permission] = await dbClient
				.select({ id: permissionsTable.id })
				.from(permissionsTable)
				.where(
					and(
						eq(permissionsTable.name, name),
						excludeId ? ne(permissionsTable.id, excludeId) : undefined,
					),
				)
				.limit(1);
			return permission ?? null;
		},

		async findExistingByNames(names: string[]): Promise<{ name: string }[]> {
			if (names.length === 0) return [];
			return dbClient
				.select({ name: permissionsTable.name })
				.from(permissionsTable)
				.where(inArray(permissionsTable.name, names));
		},

		async countByIds(ids: string[]): Promise<number> {
			if (ids.length === 0) return 0;
			return dbClient.$count(
				permissionsTable,
				inArray(permissionsTable.id, ids),
			);
		},

		async createMany(data: { name: string; group: string }[]): Promise<void> {
			if (data.length === 0) return;
			await dbClient.insert(permissionsTable).values(data);
		},

		async update(
			id: string,
			data: { name: string; group: string },
		): Promise<void> {
			await dbClient
				.update(permissionsTable)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(permissionsTable.id, id));
		},

		async delete(id: string): Promise<void> {
			await dbClient
				.delete(permissionsTable)
				.where(eq(permissionsTable.id, id));
		},

		async getSelectOptions(): Promise<PermissionSelectOptions[]> {
			const permissions = await dbClient
				.select({
					id: permissionsTable.id,
					name: permissionsTable.name,
					group: permissionsTable.group,
				})
				.from(permissionsTable)
				.orderBy(asc(permissionsTable.group), asc(permissionsTable.name));

			const grouped = new Map<string, PermissionSelectOptions["permissions"]>();
			for (const permission of permissions) {
				const list = grouped.get(permission.group) ?? [];
				list.push(permission);
				grouped.set(permission.group, list);
			}

			return Array.from(grouped.entries()).map(([group, list]) => ({
				group,
				permissions: list,
			}));
		},
	};
}
