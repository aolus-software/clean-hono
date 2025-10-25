import { db, role_permissionsTable, rolesTable } from "infra/postgres/index";
import { DatatableType } from "../types/datatable";
import { and, asc, desc, eq, ilike, ne, not, or, SQL } from "drizzle-orm";
import { defaultSort } from "@default/sort";
import { DatatableToolkit } from "@toolkit/datatable";
import { PaginationResponse } from "../types/pagination";
import { UnprocessableEntityError } from "../errors";
import { NotFoundError } from "../errors/not-found-error";
import { SortDirection } from "../types/sortdirection";

export type RoleList = {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
};

export type RoleDetail = {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	permissions: {
		group: string;
		names: {
			id: string;
			name: string;
			is_assigned: boolean;
		}[];
	}[];
};

export const RoleRepository = () => {
	const dbInstance = db;

	return {
		db: dbInstance,
		findAll: async (
			queryParam: DatatableType,
		): Promise<PaginationResponse<RoleList>> => {
			const page: number = queryParam.page || 1;
			const limit: number = queryParam.limit || 10;
			const search: string | null = queryParam.search || null;
			const orderBy: string = queryParam.sort ? queryParam.sort : defaultSort;
			const orderDirection: SortDirection = queryParam.sortDirection
				? queryParam.sortDirection
				: "desc";
			const filter: Record<string, boolean | string | Date> | null =
				queryParam.filter || null;
			const offset = (page - 1) * limit;

			let whereCondition: SQL | undefined;
			if (search) {
				whereCondition = or(ilike(rolesTable.name, `%${search}%`));
			}

			let filteredCondition: SQL | undefined = undefined;
			if (filter) {
				if (filter.name) {
					filteredCondition = and(
						whereCondition,
						ilike(rolesTable.name, `%${filter.name.toString()}%`),
					);
				}
			}

			const finalWhereCondition: SQL | undefined = and(
				whereCondition,
				filteredCondition,
			);

			const orderColumn = DatatableToolkit.parseSort(
				{
					id: rolesTable.id,
					name: rolesTable.name,
					createdAt: rolesTable.createdAt,
					updatedAt: rolesTable.updatedAt,
				},
				orderBy,
			);

			const roles = await dbInstance.query.roles.findMany({
				where: finalWhereCondition,
				orderBy:
					orderDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
				columns: {
					id: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
				limit,
				offset,
			});

			const totalCount = await dbInstance.$count(
				rolesTable,
				finalWhereCondition,
			);

			return {
				data: roles,
				meta: {
					page,
					limit,
					totalCount,
				},
			};
		},

		create: async (data: {
			name: string;
			permission_ids: string[];
		}): Promise<void> => {
			const isNameExists = await dbInstance.query.roles.findFirst({
				where: eq(rolesTable.name, data.name),
			});

			if (isNameExists) {
				throw new UnprocessableEntityError("Role name already exists", [
					{
						field: "name",
						message: `The role name for ${data.name} already exists`,
					},
				]);
			}

			const role = await dbInstance
				.insert(rolesTable)
				.values({
					name: data.name,
				})
				.returning({ id: rolesTable.id })
				.execute();

			if (data.permission_ids.length > 0) {
				const rolePermissions = data.permission_ids.map((permissionId) => ({
					roleId: role[0].id,
					permissionId,
				}));

				await dbInstance.insert(role_permissionsTable).values(rolePermissions);
			}
		},

		getDetail: async (id: string) => {
			const role = await dbInstance.query.roles.findFirst({
				where: eq(rolesTable.id, id),
				columns: {
					id: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},

				with: {
					role_permissions: {
						with: {
							permission: {
								columns: {
									id: true,
									name: true,
									group: true,
								},
							},
						},
					},
				},
			});

			if (!role) {
				throw new NotFoundError("Role not found");
			}

			const allPermissions = await dbInstance.query.permissions.findMany({
				columns: {
					id: true,
					name: true,
					group: true,
				},
			});

			return {
				id: role.id,
				name: role.name,
				createdAt: role.createdAt,
				updatedAt: role.updatedAt,
				permissions: allPermissions.reduce(
					(
						acc: {
							group: string;
							names: { id: string; name: string; is_assigned: boolean }[];
						}[],
						permission,
					) => {
						const isAssigned = role.role_permissions.some(
							(rp) => rp.permission.id === permission.id,
						);

						const group = permission.group || "Ungrouped";
						const nameEntry = {
							id: permission.id,
							name: permission.name,
							is_assigned: isAssigned,
						};

						const existingGroup = acc.find((g) => g.group === group);
						if (existingGroup) {
							existingGroup.names.push(nameEntry);
						} else {
							acc.push({ group, names: [nameEntry] });
						}

						return acc;
					},
					[],
				),
			};
		},

		update: async (
			id: string,
			data: { name: string; permission_ids: string[] },
		): Promise<void> => {
			const role = await dbInstance.query.roles.findFirst({
				where: eq(rolesTable.id, id),
			});

			if (!role) {
				throw new NotFoundError("Role not found");
			}

			const isNameExists = await dbInstance.query.roles.findFirst({
				where: and(eq(rolesTable.name, data.name), not(eq(rolesTable.id, id))),
			});

			if (isNameExists) {
				throw new UnprocessableEntityError("Role name already exists", [
					{
						field: "name",
						message: `The role name for ${data.name} already exists`,
					},
				]);
			}

			await dbInstance
				.update(rolesTable)
				.set({
					name: data.name,
				})
				.where(eq(rolesTable.id, id))
				.execute();

			await dbInstance
				.delete(role_permissionsTable)
				.where(eq(role_permissionsTable.roleId, id))
				.execute();

			if (data.permission_ids.length > 0) {
				const rolePermissions = data.permission_ids.map((permissionId) => ({
					roleId: id,
					permissionId,
				}));

				await dbInstance.insert(role_permissionsTable).values(rolePermissions);
			}
		},

		delete: async (id: string): Promise<void> => {
			const role = await dbInstance.query.roles.findFirst({
				where: eq(rolesTable.id, id),
			});

			if (!role) {
				throw new NotFoundError("Role not found");
			}

			await dbInstance
				.delete(role_permissionsTable)
				.where(eq(role_permissionsTable.roleId, id))
				.execute();

			await dbInstance
				.delete(rolesTable)
				.where(eq(rolesTable.id, id))
				.execute();
		},

		selectOptions: async (): Promise<{ id: string; name: string }[]> => {
			const roles = await dbInstance.query.roles.findMany({
				where: ne(rolesTable.name, "superuser"),
				columns: {
					id: true,
					name: true,
				},
				orderBy: asc(rolesTable.name),
			});

			return roles;
		},
	};
};
