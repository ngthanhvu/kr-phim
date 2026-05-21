<script setup lang="ts">
import { Clock3, Trash2 } from 'lucide-vue-next'
import type { WatchHistoryItem } from '~/composables/useWatchHistory'

const { initAuth } = useSupabaseAuth()
const { loadWatchHistory, clearWatchHistory } = useWatchHistory()
const historyItems = ref<WatchHistoryItem[]>([])
const loading = ref(true)

async function refreshHistory() {
  loading.value = true
  historyItems.value = await loadWatchHistory(30)
  loading.value = false
}

function watchHistoryLink(item: WatchHistoryItem) {
  return {
    path: `/xem/${item.slug}`,
    query: {
      source: item.source,
      server: item.serverIndex || 0,
      ep: (item.episodeIndex || 0) + 1,
    },
  }
}

async function removeHistory() {
  await clearWatchHistory()
  historyItems.value = []
}

onMounted(async () => {
  await initAuth()
  await refreshHistory()
})

useHead({
  title: 'Lịch sử xem - KR Phim',
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <AppHeader />

    <section class="mx-auto max-w-390 px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32 xl:px-10">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-black uppercase text-sky-300">Thành viên</p>
          <h1 class="mt-2 text-3xl font-black sm:text-4xl">Lịch sử xem</h1>
        </div>
        <button v-if="historyItems.length" type="button"
          class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-white/8 px-4 text-sm font-black text-white transition hover:bg-white/14"
          @click="removeHistory">
          <Trash2 class="size-4" />
          Xóa lịch sử
        </button>
      </div>

      <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div v-for="item in 12" :key="item" class="aspect-2/3 animate-pulse rounded-md bg-white/10" />
      </div>

      <div v-else-if="historyItems.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <NuxtLink v-for="item in historyItems" :key="`${item.source}-${item.slug}`" :to="watchHistoryLink(item)"
          class="group block min-w-0">
          <div
            class="relative aspect-2/3 overflow-hidden rounded-md bg-slate-900 shadow-xl shadow-black/25 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-sky-300/60">
            <img v-if="item.thumb || item.poster" :src="item.thumb || item.poster" :alt="item.name"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
            <div v-else class="grid h-full w-full place-items-center bg-white/8">
              <Clock3 class="size-10 text-sky-300" />
            </div>
            <div class="absolute inset-x-0 bottom-0 h-1 bg-white/18">
              <span class="block h-full w-1/3 bg-sky-300" />
            </div>
            <span class="absolute left-2 top-2 rounded bg-sky-400 px-2 py-1 text-xs font-black text-slate-950">
              {{ item.episodeName || `Tập ${(item.episodeIndex || 0) + 1}` }}
            </span>
          </div>
          <h2 class="mt-3 truncate text-sm font-black">{{ item.name }}</h2>
          <p class="mt-1 truncate text-xs font-semibold text-slate-400">
            {{ item.episodeName || `Tập ${(item.episodeIndex || 0) + 1}` }}
          </p>
        </NuxtLink>
      </div>

      <div v-else
        class="flex min-h-80 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/6 p-6 text-center">
        <Clock3 class="size-12 text-sky-300" />
        <h2 class="mt-4 text-xl font-black">Chưa có lịch sử xem</h2>
        <p class="mt-2 max-w-md text-sm leading-6 text-slate-300">
          Phim bạn đã xem sẽ xuất hiện ở đây để bạn có thể xem tiếp nhanh hơn.
        </p>
        <NuxtLink to="/phim"
          class="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-sky-300 px-5 text-sm font-black text-slate-950 transition hover:bg-white">
          Duyệt phim
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
