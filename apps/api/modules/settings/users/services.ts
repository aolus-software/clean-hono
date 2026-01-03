import { DatatableType, PaginationResponse } from "@packages/*";
import {
	UserRepository,
	UserList,
	UserDetail,
	UserCreate,
} from "@postgres/repositories";
import { z } from "@hono/zod-openapi";
import { UserCreateSchema, UserUpdateSchema } from "./schema";

export class UserService {
	async findAll(
		queryParam: DatatableType,
	): Promise<PaginationResponse<UserList>> {
		return UserRepository().findAll(queryParam);
	}

	async create(data: z.infer<typeof UserCreateSchema>): Promise<void> {
		await UserRepository().create(data as UserCreate);
	}

	async findOne(id: string): Promise<UserDetail> {
		return UserRepository().getDetail(id);
	}

	async update(
		data: z.infer<typeof UserUpdateSchema>,
		id: string,
	): Promise<void> {
		await UserRepository().update(id, data);
	}

	async delete(id: string): Promise<void> {
		await UserRepository().delete(id);
	}
}
