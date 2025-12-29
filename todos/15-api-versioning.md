# TODO: Implement API Versioning

## Priority: Low

## Current State

- No API versioning implemented
- All routes under root path

## Goal

Implement API versioning to support backward compatibility.

## Tasks

### 1. Choose Versioning Strategy

Options:

- **URL Path** (Recommended): `/v1/users`, `/v2/users`
- Header-based: `X-API-Version: 1`
- Query parameter: `?version=1`

### 2. Implement URL-based Versioning

```typescript
// apps/api/routes/v1/index.ts
const v1 = new Hono();
v1.route("/auth", authRoutes);
v1.route("/users", userRoutes);

// apps/api/routes/index.ts
routes.route("/v1", v1);
routes.route("/v2", v2); // Future version
```

### 3. Version Documentation

- [ ] Document version differences
- [ ] Deprecation notices
- [ ] Migration guides

### 4. Default Version Handling

- [ ] Redirect `/api/*` to latest version
- [ ] Or keep latest at root

## Success Criteria

- [ ] API versioned at `/v1`
- [ ] Easy to add new versions
- [ ] Backward compatibility maintained
