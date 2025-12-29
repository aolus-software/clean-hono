# TODO: Improve Environment Configuration

## Priority: Medium

## Current State

- Environment variables loaded via `dotenv`
- Configuration spread across multiple files in `config/`
- No environment variable validation at startup
- No type-safe environment access

## Goal

Implement robust environment configuration with validation, type safety, and better organization.

## Tasks

### 1. Add Environment Validation Library

```bash
bun add envalid
```

### 2. Create Centralized Environment Schema

- [ ] Define all environment variables
- [ ] Add validation rules
- [ ] Fail fast on missing required variables

```typescript
// config/env.ts
import { cleanEnv, str, num, bool, url } from "envalid";

export const env = cleanEnv(process.env, {
	NODE_ENV: str({ choices: ["development", "production", "test"] }),
	APP_PORT: num({ default: 3000 }),
	DATABASE_URL: str(),
	REDIS_HOST: str({ default: "localhost" }),
	JWT_SECRET: str(),
});
```

### 3. Update Config Files to Use Validated Env

- [ ] Refactor all config files to use `env` object
- [ ] Remove direct `process.env` access

### 4. Environment-Specific Configuration

- [ ] Create `config/environments/` directory
- [ ] Support config overrides per environment

### 5. Update .env.example

- [ ] Add all new environment variables with descriptions

## Success Criteria

- [ ] All env vars validated at startup
- [ ] Type-safe environment access
- [ ] No direct `process.env` access in code
