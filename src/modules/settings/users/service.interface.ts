import type {
	DatatableType,
	PaginationResponse,
	UserInformation,
} from "@packages/*";
import type { UserDetail, UserList } from "@postgres/repositories";
import type { z } from "@hono/zod-openapi";
import { UserCreateSchema, UserUpdateSchema } from "./schema";

export interface IUserService {
	findAll(queryParam: DatatableType): Promise<PaginationResponse<UserList>>;

	create(data: z.infer<typeof UserCreateSchema>): Promise<void>;

	findOne(id: string): Promise<UserDetail>;

	update(data: z.infer<typeof UserUpdateSchema>, id: string): Promise<void>;

	delete(id: string): Promise<void>;
}
