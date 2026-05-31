# VaultX

> A security-focused personal vault exploring **two-person access control**, **time-locked entries**, and **nominee succession** — built as a full-stack study in multi-party authorization and confidential data handling.

Demo: https://vault-x-red.vercel.app

---

## What makes VaultX different

Most "build your own password manager" projects stop at credential storage. VaultX leans into the harder problem: **who can see what, when, and under whose approval.**

- **Two-person access control.** Entries can be gated so that neither the owner nor a designated approver can open sensitive content alone. An email-signed approval link (scoped JWT, replay-protected) unlocks the entry for a 10-minute window.
- **Time-locked entries.** Set a future `unlockAt` on any entry. All reads, previews, and downloads are refused until the clock hits — and every attempt is written to the activity log.
- **Nominee succession.** Designate a trusted person who can, under legal or inactivity-based conditions, submit a claim with proof documents. An admin reviewer approves and activates nominee access. Nominees never self-activate.
- **Protected share links.** Owners create single-document shareable URLs with a password and short-lived download tokens. The recipient never touches the vault or authenticated API.

Field-level **AES-256-GCM** encryption, bcrypt-hashed passwords, per-account login lockout, and per-code reset-attempt counters sit underneath.

---

## Feature overview

### Vault
- Encrypted entries: title, data, username, password, notes, URLs, tags, and up to 10 attachments (images/PDF, 10 MB each)
- Categorization, multi-select filters, sort, search, grid/list toggle
- Dual-approval workflow with email-based approver links
- Time-locked entries with server-enforced unlock gate
- Protected shareable links with password + expiring download tokens
- Activity log per user (180-day TTL)

### Authentication
- Email + password with bcrypt (cost 12)
- JWT access tokens (7 day TTL) with strict-scope approval tokens
- Per-account login lockout (6 failures → 15 min cooldown)
- Password reset via 6-digit code with attempt limiting (5 tries → invalidated)
- Per-IP rate limiting on auth, password reset, and shared-link verification

### Nominee & succession
- Register a nominee with an activation condition (death, incapacity, inactivity, court order)
- Nominee submits a claim with proof type, notes, and a proof document
- Admin reviews, approves, and activates — legal conditions require admin verification
- Revocation at any time by the owner

### UI
- Minimal "graphite" design system (warm off-white / near-black ink)
- Lenis smooth scroll, tactile press feedback, respects `prefers-reduced-motion`
- Route-level code splitting (29 kB initial shell / 9 kB gzipped)
- Post-login folder-to-cards entrance animation (one-shot per session)

---

## Architecture

```
┌──────────────────────────────────────────────┐
│ React 18 · Vite · Tailwind · Framer Motion   │
│ TanStack Query · Zustand · Zod · Lenis       │
└─────────────┬────────────────────────────────┘
              │ HTTPS / JSON
┌─────────────▼────────────────────────────────┐
│ Express 4                                    │
│  ├─ helmet, CORS, body-size, rate limits     │
│  ├─ zod validate() → HttpError → errorHandler│
│  ├─ JWT protect() + requireAdmin()           │
│  └─ morgan + request IDs + /api/health       │
├──────────────────────────────────────────────┤
│ Controllers (async)                          │
│  auth · users · vault · nominee · shared     │
├──────────────────────────────────────────────┤
│ Utils                                        │
│  encryption (AES-256-GCM) · lockout          │
│  timeLock · cloudinaryAsset · email          │
├──────────────────────────────────────────────┤
│ Mongoose models                              │
│  User · Vault · SharedLink · ActivityLog     │
└─────────────┬────────────────────────────────┘
              │
      MongoDB Atlas · Cloudinary · SMTP (Brevo)
```

### Tech stack

**Frontend** — React 18, TypeScript, Vite, Tailwind, Framer Motion, TanStack Query, Zustand, Radix UI, React Hook Form, Zod, Lenis, React Router DOM, React Hot Toast

**Backend** — Node.js, Express, Mongoose, JWT, bcryptjs, Helmet, express-rate-limit, Multer, Nodemailer, Cloudinary, Morgan

**Infra** — MongoDB Atlas, Cloudinary, Vercel (serverless), Brevo (SMTP)

---

## Security posture

| Concern                          | Mitigation                                                                |
| -------------------------------- | ------------------------------------------------------------------------- |
| Credential theft at rest         | AES-256-GCM field-level encryption with per-field random IVs              |
| Credential theft over wire       | HTTPS only, Cloudinary signed asset URLs                                  |
| Password hashing                 | bcrypt, cost 12                                                           |
| Brute-force login                | Per-IP rate limit + per-account lockout with `Retry-After`                |
| Password-reset brute-force       | 5-attempt counter; code invalidated on threshold; rate limit on endpoint  |
| Session fixation                 | Token rotation on password reset; lockout cleared on successful reset     |
| CSRF-style approval forgery      | Approval links signed with scoped JWT, 30m TTL, single-use tie-in         |
| Time-lock bypass                 | Server-side `isVaultLocked` gate on every read/preview/download path      |
| Unauthorized vault reads         | `canReadVaultEntry` checks owner · approver · active nominee              |
| Payload smuggling                | `express.json({ limit: '1mb' })`, Multer 10 MB/file, 50 MB/request        |
| File type spoofing               | MIME allowlist enforced pre-Cloudinary (JPEG/PNG/WEBP/GIF/PDF)             |
| Log-based info leakage           | `errorHandler` strips raw messages on 5xx; request IDs in body + logs     |
| Admin-only operations            | `requireAdmin` middleware on user list and nominee review                 |
| Secret rotation readiness        | Env validated at boot; ENCRYPTION_KEY format-checked                      |
| Headers                          | Helmet (CSP off by design for Cloudinary previews), `x-powered-by` off    |

**Known trade-offs** (documented, not hidden):
- JWT in `sessionStorage` (XSS-exposed). A production build would move to httpOnly cookies with a refresh-token rotation.
- Server-side encryption key — a compromised server decrypts everything. Zero-knowledge mode would require client-side encryption with user-derived keys.
- No audit of the encryption implementation. Use at your own risk for real secrets.

---

## Getting started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)
- SMTP provider (Brevo, SendGrid, Gmail app password, etc.) — optional for local dev

### Setup

```bash
git clone https://github.com/<your-username>/secure-vault.git
cd secure-vault
npm install
```

Create a `.env` at the project root:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster/<db>?retryWrites=true&w=majority

# 32-byte hex string (64 chars). Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<64-char hex>

# 32+ random chars
JWT_SECRET=<long random string>

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Public URL (used in approval + share links)
APP_URL=http://localhost:3000

# SMTP (optional in dev — reset codes will be logged to console instead)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=VaultX <no-reply@example.com>
```

> **Important:** Never commit your `.env`. Rotate `ENCRYPTION_KEY` carefully — existing ciphertext was encrypted with the previous key.

### Run

```bash
# Backend (http://localhost:3000)
npm run dev:backend

# Frontend (http://localhost:5173, proxies /api to backend)
npm run dev:frontend

# Production build
npm run build
npm start
```

Health check: `GET http://localhost:3000/api/health`

---

## API surface

| Method | Path                                          | Auth       | Notes                                     |
| ------ | --------------------------------------------- | ---------- | ----------------------------------------- |
| POST   | `/api/auth/register`                          | –          | Rate limited                              |
| POST   | `/api/auth/login`                             | –          | Rate limited, per-account lockout         |
| POST   | `/api/auth/forgot-password`                   | –          | Rate limited, generic response            |
| POST   | `/api/auth/reset-password`                    | –          | Rate limited, attempt-counted             |
| GET    | `/api/users`                                  | admin      | List users                                |
| GET    | `/api/users/me`                               | user       | Current profile                           |
| PUT    | `/api/users/me`                               | user       | Update name / avatar                      |
| GET    | `/api/vault`                                  | user       | Paginated (`?page=&limit=`)               |
| POST   | `/api/vault`                                  | user       | Multipart; up to 10 attachments           |
| GET    | `/api/vault/:id`                              | user       | Redacts if dual-approval pending          |
| PUT    | `/api/vault/:id`                              | owner      | Multipart                                 |
| DELETE | `/api/vault/:id`                              | owner      |                                           |
| POST   | `/api/vault/:id/request-approval`             | participant| Emails the other party an approval link   |
| POST   | `/api/vault/approve-email`                    | –          | Approval token required                   |
| GET    | `/api/vault/:id/attachments/:i/preview`       | user       | Streamed from Cloudinary                  |
| GET    | `/api/vault/:id/attachments/:i/download`      | user       | `Content-Disposition: attachment`         |
| POST   | `/api/vault/:id/share-link`                   | owner      | Returns shareId + shareable URL           |
| GET    | `/api/shared/:shareId`                        | –          | Returns document kind                     |
| POST   | `/api/shared/:shareId/verify`                 | –          | Rate limited                              |
| GET    | `/api/shared/:shareId/preview`                | token      | Short-lived JWT download token            |
| GET    | `/api/shared/:shareId/download`               | token      |                                           |
| POST   | `/api/nominee`                                | user       | Register a nominee                        |
| GET    | `/api/nominee`                                | user       | Status + nominations by you               |
| GET    | `/api/nominee/claims`                         | admin      | Review queue                              |
| POST   | `/api/nominee/claim`                          | user       | Multipart proof document                  |
| POST   | `/api/nominee/approve`                        | admin      | Approve submitted claim                   |
| POST   | `/api/nominee/activate`                       | admin      | Grant nominee access                      |
| POST   | `/api/nominee/revoke`                         | user       | Owner revokes their nominee               |
| POST   | `/api/upload`                                 | user       | Single file, used for avatars / proof     |
| GET    | `/api/activity`                               | user       | Last 100 events for the signed-in user    |
| GET    | `/api/health`                                 | –          | Liveness probe (uptime + db state)        |

---

## Project layout

```
secure-vault/
├── api/                       # Vercel serverless entry shim
├── backend/
│   ├── config/
│   │   ├── db.js              # Mongo connection (reused across requests)
│   │   └── env.js             # Startup env validation
│   ├── controllers/           # auth · user · vault · nominee · shared · activity
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT protect()
│   │   ├── errorHandler.js    # HttpError + central 4xx/5xx formatter
│   │   ├── rateLimiters.js    # auth / reset / shared / general
│   │   ├── requireAdmin.js
│   │   ├── requestContext.js  # X-Request-Id
│   │   ├── uploadMiddleware.js# Multer + Cloudinary + MIME allowlist
│   │   └── validate.js        # zod schemas → HttpError 400
│   ├── models/                # User · Vault · SharedLink · ActivityLog
│   ├── routes/                # One file per resource
│   ├── Utils/
│   │   ├── encryption.js      # AES-256-GCM with IV/tag envelope
│   │   ├── accountLockout.js  # Failed-login bookkeeping
│   │   ├── timeLock.js        # Unlock-at parsing + checks
│   │   ├── lockAccess.js      # enforceVaultUnlock()
│   │   ├── cloudinaryAsset.js # Signed fetchable URLs
│   │   ├── remoteDocument.js  # Preview/download proxy
│   │   ├── email.js           # Nodemailer transport + templates
│   │   ├── appUrl.js
│   │   ├── asyncHandler.js
│   │   └── vaultQuery.js      # Shared population helpers
│   ├── validation/            # zod schemas per resource
│   └── server.js              # helmet, morgan, routes, graceful shutdown
└── frontend/
    ├── index.html
    └── src/
        ├── pages/             # Auth · Dashboard · EntryDetail · Profile · Settings · SharedLink · ApproveAccess
        ├── components/        # auth · forms · layout · vault · ui
        ├── features/          # auth · vault · user · nominee · settings
        ├── lib/               # request · utils · motion · smoothScroll · categoryIcons · validators · constants · hooks
        ├── router.tsx         # Code-split routes
        ├── main.tsx
        └── index.css          # Graphite design system
```

---

## Design system notes

- **Palette:** warm off-white paper (`36 22% 97%`) with near-black ink (`220 14% 12%`) and a cool slate accent. Dark mode is a 2% warm-tinted graphite (not flat OLED black).
- **Type:** Instrument Sans for UI, Fraunces for headings, `tabular-nums` on every number-heavy surface.
- **Motion:** single `cubic-bezier(0.22, 1, 0.36, 1)` easing. No translations >12px, no glowing colors, no floating objects. Respects `prefers-reduced-motion`.
- **Scroll:** Lenis rAF-driven smooth scroll for wheel/trackpad.
- **Animation:** subtle post-login folder → card entrance (one-shot per session, strict-mode-safe latch).

---

## Scripts

```bash
npm run dev            # alias for dev:backend
npm run dev:backend    # node backend/server.js
npm run dev:frontend   # vite dev server on :5173
npm run build          # vite build → frontend/dist/
npm start              # production backend (serves dist/)
```

---

## Roadmap

Honest about what's missing for a production-grade security product:

- [ ] httpOnly cookie auth + refresh-token rotation (replacing sessionStorage JWT)
- [ ] Client-side encryption for zero-knowledge mode
- [ ] TOTP-based 2FA
- [ ] WebAuthn passkey login
- [ ] Content Security Policy (blocked today by Cloudinary iframe previews)
- [ ] HIBP breach check on password entry
- [ ] Encryption key rotation with ciphertext migration
- [ ] Audit trail export
- [ ] E2E tests (Playwright)
- [ ] OpenAPI spec generation from zod schemas

---

## License

ISC — see `package.json`. This project is a learning exercise. **Do not store real secrets in an unaudited vault.**

---

## Acknowledgements

- [Lenis](https://lenis.darkroom.engineering) — smooth scroll primitive
- [Lucide](https://lucide.dev) — icon set
- [Headless UI](https://headlessui.com) & [Radix UI](https://radix-ui.com) — accessible primitives
- [Framer Motion](https://www.framer.com/motion/) — animation runtime
- [TanStack Query](https://tanstack.com/query) — async state
