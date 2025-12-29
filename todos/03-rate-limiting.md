# TODO: Implement Rate Limiting

## Priority: High

## Current State

- No rate limiting implemented
- API vulnerable to brute force attacks
- No protection against abuse on sensitive endpoints (auth, password reset)

## Goal

Implement comprehensive rate limiting to protect the API from abuse, brute force attacks, and DDoS while maintaining good user experience.

## Tasks

### 1. Install Rate Limiter

```bash
bun add hono-rate-limiter
# For Redis-based limiting (recommended for production):
bun add rate-limit-redis
```

### 2. Create Rate Limit Configuration

- [ ] Create `config/rate-limit.config.ts`
- [ ] Define different limits for different endpoint types
- [ ] Configure Redis store for distributed rate limiting

```typescript
// config/rate-limit.config.ts
export const rateLimitConfig = {
	// General API rate limit
	general: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100, // 100 requests per window
		message: "Too many requests, please try again later",
	},

	// Strict limit for authentication endpoints
	auth: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 5, // 5 attempts per window
		message: "Too many login attempts, please try again later",
	},

	// Password reset (prevent email bombing)
	passwordReset: {
		windowMs: 60 * 60 * 1000, // 1 hour
		max: 3, // 3 attempts per hour
		message: "Too many password reset attempts",
	},

	// Strict limit for registration
	registration: {
		windowMs: 60 * 60 * 1000, // 1 hour
		max: 5, // 5 registrations per hour per IP
		message: "Too many registration attempts",
	},
};
```

### 3. Create Rate Limit Middleware

- [ ] Create `apps/api/middlewares/rate-limit.middleware.ts`
- [ ] Use Redis for distributed rate limiting (utilize existing Redis connection)
- [ ] Implement different limiters for different routes

```typescript
// apps/api/middlewares/rate-limit.middleware.ts
import { rateLimiter } from "hono-rate-limiter";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "@infra/redis";

export const createRateLimiter = (config: {
	windowMs: number;
	max: number;
	message?: string;
	keyPrefix?: string;
}) => {
	return rateLimiter({
		windowMs: config.windowMs,
		limit: config.max,
		standardHeaders: "draft-6",
		keyGenerator: (c) => {
			// Use IP + optional user ID for authenticated requests
			const ip =
				c.req.header("x-forwarded-for") ||
				c.req.header("x-real-ip") ||
				"unknown";
			const userId = c.get("currentUser")?.id || "";
			return `${config.keyPrefix || "rl"}:${ip}:${userId}`;
		},
		store: new RedisStore({
			sendCommand: (...args: string[]) => redisClient.call(...args),
		}),
		message: config.message || "Too many requests",
	});
};

export const generalLimiter = createRateLimiter(rateLimitConfig.general);
export const authLimiter = createRateLimiter({
	...rateLimitConfig.auth,
	keyPrefix: "auth",
});
export const registrationLimiter = createRateLimiter({
	...rateLimitConfig.registration,
	keyPrefix: "reg",
});
export const passwordResetLimiter = createRateLimiter({
	...rateLimitConfig.passwordReset,
	keyPrefix: "pwd",
});
```

### 4. Apply Rate Limiters to Routes

- [ ] Apply general limiter to all routes
- [ ] Apply strict limiter to auth routes
- [ ] Apply password reset limiter appropriately

```typescript
// apps/api/routes/auth.routes.ts
import {
	authLimiter,
	registrationLimiter,
	passwordResetLimiter,
} from "../middlewares/rate-limit.middleware";

const authRoutes = new Hono();

authRoutes.post("/login", authLimiter, AuthHandler.login);
authRoutes.post("/register", registrationLimiter, AuthHandler.register);
authRoutes.post(
	"/forgot-password",
	passwordResetLimiter,
	AuthHandler.forgotPassword,
);
authRoutes.post(
	"/reset-password",
	passwordResetLimiter,
	AuthHandler.resetPassword,
);
```

### 5. Handle Rate Limit Responses

- [ ] Return proper rate limit headers
- [ ] Include `Retry-After` header
- [ ] Log rate limit violations for monitoring

### 6. Sliding Window Implementation (Advanced)

- [ ] Consider implementing sliding window for smoother limiting
- [ ] Add token bucket algorithm for burst handling

### 7. IP-based vs User-based Limiting

- [ ] Implement both IP-based and user-based limits
- [ ] Allow authenticated users higher limits
- [ ] Track by API key for third-party integrations

## Testing

- [ ] Test rate limiting works as expected
- [ ] Verify Redis store persistence
- [ ] Test across multiple server instances
- [ ] Load test to verify protection

## Monitoring

- [ ] Log rate limit hits
- [ ] Create alerts for high rate limit hits
- [ ] Dashboard for rate limit metrics

## Resources

- [hono-rate-limiter](https://github.com/rhinobase/hono-rate-limiter)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

## Success Criteria

- [ ] Rate limiting working on all endpoints
- [ ] Auth endpoints have stricter limits
- [ ] Redis-based distributed limiting working
- [ ] Proper rate limit headers returned
- [ ] No impact on legitimate users
