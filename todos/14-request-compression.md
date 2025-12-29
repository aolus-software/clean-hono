# TODO: Add Request Compression

## Priority: Low

## Current State

- No response compression configured
- No request body size limits

## Goal

Implement response compression and request body validation.

## Tasks

### 1. Add Response Compression

```typescript
import { compress } from "hono/compress";

app.use("*", compress());
```

### 2. Set Request Body Size Limits

- [ ] Limit JSON body size
- [ ] Configure per-route limits for uploads

```typescript
import { bodyLimit } from "hono/body-limit";

// Global limit
app.use("*", bodyLimit({ maxSize: 100 * 1024 })); // 100KB

// Route-specific for uploads
app.post("/upload", bodyLimit({ maxSize: 10 * 1024 * 1024 })); // 10MB
```

### 3. Content-Encoding Support

- [ ] Support gzip, deflate, br (brotli)
- [ ] Set appropriate compression level

## Success Criteria

- [ ] Responses compressed
- [ ] Body size limits enforced
- [ ] No performance regression
