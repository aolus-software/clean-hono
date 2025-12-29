# TODO: Implement Helmet Security Headers

## Priority: High

## Current State

- Basic CORS configuration exists in `config/cors.config.ts`
- No security headers middleware implemented
- Missing protection against common web vulnerabilities

## Goal

Add comprehensive HTTP security headers using Hono's secure headers middleware or a custom implementation to protect against XSS, clickjacking, MIME sniffing, and other attacks.

## Tasks

### 1. Install/Use Hono Secure Headers

Hono has built-in secure headers middleware:

```typescript
import { secureHeaders } from "hono/secure-headers";
```

### 2. Configure Security Headers

- [ ] Create `config/security.config.ts` for security configuration
- [ ] Enable Content-Security-Policy (CSP)
- [ ] Enable X-Frame-Options
- [ ] Enable X-Content-Type-Options
- [ ] Enable Referrer-Policy
- [ ] Enable Strict-Transport-Security (HSTS)
- [ ] Enable Permissions-Policy

### 3. Update App Middleware Stack

- [ ] Add `secureHeaders()` middleware to `apps/api/app.ts`
- [ ] Place it early in the middleware chain
- [ ] Configure environment-specific settings

### 4. Implementation Details

```typescript
// config/security.config.ts
export const securityConfig = {
	contentSecurityPolicy: {
		defaultSrc: ["'self'"],
		scriptSrc: ["'self'"],
		styleSrc: ["'self'", "'unsafe-inline'"],
		imgSrc: ["'self'", "data:", "https:"],
		connectSrc: ["'self'"],
		fontSrc: ["'self'"],
		objectSrc: ["'none'"],
		mediaSrc: ["'self'"],
		frameSrc: ["'none'"],
	},
	strictTransportSecurity: {
		maxAge: 31536000, // 1 year
		includeSubDomains: true,
		preload: true,
	},
	xFrameOptions: "DENY",
	xContentTypeOptions: "nosniff",
	referrerPolicy: "strict-origin-when-cross-origin",
	permissionsPolicy: {
		camera: [],
		microphone: [],
		geolocation: [],
	},
};
```

```typescript
// apps/api/app.ts
import { secureHeaders } from "hono/secure-headers";

app.use(
	"*",
	secureHeaders({
		contentSecurityPolicy:
			process.env.NODE_ENV === "production"
				? securityConfig.contentSecurityPolicy
				: undefined,
		strictTransportSecurity: securityConfig.strictTransportSecurity,
		xFrameOptions: securityConfig.xFrameOptions,
		xContentTypeOptions: securityConfig.xContentTypeOptions,
		referrerPolicy: securityConfig.referrerPolicy,
	}),
);
```

### 5. Environment-Specific Configuration

- [ ] Disable strict CSP in development for easier debugging
- [ ] Enable all headers in production
- [ ] Add configuration via environment variables

### 6. Additional Security Considerations

- [ ] Remove `X-Powered-By` header (if present)
- [ ] Add `X-Request-ID` for request tracing
- [ ] Consider adding `Cross-Origin-Opener-Policy`
- [ ] Consider adding `Cross-Origin-Resource-Policy`

## Testing

- [ ] Use security scanning tools (OWASP ZAP, securityheaders.com)
- [ ] Verify headers in browser DevTools
- [ ] Test that application functionality is not broken by CSP

## Resources

- [Hono Secure Headers](https://hono.dev/docs/middleware/builtin/secure-headers)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

## Success Criteria

- [ ] All security headers properly configured
- [ ] A+ rating on securityheaders.com
- [ ] No functionality broken by CSP
- [ ] Headers configurable per environment
