import { describe, expect, test } from "bun:test";

import { BadRequestError } from "@errors";
import type { FilterField } from "@types";
import { DatatableToolkit } from "@utils/hono/datatable";

const fields: FilterField[] = [
	"name",
	{ field: "status", enum: ["active", "inactive"] },
	{ field: "roleId", kind: "id" },
	{ field: "createdAt", kind: "date" },
];

describe("DatatableToolkit", () => {
	test("assertSort rejects a field outside the allow-list", () => {
		expect(() => DatatableToolkit.assertSort("name", ["name"])).not.toThrow();
		expect(() => DatatableToolkit.assertSort("password", ["name"])).toThrow(
			BadRequestError,
		);
	});

	test("assertFilterKeys rejects an unknown key", () => {
		expect(() =>
			DatatableToolkit.assertFilterKeys({ name: "a" }, fields),
		).not.toThrow();
		expect(() =>
			DatatableToolkit.assertFilterKeys({ password: "a" }, fields),
		).toThrow(BadRequestError);
	});

	test("assertFilterEnums rejects a value outside the enum", () => {
		expect(() =>
			DatatableToolkit.assertFilterEnums({ status: "active,inactive" }, fields),
		).not.toThrow();
		expect(() =>
			DatatableToolkit.assertFilterEnums({ status: "deleted" }, fields),
		).toThrow(BadRequestError);
	});

	test("filterValues splits and trims a comma list", () => {
		expect(DatatableToolkit.filterValues(" a, b ,,c ")).toEqual([
			"a",
			"b",
			"c",
		]);
	});

	test("filterIds accepts uuids only", () => {
		const id = "550e8400-e29b-41d4-a716-446655440000";
		expect(DatatableToolkit.filterIds(id, "roleId")).toEqual([id]);
		expect(() => DatatableToolkit.filterIds("1", "roleId")).toThrow(
			BadRequestError,
		);
	});

	test("filterDateRange spans whole days and rejects a reversed range", () => {
		const { from, to } = DatatableToolkit.filterDateRange(
			"2024-01-01,2024-01-31",
			"createdAt",
		);
		expect(from < to).toBe(true);
		expect(() =>
			DatatableToolkit.filterDateRange("2024-02-01,2024-01-01", "createdAt"),
		).toThrow(BadRequestError);
		expect(() =>
			DatatableToolkit.filterDateRange("yesterday", "createdAt"),
		).toThrow(BadRequestError);
	});
});
