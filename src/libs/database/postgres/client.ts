import { DatabaseConfig } from "@config";
import { logger } from "@utils/hono/logger";
import type { Logger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./schema";

/**
 * Debug-level SQL log behind DB_LOG_QUERIES. Only the statement text and the
 * parameter count are written: parameters carry password hashes and tokens.
 */
class QueryLogger implements Logger {
	logQuery(query: string, params: unknown[]): void {
		logger.debug({ query, paramCount: params.length }, "db query");
	}
}

const client = new Pool({
	connectionString: DatabaseConfig.DATABASE_URL,
	max: DatabaseConfig.DB_POOL_MAX,
	idleTimeoutMillis: DatabaseConfig.DB_POOL_IDLE_TIMEOUT_MS,
	connectionTimeoutMillis: DatabaseConfig.DB_POOL_CONNECTION_TIMEOUT_MS,
});

client.on("error", (error) => {
	logger.error({ error }, "Idle PostgreSQL client error");
});

const db = drizzle(client, {
	schema,
	logger: DatabaseConfig.DB_LOG_QUERIES ? new QueryLogger() : false,
});

export { client, db };
