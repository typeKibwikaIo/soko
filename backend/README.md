# Soko Backend

Express + Prisma + PostgreSQL API for the Soko DRC marketplace. Database name: **`soko`**.

## Setup

```bash
cd backend
cp .env.example .env          # then edit DATABASE_URL and JWT secrets
npm install
# create the database once (psql):  CREATE DATABASE soko;
npx prisma migrate dev        # creates tables + generates client
npm run seed                  # inserts BUYER / VENDOR / ADMIN roles
npm run dev                   # http://localhost:4000
```

## Module 1 — Auth & profiles (implemented)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | — | Creates user + role + buyer/vendor profile in one transaction |
| `/api/auth/login` | POST | — | Email + password → access + refresh tokens |
| `/api/auth/refresh` | POST | — | Rotates refresh token, issues new pair |
| `/api/auth/logout` | POST | — | Revokes a refresh token |
| `/api/auth/me` | GET | Bearer | Current user with roles and profiles |
| `/api/users/profile` | GET/PUT | Bearer | Read / update own profile |
| `/api/addresses` | GET/POST | Bearer | List / create addresses |
| `/api/addresses/:id` | PUT/DELETE | Bearer | Update / delete own address |

### Register payload

```json
{
  "firstName": "Jane",
  "lastName": "Mbuyi",
  "email": "jane@example.com",
  "phone": "+243...",
  "password": "min-8-chars",
  "role": "BUYER"            // or "VENDOR" — optional, defaults to BUYER
}
```

Vendor registration creates a `vendor_profiles` row with `verification_status = UNVERIFIED`. `registration_number` is optional and can be filled in later via profile update.

### Token model

- **Access token** — JWT, 15 min, sent as `Authorization: Bearer <token>`.
- **Refresh token** — JWT, 30 days, stored **hashed** (SHA-256) in `refresh_tokens`. `/refresh` rotates it: the old token is revoked and a new pair is issued.
- Passwords are bcrypt-hashed (cost 12). Plain text is never stored.

## Roadmap (schema already covers all of this)

1. ✅ Auth + user profiles + addresses
2. Vendor shops (`/api/shops`)
3. Product management (`/api/products`)
4. Marketplace listings / search
5. Cart
6. Orders + vendor-order splitting
7. Payments (server-verified webhooks only)
8. Shipments / tracking
9. Admin + activity logs
