<script setup lang="ts">
import {
  Heart,
  History,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const mobileMenuOpen = ref(false)
const memberMenuOpen = ref(false)
const authModalOpen = ref(false)

const { user, fetchUser, logout: doLogout } = useAuth()
await fetchUser()

const displayName = computed(() => {
  if (!user.value) return ''
  return user.value.name || user.value.email?.split('@')[0] || 'Thành viên'
})

const displayInitial = computed(() => displayName.value.charAt(0).toUpperCase())

const avatarUrl = computed(() => {
  if (user.value?.avatar) return user.value.avatar
  return null
})

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Duyệt phim', to: '/phim' },
  { label: 'Lịch chiếu', to: '/lich-chieu' },
  { label: 'Phim bộ', to: '/phim?type=series' },
  { label: 'Phim lẻ', to: '/phim?type=single' },
]

const memberMenuItems = computed(() => {
  const items = [
    { label: 'Trang cá nhân', icon: User, to: '/thanh-vien' },
    { label: 'Yêu thích', icon: Heart, to: '/yeu-thich' },
    { label: 'Lịch sử', icon: History, to: '/lich-su' },
  ]
  if (user.value?.role === 'admin') {
    items.push({ label: 'Trang quản trị', icon: Settings, to: '/admin' })
  }
  return items
})

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.fullPath === to || route.path === to.split('?')[0] && route.fullPath.includes(to.split('?')[1] || '')
}

function submitSearch() {
  const q = keyword.value.trim()
  router.push({
    path: '/phim',
    query: q ? { q } : undefined,
  })
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function openAuthModal() {
  authModalOpen.value = true
}

function handleMemberClick() {
  if (!user.value) {
    openAuthModal()
    return
  }
  memberMenuOpen.value = !memberMenuOpen.value
}

async function handleLogout() {
  await doLogout()
  memberMenuOpen.value = false
  router.push('/')
}

watch(() => route.path, () => {
  closeMobileMenu()
  memberMenuOpen.value = false
})
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 bg-linear-to-b from-black/80 via-black/40 to-transparent">
    <nav class="mx-auto flex max-w-390 items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 xl:px-10">
      <AppLogo />

      <div class="hidden lg:flex lg:items-center lg:gap-7 lg:text-sm lg:font-semibold lg:text-slate-200">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="shrink-0 transition hover:text-yellow-200"
          :class="isActive(item.to) ? 'text-yellow-200' : 'text-slate-200'">
          {{ item.label }}
        </NuxtLink>
      </div>

      <form
        class="ml-auto flex w-full max-w-xs items-center rounded-full border border-white/10 bg-white/8 px-4 py-2 shadow-2xl shadow-yellow-950/20 sm:max-w-sm"
        @submit.prevent="submitSearch">
        <Search class="mr-3 size-4 shrink-0 text-yellow-200" />
        <input v-model="keyword" type="search" placeholder="Tìm phim Hàn Quốc..."
          class="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400">
      </form>

      <div class="group/member relative hidden shrink-0 items-center gap-2.5 md:flex">
        <button type="button"
          class="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#F2F4F7] px-4 text-sm font-semibold text-[#1c1c1c] shadow-sm transition hover:bg-white hover:shadow-md"
          aria-label="Tài khoản thành viên" @click="handleMemberClick">
          <template v-if="user">
            <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" class="size-7 rounded-full object-cover ring-2 ring-[#FFD166]/20">
            <span v-else
              class="grid size-7 place-items-center rounded-full bg-[#FFD166]/20 text-xs font-bold text-[#FFD166]">
              {{ displayInitial }}
            </span>
            <span class="max-w-24 truncate">{{ displayName }}</span>
          </template>
          <template v-else>
            <svg class="size-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span>Thành viên</span>
          </template>
        </button>

        <Transition name="member-menu">
          <div v-if="user && memberMenuOpen"
            class="absolute right-0 top-[calc(100%+0.5rem)] w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a]/95 py-2 text-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div class="border-b border-white/[0.06] px-4 py-3">
              <div class="flex items-center gap-2.5">
                <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" class="size-8 rounded-full object-cover ring-2 ring-[#FFD166]/20">
                <div v-else class="grid size-8 shrink-0 place-items-center rounded-full bg-[#FFD166]/10">
                  <span class="text-xs font-bold text-[#FFD166]">{{ displayInitial }}</span>
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-white">{{ displayName }}</p>
                  <p class="truncate text-xs text-white/40">{{ user.email }}</p>
                </div>
              </div>
            </div>
            <NuxtLink v-for="item in memberMenuItems" :key="item.label" :to="item.to"
              class="flex h-10 w-full cursor-pointer items-center gap-2.5 px-4 transition hover:bg-white/[0.04] hover:text-white">
              <component :is="item.icon" class="size-4 shrink-0 text-white/50" />
              <span class="text-[13px] font-medium text-white/70">{{ item.label }}</span>
            </NuxtLink>
            <div class="my-1.5 border-t border-white/[0.06]" />
            <button type="button"
              class="flex h-10 w-full cursor-pointer items-center gap-2.5 px-4 text-[13px] font-medium text-red-400/70 transition hover:bg-red-400/8 hover:text-red-400"
              @click="handleLogout">
              <LogOut class="size-4 shrink-0" />
              Đăng xuất
            </button>
          </div>
        </Transition>
      </div>

      <button type="button"
        class="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/10 bg-white/8 text-white transition hover:bg-white/16 lg:hidden"
        aria-label="Mở menu" @click="mobileMenuOpen = true">
        <Menu class="size-5" />
      </button>
    </nav>

    <Teleport to="body">
      <Transition name="sidebar">
        <div v-if="mobileMenuOpen" class="fixed inset-0 z-60 lg:hidden">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeMobileMenu" />
          <div class="absolute inset-y-0 left-0 w-72 bg-slate-950 shadow-2xl">
            <div class="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <AppLogo />
              <button type="button"
                class="grid size-10 cursor-pointer place-items-center rounded-lg border border-white/10 bg-white/8 text-white transition hover:bg-white/16"
                aria-label="Đóng menu" @click="closeMobileMenu">
                <X class="size-5" />
              </button>
            </div>

            <div v-if="user" class="flex items-center gap-3 border-b border-white/10 px-4 py-4">
              <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" class="size-9 rounded-full object-cover ring-2 ring-[#FFD166]/20">
              <span v-else
                class="grid size-9 place-items-center rounded-full bg-yellow-400/10 text-sm font-black text-yellow-400">
                {{ displayInitial }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-white">{{ displayName }}</p>
                <p class="truncate text-xs text-slate-400">{{ user.email }}</p>
              </div>
            </div>

            <nav class="flex flex-col gap-1 p-4">
              <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
                class="rounded-lg px-4 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/8 hover:text-yellow-200"
                :class="isActive(item.to) ? 'bg-white/8 text-yellow-200' : ''" @click="closeMobileMenu">
                {{ item.label }}
              </NuxtLink>
            </nav>
            <div class="border-t border-white/10 p-4">
              <template v-if="user">
                <NuxtLink v-for="item in memberMenuItems" :key="item.label" :to="item.to"
                  class="flex h-11 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/8 hover:text-white"
                  @click="closeMobileMenu">
                  <component :is="item.icon" class="size-4 shrink-0" />
                  {{ item.label }}
                </NuxtLink>
                <div class="my-2 border-t border-white/10" />
                <button type="button"
                  class="flex h-11 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-black text-red-400 transition hover:bg-white/8 hover:text-red-300"
                  @click="handleLogout">
                  <LogOut class="size-4 shrink-0" />
                  Đăng xuất
                </button>
              </template>
              <template v-else>
                <button type="button"
                  class="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-yellow-400 px-4 text-sm font-black text-slate-950 transition hover:bg-yellow-300"
                  @click="closeMobileMenu(); openAuthModal()">
                  Đăng nhập
                </button>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <AuthModal v-model="authModalOpen" />
  </header>
</template>

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.2s ease;
}

.sidebar-enter-active>div:last-child,
.sidebar-leave-active>div:last-child {
  transition: transform 0.2s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}

.sidebar-enter-from>div:last-child,
.sidebar-leave-to>div:last-child {
  transform: translateX(-100%);
}

.member-menu-enter-active,
.member-menu-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.member-menu-enter-from,
.member-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem);
}
</style>
