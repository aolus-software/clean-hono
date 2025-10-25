import { db, permissionsTable } from "infra/postgres/index";
import { DatatableType } from "../types/datatable";
import { defaultSort } from "@default/sort";
import { and, asc, desc, eq, ilike, not, or, SQL } from "drizzle-orm";
import { PaginationResponse } from "../types/pagination";
import { NotFoundError } from "../errors/not-found-error";
import { UnprocessableEntityError } from "../errors";
import { SortDirection } from "../types/sortdirection";

export type PermissionList = {
	id: string;
	name: string;
	group: string;
	created_at: Date;
	updated_at: Date;
};

export type PermissionSelectOptions = {
	group: string;
	permissions: {
		id: string;
		name: string;
		group: string;
	}[];
};

export const PermissionRepository = () => {
	const dbInstance = db;

	return {
		db: dbInstance,

		findAll: async (
			queryParam: DatatableType,
		): Promise<PaginationResponse<PermissionList>> => {
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
				whereCondition = or(
					ilike(permissionsTable.name, `%${search}%`),
					ilike(permissionsTable.group, `%${search}%`),
				);
			}

			let filteredCondition: SQL | undefined = undefined;
			if (filter) {
				if (filter.name) {
					filteredCondition = and(
						whereCondition,
						ilike(permissionsTable.name, `%${filter.name.toString()}%`),
					);
				}

				if (filter.group) {
					filteredCondition = and(
						whereCondition,
						ilike(permissionsTable.group, `%${filter.group.toString()}%`),
					);
				}
			}

			const finalWhereCondition: SQL | undefined = and(
				whereCondition,
				filteredCondition ? filteredCondition : undefined,
			);

			const validateOrderBy = {
				id: permissionsTable.id,
				name: permissionsTable.name,
				group: permissionsTable.group,
				created_at: permissionsTable.createdAt,
				updated_at: permissionsTable.updatedAt,
			};

			type OrderableKey = keyof typeof validateOrderBy;
			const normalizedOrderBy: OrderableKey = (
				Object.keys(validateOrderBy) as OrderableKey[]
			).includes(orderBy as OrderableKey)
				? (orderBy as OrderableKey)
				: ("id" as OrderableKey);

			const orderColumn = validateOrderBy[normalizedOrderBy];

			const rawData = await dbInstance.query.permissions.findMany({
				where: finalWhereCondition,
				orderBy:
					orderDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
				columns: {
					id: true,
					name: true,
					group: true,
					createdAt: true,
					updatedAt: true,
				},
				limit,
				offset,
			});

			const data: PermissionList[] = rawData.map((item) => ({
				id: item.id,
				name: item.name,
				group: item.group,
				created_at: item.createdAt,
				updated_at: item.updatedAt,
			}));

			const totalCount = await dbInstance.$count(
				permissionsTable,
				finalWhereCondition,
			);

			return {
				data,
				meta: {
					page,
					limit,
					totalCount,
				},
			};
		},

		getDetail: async (id: string): Promise<PermissionList> => {
			const permission = await dbInstance.query.permissions.findFirst({
				where: and(eq(permissionsTable.id, id)),
				columns: {
					id: true,
					name: true,
					group: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!permission) {
				throw new NotFoundError("Permission not found");
			}

			return {
				id: permission.id,
				name: permission.name,
				group: permission.group,
				created_at: permission.createdAt,
				updated_at: permission.updatedAt,
			};
		},

		create: async (data: { name: string[]; group: string }): Promise<void> => {
			const permissionNames: string[] = data.name.map(
				(name) => `${data.group} ${name}`,
			);

			const existingPermissions = await db.query.permissions.findMany({
				where: or(
					...permissionNames.map((name) => ilike(permissionsTable.name, name)),
				),
			});

			if (existingPermissions.length > 0) {
				throw new UnprocessableEntityError("Some permission already exists", [
					{
						field: "name",
						message: `Some permission is already exist ${existingPermissions.map((perm) => perm.name).join(", ")}`,
					},
				]);
			}

			const insertedData = data.name.map((name) => ({
				name: `${data.group} ${name}`,
				group: data.group,
			}));

			await dbInstance.insert(permissionsTable).values(insertedData);
		},

		update: async (
			id: string,
			data: { name: string; group: string },
		): Promise<void> => {
			const permission = await dbInstance.query.permissions.findFirst({
				where: eq(permissionsTable.id, id),
			});

			if (!permission) {
				throw new NotFoundError("Permission not found");
			}

			const isPermissionNameAlreadyExist = await dbInstance
				.select()
				.from(permissionsTable)
				.where(
					and(
						eq(permissionsTable.name, data.name),
						not(eq(permissionsTable.id, id)),
					),
				)
				.limit(1);

			if (isPermissionNameAlreadyExist.length > 0) {
				throw new UnprocessableEntityError("Permission name already exists", [
					{
						field: "name",
						message: "Permission name already exists",
					},
				]);
			}

			await dbInstance
				.update(permissionsTable)
				.set({
					name: data.name,
					group: data.group,
				})
				.where(eq(permissionsTable.id, id));
		},

		delete: async (id: string): Promise<void> => {
			const permission = await dbInstance.query.permissions.findFirst({
				where: eq(permissionsTable.id, id),
			});

			if (!permission) {
				throw new NotFoundError("Permission not found");
			}

			await dbInstance
				.delete(permissionsTable)
				.where(eq(permissionsTable.id, id));
		},

		selectOptions: async (): Promise<PermissionSelectOptions[]> => {
			const dataPermissions = await db.query.permissions.findMany({
				columns: { id: true, name: true, group: true },
			});
			const grouped: Record<string, PermissionSelectOptions["permissions"]> =
				{};
			dataPermissions.forEach((perm) => {
				if (!grouped[perm.group]) grouped[perm.group] = [];
				grouped[perm.group].push(perm);
			});
			return Object.entries(grouped).map(([group, permissions]) => ({
				group,
				permissions,
			}));
		},
	};
};
