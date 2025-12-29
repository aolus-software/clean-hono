# TODO: Improve Logging Infrastructure

## Priority: Medium

## Current State

- Using `pino` with `hono-pino` middleware
- Logger configured in `packages/logger/`
- Request logging enabled

## Goal

Enhance logging with structured logging, log levels, and better observability.

## Tasks

### 1. Configure Log Levels per Environment

```typescript
// packages/logger/index.ts
const level = process.env.NODE_ENV === "production" ? "info" : "debug";
```

### 2. Add Request/Response Logging

- [ ] Log request method, path, duration
- [ ] Log response status codes
- [ ] Exclude sensitive data from logs

### 3. Add Structured Logging Fields

- [ ] Add request ID to all logs
- [ ] Add user ID for authenticated requests
- [ ] Add correlation IDs for distributed tracing

### 4. Log Rotation and Management

- [ ] Configure log rotation for production
- [ ] Set up log aggregation (e.g., ELK, Loki)

### 5. Add Performance Logging

- [ ] Log slow database queries
- [ ] Log external API call durations
- [ ] Add timing middleware

### 6. Audit Logging

- [ ] Log security-relevant events
- [ ] Login attempts, password changes
- [ ] Permission changes

## Success Criteria

- [ ] Structured logs with consistent format
- [ ] Request IDs in all logs
- [ ] Environment-appropriate log levels
- [ ] Audit trail for security events
