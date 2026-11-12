import { mock } from "bun:test";

import type { EmailOptions } from "@mail/mail.service";

export const queuedMails: EmailOptions[] = [];

/* Importing `@bull` boots the mail worker; tests capture jobs instead. */
await mock.module("@bull", () => ({
	sendEmailQueue: {
		add: (_name: string, data: EmailOptions): Promise<void> => {
			queuedMails.push(data);
			return Promise.resolve();
		},
	},
}));

const { default: app } = await import("../../src/app");

type JsonBody = Record<string, unknown>;

export type TestResponse<T = unknown> = {
	status: number;
	body: {
		status: number;
		success: boolean;
		message: string;
		data?: T;
		errors?: { field: string; message: string }[];
	};
};

export const request = async <T = unknown>(
	method: string,
	path: string,
	options: { body?: JsonBody; token?: string } = {},
): Promise<TestResponse<T>> => {
	const headers: Record<string, string> = {};
	if (options.body) headers["Content-Type"] = "application/json";
	if (options.token) headers.Authorization = `Bearer ${options.token}`;

	const response = await app.request(path, {
		method,
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	return {
		status: response.status,
		body: (await response.json()) as TestResponse<T>["body"],
	};
};
