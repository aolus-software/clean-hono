import type {
	DatatableType,
	FilterField,
	PaginationResponse,
	UserCreate,
	UserDetail,
	UserForAuth,
	UserInformation,
	UserList,
	UserUpdate,
} from "@types";
import { DatatableToolkit } from "@utils/hono/datatable";
import {
	and,
	asc,
	desc,
	eq,
	exists,
	gte,
	ilike,
	inArray,
	isNull,
	lte,
	ne,
	or,
	SQL,
	sql,
} from "drizzle-orm";

import { db } from "../client";
import {
	user_rolesTable,
	usersTable,
	UserStatus,
	type UserStatusEnum,
} from "../schema";
import type { DbTransaction } from ".";

const userOrderableColumns = {
	id: usersTable.id,
	name: usersTable.name,
	email: usersTable.email,
	status: usersTable.status,
	createdAt: usersTable.created_at,
	updatedAt: usersTable.updated_at,
};

export const userSortableFields = [
	"id",
	"name",
	"email",
	"status",
	"createdAt",
	"updatedAt",
] as const satisfies readonly (keyof typeof userOrderableColumns)[];

export const userFilterableFields: FilterField[] = [
	{ field: "status", enum: Object.values(UserStatus) },
	"name",
	"email",
	{ field: "roleId", kind: "id" },
	{ field: "createdAt", kind: "date" },
	{ field: "updatedAt", kind: "date" },
];

export const userFilterExample: Record<string, string> = {
	name: "jane",
	email: "jane@example.com",
	roleId: "550e8400-e29b-41d4-a716-446655440000",
	createdAt: "2024-01-01,2024-12-31",
	updatedAt: "2024-01-01,2024-12-31",
};

const listColumns = {
	id: true,
	name: true,
	email: true,
	status: true,
	remark: true,
	created_at: true,
	updated_at: true,
} as const;

const live = (id: string): SQL | undefined =>
	and(eq(usersTable.id, id), isNull(usersTable.deleted_at));

export function UserRepository(tx?: DbTransaction) {
	const dbClient = tx || db;

	return {
		async findAll(query: DatatableType): Promise<PaginationResponse<UserList>> {
			const { page, perPage, search, sort, sortDirection, filter } = query;

			DatatableToolkit.assertSort(sort, userSortableFields);
			DatatableToolkit.assertFilterKeys(filter, userFilterableFields);
			DatatableToolkit.assertFilterEnums(filter, userFilterableFields);

			const conditions: (SQL | undefined)[] = [isNull(usersTable.deleted_at)];

			if (search) {
				conditions.push(
					or(
						ilike(usersTable.name, `%${search}%`),
						ilike(usersTable.email, `%${search}%`),
						ilike(sql`${usersTable.status}::text`, `%${search}%`),
					),
				);
			}

			if (filter?.status !== undefined) {
				conditions.push(
					inArray(
						usersTable.status,
						DatatableToolkit.filterValues(filter.status) as UserStatusEnum[],
					),
				);
			}
			if (filter?.name !== undefined) {
				conditions.push(ilike(usersTable.name, `%${filter.name.toString()}%`));
			}
			if (filter?.email !== undefined) {
				conditions.push(
					ilike(usersTable.email, `%${filter.email.toString()}%`),
				);
			}
			if (filter?.roleId !== undefined) {
				const roleIds = DatatableToolkit.filterIds(filter.roleId, "roleId");
				conditions.push(
					exists(
						dbClient
							.select({ userId: user_rolesTable.userId })
							.from(user_rolesTable)
							.where(
								and(
									eq(user_rolesTable.userId, usersTable.id),
									inArray(user_rolesTable.roleId, roleIds),
								),
							),
					),
				);
			}
			if (filter?.createdAt !== undefined) {
				const { from, to } = DatatableToolkit.filterDateRange(
					filter.createdAt,
					"createdAt",
				);
				conditions.push(
					gte(usersTable.created_at, from),
					lte(usersTable.created_at, to),
				);
			}
			if (filter?.updatedAt !== undefined) {
				const { from, to } = DatatableToolkit.filterDateRange(
					filter.updatedAt,
					"updatedAt",
				);
				conditions.push(
					gte(usersTable.updated_at, from),
					lte(usersTable.updated_at, to),
				);
			}

			const where = and(...conditions);
			const orderColumn =
				userOrderableColumns[sort as keyof typeof userOrderableColumns];

			const [users, totalCount] = await Promise.all([
				dbClient.query.users.findMany({
					where,
					orderBy:
						sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
					limit: perPage,
					offset: (page - 1) * perPage,
					columns: listColumns,
					with: {
						user_roles: {
							columns: {},
							with: { role: { columns: { name: true } } },
						},
					},
				}),
				dbClient.$count(usersTable, where),
			]);

			return {
				data: users.map((user) => ({
					id: user.id,
					name: user.name,
					email: user.email,
					status: user.status,
					remark: user.remark,
					roles: user.user_roles.map((userRole) => userRole.role.name),
					createdAt: user.created_at,
					updatedAt: user.updated_at,
				})),
				meta: { page, limit: perPage, totalCount },
			};
		},

		async findById(
			id: string,
		): Promise<{ id: string; name: string; email: string } | null> {
			const user = await dbClient.query.users.findFirst({
				where: live(id),
				columns: { id: true, name: true, email: true },
			});
			return user ?? null;
		},

		async getDetail(id: string): Promise<UserDetail | null> {
			const user = await dbClient.query.users.findFirst({
				where: live(id),
				columns: listColumns,
				with: {
					user_roles: {
						columns: {},
						with: { role: { columns: { id: true, name: true } } },
					},
				},
			});
			if (!user) return null;

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				status: user.status,
				remark: user.remark,
				roles: user.user_roles.map((userRole) => userRole.role),
				createdAt: user.created_at,
				updatedAt: user.updated_at,
			};
		},

		async findByEmail(email: string): Promise<UserForAuth | null> {
			const user = await dbClient.query.users.findFirst({
				where: and(eq(usersTable.email, email), isNull(usersTable.deleted_at)),
				columns: {
					id: true,
					name: true,
					email: true,
					password: true,
					status: true,
					email_verified_at: true,
				},
			});
			if (!user) return null;

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				password: user.password,
				status: user.status,
				emailVerifiedAt: user.email_verified_at,
			};
		},

		async findLiveByEmail(
			email: string,
			excludeId?: string,
		): Promise<{ id: string } | null> {
			const user = await dbClient.query.users.findFirst({
				where: and(
					eq(usersTable.email, email),
					isNull(usersTable.deleted_at),
					excludeId ? ne(usersTable.id, excludeId) : undefined,
				),
				columns: { id: true },
			});
			return user ?? null;
		},

		async findPasswordHash(id: string): Promise<string | null> {
			const user = await dbClient.query.users.findFirst({
				where: live(id),
				columns: { password: true },
			});
			return user?.password ?? null;
		},

		/**
		 * The identity behind every authenticated request. Only active,
		 * non-deleted users resolve; anything else is treated as logged out.
		 */
		async findUserInformation(id: string): Promise<UserInformation | null> {
			const user = await dbClient.query.users.findFirst({
				where: and(live(id), eq(usersTable.status, UserStatus.ACTIVE)),
				columns: { id: true, name: true, email: true },
				with: {
					user_roles: {
						columns: {},
						with: {
							role: {
								columns: { name: true },
								with: {
									role_permissions: {
										columns: {},
										with: { permission: { columns: { name: true } } },
									},
								},
							},
						},
					},
				},
			});
			if (!user) return null;

			const permissions = new Set<string>();
			for (const userRole of user.user_roles) {
				for (const rolePermission of userRole.role.role_permissions) {
					permissions.add(rolePermission.permission.name);
				}
			}

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				roles: user.user_roles.map((userRole) => userRole.role.name),
				permissions: Array.from(permissions),
			};
		},

		async findIdsByRoleIds(roleIds: string[]): Promise<string[]> {
			if (roleIds.length === 0) return [];
			const rows = await dbClient
				.selectDistinct({ userId: user_rolesTable.userId })
				.from(user_rolesTable)
				.where(inArray(user_rolesTable.roleId, roleIds));
			return rows.map((row) => row.userId);
		},

		async create(
			data: Omit<UserCreate, "roleIds"> & {
				roleIds?: string[];
				emailVerifiedAt?: Date | null;
			},
		): Promise<{ id: string; name: string; email: string }> {
			const { roleIds = [], emailVerifiedAt = null, ...userData } = data;
			const [user] = await dbClient
				.insert(usersTable)
				.values({ ...userData, email_verified_at: emailVerifiedAt })
				.returning({
					id: usersTable.id,
					name: usersTable.name,
					email: usersTable.email,
				});

			const uniqueRoleIds = Array.from(new Set(roleIds));
			if (uniqueRoleIds.length > 0) {
				await dbClient
					.insert(user_rolesTable)
					.values(uniqueRoleIds.map((roleId) => ({ userId: user.id, roleId })));
			}

			return user;
		},

		async update(id: string, data: Partial<UserUpdate>): Promise<void> {
			const { roleIds, ...userData } = data;
			await dbClient
				.update(usersTable)
				.set({ ...userData, updated_at: new Date() })
				.where(eq(usersTable.id, id));

			if (roleIds !== undefined) {
				await dbClient
					.delete(user_rolesTable)
					.where(eq(user_rolesTable.userId, id));
				const uniqueRoleIds = Array.from(new Set(roleIds));
				if (uniqueRoleIds.length > 0) {
					await dbClient
						.insert(user_rolesTable)
						.values(uniqueRoleIds.map((roleId) => ({ userId: id, roleId })));
				}
			}
		},

		async updatePassword(id: string, hashedPassword: string): Promise<void> {
			await dbClient
				.update(usersTable)
				.set({ password: hashedPassword })
				.where(eq(usersTable.id, id));
		},

		async markEmailVerified(id: string): Promise<void> {
			await dbClient
				.update(usersTable)
				.set({ email_verified_at: new Date() })
				.where(eq(usersTable.id, id));
		},

		async softDelete(id: string): Promise<void> {
			await dbClient
				.update(usersTable)
				.set({ deleted_at: new Date() })
				.where(eq(usersTable.id, id));
		},
	};
}
