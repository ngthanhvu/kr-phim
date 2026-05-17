<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Duyệt phim', to: '/phim' },
  { label: 'Phim bộ', to: '/phim?type=series' },
  { label: 'Phim lẻ', to: '/phim?type=single' },
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
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/78 backdrop-blur-xl">
    <nav class="mx-auto grid max-w-[1560px] grid-cols-[auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:px-8 xl:px-10">
      <AppLogo />

      <div class="no-scrollbar order-3 col-span-2 flex items-center justify-center gap-4 overflow-x-auto text-sm font-semibold text-slate-200 lg:order-none lg:col-span-1 lg:gap-7">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="shrink-0 transition hover:text-sky-200"
          :class="isActive(item.to) ? 'text-sky-200' : 'text-slate-200'"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <form
        class="ml-auto flex w-full max-w-xs items-center rounded-full border border-white/10 bg-white/8 px-4 py-2 shadow-2xl shadow-sky-950/20 sm:max-w-sm"
        @submit.prevent="submitSearch"
      >
        <Search class="mr-3 size-4 shrink-0 text-sky-200" />
        <input
          v-model="keyword"
          type="search"
          placeholder="Tìm phim Hàn Quốc..."
          class="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
        >
      </form>
    </nav>
  </header>
</template>
