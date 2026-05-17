<script setup lang="ts">
import { Heart, Play, Plus, Share2, Star } from 'lucide-vue-next'

const route = useRoute()
const selectedServer = ref(0)

const { data: movie, pending, error } = await useFetch(`/api/movies/${route.params.slug}`, {
  query: {
    source: route.query.source,
  },
})

const servers = computed(() => movie.value?.servers ?? [])
const activeServer = computed(() => servers.value[selectedServer.value])
const firstWatchLink = computed(() => ({
  path: `/xem/${route.params.slug}`,
  query: {
    source: route.query.source,
    server: selectedServer.value,
    ep: 1,
  },
}))
const episodeCount = computed(() => servers.value.reduce((total: number, server: any) => total + (server.episodes?.length || 0), 0))

function episodeLink(index: number) {
  return {
    path: `/xem/${route.params.slug}`,
    query: {
      source: route.query.source,
      server: selectedServer.value,
      ep: index + 1,
    },
  }
}

useHead(() => ({
  title: movie.value ? `${movie.value.name} - KR Phim` : 'Đang tải phim - KR Phim',
  meta: [
    {
      name: 'description',
      content: movie.value?.content || 'Xem phim Hàn Quốc Vietsub.',
    },
  ],
}))
</script>

<template>
  <main class="min-h-screen bg-[#08090d] text-white">
    <AppHeader />

    <div v-if="pending" class="mx-auto grid min-h-screen max-w-[1560px] gap-6 px-4 pt-36 sm:px-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:px-8 lg:pt-40 xl:px-10">
      <div class="h-[36rem] animate-pulse rounded-md bg-white/10" />
      <div class="h-80 animate-pulse rounded-md bg-white/10" />
    </div>

    <div v-else-if="error || !movie" class="mx-auto flex min-h-screen max-w-4xl items-center px-4 pt-36 lg:pt-24">
      <div>
        <h1 class="text-3xl font-black">Không mở được phim</h1>
        <p class="mt-3 text-slate-300">Nguồn phim có thể đang chặn request hoặc phim chưa có tập xem.</p>
      </div>
    </div>

    <template v-else>
      <section class="relative overflow-hidden pt-32 lg:pt-16">
        <div class="absolute inset-x-0 top-0 h-[28rem] overflow-hidden">
          <img :src="movie.poster || movie.thumb" :alt="movie.name" class="h-full w-full object-cover opacity-45">
          <div class="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-[#08090d]/80 to-[#08090d]" />
          <div class="absolute inset-0 bg-gradient-to-r from-[#08090d] via-transparent to-[#08090d]" />
        </div>

        <div class="relative mx-auto grid max-w-[1560px] gap-6 px-4 py-20 sm:px-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:px-8 xl:px-10">
          <aside class="rounded-md border border-white/10 bg-[#15161b]/95 p-5 shadow-2xl shadow-black/40">
            <img :src="movie.thumb || movie.poster" :alt="movie.name" class="mx-auto aspect-[2/3] w-48 rounded-md object-cover shadow-xl shadow-black/40">

            <h1 class="mt-5 text-2xl font-black leading-tight">{{ movie.name }}</h1>
            <p v-if="movie.originName" class="mt-1 text-sm font-bold text-sky-200">{{ movie.originName }}</p>

            <div class="mt-4 flex flex-wrap gap-2 text-xs font-black">
              <span v-if="movie.quality" class="rounded bg-white/12 px-2 py-1">{{ movie.quality }}</span>
              <span v-if="movie.episode" class="rounded bg-white/12 px-2 py-1">{{ movie.episode }}</span>
              <span v-if="movie.time" class="rounded bg-white/12 px-2 py-1">{{ movie.time }}</span>
              <span v-if="movie.rating" class="inline-flex items-center gap-1 rounded bg-white/12 px-2 py-1">
                <Star class="size-3 fill-sky-300 text-sky-300" />
                {{ movie.rating.toFixed(1) }}
              </span>
            </div>

            <div v-if="movie.categories?.length" class="mt-4">
              <span class="rounded bg-white/12 px-3 py-1 text-xs font-bold">{{ movie.categories[0] }}</span>
            </div>

            <div class="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              <p v-if="movie.content">
                <span class="block font-black text-white">Giới thiệu:</span>
                {{ movie.content }}
              </p>
              <p><span class="font-black text-white">Số tập:</span> {{ episodeCount || movie.episode || 'Đang cập nhật' }}</p>
              <p v-if="movie.countries?.length"><span class="font-black text-white">Quốc gia:</span> {{ movie.countries.join(', ') }}</p>
              <p v-if="movie.actors?.length"><span class="font-black text-white">Diễn viên:</span> {{ movie.actors.slice(0, 6).join(', ') }}</p>
            </div>
          </aside>

          <section class="rounded-md border border-white/10 bg-[#15161b]/95 p-5 shadow-2xl shadow-black/40">
            <div class="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex flex-wrap gap-3">
                <NuxtLink
                  :to="firstWatchLink"
                  class="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sky-400 px-7 text-sm font-black text-slate-950 transition hover:bg-white"
                >
                  <Play class="size-4 fill-current" />
                  Xem ngay
                </NuxtLink>
                <button type="button" class="grid h-12 w-14 place-items-center rounded-full text-sm font-bold text-white transition hover:bg-white/10" aria-label="Yêu thích">
                  <Heart class="size-5" />
                </button>
                <button type="button" class="grid h-12 w-14 place-items-center rounded-full text-sm font-bold text-white transition hover:bg-white/10" aria-label="Thêm vào">
                  <Plus class="size-5" />
                </button>
                <button type="button" class="grid h-12 w-14 place-items-center rounded-full text-sm font-bold text-white transition hover:bg-white/10" aria-label="Chia sẻ">
                  <Share2 class="size-5" />
                </button>
              </div>

              <div v-if="movie.rating" class="inline-flex items-center gap-3 rounded-full bg-white/8 px-4 py-2 text-sm font-bold text-slate-200">
                <span class="rounded bg-sky-300 px-2 py-1 text-xs font-black text-slate-950">IMDb</span>
                <span>{{ movie.rating.toFixed(1) }}</span>
                <span class="text-slate-400">Đánh giá</span>
              </div>
            </div>

            <div class="flex gap-6 border-b border-white/10 pt-5 text-sm font-black">
              <button type="button" class="border-b-2 border-sky-300 pb-4 text-sky-200">Tập phim</button>
              <button type="button" class="pb-4 text-slate-300">Diễn viên</button>
            </div>

            <div class="pt-7">
              <h2 class="text-xl font-black">Danh sách tập</h2>

              <div v-if="servers.length > 1" class="mt-4 flex gap-2 overflow-x-auto pb-2">
                <button
                  v-for="(server, index) in servers"
                  :key="server.name"
                  type="button"
                  class="shrink-0 rounded px-4 py-2 text-sm font-black"
                  :class="selectedServer === index ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'"
                  @click="selectedServer = index"
                >
                  {{ server.name }}
                </button>
              </div>

              <div v-if="activeServer?.episodes?.length" class="mt-3 grid gap-2 rounded-md border border-white/10 p-3 sm:grid-cols-3 lg:grid-cols-6">
                <NuxtLink
                  v-for="(episode, index) in activeServer.episodes"
                  :key="`${episode.name}-${index}`"
                  :to="episodeLink(index)"
                  class="rounded-md bg-white/10 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-sky-400 hover:text-slate-950"
                >
                  {{ episode.name }}
                </NuxtLink>
              </div>

              <p v-else class="mt-4 rounded-md border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                Chưa có tập xem từ nguồn này.
              </p>
            </div>
          </section>
        </div>
      </section>
    </template>
  </main>
</template>
