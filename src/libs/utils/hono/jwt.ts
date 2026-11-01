import { JWT_CONFIG } from "@config";
import { sign, verify } from "hono/jwt";

import { StrToolkit } from "../string";

export type TokenType = "access" | "refresh";

export type TokenPayload = {
	id: string;
	type: TokenType;
	jti?: string;
};

export type IssuedTokenPair = {
	accessToken: string;
	refreshToken: string;
	refreshTokenId: string;
	refreshExpiresInSeconds: number;
};

export class JWTToolkit {
	static async sign(
		id: string,
		type: TokenType,
		jti?: string,
	): Promise<string> {
		const lifetime =
			type === "access"
				? JWT_CONFIG.accessExpiresInSeconds
				: JWT_CONFIG.refreshExpiresInSeconds;

		return sign(
			{
				id,
				type,
				...(jti ? { jti } : {}),
				exp: Math.floor(Date.now() / 1000) + lifetime,
			},
			JWTToolkit.secretFor(type),
			"HS256",
		);
	}

	static async verify(
		token: string,
		type: TokenType,
	): Promise<TokenPayload | null> {
		try {
			const payload = await verify(token, JWTToolkit.secretFor(type), "HS256");
			if (payload.type !== type || typeof payload.id !== "string") {
				return null;
			}
			if (type === "refresh" && typeof payload.jti !== "string") {
				return null;
			}
			return {
				id: payload.id,
				type,
				...(typeof payload.jti === "string" ? { jti: payload.jti } : {}),
			};
		} catch {
			return null;
		}
	}

	/**
	 * Signs an access token and a refresh token carrying a fresh `jti`. The
	 * caller stores `refreshTokenId` so only the latest refresh token is valid.
	 */
	static async issuePair(id: string): Promise<IssuedTokenPair> {
		const refreshTokenId = StrToolkit.random(32);
		const [accessToken, refreshToken] = await Promise.all([
			JWTToolkit.sign(id, "access"),
			JWTToolkit.sign(id, "refresh", refreshTokenId),
		]);
		return {
			accessToken,
			refreshToken,
			refreshTokenId,
			refreshExpiresInSeconds: JWT_CONFIG.refreshExpiresInSeconds,
		};
	}

	private static secretFor(type: TokenType): string {
		return type === "access"
			? JWT_CONFIG.accessSecret
			: JWT_CONFIG.refreshSecret;
	}
}
