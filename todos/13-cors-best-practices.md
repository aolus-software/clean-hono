# TODO: Implement CORS Best Practices

## Priority: Low

## Current State

- CORS configured in `config/cors.config.ts`
- Using Hono's `cors` middleware
- Currently allows `*` origin by default

## Goal

Implement secure CORS configuration following best practices.

## Tasks

### 1. Restrict Origins in Production

- [ ] No wildcard `*` in production
- [ ] Whitelist specific origins
- [ ] Support multiple origins

```typescript
const allowedOrigins = ["https://app.example.com", "https://admin.example.com"];

const origin = (origin: string) => {
	if (env.isDevelopment) return "*";
	return allowedOrigins.includes(origin) ? origin : "";
};
```

### 2. Preflight Caching

- [ ] Set appropriate `maxAge` for preflight caching
- [ ] Reduce OPTIONS requests

### 3. Credentials Handling

- [ ] Enable credentials only when needed
- [ ] Document credential requirements

### 4. Expose Necessary Headers

- [ ] Add required headers to `exposedHeaders`
- [ ] Include rate limit headers, pagination info

## Success Criteria

- [ ] No wildcard origins in production
- [ ] Preflight requests cached
- [ ] Only necessary headers exposed
