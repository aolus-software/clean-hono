import { JWTToolkit } from "@toolkit/jwt";
import { UnauthorizedError } from "../errors";
import { Context } from "hono";
import { Cache, UserInformationCacheKey } from "@cache/*";
import { UserInformation } from "../types/UserInformation";
import { UserRepository } from "@postgres/repositories";
import type { Env } from "../../apps/api/types/app.types";

export const AuthMiddleware = async (
	c: Context<Env>,
	next: () => Promise<void>,
) => {
	const authHeader = c.req.header("authorization") || "";
	const token = authHeader.startsWith("Bearer ")
		? authHeader.slice(7)
		: authHeader;

	if (!token) {
		throw new UnauthorizedError("No token provided");
	}

	const payload = await new JWTToolkit().verify<{
		userId: string;
	}>(token);
	if (!payload?.userId) {
		throw new UnauthorizedError("Invalid token payload");
	}

	const cachekey = UserInformationCacheKey(payload.userId);
	let user: UserInformation | null = await Cache.get<UserInformation>(cachekey);
	if (!user) {
		const userRecord = await UserRepository().UserInformation(payload.userId);
		if (!userRecord) {
			throw new UnauthorizedError("User not found");
		}

		user = userRecord;
		await Cache.set(cachekey, user);
	}

	c.set("currentUser", user);
	return next();
};
