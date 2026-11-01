# clean-hono - TODO

> Updated: 2026-10-31

The project follows the shared clean-arc contract (the `clean-elysia` route map, envelope, env
vocabulary, and `.claude` layout), with Drizzle physical names (snake_case) as in `clean-elysia`.

---

## Done

- [x] Project setup: TypeScript, ESLint, Prettier, Husky pre-commit hook, `package.json` scripts
- [x] Drizzle schema (snake_case), migrations, seeder (15 permissions, superuser + admin, idempotent)
- [x] Repositories with sort/filter allow-lists and soft delete
- [x] Auth: login, refresh (rotating, Redis-tracked, revocable), register, verify email, resend verification, forgot/reset password
- [x] Profile, settings users / roles / permissions / select-options with per-route RBAC guards
- [x] BullMQ mail queue and worker, i18n (en / id)
- [x] Cluster mode (`APP_CLUSTER_MODE`)
- [x] `Dockerfile` (multi-stage), `docker-compose.yml` app service, Docker `make` targets
- [x] CI: lint, format check, typecheck, Drizzle generate drift / migrate / check, build
- [x] `docs/`, `.github/` templates, `CONTRIBUTING.md`, `SECURITY.md`

## Pending

- [ ] Test runner and tests (deferred across the clean-arc repos)
- [ ] Shared rate-limit store so cluster workers share one budget
