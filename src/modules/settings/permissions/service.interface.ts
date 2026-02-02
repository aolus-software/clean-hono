import { DatatableType, PaginationResponse } from "@packages/*";
import { PermissionList } from "@postgres/repositories";
import { PermissionCreateSchema, PermissionUpdateSchema } from "./schema";
import type { z } from "@hono/zod-openapi";

export interface IPermissionService {
	findAll(
		queryParam: DatatableType,
	): Promise<PaginationResponse<PermissionList>>;

	create(data: z.infer<typeof PermissionCreateSchema>): Promise<void>;

	findOne(id: string): Promise<PermissionList>;

	update(
		data: z.infer<typeof PermissionUpdateSchema>,
		id: string,
	): Promise<void>;

	delete(id: string): Promise<void>;
}
