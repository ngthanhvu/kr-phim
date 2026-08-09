# Database & Drizzle ORM Standards

This guide covers the database structure, schema conventions, and query best practices using **Drizzle ORM** (MySQL) in the CineK (kr-phim) project.

---

## 1. Database Configuration & Schema
- **Database Dialect**: MySQL
- **Schema Location**: `/server/database/schema.ts`
- **Migrations Folder**: `/server/database/migrations`
- **Config file**: `drizzle.config.ts`

### Migration Commands:
- Generate a new migration file: `npm run db:generate`
- Apply migrations to database: `npm run db:migrate`

---

## 2. Core Schemas & Types Reference
The database is structured around four primary tables. Always import types and schema objects from `~/server/database/schema`:

### Users (`users`)
- Used for authentication and roles (admin, user).
- Schema definition:
  - `id`: Auto-incrementing primary key.
  - `name`: Full name.
  - `email`: Unique email address.
  - `password`: Hashed password (using bcryptjs).
  - `role`: User authorization level (`admin` or `user`).
  - `active`: Boolean to enable/disable accounts.

### Movies (`movies`)
- Contains metadata for all imported/scraped movies.
- Key properties:
  - `source`: The origin API provider (e.g. `kkphim`, `ophim`, `nguonc`).
  - `slug`: Unique slug path for URL routing.
  - `categories` & `countries`: Stored as JSON arrays of strings.
  - `actors`: JSON array of objects `[ { name, originalName, role, avatar } ]`.
  - **Custom Overrides**: Admin can overwrite fields with `customPoster`, `customThumb`, `customContent`, `customEpisodes`, and `customServers`.

### Comments (`comments`) & Comment Votes (`comment_votes`)
- Enables interactive comments under movies with parent-child relationships for nested threads.
- Supports pinning, marking as spoiler, anonymous posting, and like/dislike reactions tracking.

---

## 3. Server Endpoints Integration
When querying the database from server routes (`/server/api/*`):
- Import the database client from a global instance (e.g., `drizzle` or `db` composable).
- Use proper relational joins or index queries to keep performance fast.
- Ensure authentication checks are in place for destructive endpoints (e.g. validating token session via `/api/auth/*` before modifying movies or comments).

Example Query:
```typescript
import { db } from '~/server/database' // check project db import structure
import { movies } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.slug as string

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug is required' })
  }

  const result = await db.select().from(movies).where(eq(movies.slug, slug)).limit(1)
  return result[0] || null
})
```
