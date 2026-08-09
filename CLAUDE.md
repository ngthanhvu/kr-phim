# CineK Project Guidelines (Nuxt 4 + Tailwind v4 + Drizzle)

This file contains commands, architecture guidelines, and design principles for the CineK project.

---

## 1. Quick Command Reference

- **Development Server**: `npm run dev` (starts on `0.0.0.0:3002`)
- **Production Build**: `npm run build`
- **Preview Production**: `npm run preview`
- **Database Generate Migration**: `npm run db:generate`
- **Database Apply Migration**: `npm run db:migrate`

---

## 2. Coding & Style Guidelines

- **Vue & TypeScript**: Strictly use `<script setup lang="ts">`. Avoid Option API or untyped JavaScript.
- **Auto-imports**: Do not manually import core Vue/Nuxt hooks (`ref`, `computed`, `useFetch`, `useRoute`, etc.). Nuxt handles this.
- **Routing & Pages**: Place routing views inside `app/pages/`.
- **Database queries**: Use Drizzle ORM schemas from `server/database/schema.ts`.
- **Icons**: Always use the custom `<AppIcon name="icon-name" />` component instead of custom raw SVG tags.

---

## 3. Frontend Design & Aesthetic Rules

To prevent generic "AI slop" design (such as standard Inter fonts, generic purple gradients, and basic card grids), always follow these rules:

<always_use_cinek_theme>
- **Aesthetic Direction**: CineK is a premium movie streaming platform. Giga-modern dark background `#0E111A` with rich gradient cards and glowing accents, or clean slate-blue light mode (`.admin-light` on `#f8fafc`).
- **Brand Palette**:
  - Main Accent (CineK Yellow): `#eab308` (CineK 500), `#facc15` (CineK 400).
  - Backgrounds: Dark Mode `#0E111A`, Light Mode (Admin) `#f8fafc`, Admin sidebar `#095DF2`.
- **Typography Pairing**: Main typeface is `"Be Vietnam Pro"`. Use bold, intentional tracking and weights rather than default browser weights.
- **Visual Depth**: Use smooth, transparent overlays (`bg-white/5` with `backdrop-blur-md`) and subtle linear borders (`border-white/[0.07]`) to create card depth.
- **Animations**: Prefer page-load sequences and subtle hover micro-interactions. Respect `prefers-reduced-motion`.
</always_use_cinek_theme>

For detailed instructions and utility classes, always read and follow:
- **Design System Utilities**: [`.agents/frontend-design.md`](./.agents/frontend-design.md)
- **Nuxt & Vue Standards**: [`.agents/nuxt-vue-standards.md`](./.agents/nuxt-vue-standards.md)
- **Database & Schema Rules**: [`.agents/drizzle-database.md`](./.agents/drizzle-database.md)
- **Distinctive UI Aesthetics**: [`.agents/distinctive-frontend.md`](./.agents/distinctive-frontend.md)
- **Docker Development**: [`.agents/docker-development.md`](./.agents/docker-development.md)
- **Docker Compose Creator**: [`.agents/docker-compose-creator.md`](./.agents/docker-compose-creator.md)


