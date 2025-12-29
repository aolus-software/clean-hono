# TODO: Database Query Optimization

## Priority: Medium

## Current State

- Using Drizzle ORM with PostgreSQL
- Some queries may not be optimized
- No query caching strategy

## Goal

Optimize database queries for better performance and scalability.

## Tasks

### 1. Add Database Indexes

- [ ] Review and add indexes for frequently queried columns
- [ ] Add composite indexes for common query patterns
- [ ] Index foreign keys

### 2. Implement Query Caching

- [ ] Cache frequently accessed data in Redis
- [ ] Add cache invalidation strategy
- [ ] Set appropriate TTLs

### 3. Optimize N+1 Queries

- [ ] Review repositories for N+1 patterns
- [ ] Use Drizzle's `with` for eager loading

```typescript
// Example: Eager loading roles with permissions
const roles = await db.query.roles.findMany({
	with: {
		permissions: true,
	},
});
```

### 4. Add Query Logging (Development)

- [ ] Log slow queries (> 100ms)
- [ ] Add Drizzle logger for development

### 5. Connection Pooling

- [ ] Configure optimal pool size
- [ ] Monitor connection usage

### 6. Pagination Optimization

- [ ] Use cursor-based pagination for large datasets
- [ ] Avoid `OFFSET` for deep pagination

## Success Criteria

- [ ] All frequently queried columns indexed
- [ ] No N+1 query patterns
- [ ] Slow queries identified and optimized
- [ ] Caching strategy implemented
