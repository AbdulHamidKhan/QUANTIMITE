# Quantimite

A serious educational platform for school (Class 0–12), undergraduate, and study-abroad learners.

This is the **Phase 1** deliverable: authentication, RBAC, content hierarchy, public reading pages,
admin/teacher content management, search, and a security baseline.

## Stack

| Layer | Tool |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| ORM / DB | Prisma + PostgreSQL |
| Auth | Custom JWT (access + httpOnly refresh cookie) + bcrypt |
| File storage | Cloudflare R2 / S3 (with local fallback) |
| Search | DB `ILIKE` by default; Meilisearch if `MEILI_HOST` is set |

## Quick start

```bash
# 1. Install
cd quantimite
npm install

# 2. Configure
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, NEXTAUTH_SECRET
# Generate secrets:  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 3. Database
npm run db:push       # create schema
npm run db:seed       # seed sample content + superadmin (admin@quantimite.local / ChangeMe!123)

# 4. Dev
npm run dev
# → http://localhost:3000
```

## Architecture

```
EducationType (school | university | abroad)
   ├── Department  (university only)
   └── Subject
        └── Chapter
             └── ContentItem (video | pdf | article | quiz | guideline)

Guide   (abroad only; country / category)
```

Every row that can be deleted supports **soft delete** (`deletedAt`). All read APIs filter
`WHERE deletedAt IS NULL`.

## Auth model

- **Access token**: short-lived (15 min) JWT, sent via `Authorization: Bearer` *or* the
  `qm_access` httpOnly cookie. Verified server-side using `jose`.
- **Refresh token**: long-lived (7 days), stored in `RefreshToken` table as a SHA-256 hash,
  delivered in the `qm_refresh` httpOnly cookie. **Rotated on every refresh.**
- **Passwords**: bcrypt, cost factor 12.
- **Roles**: `student < teacher < admin < superadmin`. Every admin API checks the role
  on the server via `requireRole()`.

### Public endpoints

- `GET /api/education-types`
- `GET /api/education-types/[slug]/subjects?classLevel=&page=`

### Auth endpoints

- `POST /api/auth/register`   — creates a `student`
- `POST /api/auth/login`      — returns access + sets cookies
- `POST /api/auth/refresh`    — rotates refresh, issues new access
- `POST /api/auth/logout`     — revokes refresh, clears cookies
- `GET  /api/auth/me`         — current session

### Admin endpoints (require `teacher` or higher)

- `GET/POST /api/content/subjects`
- `PATCH/DELETE /api/content/subjects/[id]` (delete requires `admin`)
- `POST /api/content/chapters`
- `PATCH/DELETE /api/content/chapters/[id]`
- `POST /api/content/items`
- `PATCH/DELETE /api/content/items/[id]`
- `POST /api/upload`          — multipart, validates PDF/image binary signatures, 50MB / 5MB caps

### Search

- `GET /api/search?q=...` — works on the DB by default. If `MEILI_HOST` is set, the same
  endpoint routes to Meilisearch without callers needing to change.

## Security baseline already in place

- HTTPS-only security headers (`Strict-Transport-Security`, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- `poweredByHeader` disabled.
- `bcrypt(12)` password hashing.
- JWT secret separated from NextAuth (NextAuth isn't used here; we keep a lean custom auth).
- `sanitize-html` on all teacher-authored rich text, both on write and on subsequent edits.
- Rate limits: `register` (10/min/IP), `login` (5/15min/IP), in-memory (swap with Upstash Redis for multi-instance).
- File uploads validate the **actual binary signature**, not just the extension, with size caps.
- Soft delete with `deletedAt` filter on all reads — no data lost if someone hits "delete".
- RBAC checked in every admin route, never trusted from the client.
- SQL injection avoided entirely via Prisma's parameterized queries.
- HttpOnly + `SameSite=Lax` cookies; access token rotated on refresh; refresh token stored as hash.

## What you still need to do before production

1. **PostgreSQL** — provision (Railway, Render, Neon, Supabase) and set `DATABASE_URL`.
2. **Object storage** — set R2 credentials in `.env`. Local dev works without them but
   uploaded PDFs will only have a key, not a viewable URL.
3. **HTTPS / domain** — point Cloudflare at your origin and enable HSTS preload.
4. **Secrets** — generate three random 32-byte secrets (JWT access, JWT refresh, NextAuth).
   Never commit `.env`.
5. **First superadmin** — `npm run db:seed` then change the password immediately.
6. **Backups** — turn on automated Postgres backups.
7. **CI/CD** — Vercel for the Next.js app; GitHub Actions for tests/migrations before deploy.
8. **Meilisearch** — optional but recommended once content grows past a few thousand items.

## Roadmap (next phases)

- **Phase 2 — Content scale**: admin file manager, batch uploads, content templates, scheduled publishing.
- **Phase 3 — Engagement**: bookmarks API, progress tracking, notifications.
- **Phase 4 — Personalization**: student dashboard, recommended next items, "continue where you left off".
- **Phase 5 — Scale**: Redis rate limiting, Meilisearch indexer job, CDN, analytics.

## Scripts

```bash
npm run dev          # next dev
npm run build        # prisma generate && next build
npm start            # next start (production)
npm run db:migrate   # prisma migrate dev (after first schema change)
npm run db:push      # prisma db push (no migration files)
npm run db:seed      # tsx prisma/seed.ts
npm run db:studio    # prisma studio (DB GUI)
```