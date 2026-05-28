import type { RedisClient as BunRedisClient } from "bun";
import { logger } from "@utils";
import { RedisClient } from "@database";

class Cache {
	private static getClient(): BunRedisClient {
		return RedisClient.getRedisClient();
	}

	static async get<T>(key: string): Promise<T | null> {
		try {
			const value = await this.getClient().get(key);
			return value ? (JSON.parse(value) as T) : null;
		} catch (error) {
			logger.error(error, `Error getting cache for key ${key}:`);
			return null;
		}
	}

	static async set<T>(
		key: string,
		value: T,
		ttl: number = 3600,
	): Promise<void> {
		try {
			await this.getClient().send("SET", [
				key,
				JSON.stringify(value),
				"EX",
				String(ttl),
			]);
		} catch (error) {
			logger.error(error, `Error setting cache for key ${key}:`);
		}
	}

	static async delete(key: string): Promise<void> {
		try {
			await this.getClient().del(key);
		} catch (error) {
			logger.error(error, `Error deleting cache for key ${key}:`);
		}
	}

	static async flush(): Promise<void> {
		try {
			await this.getClient().send("FLUSHDB", []);
		} catch (error) {
			logger.error(error, "Error flushing Redis cache:");
		}
	}

	static async exists(key: string): Promise<boolean> {
		try {
			const exists = await this.getClient().exists(key);
			return exists === true;
		} catch (error) {
			logger.error(error, `Error checking existence of key ${key}:`);
			return false;
		}
	}

	static async remember<T>(
		key: string,
		callback: () => Promise<T>,
		ttl: 3600,
	): Promise<T | null> {
		const cachedValue = await this.get<T>(key);
		if (cachedValue !== null) {
			return cachedValue;
		}

		const freshValue = await callback();
		await this.set(key, freshValue, ttl);
		return freshValue;
	}

	static generateKey(...args: string[]): string {
		return args.join(":");
	}

	static async getKeys(pattern: string): Promise<string[]> {
		try {
			const keys = await this.getClient().keys(pattern);
			return keys;
		} catch (error) {
			logger.error(error, `Error getting keys with pattern ${pattern}:`);
			return [];
		}
	}

	static disconnect(): void {
		try {
			this.getClient().close();
		} catch (error) {
			logger.error(error, "Error disconnecting from Redis:");
		}
	}
}

export { Cache };
