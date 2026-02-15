# ilia - Financial Wallet Platform

Two Node.js microservices that together form a basic financial wallet: **Wallet** (transactions, balance) and **Users** (auth, profile, wallet integration).

## Architecture

```
Client ──► Users :3002 ──(internal JWT)──► Wallet :3001
              │                                │
          users-db (PG)                   wallet-db (PG)
```

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| Wallet  | 3001 | wallet-db (host 5433) | Transactions CRUD, balance, idempotency |
| Users   | 3002 | users-db (host 5434)  | Register, login, profile, wallet summary |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20+)
- [Node.js](https://nodejs.org/) v18+ (only for running tests outside containers)
- Git

## Quick Start

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd ilia-nodejs-challenge

# 2. Create your .env from the example
cp .env.example .env

# 3. Build and start all services
docker compose up --build
```

All four containers (wallet-db, wallet, users-db, users) will start. Migrations run automatically on boot - no manual step needed.

To stop the services and **remove database volumes** (useful when you want a clean slate):

```bash
docker compose down -v
```

## Running Tests

Tests require the databases to be running:

```bash
# Start only the databases
docker compose up -d wallet-db users-db

# Wallet tests (16 tests)
cd services/wallet
npm install
DB_PORT=5433 npx jest --forceExit

# Users tests (9 tests)
cd ../users
npm install
DB_PORT=5434 npx jest --forceExit
```

## End-to-End Flow (curl)

### 1. Register a user

```bash
curl -s -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"Str0ng!Pass"}' | jq
```

### 2. Login

```bash
curl -s -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"Str0ng!Pass"}' | jq

# Save the returned token:
TOKEN="<paste token here>"
```

### 3. Create a credit transaction

```bash
curl -s -X POST http://localhost:3001/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"credit","amount":5000}' | jq
```

### 4. Create a debit transaction

```bash
curl -s -X POST http://localhost:3001/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"debit","amount":1500}' | jq
```

### 5. Check balance

```bash
curl -s http://localhost:3001/balance \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 6. Wallet summary (via Users service)

```bash
curl -s http://localhost:3002/me/wallet-summary \
  -H "Authorization: Bearer $TOKEN" | jq
```

This internally calls Wallet using a short-lived internal JWT - the client never touches internal endpoints directly.

## Authentication Model

| Type | Secret (env var) | Usage |
|------|-------------------|-------|
| External JWT | `ILIACHALLENGE` | Client-facing auth on both services |
| Internal JWT | `ILIACHALLENGE_INTERNAL` | Service-to-service calls (Users → Wallet), `aud="internal"`, 30s TTL |

External tokens are signed with HS256 and expire in 24h. Internal tokens are created per-request by the Users service, signed with a separate secret, and expire in 30 seconds.

## API Reference

### Wallet Service (`:3001`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/transactions` | External JWT | Create credit/debit (rate-limited) |
| GET  | `/transactions` | External JWT | List transactions (paginated, filterable) |
| GET  | `/balance` | External JWT | Current balance |
| GET  | `/health` | None | Health check |

**Idempotency**: Send `Idempotency-Key` header on POST to prevent duplicate transactions.

**Query params** for `GET /transactions`: `limit`, `offset`, `type`, `startDate`, `endDate`.

### Users Service (`:3002`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register (name, email, password) |
| POST | `/auth/login` | None | Login, returns JWT |
| GET  | `/me` | External JWT | Current user profile |
| GET  | `/me/wallet-summary` | External JWT | Balance + recent transactions |
| GET  | `/health` | None | Health check |

## Bonus: Rate Limiting

`POST /transactions` is rate-limited (default: 30 req/min per user). Configurable via:

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | 60000 | Window in ms |
| `RATE_LIMIT_MAX` | 30 | Max requests per window |

Internal routes (`/internal/*`) bypass rate limiting by design. See [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md) for details and a strategic suggestion for double-entry ledger.

## Project Structure

```
├── docker-compose.yml
├── .env.example
├── docs/
│   └── IMPROVEMENTS.md
└── services/
    ├── wallet/
    │   ├── src/
    │   │   ├── config/        # Environment config
    │   │   ├── controllers/   # Route handlers
    │   │   ├── db/            # Pool + migrations
    │   │   ├── middlewares/   # Auth, rate limiter, error handler
    │   │   ├── routes/        # External + internal routes
    │   │   ├── services/      # Business logic
    │   │   ├── validators/    # Zod schemas
    │   │   ├── app.js         # Express app
    │   │   └── server.js      # Entry point
    │   └── tests/
    └── users/
        ├── src/
        │   ├── config/
        │   ├── controllers/
        │   ├── db/
        │   ├── middlewares/
        │   ├── routes/
        │   ├── services/      # Auth logic + wallet HTTP client
        │   ├── validators/
        │   ├── app.js
        │   └── server.js
        └── tests/
```
