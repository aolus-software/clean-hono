# Documentation Index

Welcome to the Clean Hono API documentation. This directory contains comprehensive guides for working with the API.

## 📚 Available Documentation

### [API Documentation Guide](./API_DOCUMENTATION.md)

Complete guide for API consumers:

- Getting started with the API
- Understanding schemas and validation
- Request/response examples
- Error handling
- Authentication flows
- SDK generation

**Use this if you're:**

- Integrating with the API
- Building a client application
- Learning how to use the endpoints

### [Security Documentation](./SECURITY.md)

In-depth security documentation:

- Authentication & authorization flows
- Password security requirements
- Token management best practices
- Rate limiting
- RBAC implementation
- Security checklist

**Use this if you're:**

- Implementing authentication
- Understanding security mechanisms
- Conducting security audits
- Setting up production deployments

### [Middleware Documentation](./MIDDLEWARE.md)

Comprehensive middleware guide:

- Core vs Security middleware organization
- Available middleware and their functions
- Middleware execution order
- Creating custom middleware
- Configuration and customization
- Troubleshooting

**Use this if you're:**

- Understanding the middleware architecture
- Creating custom middleware
- Configuring security features
- Debugging middleware issues

### [Error Handling Documentation](./ERROR_HANDLING.md)

Complete error handling reference:

- Error response format
- Error codes and their meanings
- Available error classes
- Creating custom errors
- Error logging and debugging
- Testing error handling
- Best practices

**Use this if you're:**

- Understanding error responses
- Handling errors in your client
- Creating custom error types
- Debugging application errors

### [Configuration Documentation](./CONFIGURATION.md)

Comprehensive configuration reference:

- All environment variables explained
- Type-safe configuration access
- Runtime validation
- Configuration best practices
- Production deployment checklist
- Troubleshooting config issues

**Use this if you're:**

- Setting up the application
- Configuring for different environments
- Understanding configuration options
- Deploying to production

### [Plugin System Documentation](./PLUGINS.md)

Complete plugin architecture guide:

- Creating custom plugins
- Plugin lifecycle and hooks
- Middleware and route registration
- Plugin dependencies
- Configuration options
- Example plugins
- Best practices

**Use this if you're:**

- Building modular features
- Creating reusable components
- Understanding the plugin architecture
- Extending application functionality

## 🚀 Quick Start

### 1. View Interactive Documentation

```
http://localhost:3000/docs
```

The interactive Scalar UI provides:

- Browse all endpoints
- Try requests directly
- View schemas and examples
- See validation rules in real-time

### 2. Download OpenAPI Spec

```
http://localhost:3000/openapi.json
```

Use this to:

- Generate client SDKs
- Import into Postman/Insomnia
- Validate API contracts

### 3. Read the Guides

- Start with [API Documentation](./API_DOCUMENTATION.md) for general usage
- Check [Security Documentation](./SECURITY.md) for authentication details

## 📖 Documentation Features

### Enhanced Schemas

All schemas include:

- **Type information**: Clear data types
- **Validation rules**: Min/max lengths, formats, patterns
- **Error messages**: Descriptive validation errors
- **Examples**: Real-world usage examples
- **Descriptions**: Detailed field explanations

### Example Schema Documentation

```typescript
/**
 * Email address validation schema
 * @example "user@example.com"
 * @validation Must be valid email format, max 255 characters
 */
export const EmailSchema = z
	.string()
	.email("Must be a valid email address")
	.max(255, "Email must not exceed 255 characters")
	.openapi({
		description: "Valid email address",
		example: "user@example.com",
	});
```

### Enhanced Routes

All routes include:

- **Summary**: Brief description
- **Description**: Detailed explanation
- **Tags**: Logical grouping
- **Security**: Auth requirements
- **Examples**: Request/response samples
- **Validation errors**: Expected error scenarios

### Example Route Documentation

```typescript
const loginRoute = createRoute({
	method: "post",
	path: "/login",
	summary: "User login",
	description:
		"Authenticate user with email and password. Returns user information and JWT access token on success.",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: LoginSchema,
					example: {
						email: "user@example.com",
						password: "MyPassword123!",
					},
				},
			},
			description: "User login credentials",
			required: true,
		},
	},
	// ... responses
});
```

## 🔍 What's Documented

### ✅ Fully Documented Modules

- **Auth Module** (`/auth/*`)
  - User registration with email verification
  - Login with JWT tokens
  - Email verification flow
  - Password reset flow
  - Resend verification email

- **Profile Module** (`/profile/*`)
  - Get user profile
  - Update profile information
  - Change password

- **Common Schemas**
  - Email validation
  - Password validation (basic & strong)
  - UUID validation
  - Pagination & sorting
  - Search & filtering
  - Date ranges
  - File uploads
  - And more...

### 📋 Schema Categories

All schemas are organized in `/src/libs/hono/schemas/`:

- **`common.schemas.ts`**: Reusable validation schemas
- **`response.schemas.ts`**: Response helper functions
- **`validation.helpers.ts`**: Custom validation utilities

## 🎯 Documentation Goals

This documentation aims to:

1. **Reduce integration time**: Clear examples and explanations
2. **Prevent errors**: Comprehensive validation rules
3. **Improve security**: Security best practices and flows
4. **Enable self-service**: Detailed guides reduce support needs
5. **Maintain consistency**: Standardized response formats

## 🛠️ Development

### Updating Documentation

When adding new endpoints:

1. **Add schema documentation**:

   ```typescript
   /**
    * Brief description
    * @example { field: "value" }
    * @validation Rules description
    */
   export const MySchema = z
   	.object({
   		field: z.string().openapi({
   			description: "Field description",
   			example: "example value",
   		}),
   	})
   	.openapi("SchemaName", {
   		description: "Overall schema description",
   	});
   ```

2. **Add route documentation**:

   ```typescript
   const route = createRoute({
   	summary: "Brief summary",
   	description: "Detailed description of what this endpoint does",
   	tags: ["Category"],
   	request: {
   		body: {
   			content: {
   				"application/json": {
   					schema: MySchema,
   					example: {
   						/* full example */
   					},
   				},
   			},
   			description: "Request body description",
   			required: true,
   		},
   	},
   	responses: {
   		// Use commonResponse helper
   	},
   });
   ```

3. **Update this documentation** if needed

### Viewing Changes

1. Start the development server:

   ```bash
   bun run dev
   ```

2. Visit the docs:

   ```
   http://localhost:3000/docs
   ```

3. Changes to schemas and routes appear automatically in the OpenAPI documentation

## 📞 Support

- **API Questions**: See [API Documentation](./API_DOCUMENTATION.md)
- **Security Questions**: See [Security Documentation](./SECURITY.md)
- **Issues**: GitHub Issues
- **General**: support@example.com

## 📝 Related Files

- **Main README**: `../README.md`
- **TODO List**: `../TODO.md`
- **Source Code**: `../src/`
- **OpenAPI Output**: `http://localhost:3000/openapi.json`

---

**Documentation Version**: 1.0.0  
**Last Updated**: February 8, 2026  
**API Version**: v1
