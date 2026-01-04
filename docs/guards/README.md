# Guard Middleware System

A comprehensive role-based and permission-based access control (RBAC) system for Hono routes.

## Overview

This guard middleware system provides three main components:

1. **Role Guard** (`roleGuard`) - Check if user has specific roles
2. **Permission Guard** (`permissionGuard`) - Check if user has specific permissions
3. **Convenience Guards** (`Guards`) - Pre-built guards for common use cases

## Quick Start

```typescript
import {
	authMiddleware,
	roleGuard,
	permissionGuard,
	Guards,
} from "@app/api/middlewares";
import { OpenAPIHono } from "@hono/zod-openapi";

const MyRoutes = new OpenAPIHono();

// Always apply auth first
MyRoutes.use(authMiddleware);

// Apply role guard - only admins can access
MyRoutes.use(Guards.adminOnly());

// Or apply permission guard
MyRoutes.use(permissionGuard(["user create"]));
```

## Core Guards

### Role Guard

Checks if the user has at least one of the specified roles.

```typescript
// Single role
app.use(roleGuard(["admin"]));

// Multiple roles (OR logic - user needs at least one)
app.use(roleGuard(["admin", "superuser"]));
```

### Permission Guard

Checks if the user has at least one of the specified permissions.

```typescript
// Single permission
app.use(permissionGuard(["user list"]));

// Multiple permissions (OR logic - user needs at least one)
app.use(permissionGuard(["user create", "user edit"]));
```

## Convenience Guards

Pre-built guards for common scenarios:

```typescript
import { Guards } from "@app/api/middlewares";

// Role-based
Guards.adminOnly(); // Requires 'admin' or 'superuser' role
Guards.superuserOnly(); // Requires 'superuser' role only

// User management permissions
Guards.userManagement.list(); // Requires 'user list' permission
Guards.userManagement.create(); // Requires 'user create' permission
Guards.userManagement.detail(); // Requires 'user detail' permission
Guards.userManagement.edit(); // Requires 'user edit' permission
Guards.userManagement.delete(); // Requires 'user delete' permission
Guards.userManagement.any(); // Requires ANY user management permission

// Permission management
Guards.permissionManagement.list(); // Requires 'permission list' permission
Guards.permissionManagement.create(); // Requires 'permission create' permission
Guards.permissionManagement.detail(); // Requires 'permission detail' permission
Guards.permissionManagement.edit(); // Requires 'permission edit' permission
Guards.permissionManagement.delete(); // Requires 'permission delete' permission
Guards.permissionManagement.any(); // Requires ANY permission management permission

// Role management
Guards.roleManagement.list(); // Requires 'role list' permission
Guards.roleManagement.create(); // Requires 'role create' permission
Guards.roleManagement.detail(); // Requires 'role detail' permission
Guards.roleManagement.edit(); // Requires 'role edit' permission
Guards.roleManagement.delete(); // Requires 'role delete' permission
Guards.roleManagement.any(); // Requires ANY role management permission
```

## Usage Patterns

### Pattern 1: Global Route Protection

Apply guards to all routes in a router:

```typescript
const UserRoutes = new OpenAPIHono();

UserRoutes.use(authMiddleware);
UserRoutes.use(Guards.adminOnly()); // All routes require admin role

// All routes below require admin role
UserRoutes.openapi(UserListRoute, async (c) => {
	/* ... */
});
UserRoutes.openapi(UserCreateRoute, async (c) => {
	/* ... */
});
```

### Pattern 2: Path-Based Protection

Apply guards to specific paths:

```typescript
const SettingsRoutes = new OpenAPIHono();

SettingsRoutes.use(authMiddleware);

// Protect all /settings/users/* routes
SettingsRoutes.use("/users/*", Guards.userManagement.any());

// Protect all /settings/roles/* routes
SettingsRoutes.use("/roles/*", Guards.roleManagement.any());

SettingsRoutes.route("/users", UserRoutes);
SettingsRoutes.route("/roles", RoleRoutes);
```

### Pattern 3: Per-Route Protection

Apply different guards to different routes:

```typescript
const UserRoutes = new OpenAPIHono();

UserRoutes.use(authMiddleware);

// List - requires list permission
UserRoutes.openapi(UserListRoute, async (c) => {
	/* ... */
});
UserRoutes.use("/", Guards.userManagement.list());

// Create - requires create permission
UserRoutes.openapi(UserCreateRoute, async (c) => {
	/* ... */
});
UserRoutes.use("/", Guards.userManagement.create());

// Update - requires edit permission
UserRoutes.openapi(UserUpdateRoute, async (c) => {
	/* ... */
});
UserRoutes.use("/:id", Guards.userManagement.edit());

// Delete - requires delete permission
UserRoutes.openapi(UserDeleteRoute, async (c) => {
	/* ... */
});
UserRoutes.use("/:id", Guards.userManagement.delete());
```

### Pattern 4: Combining Guards (AND Logic)

Apply multiple guards for stricter access control:

```typescript
const AdminRoutes = new OpenAPIHono();

AdminRoutes.use(authMiddleware);

// Must be admin AND have specific permission
AdminRoutes.use(Guards.adminOnly());
AdminRoutes.use(permissionGuard(["system config"]));

// Now routes require both conditions
AdminRoutes.openapi(SystemConfigRoute, async (c) => {
	/* ... */
});
```

### Pattern 5: Using requireGuards Helper

Combine role and permission guards easily:

```typescript
import { requireGuards } from "@app/api/middlewares";

// Require both role and permissions
app.use(
	...requireGuards({
		roles: ["admin"],
		permissions: ["sensitive data access"],
	}),
);

// Only role
app.use(...requireGuards({ roles: ["superuser"] }));

// Only permissions
app.use(...requireGuards({ permissions: ["user create", "user edit"] }));
```

## Complete Example

```typescript
import { authMiddleware, Guards } from "@app/api/middlewares";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ZodDatatableSchema } from "@packages/*";
import { ResponseToolkit } from "@toolkit/response";
import { commonResponse } from "@toolkit/schemas";

const UserRoutes = new OpenAPIHono();

// Apply authentication to all routes
UserRoutes.use(authMiddleware);

// Optionally apply role guard to all routes
UserRoutes.use(Guards.adminOnly());

// Define your routes
const UserGetRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Settings/Users"],
	security: [{ Bearer: [] }],
	request: {
		query: ZodDatatableSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserListResponseSchema,
				},
			},
			description: "List of users",
		},
		...commonResponse(UserListResponseSchema, "UserGetResponse", {
			exclude: [200, 201],
		}),
	},
});

UserRoutes.openapi(UserGetRoute, async (c) => {
	const queryParam = c.req.valid("query");
	const userService = new UserService();
	const users = await userService.findAll(queryParam);

	return ResponseToolkit.success(c, users, "Fetched users successfully", 200);
});

// Apply permission guard to this specific route
UserRoutes.use("/", Guards.userManagement.list());

export default UserRoutes;
```

## Permission Naming Convention

Permissions follow the pattern: `{resource} {action}`

**Resources:**

- `user` - User management
- `permission` - Permission management
- `role` - Role management

**Actions:**

- `list` - View list of resources
- `create` - Create new resources
- `detail` - View resource details
- `edit` - Update existing resources
- `delete` - Delete resources

**Examples:**

- `user list` - Can list users
- `user create` - Can create users
- `permission edit` - Can edit permissions
- `role delete` - Can delete roles

## Error Handling

Guards throw `ForbiddenError` when access is denied:

```typescript
// No user in context
throw new ForbiddenError(
	"User information not found. Please ensure authMiddleware is applied before roleGuard.",
);

// Missing role
throw new ForbiddenError("Access denied. Required roles: admin, superuser");

// Missing permission
throw new ForbiddenError(
	"Access denied. Required permissions: user list, user create",
);
```

These errors are automatically handled by the error handler middleware and return appropriate HTTP responses.

## How It Works

### User Information Structure

The guards work with the `UserInformation` type loaded by `authMiddleware`:

```typescript
interface UserInformation {
	id: string;
	name: string;
	email: string;
	roles: string[]; // e.g., ['admin', 'superuser']
	permissions: {
		name: string; // role name
		permissions: string[]; // e.g., ['user list', 'user create']
	}[];
}
```

### Role Guard Logic

```typescript
// Checks if user has at least ONE of the allowed roles
const hasRole = currentUser.roles.some((userRole) =>
	allowedRoles.includes(userRole),
);
```

### Permission Guard Logic

```typescript
// Collects all permissions from all roles
const userPermissions: string[] = [];
for (const rolePermission of currentUser.permissions) {
	userPermissions.push(...rolePermission.permissions);
}

// Checks if user has at least ONE of the allowed permissions
const hasPermission = userPermissions.some((userPermission) =>
	allowedPermissions.includes(userPermission),
);
```

## Best Practices

1. **Always apply `authMiddleware` first** - Guards depend on user information
2. **Use role guards for sections** - E.g., admin panel, user dashboard
3. **Use permission guards for actions** - E.g., create, edit, delete operations
4. **Leverage convenience guards** - Use `Guards.*` for cleaner code
5. **Apply guards at appropriate level** - Global, path-based, or per-route
6. **Document your access control** - Make it clear what's required for each route
7. **Use arrays for OR logic** - `['admin', 'superuser']` means either role works
8. **Chain guards for AND logic** - Apply multiple guards sequentially

## Database Schema

The RBAC system uses these tables:

- `users` - User accounts
- `roles` - Available roles (e.g., admin, superuser)
- `permissions` - Available permissions (e.g., user list, user create)
- `user_roles` - Links users to their roles (many-to-many)
- `role_permissions` - Links roles to their permissions (many-to-many)

## Seeding

Default roles and permissions are seeded via `RBACSeeder`:

```typescript
// Default roles
const roleNames = ["superuser", "admin"];

// Default permission groups and actions
const groupNames = ["user", "permission", "role"];
const permissionNames = ["list", "create", "detail", "edit", "delete"];
```

This creates permissions like:

- `user list`, `user create`, `user detail`, `user edit`, `user delete`
- `permission list`, `permission create`, `permission detail`, `permission edit`, `permission delete`
- `role list`, `role create`, `role detail`, `role edit`, `role delete`

## OpenAPI Documentation with Guard Descriptions

To document access requirements in your OpenAPI/Swagger documentation, use the `GuardDescriptions` helper:

```typescript
import { GuardDescriptions, withGuardDescription } from "@app/api/middlewares";

// Use pre-built descriptions
const route = createRoute({
	method: "get",
	path: "/users",
	// ...
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserListResponseSchema,
				},
			},
			description: GuardDescriptions.userManagement.list(),
			// This generates:
			// "Fetch list of users
			//
			// **Access Requirements:**
			// - **Permissions:** user list"
		},
	},
});

// Or create custom descriptions
const customRoute = createRoute({
	// ...
	responses: {
		200: {
			// ...
			description: withGuardDescription("Custom endpoint description", {
				roles: ["admin", "superuser"],
				permissions: ["custom permission"],
			}),
		},
	},
});
```

### Available Guard Descriptions

```typescript
// Admin access
GuardDescriptions.adminOnly("Your description");
GuardDescriptions.superuserOnly("Your description");

// User management (with default descriptions)
GuardDescriptions.userManagement.list(); // "Fetch list of users"
GuardDescriptions.userManagement.create(); // "Create a new user"
GuardDescriptions.userManagement.detail(); // "Fetch user details"
GuardDescriptions.userManagement.edit(); // "Update user information"
GuardDescriptions.userManagement.delete(); // "Delete a user"

// Permission management
GuardDescriptions.permissionManagement.list();
GuardDescriptions.permissionManagement.create();
GuardDescriptions.permissionManagement.detail();
GuardDescriptions.permissionManagement.edit();
GuardDescriptions.permissionManagement.delete();

// Role management
GuardDescriptions.roleManagement.list();
GuardDescriptions.roleManagement.create();
GuardDescriptions.roleManagement.detail();
GuardDescriptions.roleManagement.edit();
GuardDescriptions.roleManagement.delete();

// Custom descriptions with roles and/or permissions
withGuardDescription("Base description", {
	roles: ["admin"],
	permissions: ["user create"],
});
```

The descriptions will appear in your Swagger/OpenAPI documentation, clearly showing what roles or permissions are required to access each endpoint.

## Further Reading

See [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) for more detailed examples and patterns.
