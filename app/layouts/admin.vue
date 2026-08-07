<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

const { data: user } = await useFetch('/api/auth/me', {
  headers: useRequestHeaders(['cookie']),
})

const navItems = [
  { label: 'Dashboard', icon: 'home' as const, to: '/admin' },
  { label: 'Phim', icon: 'film' as const, to: '/admin/phim' },
  { label: 'Thành viên', icon: 'users' as const, to: '/admin/thanh-vien' },
  { label: 'Cài đặt', icon: 'settings' as const, to: '/admin/cai-dat' },
]

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}

function closeSidebar() {
  sidebarOpen.value = false
}

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}

const displayName = computed(() => user.value?.name || user.value?.email?.split('@')[0] || 'Admin')
const displayInitial = computed(() => displayName.value.charAt(0).toUpperCase())
</script>

<template>
  <div class="admin-light min-h-screen bg-[#f8fafc]">
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-[#095DF2] transition-transform lg:translate-x-0 border-l-4 border-l-blue-700">
      <div class="flex h-16 items-center justify-between border-white/20 px-5">
        <NuxtLink to="/admin" class="flex items-center gap-3">
          <AppIcon name="film" class="size-5 text-white" />
          <span class="text-lg font-black text-white tracking-tight">Admin Management</span>
        </NuxtLink>
        <button type="button"
          class="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          @click="closeSidebar">
          <AppIcon name="x" class="size-5" />
        </button>
      </div>

      <nav class="flex flex-col gap-1 p-3">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition" :class="isActive(item.to)
            ? 'bg-white/15 text-white font-semibold'
            : 'text-blue-100 hover:bg-white/10 hover:text-white'">
          <AppIcon :name="item.icon" class="size-5 transition group-hover:scale-110" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="absolute inset-x-0 bottom-0 space-y-1 border-t border-white/20 p-3">
        <NuxtLink to="/"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white">
          <AppIcon name="home" class="size-5" />
          Về trang chủ
        </NuxtLink>
        <button type="button"
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-white/10 hover:text-red-600"
          @click="handleLogout">
          <AppIcon name="log-out" class="size-5" />
          Đăng xuất
        </button>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl lg:px-6 shadow-sm">
        <button type="button"
          class="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          @click="sidebarOpen = true">
          <AppIcon name="menu" class="size-5" />
        </button>

        <div class="ml-auto flex items-center gap-4">
          <div class="hidden items-center gap-2 text-sm text-slate-500 md:flex">
            <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Hệ thống hoạt động
          </div>
          <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <div
              class="grid size-8 place-items-center rounded-full bg-linear-to-br from-sky-400/20 to-cyan-600/10 text-sm font-black text-sky-700 ring-1 ring-[rgba(14,165,233,0.2)]">
              {{ displayInitial }}
            </div>
            <div class="hidden sm:block">
              <p class="text-sm font-bold text-slate-900">{{ displayName }}</p>
              <p class="text-xs capitalize text-slate-500">{{ user?.role || 'admin' }}</p>
            </div>
          </div>
        </div>
      </header>

      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>

    <Transition name="sidebar-fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" @click="closeSidebar" />
    </Transition>
  </div>
</template>


<style>
/* Non-scoped: MUST override Tailwind global styles from main.css */
.admin-light .admin-page {
  background-color: #f8fafc !important;
  color: #334155 !important;
}

.admin-light .admin-card,
.admin-light .admin-card-gradient {
  background-color: #ffffff !important;
  border-color: #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06) !important;
  color: #1e293b !important;
}

.admin-light .admin-input {
  background-color: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #334155 !important;
}

.admin-light .admin-input::placeholder {
  color: #94a3b8 !important;
}

.admin-light .admin-section-title {
  color: #0f172a !important;
}

.admin-light .admin-num {
  color: #0f172a !important;
}

.admin-light .admin-label {
  color: #64748b !important;
}

.admin-light .admin-btn-primary {
  background-color: #095DF1 !important;
  color: #fff !important;
}

.admin-light .admin-btn-secondary {
  background-color: #fff !important;
  border-color: #e2e8f0 !important;
  color: #475569 !important;
}

.admin-light .admin-btn-danger {
  background-color: #fef2f2 !important;
  color: #dc2626 !important;
}

.admin-light .admin-badge[class*="bg-yellow-400"] {
  background-color: rgba(14, 165, 233, 0.1) !important;
  color: #0284c7 !important;
}

.admin-light .admin-badge[class*="bg-emerald-400"] {
  background-color: rgba(16, 185, 129, 0.1) !important;
  color: #059669 !important;
}

.admin-light .admin-badge[class*="bg-slate-400"] {
  background-color: rgba(148, 163, 184, 0.1) !important;
  color: #64748b !important;
}

.admin-light .admin-badge[class*="bg-blue-400"] {
  background-color: rgba(59, 130, 246, 0.1) !important;
  color: #2563eb !important;
}

.admin-light .admin-badge[class*="bg-purple-400"] {
  background-color: rgba(168, 85, 247, 0.1) !important;
  color: #9333ea !important;
}

/* --- Contrast Fixes: Darken Faint Gray Text --- */
.admin-light h1,
.admin-light h2,
.admin-light h3,
.admin-light .admin-section-title,
.admin-light .admin-num,
.admin-light strong {
  color: #0f172a !important;
  /* Slate 900 - Darkest */
}

.admin-light .admin-label,
.admin-light .admin-section-subtitle,
.admin-light p {
  color: #334155 !important;
  /* Slate 700 - Medium Dark */
}

/* Override ALL gray text classes to make them darker */
.admin-light [class*="text-slate-400"],
.admin-light [class*="text-zinc-400"],
.admin-light [class*="text-slate-500"],
.admin-light [class*="text-zinc-500"] {
  color: #475569 !important;
  /* Force to Slate 600 */
}

.admin-light .text-red-400,
.admin-light .text-red-300 {
  color: #dc2626 !important;
  /* Red-600 */
}

.admin-light .text-emerald-400 {
  color: #059669 !important;
  /* Emerald-600 */
}

/* Input placeholder */
.admin-light input::placeholder,
.admin-light textarea::placeholder {
  color: #94a3b8 !important;
  /* Slate 400 - Visible but muted */
}
</style>

<style scoped>
.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}
</style>
