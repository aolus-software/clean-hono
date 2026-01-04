import { env } from "./env";

type CorsConfigType = {
	origin: string;
	methods: string[];
	allowedHeaders: string[];
	exposedHeaders: string[];
	maxAge: number;
	credentials: boolean;
};

export const corsConfig: CorsConfigType = {
	origin: env.CORS_ORIGIN,
	methods: env.CORS_METHODS.split(",").map((method) => method.trim()),
	allowedHeaders: env.CORS_ALLOWED_HEADERS.split(",").map((header) =>
		header.trim(),
	),
	exposedHeaders: env.CORS_EXPOSED_HEADERS.split(",").map((header) =>
		header.trim(),
	),
	maxAge: env.CORS_MAX_AGE,
	credentials: env.CORS_CREDENTIALS,
};
