# Nuxt & Vue Coding Standards

This guide outlines code style, architectural conventions, and implementation practices for Nuxt 4 and Vue 3 in the CineK (kr-phim) project.

---

## 1. Vue 3 & Composition API
- **Single File Components (SFC)**: Always use the `<script setup lang="ts">` syntax. Do not use options API or the traditional setup function.
- **Language**: TypeScript is mandatory. Ensure all refs, computed properties, props, and emit interfaces are fully typed.
- **Imports**: 
  - **Do NOT** manually import core Vue/Nuxt APIs (e.g., `ref`, `computed`, `watch`, `onMounted`, `useRoute`, `useRouter`, `useFetch`, `useRuntimeConfig`). Nuxt auto-imports these.
  - Keep custom component/composable imports clean.

### Component Structure Example:
```vue
<script setup lang="ts">
// Props definition
interface Props {
  movieId: number
  active?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  active: false
})

// Emits definition
const emit = defineEmits<{
  (e: 'update', value: boolean): void
}>()

// Reactivity
const localActive = ref(props.active)

// Computed
const statusText = computed(() => localActive.value ? 'Active' : 'Inactive')

// Methods
function toggle() {
  localActive.value = !localActive.value
  emit('update', localActive.value)
}
</script>

<template>
  <div class="admin-card p-4">
    <span class="admin-label">{{ statusText }}</span>
    <button class="admin-btn-primary mt-2" @click="toggle">
      Toggle Status
    </button>
  </div>
</template>
```

---

## 2. Nuxt 4 Directory Structure & Organization
All code must align with the Nuxt 4 structure under the `/app` folder:
- **`app/pages/`**: File-system based routing. Keep files structured logically (e.g., `app/pages/admin/phim/index.vue`).
- **`app/components/`**: Place reusable components here. Nuxt auto-imports all components inside this folder. Use PascalCase or kebab-case when using them in templates (e.g., `<AppHeader />`).
- **`app/composables/`**: Store custom reactive functions here (e.g. `useAuth.ts`).
- **`app/layouts/`**: Core layouts (e.g., `admin.vue`).
- **`app/utils/`**: Helper utility functions.
- **`server/`**: API endpoints, middleware, and database operations.

---

## 3. Data Fetching Guidelines
Nuxt 4 provides specific wrappers for network requests. Use them properly to maintain SSR compatibility:

- **`useFetch`**: Use for fetching data during initial page load/rendering. Supports automatic refresh and refetching.
  ```typescript
  const { data: movies, pending, error } = await useFetch('/api/movies', {
    query: { limit: 10 }
  })
  ```
- **`$fetch`**: Use for event-driven requests, client-side actions, form submissions, and mutation events.
  ```typescript
  async function handleSubmit() {
    await $fetch('/api/movies', {
      method: 'POST',
      body: { name: 'New Movie' }
    })
  }
  ```
- **Request Headers**: When fetching data inside server-side calls that require authentication, forward cookies appropriately:
  ```typescript
  const { data: user } = await useFetch('/api/auth/me', {
    headers: useRequestHeaders(['cookie']),
  })
  ```

---

## 4. State Management
- Prefer simple composables with `ref` or `reactive` for shared local/global state.
- Keep state local to views unless shared across layouts.
