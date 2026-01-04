# OpenAPI Guard Descriptions Example

This document demonstrates how the guard descriptions appear in your OpenAPI/Swagger documentation.

## Example Route Definition

```typescript
import { GuardDescriptions } from "@app/api/middlewares";
import { createRoute } from "@hono/zod-openapi";

const UserGetRoute = createRoute({
	method: "get",
	path: "/settings/users",
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
			description: GuardDescriptions.userManagement.list(),
		},
		// ... other responses
	},
});
```

## Generated OpenAPI Documentation

The above route will generate OpenAPI documentation that looks like this:

```yaml
paths:
  /settings/users:
    get:
      tags:
        - Settings/Users
      security:
        - Bearer: []
      parameters:
        # ... query parameters
      responses:
        "200":
          description: |
            Fetch list of users

            **Access Requirements:**
            - **Permissions:** user list
          content:
            application/json:
              schema:
                # ... schema definition
```

## How It Appears in Swagger UI

When viewed in Swagger UI, the endpoint description will show:

```
GET /settings/users

Fetch list of users

Access Requirements:
• Permissions: user list
```

## Custom Descriptions

You can also create custom descriptions:

```typescript
import { withGuardDescription } from "@app/api/middlewares";

const CustomRoute = createRoute({
	// ...
	responses: {
		200: {
			content: {
				/* ... */
			},
			description: withGuardDescription(
				"Retrieves sensitive financial data for the authenticated user",
				{
					roles: ["admin", "finance_manager"],
					permissions: ["financial_reports"],
				},
			),
		},
	},
});
```

This generates:

```
Retrieves sensitive financial data for the authenticated user

Access Requirements:
• Roles: admin, finance_manager
• Permissions: financial_reports
```

## Benefits

1. **Clear Documentation** - Developers immediately know what access level is required
2. **Self-Documenting API** - No need to maintain separate access control documentation
3. **Consistent Format** - All endpoints show requirements in the same format
4. **Easy Discovery** - Frontend developers can see requirements without reading code

## All Available Descriptions

### User Management

```typescript
GuardDescriptions.userManagement.list(); // "Fetch list of users"
GuardDescriptions.userManagement.create(); // "Create a new user"
GuardDescriptions.userManagement.detail(); // "Fetch user details"
GuardDescriptions.userManagement.edit(); // "Update user information"
GuardDescriptions.userManagement.delete(); // "Delete a user"
```

### Permission Management

```typescript
GuardDescriptions.permissionManagement.list(); // "Fetch list of permissions"
GuardDescriptions.permissionManagement.create(); // "Create a new permission"
GuardDescriptions.permissionManagement.detail(); // "Fetch permission details"
GuardDescriptions.permissionManagement.edit(); // "Update permission information"
GuardDescriptions.permissionManagement.delete(); // "Delete a permission"
```

### Role Management

```typescript
GuardDescriptions.roleManagement.list(); // "Fetch list of roles"
GuardDescriptions.roleManagement.create(); // "Create a new role"
GuardDescriptions.roleManagement.detail(); // "Fetch role details"
GuardDescriptions.roleManagement.edit(); // "Update role information"
GuardDescriptions.roleManagement.delete(); // "Delete a role"
```

### Role-Based

```typescript
GuardDescriptions.adminOnly("Your base description");
// Adds: "Roles: admin, superuser"

GuardDescriptions.superuserOnly("Your base description");
// Adds: "Roles: superuser"
```

## Integration with Actual Guards

Remember to also apply the actual middleware guards:

```typescript
const UserRoutes = new OpenAPIHono();

// Apply auth middleware
UserRoutes.use(authMiddleware);

// Define route with description
UserRoutes.openapi(UserGetRoute, async (c) => {
	// ... handler
});

// Apply the actual permission guard
UserRoutes.use("/", Guards.userManagement.list());
```

This ensures both:

1. The documentation shows what's required (via `GuardDescriptions`)
2. The actual enforcement happens at runtime (via `Guards`)
