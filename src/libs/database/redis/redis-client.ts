import { RedisClient as BunRedisClient } from "bun";
import { RedisConfig } from "@config";

const buildUrl = (): string => {
	const auth = RedisConfig.REDIS_PASSWORD
		? `:${encodeURIComponent(RedisConfig.REDIS_PASSWORD)}@`
		: "";
	return `redis://${auth}${RedisConfig.REDIS_HOST}:${RedisConfig.REDIS_PORT}`;
};

export interface QueueConnectionOptions {
	host: string;
	port: number;
	password?: string;
	maxRetriesPerRequest: null;
}

export class RedisClient {
	private static redis: BunRedisClient | null = null;

	static getRedisClient(): BunRedisClient {
		if (!this.redis) {
			this.redis = new BunRedisClient(buildUrl());
		}
		return this.redis;
	}

	static getQueueConnection(): QueueConnectionOptions {
		return {
			host: RedisConfig.REDIS_HOST,
			port: RedisConfig.REDIS_PORT,
			password: RedisConfig.REDIS_PASSWORD || undefined,
			maxRetriesPerRequest: null,
		};
	}
}
