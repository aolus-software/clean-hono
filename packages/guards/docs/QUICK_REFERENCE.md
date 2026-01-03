# Guard Middleware Quick Reference

## Import

```typescript
import {
	authMiddleware,
	roleGuard,
	permissionGuard,
	Guards,
	requireGuards,
} from "@app/api/middlewares";
```

## Basic Usage

```typescript
// 1. Always apply auth first
MyRoutes.use(authMiddleware);

// 2. Apply guards
MyRoutes.use(roleGuard(["admin"]));
// OR
MyRoutes.use(permissionGuard(["user list"]));
// OR
MyRoutes.use(Guards.adminOnly());
```

## Role Guard

```typescript
// Single role
roleGuard(["admin"]);

// Multiple roles (OR - needs at least one)
roleGuard(["admin", "superuser"]);
```

## Permission Guard

```typescript
// Single permission
permissionGuard(["user list"]);

// Multiple permissions (OR - needs at least one)
permissionGuard(["user create", "user edit"]);
```

## Convenience Guards

### Roles

```typescript
Guards.adminOnly(); // admin OR superuser
Guards.superuserOnly(); // superuser only
```

### User Management

```typescript
Guards.userManagement.list();
Guards.userManagement.create();
Guards.userManagement.detail();
Guards.userManagement.edit();
Guards.userManagement.delete();
Guards.userManagement.any(); // any user permission
```

### Permission Management

```typescript
Guards.permissionManagement.list();
Guards.permissionManagement.create();
Guards.permissionManagement.detail();
Guards.permissionManagement.edit();
Guards.permissionManagement.delete();
Guards.permissionManagement.any();
```

### Role Management

```typescript
Guards.roleManagement.list();
Guards.roleManagement.create();
Guards.roleManagement.detail();
Guards.roleManagement.edit();
Guards.roleManagement.delete();
Guards.roleManagement.any();
```

## requireGuards Helper

```typescript
// Both role AND permissions
...requireGuards({
  roles: ['admin'],
  permissions: ['user create']
})

// Only role
...requireGuards({ roles: ['superuser'] })

// Only permissions
...requireGuards({ permissions: ['user list'] })
```

## Application Patterns

### Global (all routes)

```typescript
MyRoutes.use(authMiddleware);
MyRoutes.use(Guards.adminOnly());
// All routes below require admin
```

### Path-based

```typescript
MyRoutes.use(authMiddleware);
MyRoutes.use("/admin/*", Guards.adminOnly());
// Only /admin/* routes require admin
```

### Per-route

```typescript
MyRoutes.use(authMiddleware);

MyRoutes.openapi(ListRoute, async (c) => {
	/* ... */
});
MyRoutes.use("/", Guards.userManagement.list());

MyRoutes.openapi(CreateRoute, async (c) => {
	/* ... */
});
MyRoutes.use("/", Guards.userManagement.create());
```

### Chaining (AND logic)

```typescript
MyRoutes.use(authMiddleware);
MyRoutes.use(Guards.adminOnly()); // Must be admin
MyRoutes.use(permissionGuard(["sensitive"])); // AND have permission
```

## Permission Naming

Format: `{resource} {action}`

Resources: `user`, `permission`, `role`
Actions: `list`, `create`, `detail`, `edit`, `delete`

Examples:

- `user list` - Can view user list
- `user create` - Can create users
- `permission edit` - Can edit permissions
- `role delete` - Can delete roles

## Error Messages

```
"User information not found. Please ensure authMiddleware is applied before [guard]."
"Access denied. Required roles: admin, superuser"
"Access denied. Required permissions: user list, user create"
```

## Complete Example

```typescript
import { authMiddleware, Guards } from "@app/api/middlewares";
import { OpenAPIHono } from "@hono/zod-openapi";

const UserRoutes = new OpenAPIHono();

// 1. Auth
UserRoutes.use(authMiddleware);

// 2. Optional: role guard for all routes
// UserRoutes.use(Guards.adminOnly());

// 3. Routes with permission guards
UserRoutes.openapi(UserListRoute, async (c) => {
	/* ... */
});
UserRoutes.use("/", Guards.userManagement.list());

UserRoutes.openapi(UserCreateRoute, async (c) => {
	/* ... */
});
UserRoutes.use("/", Guards.userManagement.create());

UserRoutes.openapi(UserUpdateRoute, async (c) => {
	/* ... */
});
UserRoutes.use("/:id", Guards.userManagement.edit());

UserRoutes.openapi(UserDeleteRoute, async (c) => {
	/* ... */
});
UserRoutes.use("/:id", Guards.userManagement.delete());

export default UserRoutes;
```

## OpenAPI Guard Descriptions

Add access requirements to OpenAPI docs:

```typescript
// In route definition
responses: {
  200: {
    content: { /* ... */ },
    description: GuardDescriptions.userManagement.list()
    // Shows: "Fetch list of users
    //
    // **Access Requirements:**
    // - **Permissions:** user list"
  }
}

// Custom descriptions
description: withGuardDescription("My endpoint", {
  roles: ['admin'],
  permissions: ['user create']
})

// Available pre-built descriptions
GuardDescriptions.userManagement.list()
GuardDescriptions.userManagement.create()
GuardDescriptions.userManagement.detail()
GuardDescriptions.userManagement.edit()
GuardDescriptions.userManagement.delete()

GuardDescriptions.permissionManagement.list()
GuardDescriptions.permissionManagement.create()
// ... etc

GuardDescriptions.roleManagement.list()
GuardDescriptions.roleManagement.create()
// ... etc

GuardDescriptions.adminOnly("Description")
GuardDescriptions.superuserOnly("Description")
```

## Tips

✅ Always apply `authMiddleware` first
✅ Use `Guards.*` for cleaner code
✅ Apply at the right level (global/path/route)
✅ Array = OR logic, Chaining = AND logic
✅ Document access requirements clearly
✅ Use `GuardDescriptions` in OpenAPI route definitions

❌ Don't forget `authMiddleware`
❌ Don't apply guards without auth
❌ Don't use guards in `openapi()` parameters
