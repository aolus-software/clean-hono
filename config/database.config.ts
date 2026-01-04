import { env } from "./env";

interface IDatabaseConfig {
	url: string;
}

export const DatabaseConfig: IDatabaseConfig = {
	url: env.DATABASE_URL,
};
