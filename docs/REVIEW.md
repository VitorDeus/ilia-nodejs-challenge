# Senior Fullstack Technical Evaluation

Evaluation performed against the three parts of the ília Node.js Code Challenge, plus the provided technical guidelines.

---

## Part 1 — Wallet Microservice

| Requirement | Status | Notes |
|-------------|--------|-------|
| Project setup documentation (readme.md) | ✅ | Root README includes Quick Start, API Reference, Docker instructions, and curl examples. |
| Application and Database running on a container | ✅ | `docker-compose.yml` defines `wallet` (Node 20-alpine) and `wallet-db` (Postgres 15), with health checks. |
| Microservice must receive HTTP Request | ✅ | Express-based REST API with proper JSON parsing. |
| Have a dedicated database | ✅ | Separate PostgreSQL instance (`wallet-db`), dedicated `transactions` table with UUID PKs, CHECK constraints, and indexes. |
| JWT authentication on all routes, PrivateKey = ILIACHALLENGE (env var) | ✅ | All endpoints except `/health` require JWT. The secret is passed as `ILIACHALLENGE` env var → mapped to `JWT_SECRET` in docker-compose. Auth middleware enforces HS256. |
| Port configured to 3001 | ✅ | Dockerfile EXPOSEs 3001; config defaults to 3001; docker-compose maps `${WALLET_PORT}:3001`. |
| Gitflow with Code Review | ✅ | Feature branches merged via PRs (e.g., PR #11 from develop). |

**Extras implemented:**
- Idempotency keys to prevent duplicate transactions.
- Rate limiting on `POST /transactions` (configurable, per-user).
- Internal API (`/internal/*`) for service-to-service calls, protected by a separate JWT secret with audience claim.
- Paginated listing with date-range and type filters.
- Database transactions with proper rollback handling.

---

## Part 2 — Users Microservice and Integration

| Requirement | Status | Notes |
|-------------|--------|-------|
| Project setup documentation (readme.md) | ✅ | Covered in root README with architecture diagram, API table, and auth model explanation. |
| Application and Database running on a container | ✅ | `users` service + `users-db` Postgres container in docker-compose. |
| Microservice must receive HTTP Request | ✅ | Express REST API (auth routes, profile, wallet summary). |
| Have a dedicated database | ✅ | Separate PostgreSQL database for users with email uniqueness, password hashing. |
| JWT authentication, PrivateKey = ILIACHALLENGE (env var) | ✅ | Same JWT infrastructure as Wallet; external token used for client-facing endpoints. |
| Port configured to 3002 | ✅ | Config defaults to 3002; docker-compose maps correctly. |
| Gitflow with Code Review | ✅ | Same workflow as Part 1. |
| Internal Communication Security, PrivateKey = ILIACHALLENGE_INTERNAL (env var) | ✅ | Internal JWT tokens have `aud: "internal"`, `iss: "users-service"`, 30-second TTL, signed with `ILIACHALLENGE_INTERNAL`. Wallet validates audience claim. |
| Communication between Microservices (gRPC, REST, Kafka, or Messaging Queues) | ✅ | REST-based communication. Users service calls Wallet's `/internal/*` endpoints. Clear separation of internal vs. external APIs. |

**Architecture highlights:**
- Two-tier JWT model (external 24h, internal 30s) is a solid production pattern.
- Wallet client creates a fresh internal JWT per request — prevents replay.
- Error propagation from Wallet maps 5xx → 502 (Gateway), preserving client-facing error semantics.
- Password hashing with bcrypt (10 salt rounds).

---

## Part 3 — Frontend Implementation

| Requirement | Status | Notes |
|-------------|--------|-------|
| Separate folder | ✅ | `frontend/` with its own `package.json`, Dockerfile, README. |
| Built in TypeScript | ✅ | Strict TypeScript config, `.tsx` components, Zod schemas with type inference. |
| Authenticate | ✅ | Login and Register pages with form validation. |
| View wallet balance | ✅ | Balance card with loading skeleton, error state. |
| List transactions | ✅ | Paginated list with credit/debit color-coding, empty state. |
| Create transactions (credit/debit) | ✅ | Form with type selector, amount input, validation, success/error feedback, cache invalidation. |
| Loading, empty, and error states | ✅ | All three handled in BalanceCard, TransactionList, and forms. |
| Secure JWT handling | ✅ | Token in memory + sessionStorage (not localStorage — XSS mitigation noted in README). |
| i18n support | ✅ | English and pt-BR locales via i18next; language switcher component. |
| Responsive design | ✅ | TailwindCSS with max-width containers, mobile-friendly layouts. |
| Test coverage | ✅ | 8 tests across 3 suites (Login, Dashboard, CreateTransaction) using Vitest + React Testing Library. |
| Scalable component structure | ✅ | Clean separation: pages, components, hooks, lib, types, i18n, test, and shadcn/ui primitives. |

**Tech stack quality:**
- React 19, Vite 6, TailwindCSS 4 — latest stable versions.
- TanStack Query for server state — proper cache invalidation on mutations.
- react-hook-form + Zod for type-safe form validation.
- Axios interceptors attach JWT on every request — DRY approach.
- Nginx reverse proxy in Docker handles API routing.

---

## Technical Guidelines Compliance

| Guideline | Assessment |
|-----------|------------|
| Separation of Concerns | ✅ Clean architecture: config, controllers, services, validators, middlewares, routes. No fat files mixing layers. |
| No hardcoded sensitive values | ✅ Secrets come from environment variables; `.env.example` has placeholder values; `.env` is in `.gitignore`. |
| Error & edge case handling | ✅ Validation (Zod), insufficient balance (422), duplicate email (409), rate limiting (429), wallet unreachable (502). Error handlers log server errors. |
| Endpoints with auth | ✅ Only `/health` is unauthenticated on both services. Auth and register on Users service are intentionally public. |
| Database querying | ✅ Parameterized queries ($1, $2) — no SQL injection risk. Balance calculated via aggregate query. Indexes on key columns. |
| DB Transaction lifecycle | ✅ `BEGIN → COMMIT` / `ROLLBACK` in `createTransaction` with `finally { client.release() }`. Proper error-path rollback. |
| Linter configured | ✅ ESLint configured for all three projects; lints pass cleanly. |
| File readability and separation | ✅ Small, focused files. Each controller method delegates to a service. Validators are separate. |
| Security | ✅ bcrypt password hashing, JWT HS256, internal JWT with audience claim and short TTL, rate limiting, no secrets in code. |
| Performance | ✅ DB indexes, connection pooling (pg Pool), rate limiting, paginated queries. |
| Scalability | ✅ Stateless microservices, Docker containers, separate databases, environment-driven config. |

---

## Summary

The project is a well-structured, production-ready implementation that satisfies all three parts of the challenge. The code demonstrates strong separation of concerns, proper security practices, and attention to real-world patterns like idempotency, rate limiting, and two-tier JWT authentication. The frontend is modern, typed, tested, internationalized, and responsive.

**Overall rating: Strong pass.** The implementation exceeds the basic requirements with thoughtful extras (idempotency, rate limiting, internal JWT security, double-entry ledger design document) and follows the technical guidelines consistently.
