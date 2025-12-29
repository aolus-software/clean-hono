# TODO: Implement Proper Dependency Injection

## Priority: Medium

## Current State

- Services are imported directly in handlers
- Repositories are factory functions
- No DI container
- Hard to mock for testing
- Context binding is commented out in `app.ts`

```typescript
// Current usage in app.ts (commented out)
app.use("*", async (c, next) => {
	// c.set("authService", new AuthService());
	await next();
});

// Current usage in handlers
import { AuthService } from "../services/auth.service";
const authService = AuthService;
```

## Goal

Implement a clean dependency injection pattern that maintains the clean architecture principles while improving testability and maintainability.

## Tasks

### 1. Create Service Container

- [ ] Create a lightweight DI container
- [ ] Register services at app startup
- [ ] Access services through context

```typescript
// packages/core/container.ts
type ServiceFactory<T> = () => T;

class Container {
	private services = new Map<string, ServiceFactory<unknown>>();
	private instances = new Map<string, unknown>();

	register<T>(name: string, factory: ServiceFactory<T>): void {
		this.services.set(name, factory);
	}

	resolve<T>(name: string): T {
		if (this.instances.has(name)) {
			return this.instances.get(name) as T;
		}

		const factory = this.services.get(name);
		if (!factory) {
			throw new Error(`Service ${name} not registered`);
		}

		const instance = factory() as T;
		this.instances.set(name, instance);
		return instance;
	}

	reset(): void {
		this.instances.clear();
	}
}

export const container = new Container();
```

### 2. Define Service Interfaces

- [ ] Create interfaces for all services
- [ ] Enable easier testing with mocks

```typescript
// apps/api/interfaces/auth.interface.ts
import { UserInformation } from "../types/UserInformation";

export interface IAuthService {
	login(
		payload: { email: string; password: string },
		context?: { ipAddress: string; userAgent: string },
	): Promise<UserInformation>;

	register(
		payload: { name: string; email: string; password: string },
		context?: { ipAddress: string; userAgent: string },
	): Promise<void>;

	// ... other methods
}

// apps/api/interfaces/user.repository.interface.ts
export interface IUserRepository {
	findByEmail(email: string): Promise<User | null>;
	findById(id: string): Promise<User | null>;
	UserInformation(userId: string): Promise<UserInformation>;
	// ... other methods
}
```

### 3. Update Services to Implement Interfaces

- [ ] Services implement their interfaces
- [ ] Accept dependencies via constructor/factory

```typescript
// apps/api/services/auth.service.ts
import { IAuthService } from "../interfaces/auth.interface";
import { IUserRepository } from "../interfaces/user.repository.interface";

export const createAuthService = (
	userRepository: IUserRepository,
): IAuthService => ({
	async login(payload, context) {
		const user = await userRepository.findByEmail(payload.email);
		// ... implementation
	},
	// ... other methods
});
```

### 4. Register Services at Startup

- [ ] Create bootstrap file for service registration
- [ ] Register all services and repositories

```typescript
// apps/api/bootstrap.ts
import { container } from "@packages/core/container";
import { createAuthService } from "./services/auth.service";
import { createUserRepository } from "./repositories/user.repository";
import { db } from "@postgres/index";

export const bootstrap = () => {
	// Register repositories
	container.register("userRepository", () => createUserRepository(db));

	// Register services (with dependencies)
	container.register("authService", () =>
		createAuthService(container.resolve("userRepository")),
	);

	// ... register other services
};
```

### 5. Create DI Middleware

- [ ] Inject services into Hono context
- [ ] Type-safe service access

```typescript
// apps/api/middlewares/di.middleware.ts
import { container } from "@packages/core/container";
import { MiddlewareHandler } from "hono";

export const diMiddleware: MiddlewareHandler = async (c, next) => {
	c.set("authService", container.resolve<IAuthService>("authService"));
	c.set("userRepository", container.resolve<IUserRepository>("userRepository"));
	// ... inject other services
	await next();
};

// Update app types
export type Variables = {
	currentUser: UserInformation;
	authService: IAuthService;
	userRepository: IUserRepository;
};
```

### 6. Update Handlers to Use Injected Services

- [ ] Remove direct service imports
- [ ] Use context-injected services

```typescript
// apps/api/handlers/auth.handler.ts
export const AuthHandler = {
	login: async (c: Context<Env>) => {
		const authService = c.get("authService");
		const payload = c.get("validatedData");

		const user = await authService.login(payload, {
			ipAddress: c.req.header("x-forwarded-for") || "unknown",
			userAgent: c.req.header("user-agent") || "unknown",
		});

		// ...
	},
};
```

### 7. Alternative: Use Hono's Native Factory Pattern

- [ ] Consider using `createFactory` from Hono
- [ ] Simpler approach for smaller apps

```typescript
import { createFactory } from "hono/factory";

const factory = createFactory<Env>();

// Create handlers with dependencies
const createAuthHandlers = (deps: { authService: IAuthService }) => ({
  login: factory.createHandlers(async (c) => {
    const user = await deps.authService.login(...);
    return c.json({ user });
  }),
});
```

### 8. Testing Benefits

- [ ] Easy to mock dependencies
- [ ] Isolated unit tests
- [ ] Integration tests with real services

```typescript
// tests/unit/services/auth.service.test.ts
import { createAuthService } from "@api/services/auth.service";

describe("AuthService", () => {
	const mockUserRepository = {
		findByEmail: jest.fn(),
		findById: jest.fn(),
	};

	const authService = createAuthService(mockUserRepository);

	test("login throws for non-existent user", async () => {
		mockUserRepository.findByEmail.mockResolvedValue(null);

		await expect(
			authService.login({ email: "test@test.com", password: "pass" }),
		).rejects.toThrow();
	});
});
```

## Resources

- [Hono Factory](https://hono.dev/docs/helpers/factory)
- [Clean Architecture in TypeScript](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection Patterns](https://martinfowler.com/articles/injection.html)

## Success Criteria

- [ ] Services accessed through DI container or context
- [ ] All services have interfaces
- [ ] Easy to mock services in tests
- [ ] No direct service imports in handlers
- [ ] Clean separation of concerns maintained
