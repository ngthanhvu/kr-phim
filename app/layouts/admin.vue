<script setup lang="ts">
import {
  Film,
  Home,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

const { data: user } = await useFetch('/api/auth/me', {
  headers: useRequestHeaders(['cookie']),
})

const navItems = [
  { label: 'Dashboard', icon: Home, to: '/admin' },
  { label: 'Phim', icon: Film, to: '/admin/phim' },
  { label: 'Thành viên', icon: Users, to: '/admin/thanh-vien' },
  { label: 'Cài đặt', icon: Settings, to: '/admin/cai-dat' },
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
  <div class="min-h-screen bg-slate-950">
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-slate-900 transition-transform lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'">
      <div class="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <NuxtLink to="/admin" class="flex items-center gap-2">
          <div class="grid size-8 place-items-center rounded-lg bg-yellow-400">
            <Film class="size-4 text-slate-950" />
          </div>
          <span class="text-lg font-black text-white">CineK Admin</span>
        </NuxtLink>
        <button type="button" class="grid size-8 place-items-center rounded-lg text-white hover:bg-white/10 lg:hidden"
          @click="closeSidebar">
          <X class="size-5" />
        </button>
      </div>

      <nav class="flex flex-col gap-1 p-4">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition"
          :class="isActive(item.to)
            ? 'bg-yellow-400/10 text-yellow-400'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'">
          <component :is="item.icon" class="size-5" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="absolute inset-x-0 bottom-0 space-y-1 border-t border-white/10 p-4">
        <NuxtLink to="/"
          class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
          <Home class="size-5" />
          Về trang chủ
        </NuxtLink>
        <button type="button"
          class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-400/10"
          @click="handleLogout">
          <LogOut class="size-5" />
          Đăng xuất
        </button>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-xl lg:px-6">
        <button type="button" class="grid size-10 place-items-center rounded-lg text-white hover:bg-white/10 lg:hidden"
          @click="sidebarOpen = true">
          <Menu class="size-5" />
        </button>

        <div class="ml-auto flex items-center gap-3">
          <div class="grid size-9 place-items-center rounded-full bg-yellow-400/10">
            <span class="text-sm font-black text-yellow-400">{{ displayInitial }}</span>
          </div>
          <div class="hidden sm:block">
            <p class="text-sm font-semibold text-white">{{ displayName }}</p>
            <p class="text-xs capitalize text-slate-400">{{ user?.role || 'admin' }}</p>
          </div>
        </div>
      </header>

      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>

    <Transition name="sidebar-fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        @click="closeSidebar" />
    </Transition>
  </div>
</template>

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
