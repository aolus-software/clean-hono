import { JWTToolkit } from "@toolkit/jwt";
import { UnauthorizedError } from "../errors";
import { UserRepository } from "../repositories";
import { MiddlewareHandler } from "hono";

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

		const user = await UserRepository().UserInformation(payload.userId);
		if (!user) throw new UnauthorizedError("User not found");

		c.set("currentUser", user);
		return next();
	} catch {
		throw new UnauthorizedError("Invalid token");
	}
};
