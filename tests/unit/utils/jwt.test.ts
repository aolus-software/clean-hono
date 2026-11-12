import { describe, expect, test } from "bun:test";

import { JWTToolkit } from "@utils";

const userId = "550e8400-e29b-41d4-a716-446655440000";

describe("JWTToolkit", () => {
	test("round-trips an access token", async () => {
		const token = await JWTToolkit.sign(userId, "access");
		expect(await JWTToolkit.verify(token, "access")).toEqual({
			id: userId,
			type: "access",
		});
	});

	test("rejects an access token presented as a refresh token", async () => {
		const token = await JWTToolkit.sign(userId, "access");
		expect(await JWTToolkit.verify(token, "refresh")).toBeNull();
	});

	test("rejects a refresh token presented as an access token", async () => {
		const { refreshToken } = await JWTToolkit.issuePair(userId);
		expect(await JWTToolkit.verify(refreshToken, "access")).toBeNull();
	});

	test("issuePair carries the refresh token id as jti", async () => {
		const pair = await JWTToolkit.issuePair(userId);
		const payload = await JWTToolkit.verify(pair.refreshToken, "refresh");
		expect(payload?.jti).toBe(pair.refreshTokenId);
	});

	test("rejects a malformed token", async () => {
		expect(await JWTToolkit.verify("not.a.token", "access")).toBeNull();
	});
});
