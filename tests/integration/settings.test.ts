import { beforeAll, describe, expect, test } from "bun:test";

import { JWTToolkit } from "@utils";

import { request } from "../helpers/app";
import { login } from "../helpers/auth";
import { resetDatabase } from "../helpers/database";

type Paginated<T> = {
	data: T[];
	meta: { page: number; limit: number; totalCount: number };
};
type RoleOption = { id: string; name: string };

let superuserToken: string;
let adminToken: string;

beforeAll(async () => {
	await resetDatabase();
	superuserToken = (await login("superuser@example.com")).accessToken;
	adminToken = (await login("admin@example.com")).accessToken;
});

describe("GET /settings/users", () => {
	test("returns a paginated list", async () => {
		const response = await request<Paginated<{ email: string }>>(
			"GET",
			"/settings/users?page=1&perPage=10",
			{ token: adminToken },
		);
		expect(response.status).toBe(200);
		expect(response.body.data?.meta.totalCount).toBe(2);
		expect(response.body.data?.data).toHaveLength(2);
	});

	test("answers 400 for an unknown filter key", async () => {
		const response = await request(
			"GET",
			"/settings/users?filter[password]=x",
			{ token: adminToken },
		);
		expect(response.status).toBe(400);
	});

	test("answers 422 for a sort field outside the allow-list", async () => {
		const response = await request("GET", "/settings/users?sort=password", {
			token: adminToken,
		});
		expect(response.status).toBe(422);
	});
});

describe("RBAC", () => {
	test("a user without roles gets 403 on a guarded route", async () => {
		const created = await request("POST", "/settings/users", {
			token: superuserToken,
			body: {
				name: "Plain",
				email: "plain@example.com",
				password: "S3crEtP4ssw0rd!",
				status: "active",
				remark: null,
				roleIds: [],
			},
		});
		expect(created.status).toBe(201);

		const list = await request<Paginated<{ id: string }>>(
			"GET",
			"/settings/users?filter[email]=plain@example.com",
			{ token: superuserToken },
		);
		const plainId = list.body.data?.data[0]?.id ?? "";
		const plainToken = await JWTToolkit.sign(plainId, "access");

		const forbidden = await request("GET", "/settings/users", {
			token: plainToken,
		});
		expect(forbidden.status).toBe(403);

		const profile = await request("GET", "/profile", { token: plainToken });
		expect(profile.status).toBe(200);
	});

	test("select-options are superuser only", async () => {
		const admin = await request("GET", "/settings/select-options/roles", {
			token: adminToken,
		});
		expect(admin.status).toBe(403);

		const superuser = await request<RoleOption[]>(
			"GET",
			"/settings/select-options/roles",
			{ token: superuserToken },
		);
		expect(superuser.status).toBe(200);
		expect(superuser.body.data?.map((role) => role.name)).toEqual(["admin"]);
	});
});

describe("Role select-options cache", () => {
	test("a new role shows up in the cached options", async () => {
		await request("GET", "/settings/select-options/roles", {
			token: superuserToken,
		});

		const created = await request("POST", "/settings/roles", {
			token: superuserToken,
			body: { name: "editor", permissionIds: [] },
		});
		expect(created.status).toBe(201);

		const options = await request<RoleOption[]>(
			"GET",
			"/settings/select-options/roles",
			{ token: superuserToken },
		);
		expect(options.body.data?.map((role) => role.name)).toEqual([
			"admin",
			"editor",
		]);
	});

	test("a duplicate role name is 422", async () => {
		const response = await request("POST", "/settings/roles", {
			token: superuserToken,
			body: { name: "editor", permissionIds: [] },
		});
		expect(response.status).toBe(422);
	});
});
