# Guard Middleware Usage Examples

This document demonstrates how to use the `roleGuard` and `permissionGuard` middlewares in your Hono routes.

## Prerequisites

Both guards require `authMiddleware` to be applied first, as they depend on the `currentUser` being set in the context.

## Import

```typescript
import {
	authMiddleware,
	roleGuard,
	permissionGuard,
} from "@app/api/middlewares";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
```

## Pattern 1: Apply Guards to All Routes

Apply the guard to all routes in the router:

```typescript
const MyRoutes = new OpenAPIHono();

// Apply auth middleware first
MyRoutes.use(authMiddleware);

// Apply role guard to all routes (only admins and superusers can access)
MyRoutes.use(roleGuard(["admin", "superuser"]));

// Or apply permission guard to all routes
// MyRoutes.use(permissionGuard(['user list', 'user create']));

// Define your routes...
MyRoutes.openapi(MyRoute, async (c) => {
	// Your handler
});
```

## Pattern 2: Apply Guards to Specific Routes

Apply the guard to specific routes:

```typescript
const MyRoutes = new OpenAPIHono();

// Apply auth to all routes
MyRoutes.use(authMiddleware);

// GET route - requires 'user list' permission
MyRoutes.openapi(ListRoute, async (c) => {
	// Your handler
});
MyRoutes.use("/", permissionGuard(["user list"]));

// POST route - requires 'user create' permission
MyRoutes.openapi(CreateRoute, async (c) => {
	// Your handler
});
MyRoutes.use("/", permissionGuard(["user create"]));
```

## Pattern 3: Apply Guards to Route Groups

Apply guards using path-based middleware:

```typescript
const MyRoutes = new OpenAPIHono();

MyRoutes.use(authMiddleware);

// Admin-only routes (using role guard)
MyRoutes.use("/admin/*", roleGuard(["admin", "superuser"]));

MyRoutes.openapi(AdminDashboardRoute, async (c) => {
	// Only accessible by admin or superuser
});

// Permission-based routes
MyRoutes.use(
	"/users/*",
	permissionGuard(["user list", "user create", "user edit", "user delete"]),
);

MyRoutes.openapi(UserListRoute, async (c) => {
	// Accessible if user has any of the user permissions
});
```

## Pattern 4: Chain Multiple Guards

Combine role and permission guards:

```typescript
const MyRoutes = new OpenAPIHono();

MyRoutes.use(authMiddleware);

// Must be admin AND have specific permissions
MyRoutes.use("/sensitive/*", roleGuard(["admin"]));
MyRoutes.use("/sensitive/*", permissionGuard(["sensitive data access"]));

MyRoutes.openapi(SensitiveDataRoute, async (c) => {
	// Must satisfy both conditions
});
```

## Pattern 5: Route-Level Guards (Recommended)

Apply guards using Hono's route chaining:

```typescript
const MyRoutes = new OpenAPIHono();

MyRoutes.use(authMiddleware);

// Chain guards before route handler
MyRoutes.on(["GET"], "/", permissionGuard(["user list"]), async (c) => {
	// List users
});

MyRoutes.on(["POST"], "/", permissionGuard(["user create"]), async (c) => {
	// Create user
});

MyRoutes.on(["PUT"], "/:id", permissionGuard(["user edit"]), async (c) => {
	// Update user
});

MyRoutes.on(["DELETE"], "/:id", permissionGuard(["user delete"]), async (c) => {
	// Delete user
});
```

## Complete Example

Here's a complete example with settings/users routes:

```typescript
import {
	authMiddleware,
	roleGuard,
	permissionGuard,
} from "@app/api/middlewares";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ResponseToolkit } from "@toolkit/response";

const UserRoutes = new OpenAPIHono();

// Apply authentication to all routes
UserRoutes.use(authMiddleware);

// Only allow users with admin or superuser role
UserRoutes.use(roleGuard(["admin", "superuser"]));

// Define routes
const UserGetRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Settings/Users"],
	security: [{ Bearer: [] }],
	// ... rest of route definition
});

const UserCreateRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Settings/Users"],
	security: [{ Bearer: [] }],
	// ... rest of route definition
});

// Apply permission guards to specific routes using path
UserRoutes.openapi(UserGetRoute, async (c) => {
	// Fetch users
	return ResponseToolkit.success(c, users, "Fetched users successfully", 200);
});
UserRoutes.use("/", permissionGuard(["user list"]));

UserRoutes.openapi(UserCreateRoute, async (c) => {
	// Create user
	return ResponseToolkit.created(c, {}, "User created successfully");
});
UserRoutes.use("/", permissionGuard(["user create"]));

export default UserRoutes;
```

## Error Handling

When a guard fails, it will throw a `ForbiddenError`:

- **No user in context**: "User information not found. Please ensure authMiddleware is applied before [roleGuard|permissionGuard]."
- **Missing role**: "Access denied. Required roles: admin, superuser"
- **Missing permission**: "Access denied. Required permissions: user list, user create"

These errors are automatically handled by the error handler middleware.

## Best Practices

1. **Always apply `authMiddleware` first** - Guards depend on user information being loaded
2. **Use role guards for coarse-grained access control** - E.g., admin-only sections
3. **Use permission guards for fine-grained access control** - E.g., specific actions like create, edit, delete
4. **Combine guards when needed** - Apply both role and permission guards for sensitive operations
5. **Apply guards at the appropriate level** - Route group for sections, individual routes for specific actions
6. **Document your guards** - Make it clear what roles/permissions are needed for each route
7. **Use arrays for OR logic** - `roleGuard(['admin', 'superuser'])` means user needs either role
8. **Chain guards for AND logic** - Apply multiple guards sequentially for all conditions to be met

## Permission Naming Convention

Based on the RBAC seeder, permissions follow this pattern:

- `{resource} {action}` - E.g., "user list", "user create", "user edit", "user delete"
- Common resources: user, permission, role
- Common actions: list, create, detail, edit, delete
