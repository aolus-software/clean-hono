# API Security Documentation

## Overview

This document describes the security mechanisms, authentication flows, and best practices implemented in the Clean Hono API.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Password Security](#password-security)
3. [Token Management](#token-management)
4. [Rate Limiting](#rate-limiting)
5. [Input Validation](#input-validation)
6. [Security Headers](#security-headers)
7. [RBAC (Role-Based Access Control)](#rbac-role-based-access-control)
8. [Best Practices](#best-practices)

---

## Authentication & Authorization

### Authentication Flow

The API uses **JWT (JSON Web Tokens)** for authentication. The authentication flow works as follows:

#### 1. User Registration

```
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

- Password is hashed using bcrypt before storage
- Email verification link is sent to the user
- User account is created but marked as unverified

#### 2. Email Verification

```
POST /auth/verify-email
{
  "token": "verification_token_from_email"
}
```

- Verifies user's email address
- Activates the account for login

#### 3. Login

```
POST /auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Login successful",
	"data": {
		"user": {
			"id": "uuid",
			"name": "John Doe",
			"email": "john@example.com",
			"role": "user"
		},
		"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

#### 4. Authenticated Requests

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authorization Middleware

Protected routes require authentication. The `AuthMiddleware` validates JWT tokens and extracts user information.

**Example Protected Route:**

```typescript
// All profile routes require authentication
ProfileRoutes.use("*", AuthMiddleware);
```

---

## Password Security

### Password Requirements

**For Login (Basic Validation):**

- Minimum 8 characters
- Maximum 128 characters

**For Registration/Password Changes (Strong Validation):**

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&\*()\_+-=[]{}|;:,.<>?)

### Password Storage

- Passwords are **never** stored in plain text
- Passwords are hashed using **bcrypt** with automatic salt generation
- Hash rounds are configured for optimal security/performance balance

### Password Reset Flow

#### 1. Request Reset

```
POST /auth/forgot-password
{
  "email": "user@example.com"
}
```

- Sends password reset link to email
- Token expires after a configured time period (default: 1 hour)
- For security, same response is returned whether email exists or not

#### 2. Reset Password

```
POST /auth/reset-password
{
  "token": "reset_token_from_email",
  "password": "NewSecure123!"
}
```

- Validates reset token
- Ensures new password meets strong password requirements
- Invalidates old tokens after successful reset

### Password Change (Authenticated Users)

```
PUT /profile/password
Authorization: Bearer <jwt_token>
{
  "current_password": "OldPass123!",
  "new_password": "NewSecure123!"
}
```

- Requires current password verification
- New password must be different from current password
- New password must meet strong password requirements

---

## Token Management

### JWT Token Structure

```json
{
	"sub": "user_uuid",
	"email": "user@example.com",
	"role": "user",
	"permissions": ["user.read", "user.update"],
	"iat": 1640000000,
	"exp": 1640086400
}
```

### Token Lifecycle

1. **Access Token**: Short-lived token for API requests (default: 24 hours)
2. **Refresh Token**: Long-lived token for obtaining new access tokens (default: 7 days)

### Token Validation

All authenticated endpoints validate:

- Token signature
- Token expiration
- User existence
- User active status

### Token Revocation

Tokens can be invalidated through:

- Password change (invalidates all existing tokens)
- Logout (server-side token blacklisting via Redis)
- Admin action (account suspension)

---

## Rate Limiting

Rate limiting is implemented to prevent abuse and brute force attacks.

### Default Limits

| Endpoint Type            | Limit        | Window     |
| ------------------------ | ------------ | ---------- |
| Authentication endpoints | 5 requests   | 15 minutes |
| Profile updates          | 10 requests  | 1 hour     |
| General API              | 100 requests | 15 minutes |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded Response

```json
{
	"success": false,
	"message": "Too many requests. Please try again later.",
	"data": null
}
```

---

## Input Validation

All API inputs are validated using **Zod schemas** with OpenAPI integration.

### Validation Levels

1. **Type Validation**: Ensures correct data types
2. **Format Validation**: Email format, UUID format, etc.
3. **Business Rules**: Password strength, min/max lengths
4. **Custom Validation**: Complex validation logic

### Validation Error Response

```json
{
	"success": false,
	"message": "Validation Error",
	"data": null,
	"errors": {
		"email": ["Must be a valid email address"],
		"password": [
			"Password must be at least 8 characters",
			"Password must contain uppercase, lowercase, number, and special character"
		]
	}
}
```

### Common Validations

| Field Type        | Validation Rules                  |
| ----------------- | --------------------------------- |
| Email             | Valid email format, max 255 chars |
| Password (basic)  | Min 8 chars, max 128 chars        |
| Password (strong) | Min 8 chars + complexity rules    |
| UUID              | Valid UUID v4 format              |
| Name              | Min 1 char, max 255 chars         |
| Remarks           | Optional, max 500 chars           |

---

## Security Headers

The API sets security headers on all responses:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### CORS Configuration

CORS is configured based on environment:

**Development:**

- Allows all origins for testing
- Credentials enabled

**Production:**

- Whitelist of allowed origins
- Credentials enabled for trusted domains only

---

## RBAC (Role-Based Access Control)

### Roles

The system implements hierarchical role-based access:

1. **Super Admin**: Full system access
2. **Admin**: Manage users and settings
3. **User**: Standard user access

### Permissions

Granular permissions control specific actions:

- `user.read`: View users
- `user.create`: Create users
- `user.update`: Update users
- `user.delete`: Delete users
- `role.manage`: Manage roles
- `permission.manage`: Manage permissions

### Permission Guards

Routes can be protected with permission requirements:

```typescript
import { HasPermission } from "@guards";

// Requires user.create permission
UserRoutes.use("/", HasPermission("user.create"));
```

### Role Guards

Routes can be protected with role requirements:

```typescript
import { HasRole } from "@guards";

// Requires admin role
AdminRoutes.use("/", HasRole("admin"));
```

---

## Best Practices

### For API Consumers

1. **Store tokens securely**
   - Use httpOnly cookies or secure storage
   - Never expose tokens in URLs
   - Clear tokens on logout

2. **Handle token expiration**
   - Implement token refresh logic
   - Gracefully handle 401 unauthorized responses
   - Redirect to login when tokens expire

3. **Use HTTPS**
   - Always use HTTPS in production
   - Never send credentials over HTTP

4. **Implement rate limit handling**
   - Respect rate limit headers
   - Implement exponential backoff on failures
   - Cache responses when appropriate

5. **Validate responses**
   - Check response status codes
   - Validate response data structure
   - Handle errors gracefully

### For API Developers

1. **Never log sensitive data**
   - No passwords in logs
   - Mask sensitive fields
   - Use structured logging

2. **Keep dependencies updated**
   - Regular security updates
   - Monitor vulnerability databases
   - Use automated dependency scanning

3. **Use environment variables**
   - Never hardcode secrets
   - Use different keys per environment
   - Rotate keys regularly

4. **Implement audit logging**
   - Log authentication attempts
   - Log permission changes
   - Log data access

5. **Regular security audits**
   - Code reviews for security issues
   - Penetration testing
   - Vulnerability scanning

---

## Security Checklist

### Authentication

- [x] JWT-based authentication
- [x] Password hashing (bcrypt)
- [x] Email verification
- [x] Password reset with tokens
- [x] Token expiration
- [x] Secure password requirements

### Authorization

- [x] Role-based access control (RBAC)
- [x] Permission-based guards
- [x] Middleware authentication
- [x] Protected routes

### Input Validation

- [x] Zod schema validation
- [x] OpenAPI integration
- [x] Detailed error messages
- [x] Type safety

### Rate Limiting

- [x] Request rate limiting
- [x] Redis-backed rate limiter
- [x] Per-endpoint limits
- [x] Rate limit headers

### Security Headers

- [x] CORS configuration
- [x] Security headers
- [x] HTTPS enforcement
- [x] Content type validation

### Monitoring

- [x] Structured logging (Pino)
- [x] Request ID tracking
- [x] Performance monitoring
- [x] Error tracking

---

## Support & Contact

For security issues or vulnerabilities:

- **Do not** open public issues
- Contact: security@example.com
- Use responsible disclosure practices
- Allow reasonable time for fixes

For general security questions:

- Review this documentation
- Check the API documentation
- Contact: support@example.com

---

**Last Updated**: February 8, 2026  
**Version**: 1.0.0
