<script setup lang="ts">
import { apiFetch } from '~/utils/api'
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)

const { data: user } = await useFetch('/api/auth/me', {
  headers: useRequestHeaders(['cookie']),
  _bypassCredentials: true,
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

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function closeMobileDrawer() {
  sidebarOpen.value = false
}

async function handleLogout() {
  await apiFetch('/api/auth/logout', { method: 'POST' })
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth_token')
  }
  await navigateTo('/admin/login')
}

const displayName = computed(() => user.value?.name || user.value?.email?.split('@')[0] || 'Admin')
const displayInitial = computed(() => displayName.value.charAt(0).toUpperCase())
</script>

<template>
  <div class="min-h-screen bg-zinc-50">
    <!-- Sidebar -->
    <aside :class="[
      sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full',
    ]" class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white transition-[width] duration-300 ease-in-out lg:translate-x-0">
      <!-- Header -->
      <div class="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
        <NuxtLink to="/admin"
          class="flex items-center gap-3 overflow-hidden whitespace-nowrap transition-opacity duration-300"
          :class="sidebarCollapsed && !sidebarOpen ? 'opacity-0 pointer-events-none w-0' : ''">
          <AppIcon name="film" class="size-5 shrink-0 text-zinc-900" />
          <span class="text-lg font-bold tracking-tight text-zinc-900">Admin</span>
        </NuxtLink>
        <button v-if="sidebarOpen" type="button"
          class="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          @click="closeMobileDrawer">
          <AppIcon name="x" class="size-5" />
        </button>
      </div>

      <!-- Nav links -->
      <nav class="flex flex-col gap-1 p-3">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="group flex h-10 items-center rounded-lg text-sm font-medium transition" :class="[
            isActive(item.to)
              ? 'bg-zinc-100 text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
            sidebarCollapsed ? 'justify-center' : 'px-3'
          ]">
          <AppIcon :name="item.icon" class="size-5 shrink-0" />
          <span v-if="!sidebarCollapsed" class="ml-3 whitespace-nowrap">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Bottom section -->
      <div class="mt-auto space-y-1 border-t border-zinc-200 p-3">
        <NuxtLink to="/"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
          :class="sidebarCollapsed ? 'justify-center px-2' : ''">
          <AppIcon name="home" class="size-5 shrink-0" />
          <span class="overflow-hidden whitespace-nowrap transition-opacity duration-300"
            :class="sidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : ''">Về trang chủ</span>
        </NuxtLink>
        <button type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
          :class="sidebarCollapsed ? 'justify-center px-2' : ''" @click="handleLogout">
          <AppIcon name="log-out" class="size-5 shrink-0" />
          <span class="overflow-hidden whitespace-nowrap transition-opacity duration-300"
            :class="sidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : ''">Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="transition-all duration-300 ease-in-out" :class="sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'">
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-xl lg:px-6">
        <!-- Mobile menu button -->
        <button type="button"
          class="grid size-10 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 lg:hidden"
          @click="sidebarOpen = true">
          <AppIcon name="menu" class="size-5" />
        </button>

        <!-- Desktop collapse toggle -->
        <button type="button"
          class="hidden size-10 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 lg:inline-grid"
          @click="toggleSidebar">
          <AppIcon v-if="sidebarCollapsed" name="chevron-right" class="size-4 transition-transform duration-300" />
          <AppIcon v-else name="chevron-left" class="size-4 transition-transform duration-300" />
        </button>

        <div class="ml-auto flex items-center gap-4">
          <div class="hidden items-center gap-2 text-sm text-zinc-500 md:flex">
            <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Hệ thống hoạt động
          </div>
          <div class="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5">
            <div class="grid size-8 place-items-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-700">
              {{ displayInitial }}
            </div>
            <div class="hidden sm:block">
              <p class="text-sm font-semibold text-zinc-900">{{ displayName }}</p>
              <p class="text-xs capitalize text-zinc-500">{{ user?.role || 'admin' }}</p>
            </div>
          </div>
        </div>
      </header>

      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>

    <!-- Mobile overlay -->
    <Transition name="sidebar-fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        @click="closeMobileDrawer" />
    </Transition>
  </div>
</template>

<style scoped>
.sidebar-fade-enter-active, .sidebar-fade-leave-active { transition: opacity 0.2s ease; }
.sidebar-fade-enter-from, .sidebar-fade-leave-to { opacity: 0; }
</style>
