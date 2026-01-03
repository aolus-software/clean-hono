import { DatatableType, PaginationResponse } from "@packages/*";
import { RoleRepository, RoleList, RoleDetail } from "@postgres/repositories";
import { z } from "@hono/zod-openapi";
import { RoleCreateSchema, RoleUpdateSchema } from "./schema";

export class RoleService {
	async findAll(
		queryParam: DatatableType,
	): Promise<PaginationResponse<RoleList>> {
		return RoleRepository().findAll(queryParam);
	}

	async create(data: z.infer<typeof RoleCreateSchema>): Promise<void> {
		await RoleRepository().create(data);
	}

	async findOne(id: string): Promise<RoleDetail> {
		return RoleRepository().getDetail(id);
	}

	async update(
		data: z.infer<typeof RoleUpdateSchema>,
		id: string,
	): Promise<void> {
		await RoleRepository().update(id, data);
	}

	async delete(id: string): Promise<void> {
		await RoleRepository().delete(id);
	}
}
