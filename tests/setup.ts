/**
 * Runs before every test file. `bun test` sets NODE_ENV=test and loads
 * `.env`, so the values that matter are pinned here: a NODE_ENV that env.ts
 * accepts, throwaway JWT secrets, and a database and Redis db that are never
 * the development ones.
 */
process.env.NODE_ENV = "development";
process.env.LOG_LEVEL = "error";
process.env.ENABLE_API_DOCS = "false";
process.env.APP_CLUSTER_MODE = "false";
process.env.JWT_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	"postgresql://postgres:postgres@localhost:5432/hono_clean_test";
process.env.REDIS_DB = process.env.TEST_REDIS_DB ?? "15";
