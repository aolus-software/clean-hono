import { DatatableType, PaginationResponse, PermissionList } from "@types";
import { PermissionRepository } from "@database";
import { z } from "@hono/zod-openapi";
import { PermissionCreateSchema, PermissionUpdateSchema } from "./schema";
import { NotFoundError } from "@errors";
import { IPermissionService } from "./service.interface";

export class PermissionService implements IPermissionService {
	async findAll(
		queryParam: DatatableType,
	): Promise<PaginationResponse<PermissionList>> {
		return PermissionRepository().findAll(queryParam);
	}

	async create(data: z.infer<typeof PermissionCreateSchema>): Promise<void> {
		await PermissionRepository().create(data);
	}

	async findOne(id: string): Promise<PermissionList> {
		const permissions = await PermissionRepository().getDetail(id);
		if (!permissions) {
			throw new NotFoundError("Permission not found");
		}

		return permissions;
	}

	async update(
		data: z.infer<typeof PermissionUpdateSchema>,
		id: string,
	): Promise<void> {
		await PermissionRepository().update(id, data);
	}

	async delete(id: string): Promise<void> {
		await PermissionRepository().delete(id);
	}
}
