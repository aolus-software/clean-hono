import { RedisClient as BunRedisClient } from "bun";
import { RedisConfig } from "@config";
import IORedis from "ioredis";

const buildUrl = (): string => {
	const auth = RedisConfig.REDIS_PASSWORD
		? `:${encodeURIComponent(RedisConfig.REDIS_PASSWORD)}@`
		: "";
	return `redis://${auth}${RedisConfig.REDIS_HOST}:${RedisConfig.REDIS_PORT}/${RedisConfig.REDIS_DB}`;
};

/**
 * Two clients on the same Redis: Bun's native client for the cache and
 * refresh-token ids, and one shared ioredis connection for BullMQ, which
 * requires ioredis and `maxRetriesPerRequest: null`.
 */
export class RedisClient {
	private static redis: BunRedisClient | null = null;
	private static queueRedis: IORedis | null = null;

	static getRedisClient(): BunRedisClient {
		if (!this.redis) {
			this.redis = new BunRedisClient(buildUrl());
		}
		return this.redis;
	}

	static getQueueConnection(): IORedis {
		if (!this.queueRedis) {
			this.queueRedis = new IORedis({
				host: RedisConfig.REDIS_HOST,
				port: RedisConfig.REDIS_PORT,
				password: RedisConfig.REDIS_PASSWORD || undefined,
				db: RedisConfig.REDIS_DB,
				maxRetriesPerRequest: null,
			});
		}
		return this.queueRedis;
	}
}
