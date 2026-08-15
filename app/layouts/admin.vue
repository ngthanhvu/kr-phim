<script setup lang="ts">
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)

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

// Desktop: collapse/expand | Mobile: open/close drawer
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function closeMobileDrawer() {
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
  <div class="admin-layout admin-light min-h-screen bg-white">
    <!-- Sidebar -->
    <aside :class="[
      sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full',
    ]" class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col
         border-r border-slate-200 bg-white
         transition-[width,transform] duration-300 ease-in-out
         lg:translate-x-0
         border-l-4">
      <!-- Header row -->
      <div class="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <!-- Logo -->
        <NuxtLink to="/admin"
          class="flex items-center gap-3 overflow-hidden whitespace-nowrap transition-opacity duration-300"
          :class="sidebarCollapsed && !sidebarOpen ? 'opacity-0 pointer-events-none w-0' : ''">
          <AppIcon name="film" class="size-5 shrink-0 text-[#095DF2]" />
          <span class="text-lg font-black text-slate-900 tracking-tight">Admin Management</span>
        </NuxtLink>

        <!-- Close on mobile only -->
        <button v-if="sidebarOpen" type="button"
          class="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          @click="closeMobileDrawer">
          <AppIcon name="x" class="size-5" />
        </button>
      </div>

      <!-- Nav links -->
      <nav class="flex flex-col gap-1 p-3">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="group flex h-11 items-center rounded-xl text-sm font-semibold transition" :class="[
            isActive(item.to)
              ? 'bg-[#095DF2]/10 text-[#095DF2]'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',

            sidebarCollapsed
              ? 'justify-center'
              : 'px-4'
          ]">
          <AppIcon :name="item.icon" class="size-5 shrink-0" />

          <span v-if="!sidebarCollapsed" class="ml-3 whitespace-nowrap">
            {{ item.label }}
          </span>
        </NuxtLink>
      </nav>

      <!-- Bottom section -->
      <div class="mt-auto space-y-1 border-t border-slate-200 p-3">
        <NuxtLink to="/"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          :class="sidebarCollapsed ? 'justify-center px-2' : ''">
          <AppIcon name="home" class="size-5 shrink-0" />
          <span class="overflow-hidden whitespace-nowrap transition-opacity duration-300"
            :class="sidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : ''">Về trang chủ</span>
        </NuxtLink>
        <button type="button"
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
          :class="sidebarCollapsed ? 'justify-center px-2' : ''" @click="handleLogout">
          <AppIcon name="log-out" class="size-5 shrink-0" />
          <span class="overflow-hidden whitespace-nowrap transition-opacity duration-300"
            :class="sidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : ''">Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main content wrapper -->
    <div class="transition-all duration-300 ease-in-out" :class="sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'">
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl lg:px-6">
        <!-- Mobile menu -->
        <button type="button"
          class="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          @click="sidebarOpen = true">
          <AppIcon name="menu" class="size-5" />
        </button>

        <!-- Desktop collapse toggle -->
        <button type="button"
          class="hidden size-10 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:inline-grid"
          @click="toggleSidebar">
          <AppIcon v-if="sidebarCollapsed" name="chevron-right" class="size-4 transition-transform duration-300" />
          <AppIcon v-else name="chevron-left" class="size-4 transition-transform duration-300" />
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

    <!-- Mobile overlay backdrop -->
    <Transition name="sidebar-fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        @click="closeMobileDrawer" />
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
}

.admin-light .admin-label,
.admin-light .admin-section-subtitle,
.admin-light p {
  color: #334155 !important;
}

/* Override ALL gray text classes to make them darker */
.admin-light [class*="text-slate-400"],
.admin-light [class*="text-zinc-400"],
.admin-light [class*="text-slate-500"],
.admin-light [class*="text-zinc-500"] {
  color: #475569 !important;
}

.admin-light .text-red-400,
.admin-light .text-red-300 {
  color: #dc2626 !important;
}

.admin-light .text-emerald-400 {
  color: #059669 !important;
}

/* --- Table overrides for light mode --- */
.admin-light .admin-card table td[class*="text-white"],
.admin-light .admin-card table th[class*="text-white"],
.admin-light .admin-card tbody tr td[class*="text-white"],
.admin-light .admin-card tbody tr td[class*="text-black"] {
  color: #1e293b !important;
}

.admin-light .admin-card table tbody tr:hover {
  background-color: #f1f5f9 !important;
}

.admin-light input::placeholder,
.admin-light textarea::placeholder {
  color: #94a3b8 !important;
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
