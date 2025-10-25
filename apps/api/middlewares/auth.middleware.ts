import { JWTToolkit } from "@toolkit/jwt";
import { UnauthorizedError } from "../errors";
import { UserRepository } from "../repositories";
import { MiddlewareHandler } from "hono";
import { Cache, UserInformationCacheKey } from "@cache/*";
import { UserInformation } from "../types/UserInformation";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
	const authHeader = c.req.header("authorization") || "";
	const token = authHeader.startsWith("Bearer ")
		? authHeader.slice(7)
		: authHeader;

	if (!token) {
		throw new UnauthorizedError("No token provided");
	}

	try {
		const payload = await new JWTToolkit().verify<{
			userId: string;
		}>(token);
		if (!payload?.userId) {
			throw new UnauthorizedError("Invalid token payload");
		}

		const cachekey = UserInformationCacheKey(payload.userId);
		let user: UserInformation | null =
			await Cache.get<UserInformation>(cachekey);
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
	} catch {
		throw new UnauthorizedError("Invalid token");
	}
};
