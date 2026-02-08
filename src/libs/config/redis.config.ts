import { env } from "./env";

interface IRedisConfig {
	REDIS_HOST: string;
	REDIS_PORT: number;
	REDIS_PASSWORD: string | undefined;
}

export const RedisConfig: IRedisConfig = {
	REDIS_HOST: env.REDIS_HOST || "localhost",
	REDIS_PORT: env.REDIS_PORT,
	REDIS_PASSWORD: env.REDIS_PASSWORD,
};
