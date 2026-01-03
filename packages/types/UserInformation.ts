import { z } from "zod";
export interface UserInformation {
	id: string;
	name: string;
	email: string;
	roles: string[];
	permissions: {
		name: string;
		permissions: string[];
	}[];
}

export const ZodUserInformation = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	roles: z.array(z.string()),
	permissions: z.array(
		z.object({
			name: z.string(),
			permissions: z.array(z.string()),
		}),
	),
});
