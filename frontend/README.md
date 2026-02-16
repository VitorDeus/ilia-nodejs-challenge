# Frontend - ilia Wallet UI

React + TypeScript SPA for the ilia Financial Wallet platform.

## Tech Stack

| Library | Purpose |
|---------|---------|
| Vite 6 | Build tooling, dev server with proxy |
| React 19 | UI framework |
| TypeScript | Type safety |
| TailwindCSS 4 | Styling |
| shadcn/ui components | Button, Card, Input, Label, Alert, Select |
| react-router-dom v7 | Client-side routing |
| TanStack Query v5 | Server state management |
| react-hook-form + zod v4 | Form validation |
| i18next | Internationalization (en, pt-BR) |
| Vitest + React Testing Library | Unit/integration tests |

## Pages

| Route | Component | Auth |
|-------|-----------|------|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/app` | DashboardPage | Protected |

## Quick Start (Vite dev)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Opens at http://localhost:3000. The Vite proxy forwards API calls:

- `/api/users/*` -> `http://localhost:3002`
- `/api/wallet/*` -> `http://localhost:3001`

Make sure the backend services are running (`docker compose up -d` from root).

## Docker (full stack)

From the repo root:

```bash
cp .env.example .env
docker compose up --build
```

The frontend runs on port 3000 behind nginx, which proxies API calls to the backend containers.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USERS_BASE_URL` | `/api/users` | Users service base URL |
| `VITE_WALLET_BASE_URL` | `/api/wallet` | Wallet service base URL |

When running via Docker, the nginx reverse proxy handles routing to backends. The defaults (`/api/users`, `/api/wallet`) work out of the box.

When running via Vite dev server, the same defaults work because Vite's proxy config rewrites them.

If you point directly to backends (e.g., `http://localhost:3002`), CORS must be handled on the backend side.

## API Routes Used

### Users Service (`:3002`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, returns JWT |

### Wallet Service (`:3001`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/balance` | Fetch current balance |
| GET | `/transactions` | List transactions (paginated) |
| POST | `/transactions` | Create credit/debit transaction |

## Auth Strategy

- Token is stored in **memory** (React state) by default
- Persisted in **sessionStorage** as fallback (survives page refresh within the tab)
- **localStorage is intentionally avoided** to reduce XSS exposure surface
- **Production hardening**: use httpOnly cookies set by the backend, eliminating client-side token storage entirely

## Tests

```bash
npm test
```

Runs 8 tests across 3 suites:

- LoginPage: validation, success flow, error handling
- DashboardPage: balance + transactions rendering, empty state
- CreateTransactionForm: validation, submit, error feedback

## Project Structure

```
frontend/
  src/
    components/
      ui/             # shadcn/ui primitives
      AuthLayout.tsx
      BalanceCard.tsx
      CreateTransactionForm.tsx
      DashboardLayout.tsx
      LanguageSwitcher.tsx
      ProtectedRoute.tsx
      TransactionList.tsx
    hooks/
      useAuth.tsx
      useWallet.ts
    i18n/
      locales/
        en.json
        pt-BR.json
      index.ts
    lib/
      auth.ts
      axios.ts
      query-client.ts
      schemas.ts
      utils.ts
    pages/
      DashboardPage.tsx
      LoginPage.tsx
      RegisterPage.tsx
    test/
      setup.ts
      LoginPage.test.tsx
      DashboardPage.test.tsx
      CreateTransaction.test.tsx
    types/
      index.ts
    App.tsx
    main.tsx
    index.css
  Dockerfile
  nginx.conf
  .env.example
  vite.config.ts
```
