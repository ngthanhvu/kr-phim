# Frontend Design and Styling Guidelines

This guide defines the design system, styling philosophy, and component design patterns used in the CineK (kr-phim) project. All AI agents MUST read and strictly adhere to these guidelines when modifying or creating any frontend UI.

---

## 1. Core Philosophy: Premium & Dynamic Aesthetics
CineK is a premium movie streaming website. Simple, generic, or plain-looking user interfaces are NOT acceptable. Every UI must feel premium, modern, and interactive:
- **Curated Palettes**: Avoid generic primary colors (e.g. basic `#0000ff` blue or `#ff0000` red). Instead, use the project's tailored palettes (CineK yellow, dark/slate neutrals).
- **Responsive & Alive**: Every interactive element (buttons, cards, inputs, tabs) must have hover/active states with smooth transitions.
- **Glassmorphism & Gradients**: Use smooth, semi-transparent overlays (`bg-white/5` with `backdrop-blur-md`) and linear-gradient background shapes on dark elements to create depth.
- **Typography Hierarchy**: Maintain strict typographical hierarchies using clean sans-serif typography (`Be Vietnam Pro`). Avoid raw default sans-serif when possible.

---

## 2. Global Typography & Styling Variables
We use **Tailwind CSS v4** and customize the theme variables inside `app/assets/css/main.css`:

### Font
- **Primary Font**: `"Be Vietnam Pro"`, ui-sans-serif, system-ui, sans-serif
- Imported globally via Google Fonts API.

### Primary Color Palette (CineK Yellow)
Our brand color is a warm yellow:
- `--color-cinek-50`: `#fefce8`
- `--color-cinek-100`: `#fef9c3`
- `--color-cinek-300`: `#fde047`
- `--color-cinek-400`: `#facc15`
- `--color-cinek-500`: `#eab308` (Primary brand color)
- `--color-cinek-950`: `#422006`

### Theme Backgrounds
- **Dark Mode Background**: `#0E111A` (Body background for the main streaming portal)
- **Admin Light Mode Background**: `#f8fafc` (Body background for light administration views)

---

## 3. Utility Class Design System
A central set of class conventions is defined in `main.css`. Always prefer these predefined styles over ad-hoc Tailwind classes to keep the markup clean and maintain visual consistency.

| Utility Class | Description | Standard Usage |
|---|---|---|
| `.admin-page` | Layout wrapper for admin views | `<div class="admin-page">` |
| `.admin-card` | Container with borders and hover state | `<div class="admin-card">` |
| `.admin-card-gradient` | Container with subtle top highlights | `<div class="admin-card-gradient">` |
| `.admin-input` | Standard styling for input fields (height: 11) | `<input class="admin-input" />` |
| `.admin-input-sm` | Compact input fields for dense tables | `<input class="admin-input-sm" />` |
| `.admin-btn-primary` | Main action buttons (brand blue/yellow) | `<button class="admin-btn-primary">` |
| `.admin-btn-secondary` | Muted/Bordered secondary actions | `<button class="admin-btn-secondary">` |
| `.admin-btn-danger` | Alert/Destructive actions | `<button class="admin-btn-danger">` |
| `.admin-badge` | Visual badges (status, tags) | `<span class="admin-badge">` |
| `.admin-label` | Small uppercase tracker label for inputs | `<label class="admin-label">` |
| `.admin-section-title` | Title for primary view section headings | `<h1 class="admin-section-title">` |
| `.admin-section-subtitle` | Context/Subtitle beneath a section title | `<p class="admin-section-subtitle">` |
| `.admin-num` | Numbers/Metrics (tabular-nums font) | `<span class="admin-num">` |

---

## 4. Dark vs. Light Theme Rules (Admin Layout)
The admin layout uses an `.admin-light` wrapper that forces a crisp enterprise look. Do not hardcode dark utilities (`dark:...`) unless you specifically want dark behavior in both modes.

In `.admin-light` mode, the global styles in `main.css` are overridden:
- Global text colors mapping to `text-slate-400`, `text-zinc-500`, etc., are forced to darker shades (`#475569` or `#334155`) to comply with accessibility standards (contrast ratios).
- Cards become solid white, backgrounds become light gray-blue (`#f8fafc`), and border properties adapt to `#e2e8f0`.

When coding admin components:
- **Never** use light-gray text on a white background. Ensure headings are `#0f172a` (Slate 900) and descriptions are `#334155` (Slate 700).
- Input placeholders must remain readable (`#94a3b8` - Slate 400).

---

## 5. UI Components & Icon Conventions
- **Icons**: Do not write raw `<svg>` tags. Always use the built-in `<AppIcon>` component. This wraps FontAwesome icons securely.
  - Usage: `<AppIcon name="film" class="size-5" />`
  - Allowed names conform to common Lucide / FontAwesome names (e.g. `home`, `film`, `users`, `settings`, `x`, `log-out`, `menu`).
- **Sliders & Carousels**: Always use the **Swiper** library (`swiper` dependencies are present in `package.json`).
- **Scrollbars**: Apply the `.admin-scrollbar` utility class for sleek custom scrollbars in scrollable panels or tables.
- **Animations**: Use predefined transitions like `.hero-fade-enter-active` or Vue transitions with `name="modal-fade"` / `name="sidebar-fade"` for smooth entrance and exit animations.

---

## 6. Official Anthropic / Claude Code Frontend Design Principles
Adopt the mindset of a design lead at a specialized studio. Avoid generic, templated default designs. Follow these exact rules from the Claude Code `frontend-design` plugin:

### Grounding in the Subject
- State one concrete subject, audience, and the view's single job before coding.
- Match typography, color, and layout to the specific cinematic context of the Korean movie database (CineK).

### Visual & Typography Guidelines
- **Hero/Header**: Make the hero element a "thesis" presenting the most characteristic thing about the movie database. Avoid the templated "big number with a small label + gradient accent" unless it truly fits.
- **Typography Pairing**: Pair display and body fonts deliberately. Do not let text act as a neutral vehicle; make the type treatment a memorable part of the design.
- **Structure**: Numbering, badges, dividing lines, and labels must represent real structure and sequence in the movie database. Do not use numbers (like 01 / 02 / 03) unless ordering carries essential information.
- **Motion**: Use motion deliberately (loading animations, scroll reveals, hover interactions). Avoid cluttered animations that scream "AI-generated". Less is more.

### Process: The Two-Pass Workflow
1. **Pass 1: Brainstorming**: First define a token system.
   - **Color**: 4–6 named hex values.
   - **Type**: Choose faces for the different typography roles.
   - **Layout**: Draft a layout concept with one-sentence descriptions.
   - **Signature**: Define the single unique element this view will be remembered by.
2. **Pass 2: Critique & Build**: Review the plan against generic templates. If it looks like a generic SaaS dashboard, revise it. Once validated, build the code exactly following the plan.

### Restraint & Copywriting
- **Restraint**: Spend boldness in one place (the signature element). Keep everything else clean and disciplined.
- **Copywriting**: Words are design material. Write from the user's side of the screen using active voice.
  - E.g., "Save changes," not "Submit".
  - Empty states should be invitations to act, and errors should explain what went wrong and how to fix it without being vague.
