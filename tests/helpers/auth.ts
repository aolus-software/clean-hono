import { request } from "./app";
import { SEED_PASSWORD } from "./database";

type LoginData = { accessToken: string; refreshToken: string };

export const login = async (
	email: string,
	password: string = SEED_PASSWORD,
): Promise<LoginData> => {
	const response = await request<LoginData>("POST", "/auth/login", {
		body: { email, password },
	});
	if (response.status !== 200 || !response.body.data) {
		throw new Error(`Login failed for ${email}: ${response.status}`);
	}
	return response.body.data;
};
