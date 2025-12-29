# TODO: Improve Error Handling

## Priority: Medium

## Current State

- Custom error classes exist (`ForbiddenError`, `NotFoundError`, etc.)
- Global error handler in `apps/api/errors/error.handler.ts`
- VineJS validation errors handled
- NotFoundError returns 422 instead of 404 (bug)

## Goal

Implement consistent, comprehensive error handling with proper HTTP status codes.

## Tasks

### 1. Fix Status Code Bug

- [ ] `NotFoundError` should return 404, not 422

### 2. Create Base Error Class

```typescript
// apps/api/errors/base.error.ts
export abstract class AppError extends Error {
	abstract statusCode: number;
	abstract isOperational: boolean;

	constructor(
		message: string,
		public details?: unknown,
	) {
		super(message);
		Error.captureStackTrace(this, this.constructor);
	}
}
```

### 3. Standardize Error Response Format

```typescript
interface ErrorResponse {
	status: number;
	success: false;
	message: string;
	code?: string; // Machine-readable error code
	errors?: Array<{ field: string; message: string }>;
	requestId?: string;
}
```

### 4. Add Error Codes

- [ ] Define error codes for all error types
- [ ] Document error codes for API consumers

### 5. Improve Error Logging

- [ ] Log stack traces for 500 errors
- [ ] Include request context in logs
- [ ] Add correlation IDs

## Success Criteria

- [ ] Correct HTTP status codes for all errors
- [ ] Consistent error response format
- [ ] Error codes documented
- [ ] Proper error logging in place
