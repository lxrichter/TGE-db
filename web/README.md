# Web Application

Next.js application for the current TGE geothermal intelligence platform prototype.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- NextAuth 4 credentials provider
- SQLite through `sqlite` and `sqlite3`
- Leaflet / React Leaflet for map views
- `xlsx` for spreadsheet export workflows

## Scripts

```bash
npm run dev     # Start local development server
npm run build   # Build production bundle
npm run start   # Start production server after build
npm run lint    # Run ESLint
```

## Local Setup

From this `web/` directory:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

The root route redirects to `/login` when no session is active.

## Environment

Example:

```text
DB_PATH=../shared/data/tge.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-local-development-secret
```

Notes:

- `DB_PATH` can be absolute or relative to the `web/` working directory.
- The default local path points to `../shared/data/tge.db`.
- `.env.local` is ignored by Git and must not be committed.
- Use a real random `NEXTAUTH_SECRET` for any non-local environment.

## Database

Runtime database access is handled in:

```text
web/lib/db.ts
```

Initialization logic is in:

```text
web/lib/init-db.ts
web/app/api/init/route.ts
```

Reference schema snapshot:

```text
web/data/schema.sql
```

Local SQLite files and backups are intentionally ignored. The repository does not include a production or working data dump.

## Authentication And Roles

Authentication uses NextAuth credentials and the local `users` table.

Key paths:

```text
web/lib/auth/auth.ts
web/lib/auth/roles.ts
web/middleware.ts
web/app/login/page.tsx
web/app/admin/users/page.tsx
```

Access is role-aware. The app supports internal editorial/admin workflows; subscriber access is a future platform layer, not a completed production feature in this snapshot.

## Main Route Areas

```text
/projects
/plants
/companies
/map
/markets
/analysis
/research-ops
/admin
```

API routes live under:

```text
web/app/api/
```

## Known Issues

`npm run lint` currently fails on pre-existing lint debt, mostly:

- `@typescript-eslint/no-explicit-any`
- unused variables in a few pages
- image optimization warnings
- one `react-hooks/set-state-in-effect` rule

This is documented as audit/stabilization work. Do not assume the current prototype is production-ready just because it runs locally.

## Development Principle

For new work, keep a clear distinction between:

- current implemented functionality
- proposed future improvements
- open questions needing business or data-model decisions
