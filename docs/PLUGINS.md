# Plugin System Documentation

## Overview

The plugin system provides a modular, extensible architecture for adding features to your Hono application. Inspired by Elysia's plugin architecture, it offers:

- **Modular Design**: Isolate features into reusable plugins
- **Lifecycle Hooks**: Control plugin initialization and teardown
- **Dependency Management**: Declare and validate plugin dependencies
- **Type Safety**: Full TypeScript support with strict typing
- **Middleware Support**: Apply middleware at plugin level
- **Route Registration**: Define routes within plugins
- **Configuration**: Plugin-specific configuration options

## Architecture

### Core Components

**Plugin Registry** (`plugin.registry.ts`):

- Manages plugin registration and lifecycle
- Validates dependencies
- Handles plugin hooks
- Provides plugin queries

**Plugin Builder** (`plugin.builder.ts`):

- Fluent API for creating plugins
- Type-safe plugin construction
- Helper functions for quick plugin creation

**Plugin Types** (`plugin.types.ts`):

- TypeScript interfaces and types
- Error classes for plugin system
- Metadata structures

## Creating Plugins

### Method 1: Using Plugin Builder

The plugin builder provides a fluent API for constructing plugins:

```typescript
import { createPlugin } from "@libs/plugins";

export const myPlugin = createPlugin()
	.withMetadata({
		name: "my-plugin",
		version: "1.0.0",
		description: "My awesome plugin",
		author: "Your Name",
		dependencies: [], // Optional: other plugins this depends on
		tags: ["feature", "utility"],
	})
	.withHooks({
		onBeforeRegister: async (app) => {
			console.log("Preparing to register plugin");
		},
		onAfterRegister: async (app) => {
			console.log("Plugin registered successfully");
		},
		onStart: async () => {
			console.log("Application started");
		},
		onStop: async () => {
			console.log("Application stopping");
		},
	})
	.withMiddleware(async (c, next) => {
		// Middleware logic
		await next();
	})
	.withSetup(async (app, options) => {
		// Setup logic
		console.log("Setting up plugin with options:", options);
	})
	.withRoutes((app, options) => {
		const prefix = options?.prefix || "/api";

		app.get(`${prefix}/my-route`, (c) => {
			return c.json({ message: "Hello from plugin!" });
		});
	})
	.withTeardown(async () => {
		// Cleanup logic
		console.log("Cleaning up plugin resources");
	})
	.build();
```

### Method 2: Using definePlugin Helper

For simpler plugins, use the `definePlugin` helper:

```typescript
import { definePlugin } from "@libs/plugins";

export const simplePlugin = definePlugin(
	{
		name: "simple-plugin",
		version: "1.0.0",
		description: "A simple plugin",
	},
	async (app, options) => {
		// Plugin setup
		app.get("/simple", (c) => c.json({ status: "ok" }));
	},
);
```

### Method 3: Manual Implementation

Implement the `Plugin` interface directly:

```typescript
import type { Plugin } from "@types";

export const manualPlugin: Plugin = {
	metadata: {
		name: "manual-plugin",
		version: "1.0.0",
	},
	setup: async (app, options) => {
		// Setup logic
	},
	routes: (app, options) => {
		// Route registration
	},
};
```

## Plugin Metadata

### Required Fields

| Field     | Type     | Description                      |
| --------- | -------- | -------------------------------- |
| `name`    | `string` | Unique plugin identifier         |
| `version` | `string` | Semantic version (e.g., "1.0.0") |

### Optional Fields

| Field          | Type       | Description                      |
| -------------- | ---------- | -------------------------------- |
| `description`  | `string`   | Plugin purpose and functionality |
| `author`       | `string`   | Plugin author/maintainer         |
| `dependencies` | `string[]` | Required plugins (by name)       |
| `tags`         | `string[]` | Categorization tags              |

## Lifecycle Hooks

### Available Hooks

**onBeforeRegister** `(app: AppType) => Promise<void> | void`:

- Called before plugin registration
- Use for validation or preparation
- Throws to prevent registration

**onAfterRegister** `(app: AppType) => Promise<void> | void`:

- Called after successful registration
- Use for notifications or post-setup

**onStart** `() => Promise<void> | void`:

- Called when application starts
- Use for service initialization

**onStop** `() => Promise<void> | void`:

- Called during application shutdown
- Use for cleanup and resource release

### Hook Execution Order

```
1. onBeforeRegister
2. Middleware registration
3. Setup execution
4. Route registration
5. onAfterRegister
------------------- (later)
6. onStart (on app startup)
7. onStop (on app shutdown)
```

## Plugin Options

Configure plugins during registration:

```typescript
interface PluginOptions {
	enabled?: boolean; // Enable/disable plugin
	config?: Record<string, unknown>; // Plugin-specific config
	prefix?: string; // Route prefix
}
```

### Example

```typescript
await registry.register(myPlugin, {
	enabled: true,
	prefix: "/api/v1",
	config: {
		maxRetries: 3,
		timeout: 5000,
	},
});
```

## Registering Plugins

### Initialize Registry

```typescript
import { PluginRegistry } from "@libs/plugins";
import { Hono } from "hono";

const app = new Hono();
const registry = new PluginRegistry(app);
```

### Register Single Plugin

```typescript
await registry.register(healthCheckPlugin, {
	prefix: "/api",
});
```

### Register Multiple Plugins

```typescript
const plugins = [
	{ plugin: healthCheckPlugin, options: { prefix: "/api" } },
	{ plugin: requestLoggerPlugin, options: { enabled: true } },
];

for (const { plugin, options } of plugins) {
	await registry.register(plugin, options);
}
```

### Conditional Registration

```typescript
if (AppConfig.APP_ENV === "development") {
	await registry.register(debugPlugin);
}

if (AppConfig.ENABLE_ANALYTICS) {
	await registry.register(analyticsPlugin);
}
```

## Plugin Dependencies

### Declaring Dependencies

```typescript
export const advancedPlugin = createPlugin()
	.withMetadata({
		name: "advanced-plugin",
		version: "1.0.0",
		dependencies: ["health-check", "auth"], // Requires these plugins
	})
	.build();
```

### Registration Order

Ensure dependencies are registered first:

```typescript
// Correct order
await registry.register(authPlugin);
await registry.register(healthCheckPlugin);
await registry.register(advancedPlugin); // Depends on above

// Wrong order - will throw PluginDependencyError
await registry.register(advancedPlugin);
await registry.register(authPlugin); // Too late!
```

## Example Plugins

### 1. Health Check Plugin

```typescript
export const healthCheckPlugin = createPlugin()
	.withMetadata({
		name: "health-check",
		version: "1.0.0",
		description: "Provides health check endpoints",
		tags: ["health", "monitoring"],
	})
	.withRoutes((app, options) => {
		const prefix = options?.prefix || "/api";

		app.get(`${prefix}/health`, (c) => {
			return c.json({
				status: "ok",
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
			});
		});

		app.get(`${prefix}/ready`, (c) => {
			return c.json({
				status: "ready",
			});
		});
	})
	.build();
```

### 2. Authentication Plugin

```typescript
export const authPlugin = createPlugin()
	.withMetadata({
		name: "auth",
		version: "1.0.0",
		description: "JWT authentication",
	})
	.withMiddleware(async (c, next) => {
		const token = c.req.header("Authorization");

		if (!token) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Validate token...
		await next();
	})
	.build();
```

### 3. Rate Limiting Plugin

```typescript
export const rateLimitPlugin = definePlugin(
	{
		name: "rate-limit",
		version: "1.0.0",
	},
	async (app, options) => {
		const config =
			(options?.config as { limit?: number; window?: number }) || {};
		const limit = config.limit || 100;
		const window = config.window || 60000;

		const requests = new Map<string, number[]>();

		app.use("*", async (c, next) => {
			const ip = c.req.header("x-forwarded-for") || "unknown";
			const now = Date.now();
			const timestamps = requests.get(ip) || [];

			const recentRequests = timestamps.filter((t) => now - t < window);

			if (recentRequests.length >= limit) {
				return c.json({ error: "Too many requests" }, 429);
			}

			recentRequests.push(now);
			requests.set(ip, recentRequests);

			await next();
		});
	},
);
```

## Best Practices

### 1. Use Descriptive Names

✅ **Good**:

```typescript
name: "authentication-jwt";
name: "health-check";
name: "rate-limiter-redis";
```

❌ **Bad**:

```typescript
name: "plugin1";
name: "my-plugin";
name: "test";
```

### 2. Version Your Plugins

Follow semantic versioning:

- `1.0.0`: Initial release
- `1.0.1` Patch (bug fixes)
- `1.1.0`: Minor (new features, backward compatible)
- `2.0.0`: Major (breaking changes)

### 3. Handle Errors Gracefully

```typescript
.withSetup(async (app, options) => {
  try {
    await initializeService();
  } catch (error) {
    logger.error({ error }, "Plugin setup failed");
    throw error; // Prevent registration on critical errors
  }
})
```

### 4. Clean Up Resources

```typescript
.withTeardown(async () => {
  await closeConnections();
  await clearCaches();
  logger.info("Plugin resources cleaned up");
})
```

### 5. Make Plugins Configurable

```typescript
interface MyPluginConfig {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
}

export const configurablePlugin = definePlugin(
  { name: "configurable", version: "1.0.0" },
  async (app, options) => {
    const config = options?.config as MyPluginConfig || {};
    usageMetadata: {
    timeout: config.timeout || 5000,
      retries: config.retries || 3,
    };
  }
);
```

### 6. Add Tags for Organization

```typescript
.withMetadata({
  name: "analytics",
  version: "1.0.0",
  tags: ["monitoring", "analytics", "metrics", "production"],
})
```

## Error Handling

### Plugin Errors

**PluginError**: Base error for plugin-related issues
**PluginDependencyError**: Missing dependency
**PluginAlreadyRegisteredError**: Duplicate registration

### Handling Errors

```typescript
try {
	await registry.register(myPlugin);
} catch (error) {
	if (error instanceof PluginDependencyError) {
		console.error("Missing dependency:", error.message);
	} else if (error instanceof PluginAlreadyRegisteredError) {
		console.error("Plugin already registered");
	} else {
		console.error("Plugin error:", error);
	}
}
```

## Advanced Usage

### Dynamic Plugin Loading

```typescript
async function loadPlugins(pluginNames: string[]) {
	for (const name of pluginNames) {
		const plugin = await import(`./plugins/${name}`);
		await registry.register(plugin.default);
	}
}
```

### Plugin Discovery

```typescript
// List all registered plugins
registry.listPlugins();

// Check if plugin exists
if (registry.has("health-check")) {
	console.log("Health check is available");
}

// Get plugin details
const entry = registry.get("health-check");
console.log(entry?.plugin.metadata);
```

### Calling Lifecycle Hooks

```typescript
// Call onStart hooks for all plugins
await registry.callHook("onStart");

// During shutdown
await registry.callHook("onStop");
```

## Migration from Middleware

### Before (Middleware)

```typescript
// app.ts
app.use("*", authMiddleware);
app.use("*", loggingMiddleware);
app.get("/health", healthHandler);
```

### After (Plugins)

```typescript
// plugins/auth.plugin.ts
export const authPlugin = createPlugin().withMiddleware(authMiddleware).build();

// app.ts
const registry = new PluginRegistry(app);
await registry.register(authPlugin);
await registry.register(loggingPlugin);
await registry.register(healthPlugin);
```

## Troubleshooting

### Plugin Not Registering

**Check**:

1. Plugin metadata is complete
2. Dependencies are registered first
3. No duplicate plugin names
4. Options have `enabled: true` (or omitted)

### Routes Not Working

**Check**:

1. Route prefix configuration
2. Plugin routes function is defined
3. No route conflicts with existing routes
4. Plugin actually registered

### Hooks Not Executing

**Check**:

1. Hooks are properly defined
2. Using correct hook names
3. Hooks don't throw errors
4. `callHook()` is being called for manual hooks

## Further Reading

- [Hono Documentation](https://hono.dev/)
- [Elysia Plugins](https://elysiajs.com/plugins/overview.html)
- [Plugin Design Patterns](https://refactoring.guru/design-patterns/plugin)

## Examples in This Project

See `src/libs/plugins/examples/` for complete working examples:

- `health-check.plugin.ts`: Simple health check endpoints
- `request-logger.plugin.ts`: Request logging with configuration
