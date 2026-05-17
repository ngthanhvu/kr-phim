# KR Phim

KR Phim is a Korean movie streaming web app built with Nuxt and Tailwind CSS. It aggregates Korean-only movie data from the OPhim and NguonC APIs, normalizes the responses on the server, and presents the content with a Netflix-inspired sky-blue interface.

## Features

- Korean-only movie catalogue from OPhim and NguonC.
- Netflix-style home page with a large hero carousel.
- Floating movie preview cards on home page hover.
- Browse page with search, type filters, and pagination.
- Movie detail page with embedded player and episode selector.
- Shared responsive header with centered navigation and global search.
- Shared footer and scroll-to-top button.
- Tailwind CSS styling with the `Be Vietnam Pro` font.
- Lucide icons for UI actions.

## Tech Stack

- Nuxt 4
- Vue 3
- Tailwind CSS 4
- `@tailwindcss/vite`
- `lucide-vue-next`

## Project Structure

```text
app/
  assets/css/main.css        Global Tailwind and theme styles
  components/                Shared UI components
  pages/index.vue            Home page
  pages/phim/index.vue       Browse, search, filter, and pagination page
  pages/phim/[slug].vue      Movie detail and player page
server/
  api/movies.get.ts          Movie list API endpoint
  api/movies/[slug].get.ts   Movie detail API endpoint
  utils/movies.ts            API adapters and normalization helpers
API_nguonc.md                NguonC API notes
API_ophim.md                 OPhim API notes
```

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will usually be available at:

```text
http://localhost:3002
```

## Production Build

Build the app for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run the production server after building:

```bash
npm run start
```

The production server listens on port `3002` by default.

## Docker

Build and run with Docker Compose:

```bash
docker compose up -d --build
```

The container exposes the app at:

```text
http://localhost:3002
```

Stop the container:

```bash
docker compose down
```

The Compose service is named `kr-phim` and maps host port `3002` to container port `3002`.

## Available Routes

- `/` - Home page with hero carousel and movie rows.
- `/phim` - Browse page with search, filters, and pagination.
- `/phim?type=series` - Browse Korean series.
- `/phim?type=single` - Browse Korean movies.
- `/phim?q=keyword` - Search Korean movies.
- `/phim/[slug]?source=ophim` - Movie detail page from OPhim.
- `/phim/[slug]?source=nguonc` - Movie detail page from NguonC.

## API Notes

The app does not call external movie APIs directly from the browser. Instead, Nuxt server endpoints request and normalize movie data:

- OPhim list/detail data is handled in `server/utils/movies.ts`.
- NguonC list/detail data is handled in `server/utils/movies.ts`.
- Only Korean movies are kept in the normalized result.

If one source is unavailable, the list endpoint still returns data from the other source when possible and includes source status metadata.

## Scripts

```bash
npm run dev       # Start Nuxt development server
npm run build     # Build for production
npm run preview   # Preview the production build
npm run start     # Start the built Nitro server
npm run generate  # Generate a static build when supported
```

## Notes

This project is intended as a movie browsing and streaming UI experiment using public movie API sources. Availability of movie metadata, images, and episode embeds depends on the upstream APIs.
