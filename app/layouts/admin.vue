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
  <div class="min-h-screen bg-[#0A0B0E]">
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/[0.06] bg-[#0E0F13] transition-transform lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'">
      <div class="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
        <NuxtLink to="/admin" class="flex items-center gap-3">
          <div class="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-400/20">
            <AppIcon name="film" class="size-4 text-slate-950" />
          </div>
          <span class="text-lg font-black text-white">CineK Admin</span>
        </NuxtLink>
        <button type="button" class="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.05] hover:text-white lg:hidden"
          @click="closeSidebar">
          <AppIcon name="x" class="size-5" />
        </button>
      </div>

      <nav class="flex flex-col gap-1 p-3">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
          :class="isActive(item.to)
            ? 'bg-yellow-400/10 text-yellow-400'
            : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'">
          <span v-if="isActive(item.to)" class="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-yellow-400" />
          <AppIcon :name="item.icon" class="size-5 transition group-hover:scale-110" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="absolute inset-x-0 bottom-0 space-y-1 border-t border-white/[0.06] p-3">
        <NuxtLink to="/"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.03] hover:text-white">
          <AppIcon name="home" class="size-5" />
          Về trang chủ
        </NuxtLink>
        <button type="button"
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          @click="handleLogout">
          <AppIcon name="log-out" class="size-5" />
          Đăng xuất
        </button>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] bg-[#0A0B0E]/80 px-4 backdrop-blur-xl lg:px-6">
        <button type="button" class="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.05] hover:text-white lg:hidden"
          @click="sidebarOpen = true">
          <AppIcon name="menu" class="size-5" />
        </button>

        <div class="ml-auto flex items-center gap-4">
          <div class="hidden items-center gap-2 text-sm text-slate-400 md:flex">
            <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50" />
            Hệ thống hoạt động
          </div>
          <div class="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#131418] px-3 py-1.5">
            <div class="grid size-8 place-items-center rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 text-sm font-black text-yellow-400 ring-1 ring-yellow-400/20">
              {{ displayInitial }}
            </div>
            <div class="hidden sm:block">
              <p class="text-sm font-bold text-white">{{ displayName }}</p>
              <p class="text-xs capitalize text-slate-400">{{ user?.role || 'admin' }}</p>
            </div>
          </div>
        </div>
      </header>

      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>

    <Transition name="sidebar-fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
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
