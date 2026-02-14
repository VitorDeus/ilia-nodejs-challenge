# Improvements & Bonus Features

## Implemented Bonus: Rate Limiting

### What
A configurable rate limiter is applied to the `POST /transactions` endpoint to protect write operations against abuse and excessive load.

### Where
- **Middleware**: `services/wallet/src/middlewares/rateLimiter.js`
- **Applied in**: `services/wallet/src/routes/transactions.js` (on `POST /` route)
- **Library**: [`express-rate-limit`](https://www.npmjs.com/package/express-rate-limit)

### Configuration
Controlled via environment variables (set in `docker-compose.yml` or `.env`):

| Variable               | Default | Description                          |
|------------------------|---------|--------------------------------------|
| `RATE_LIMIT_WINDOW_MS` | 60000   | Time window in milliseconds (1 min)  |
| `RATE_LIMIT_MAX`       | 30      | Max requests per window per user     |

### Behavior
- Keyed by authenticated `userId` (falls back to IP if auth hasn't run yet).
- Returns HTTP **429** with a consistent JSON error body:
  ```json
  { "error": "Too many requests, please try again later" }
  ```
- Standard `RateLimit-*` headers are included in responses (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).

---

## Strategic Improvement Suggestion (NOT Implemented): Double-Entry Ledger

### Why It Matters
In production fintech systems, a single-entry model (one `transactions` table with `credit`/`debit` rows) works for simple wallets but breaks down as the system scales in complexity:

- **Auditability**: Regulators and auditors expect every movement of funds to be traceable between accounts. A single-entry model makes reconciliation manual and error-prone.
- **Multi-currency / multi-account**: When users can hold balances in multiple currencies or when the platform itself has accounts (fees, reserves, payouts), single-entry cannot express "where did the money go?".
- **Consistency guarantees**: The fundamental accounting equation (Assets = Liabilities + Equity) becomes automatically enforceable — every ledger posting must balance to zero, making silent data corruption detectable.

### What Changes Conceptually
Instead of one row per transaction, every financial event produces **at least two entries** (a posting) that net to zero:

| Current Model                          | Double-Entry Model                                  |
|----------------------------------------|-----------------------------------------------------|
| `transactions(userId, type, amount)`   | `ledger_entries(account_id, debit, credit, posting_id)` |
| Balance = SUM(credits) – SUM(debits)   | Balance = SUM(debits) – SUM(credits) per account    |
| One table, one user                    | Many accounts (user wallet, platform fees, etc.)    |

Key concepts introduced:
- **Account**: A named bucket (e.g., `user:123:usd`, `platform:fees:usd`).
- **Posting** (or Journal Entry): A group of ledger entries that must sum to zero.
- **Ledger Entry**: A single debit or credit to one account within a posting.

### Rough Implementation Steps

1. **New tables**:
   ```sql
   CREATE TABLE accounts (
     id UUID PRIMARY KEY,
     owner_id VARCHAR(255),
     type VARCHAR(50),       -- 'asset', 'liability', 'equity', 'revenue', 'expense'
     currency VARCHAR(10),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE postings (
     id UUID PRIMARY KEY,
     description TEXT,
     idempotency_key VARCHAR(255) UNIQUE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE ledger_entries (
     id UUID PRIMARY KEY,
     posting_id UUID REFERENCES postings(id),
     account_id UUID REFERENCES accounts(id),
     debit  INTEGER NOT NULL DEFAULT 0 CHECK (debit >= 0),
     credit INTEGER NOT NULL DEFAULT 0 CHECK (credit >= 0),
     CHECK (debit = 0 OR credit = 0)  -- entry is either debit or credit
   );
   ```

2. **Balance constraint**: Add a DB trigger or application-level check that `SUM(debit) = SUM(credit)` per posting before commit.

3. **Migrate existing data**: Convert current `transactions` rows into postings + ledger entries (e.g., a user credit becomes: debit `platform:funding`, credit `user:X:usd`).

4. **Update service layer**: Replace `transactionService.createTransaction` with a `postingService.createPosting` that accepts an array of entries and validates the zero-sum rule.

5. **Balance query**: `SELECT SUM(debit) - SUM(credit) FROM ledger_entries WHERE account_id = $1` (or the inverse, depending on account type convention).

6. **Reporting**: Add endpoints for account statements, reconciliation reports, and trial balance.

### Trade-offs
- **Complexity**: More tables, more application logic, and a steeper learning curve for developers unfamiliar with accounting.
- **Performance**: More rows per financial event; mitigated with materialized balance caches and partitioning.
- **Correctness**: Dramatically higher — the system becomes self-auditing by construction.

> **Recommendation**: Adopt this pattern before launch if the product handles real money or if multi-account / multi-currency features are on the roadmap. The cost of retrofitting a ledger post-launch is significantly higher than building it from the start.
