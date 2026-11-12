import { describe, expect, test } from "bun:test";

import { parseAcceptLanguage, translate } from "@i18n";

describe("parseAcceptLanguage", () => {
	test("picks the highest-weighted supported locale", () => {
		expect(parseAcceptLanguage("fr;q=0.9, id-ID;q=0.8")).toBe("id");
		expect(parseAcceptLanguage("en-US,id;q=0.5")).toBe("en");
	});

	test("falls back to en", () => {
		expect(parseAcceptLanguage(undefined)).toBe("en");
		expect(parseAcceptLanguage("fr, de")).toBe("en");
	});
});

describe("translate", () => {
	test("resolves a key per locale", () => {
		expect(translate("auth.loginSuccess", undefined, "en")).toBe(
			"Login successful",
		);
		expect(translate("auth.loginSuccess", undefined, "id")).toBe(
			"Login berhasil",
		);
	});
});
