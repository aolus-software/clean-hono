import { z } from "zod";

export const commonResponse = <T extends z.ZodTypeAny>(
	schema: T,
	description: string = "Success",
	withoutCodes: number[] = [],
) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result: Record<number, any> = {};

	if (!withoutCodes.includes(200)) {
		result[200] = {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean().openapi({ example: true }),
						message: z.string().openapi({ example: "Success" }),
						data: schema,
						errors: z.array(z.any()).optional().openapi({ example: [] }),
					}),
				},
			},
			description,
		};
	}
	if (!withoutCodes.includes(201)) {
		result[201] = {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean().openapi({ example: true }),
						message: z.string().openapi({ example: "Created" }),
						data: schema,
						errors: z.array(z.any()).optional().openapi({ example: [] }),
					}),
				},
			},
			description: "Created",
		};
	}
	if (!withoutCodes.includes(400)) {
		result[400] = {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(false),
						message: z.string().openapi({ example: "Bad Request" }),
						data: z.null(),
						errors: z.array(z.any()).optional().openapi({ example: [] }),
					}),
				},
			},
			description: "Bad Request",
		};
	}
	if (!withoutCodes.includes(401)) {
		result[401] = {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(false),
						message: z.string().openapi({ example: "Unauthorized" }),
						data: z.null(),
						errors: z.array(z.any()).optional().openapi({ example: [] }),
					}),
				},
			},
			description: "Unauthorized",
		};
	}
	if (!withoutCodes.includes(403)) {
		result[403] = {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(false),
						message: z.string().openapi({ example: "Forbidden" }),
						data: z.null(),
						errors: z.array(z.any()).optional().openapi({ example: [] }),
					}),
				},
			},
			description: "Forbidden",
		};
	}
	if (!withoutCodes.includes(404)) {
		result[404] = {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(false),
						message: z.string().openapi({ example: "Not Found" }),
						data: z.null(),
						errors: z.array(z.any()).optional().openapi({ example: [] }),
					}),
				},
			},
			description: "Not Found",
		};
	}
	if (!withoutCodes.includes(422)) {
		result[422] = {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(false),
						message: z.string().openapi({ example: "Validation Error" }),
						data: z.null(),
						errors: z
							.array(z.any())
							.optional()
							.openapi({
								example: [
									{
										email: ["Email is required"],
										password: [
											"Password must be at least 6 characters long",
											"Password must contain a number",
										],
									},
								],
							}),
					}),
				},
			},
			description: "Validation Error",
		};
	}
	if (!withoutCodes.includes(500)) {
		result[500] = {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(false),
						message: z.string().openapi({ example: "Internal Server Error" }),
						data: z.null(),
						errors: z.array(z.any()).optional().openapi({ example: [] }),
					}),
				},
			},
			description: "Internal Server Error",
		};
	}

	return result;
};
