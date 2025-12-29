# TODO: Implement Testing Infrastructure

## Priority: High

## Current State

- No test files found in the project
- No testing framework configured
- No test scripts in `package.json`

## Goal

Implement comprehensive testing infrastructure including unit tests, integration tests, and E2E tests using Bun's native test runner or a compatible testing framework.

## Tasks

### 1. Configure Testing Framework

```bash
# Bun has built-in test runner, but you can also use:
bun add -d vitest @vitest/coverage-v8
```

Add to `package.json`:

```json
{
	"scripts": {
		"test": "bun test",
		"test:watch": "bun test --watch",
		"test:coverage": "bun test --coverage",
		"test:unit": "bun test ./tests/unit",
		"test:integration": "bun test ./tests/integration",
		"test:e2e": "bun test ./tests/e2e"
	}
}
```

### 2. Create Test Directory Structure

- [ ] Create `tests/` directory
- [ ] Create `tests/unit/` for unit tests
- [ ] Create `tests/integration/` for integration tests
- [ ] Create `tests/e2e/` for end-to-end tests
- [ ] Create `tests/fixtures/` for test data
- [ ] Create `tests/helpers/` for test utilities

```
tests/
├── unit/
│   ├── handlers/
│   ├── services/
│   ├── repositories/
│   └── utils/
├── integration/
│   ├── auth/
│   ├── users/
│   └── settings/
├── e2e/
│   └── flows/
├── fixtures/
│   ├── users.ts
│   └── auth.ts
└── helpers/
    ├── setup.ts
    ├── teardown.ts
    └── test-app.ts
```

### 3. Test Helpers Setup

- [ ] Create test app factory
- [ ] Create database test utilities
- [ ] Create authentication helpers

```typescript
// tests/helpers/test-app.ts
import { Hono } from "hono";
import app from "../../apps/api/app";

export const createTestApp = () => {
	return app;
};

// tests/helpers/auth.ts
import { JWTToolkit } from "@toolkit/jwt";

export const createTestToken = async (userId: string) => {
	return new JWTToolkit().sign({ userId });
};

export const createAuthHeader = async (userId: string) => {
	const token = await createTestToken(userId);
	return { Authorization: `Bearer ${token}` };
};
```

### 4. Unit Tests

- [ ] Test utility functions (`packages/toolkit/`)
- [ ] Test validation schemas
- [ ] Test service methods (mocked dependencies)
- [ ] Test repository methods (mocked database)

```typescript
// tests/unit/toolkit/string.test.ts
import { describe, expect, test } from "bun:test";
import { StrToolkit } from "@toolkit/string";

describe("StrToolkit", () => {
	describe("random", () => {
		test("generates string of specified length", () => {
			const result = StrToolkit.random(10);
			expect(result.length).toBe(10);
		});

		test("generates unique strings", () => {
			const a = StrToolkit.random(20);
			const b = StrToolkit.random(20);
			expect(a).not.toBe(b);
		});
	});
});
```

### 5. Integration Tests

- [ ] Test API endpoints with real handlers
- [ ] Test authentication flow
- [ ] Test database operations (test database)

```typescript
// tests/integration/auth/login.test.ts
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { createTestApp } from "../../helpers/test-app";
import { setupTestDatabase, cleanupTestDatabase } from "../../helpers/database";

describe("POST /auth/login", () => {
	const app = createTestApp();

	beforeAll(async () => {
		await setupTestDatabase();
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});

	test("returns 422 for invalid credentials", async () => {
		const response = await app.request("/auth/login", {
			method: "POST",
			body: JSON.stringify({
				email: "nonexistent@test.com",
				password: "wrongpassword",
			}),
			headers: { "Content-Type": "application/json" },
		});

		expect(response.status).toBe(422);
		const data = await response.json();
		expect(data.success).toBe(false);
	});

	test("returns token for valid credentials", async () => {
		// Create test user first
		const response = await app.request("/auth/login", {
			method: "POST",
			body: JSON.stringify({
				email: "test@test.com",
				password: "ValidPass123!",
			}),
			headers: { "Content-Type": "application/json" },
		});

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.data.accessToken).toBeDefined();
	});
});
```

### 6. Test Database Setup

- [ ] Create test database configuration
- [ ] Create migration runner for tests
- [ ] Create seed data for tests
- [ ] Implement cleanup between tests

```typescript
// tests/helpers/database.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

export const setupTestDatabase = async () => {
	const testDb = drizzle(process.env.TEST_DATABASE_URL!);
	await migrate(testDb, { migrationsFolder: "./infra/postgres/migrations" });
	// Seed test data
};

export const cleanupTestDatabase = async () => {
	// Truncate all tables
};
```

### 7. Mocking Setup

- [ ] Create mocks for external services
- [ ] Mock email service
- [ ] Mock Redis cache
- [ ] Mock ClickHouse for analytics

```typescript
// tests/mocks/email.mock.ts
export const mockSendEmailQueue = {
	add: jest.fn().mockResolvedValue(undefined),
};

// In tests
import { mock } from "bun:test";
mock.module("@app/worker/queue/send-email.queue", () => ({
	sendEmailQueue: mockSendEmailQueue,
}));
```

### 8. CI/CD Integration

- [ ] Add test job to CI pipeline
- [ ] Configure test database in CI
- [ ] Add coverage reporting
- [ ] Set minimum coverage thresholds

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test --coverage
```

### 9. Coverage Configuration

- [ ] Configure coverage thresholds
- [ ] Generate coverage reports
- [ ] Exclude non-testable files

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Testing Hono Applications](https://hono.dev/docs/guides/testing)
- [Vitest Documentation](https://vitest.dev/)

## Success Criteria

- [ ] Test scripts work (`bun test`)
- [ ] Unit tests for all utility functions
- [ ] Integration tests for all API endpoints
- [ ] Coverage > 80%
- [ ] Tests run in CI/CD pipeline
- [ ] Test database properly isolated
