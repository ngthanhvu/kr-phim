<script setup lang="ts">
const route = useRoute()
const selectedServer = ref(0)
const selectedEpisode = ref(0)

const { data: movie, pending, error } = await useFetch(`/api/movies/${route.params.slug}`, {
  query: {
    source: route.query.source,
  },
})

const servers = computed(() => movie.value?.servers ?? [])
const activeServer = computed(() => servers.value[selectedServer.value])
const activeEpisode = computed(() => activeServer.value?.episodes?.[selectedEpisode.value])
const playerUrl = computed(() => activeEpisode.value?.linkEmbed || activeEpisode.value?.linkM3u8 || '')
const episodeCount = computed(() => servers.value.reduce((total: number, server: any) => total + (server.episodes?.length || 0), 0))

watch(selectedServer, () => {
  selectedEpisode.value = 0
})

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
  <main class="min-h-screen bg-slate-950 text-white">
    <AppHeader />

    <div v-if="pending" class="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 pt-36 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8 lg:pt-28">
      <div class="aspect-video animate-pulse rounded-md bg-white/10" />
      <div class="h-96 animate-pulse rounded-md bg-white/10" />
    </div>

    <div v-else-if="error || !movie" class="mx-auto flex min-h-screen max-w-4xl items-center px-4 pt-36 lg:pt-24">
      <div>
        <h1 class="text-3xl font-black">Không mở được phim</h1>
        <p class="mt-3 text-slate-300">Nguồn phim có thể đang chặn request hoặc phim chưa có tập xem.</p>
      </div>
    </div>

    <template v-else>
      <section class="relative pt-32 lg:pt-16">
        <img :src="movie.poster || movie.thumb" :alt="movie.name" class="absolute inset-0 h-full w-full object-cover opacity-25">
        <div class="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950 to-slate-950" />

        <div class="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
          <div>
            <div class="overflow-hidden rounded-md bg-black shadow-2xl shadow-sky-950/40 ring-1 ring-white/10">
              <div class="aspect-video">
                <iframe
                  v-if="playerUrl"
                  :src="playerUrl"
                  :title="`${movie.name} - ${activeEpisode?.name || 'Tập phim'}`"
                  class="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
                <div v-else class="flex h-full items-center justify-center bg-slate-900 px-6 text-center text-slate-300">
                  Phim này chưa có link xem khả dụng từ API.
                </div>
              </div>
            </div>

            <div class="mt-8">
              <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-300">{{ movie.source }} · {{ movie.lang || 'Vietsub' }}</p>
              <h1 class="text-3xl font-black leading-tight sm:text-5xl">{{ movie.name }}</h1>
              <p v-if="movie.originName" class="mt-2 text-lg text-slate-300">{{ movie.originName }}</p>

              <div class="mt-5 flex flex-wrap gap-2 text-sm text-slate-100">
                <span v-if="movie.year" class="rounded-full bg-white/10 px-3 py-1">{{ movie.year }}</span>
                <span v-if="movie.quality" class="rounded-full bg-white/10 px-3 py-1">{{ movie.quality }}</span>
                <span v-if="movie.episode" class="rounded-full bg-sky-400/20 px-3 py-1 text-sky-100">{{ movie.episode }}</span>
                <span v-if="movie.time" class="rounded-full bg-white/10 px-3 py-1">{{ movie.time }}</span>
              </div>

              <p v-if="movie.content" class="mt-6 max-w-4xl text-base leading-8 text-slate-200">
                {{ movie.content }}
              </p>

              <div class="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <p v-if="movie.categories?.length"><span class="font-bold text-white">Thể loại:</span> {{ movie.categories.join(', ') }}</p>
                <p v-if="movie.countries?.length"><span class="font-bold text-white">Quốc gia:</span> {{ movie.countries.join(', ') }}</p>
                <p v-if="movie.actors?.length"><span class="font-bold text-white">Diễn viên:</span> {{ movie.actors.slice(0, 8).join(', ') }}</p>
                <p v-if="movie.directors?.length"><span class="font-bold text-white">Đạo diễn:</span> {{ movie.directors.join(', ') }}</p>
              </div>
            </div>
          </div>

          <aside class="lg:sticky lg:top-24 lg:self-start">
            <div class="rounded-md border border-white/10 bg-white/8 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-xl font-extrabold">Danh sách tập</h2>
                <span class="text-sm text-slate-300">{{ episodeCount }} tập</span>
              </div>

              <div v-if="servers.length > 1" class="mt-4 flex gap-2 overflow-x-auto pb-2">
                <button
                  v-for="(server, index) in servers"
                  :key="server.name"
                  type="button"
                  class="shrink-0 rounded-md px-3 py-2 text-sm font-semibold"
                  :class="selectedServer === index ? 'bg-sky-300 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'"
                  @click="selectedServer = index"
                >
                  {{ server.name }}
                </button>
              </div>

              <div v-if="activeServer?.episodes?.length" class="mt-4 grid max-h-[32rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-3">
                <button
                  v-for="(episode, index) in activeServer.episodes"
                  :key="`${episode.name}-${index}`"
                  type="button"
                  class="min-h-11 rounded-md px-3 py-2 text-sm font-bold transition"
                  :class="selectedEpisode === index ? 'bg-sky-300 text-slate-950' : 'bg-slate-900/80 text-slate-100 hover:bg-sky-400/20'"
                  @click="selectedEpisode = index"
                >
                  {{ episode.name }}
                </button>
              </div>

              <p v-else class="mt-4 rounded-md border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                Chưa có tập xem từ nguồn này.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </template>
  </main>
</template>
