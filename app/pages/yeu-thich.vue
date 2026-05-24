<script setup lang="ts">
import { Heart, UserRound } from 'lucide-vue-next'
import type { LibraryMovieItem } from '~/composables/useMovieLibrary'

const { user, loading: authLoading, initAuth } = useSupabaseAuth()
const { loadFavorites } = useMovieLibrary()
const favoriteItems = ref<LibraryMovieItem[]>([])
const loading = ref(true)

async function refreshFavorites() {
  loading.value = true
  favoriteItems.value = await loadFavorites(48)
  loading.value = false
}

function movieLink(item: LibraryMovieItem) {
  return {
    path: `/phim/${item.slug}`,
    query: {
      source: item.source,
    },
  }
}

onMounted(async () => {
  await initAuth()
  await refreshFavorites()
})

watch(user, () => {
  refreshFavorites()
})

useHead({
  title: 'Yêu thích - CineK',
  meta: [
    {
      name: 'description',
      content: 'Danh sách phim yêu thích của bạn trên CineK, giúp lưu lại các phim Hàn Quốc muốn xem hoặc xem lại nhanh hơn.',
    },
  ],
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <AppHeader />

    <section class="mx-auto max-w-390 px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32 xl:px-10">
      <div class="mb-6">
        <p class="text-sm font-black uppercase text-yellow-300">Thư viện</p>
        <h1 class="mt-2 text-3xl font-black sm:text-4xl">Yêu thích</h1>
      </div>

      <div v-if="loading || authLoading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div v-for="item in 12" :key="item" class="aspect-2/3 animate-pulse rounded-md bg-white/10" />
      </div>

      <div v-else-if="favoriteItems.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <NuxtLink v-for="item in favoriteItems" :key="`${item.source}-${item.slug}`" :to="movieLink(item)"
          class="group block min-w-0">
          <div
            class="relative aspect-2/3 overflow-hidden rounded-md bg-slate-900 shadow-xl shadow-black/25 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-yellow-300/60">
            <img v-if="item.thumb || item.poster" :src="item.thumb || item.poster" :alt="item.name"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
            <div v-else class="grid h-full w-full place-items-center bg-white/8">
              <Heart class="size-10 text-yellow-300" />
            </div>
            <span class="absolute left-2 top-2 rounded bg-yellow-400 px-2 py-1 text-xs font-black text-slate-950">
              Yêu thích
            </span>
          </div>
          <h2 class="mt-3 truncate text-sm font-black">{{ item.name }}</h2>
          <p class="mt-1 truncate text-xs font-semibold text-slate-400">{{ item.originName || item.source }}</p>
        </NuxtLink>
      </div>

      <div v-else-if="user"
        class="flex min-h-80 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/6 p-6 text-center">
        <Heart class="size-12 text-yellow-300" />
        <h2 class="mt-4 text-xl font-black">Chưa có phim yêu thích</h2>
        <p class="mt-2 max-w-md text-sm leading-6 text-slate-300">
          Bấm nút Yêu thích ở trang phim để lưu phim vào đây.
        </p>
        <NuxtLink to="/phim"
          class="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-yellow-300 px-5 text-sm font-black text-slate-950 transition hover:bg-white">
          Duyệt phim
        </NuxtLink>
      </div>

      <div v-else class="rounded-lg border border-white/10 bg-white/6 p-6">
        <UserRound class="size-10 text-yellow-300" />
        <h2 class="mt-4 text-xl font-black">Bạn chưa đăng nhập</h2>
        <p class="mt-2 text-sm leading-6 text-slate-300">
          Đăng nhập để đồng bộ danh sách yêu thích, hoặc vẫn có thể lưu tạm trên thiết bị này.
        </p>
      </div>
    </section>
  </main>
</template>
