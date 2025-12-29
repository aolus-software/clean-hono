# TODO: Implement Health Check Endpoints

## Priority: Medium

## Current State

- Basic `/health` endpoint exists
- No detailed health checks for dependencies

## Goal

Implement comprehensive health check endpoints for monitoring and orchestration.

## Tasks

### 1. Create Detailed Health Check

- [ ] Check database connectivity
- [ ] Check Redis connectivity
- [ ] Check ClickHouse connectivity
- [ ] Return individual component status

```typescript
// apps/api/handlers/health.handler.ts
export const detailedHealthCheck = async (c: Context) => {
	const checks = await Promise.allSettled([
		checkDatabase(),
		checkRedis(),
		checkClickHouse(),
	]);

	return c.json({
		status: checks.every((c) => c.status === "fulfilled")
			? "healthy"
			: "degraded",
		checks: {
			database: formatCheck(checks[0]),
			redis: formatCheck(checks[1]),
			clickhouse: formatCheck(checks[2]),
		},
		timestamp: new Date().toISOString(),
	});
};
```

### 2. Add Endpoints

- [ ] `GET /health` - Quick health check (for load balancers)
- [ ] `GET /health/ready` - Readiness probe (for Kubernetes)
- [ ] `GET /health/live` - Liveness probe
- [ ] `GET /health/detailed` - Detailed status (authenticated)

### 3. Add Metrics Endpoint

- [ ] Consider adding Prometheus metrics
- [ ] Track request counts, latencies, error rates

## Success Criteria

- [ ] Health endpoints available
- [ ] All dependencies checked
- [ ] Kubernetes probes work correctly
