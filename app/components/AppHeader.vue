<script setup lang="ts">
import {
  Heart,
  History,
  Menu,
  Search,
  User,
  UserRound,
  X,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const mobileMenuOpen = ref(false)
const memberMenuOpen = ref(false)

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Duyệt phim', to: '/phim' },
  { label: 'Lịch chiếu', to: '/lich-chieu' },
  { label: 'Phim bộ', to: '/phim?type=series' },
  { label: 'Phim lẻ', to: '/phim?type=single' },
]

const memberMenuItems = [
  { label: 'Yêu thích', icon: Heart, to: '/yeu-thich' },
  { label: 'Lịch sử', icon: History, to: '/lich-su' },
]

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

function handleMemberClick() {
  memberMenuOpen.value = !memberMenuOpen.value
}

watch(() => route.path, () => {
  closeMobileMenu()
  memberMenuOpen.value = false
})
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/78 backdrop-blur-xl">
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

      <div class="group/member relative hidden shrink-0 items-center gap-2.5 md:flex"
        @mouseenter="memberMenuOpen = true" @mouseleave="memberMenuOpen = false">
        <button type="button"
          class="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white px-2.5 pl-1 text-xs font-black text-slate-950 shadow-xl shadow-black/20 transition hover:bg-yellow-100"
          aria-label="Tài khoản thành viên" @click="handleMemberClick">
          <User class="ml-1 size-4 fill-current" />
          <span>Thành viên</span>
        </button>

        <Transition name="member-menu">
          <div v-if="memberMenuOpen"
            class="absolute right-0 top-[calc(100%+0.75rem)] w-64 overflow-hidden rounded-lg border border-white/10 bg-[#101116] py-2 text-sm font-semibold text-slate-200 shadow-2xl shadow-black/40">
            <NuxtLink v-for="item in memberMenuItems" :key="item.label" :to="item.to"
              class="flex h-12 w-full cursor-pointer items-center gap-3 px-5 text-left transition hover:bg-white/8 hover:text-white">
              <component :is="item.icon" class="size-4 shrink-0" />
              {{ item.label }}
            </NuxtLink>
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
            <nav class="flex flex-col gap-1 p-4">
              <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
                class="rounded-lg px-4 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/8 hover:text-yellow-200"
                :class="isActive(item.to) ? 'bg-white/8 text-yellow-200' : ''" @click="closeMobileMenu">
                {{ item.label }}
              </NuxtLink>
            </nav>
            <div class="border-t border-white/10 p-4">
              <NuxtLink v-for="item in memberMenuItems" :key="item.label" :to="item.to"
                class="flex h-11 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/8 hover:text-white"
                @click="closeMobileMenu">
                <component :is="item.icon" class="size-4 shrink-0" />
                {{ item.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
