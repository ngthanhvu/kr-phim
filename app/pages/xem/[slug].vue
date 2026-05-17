<script setup lang="ts">
import { Heart, Play, Plus, Share2, Star } from 'lucide-vue-next'

const route = useRoute()
const selectedServer = ref(Math.max(Number(route.query.server || 0), 0))
const selectedEpisode = ref(Math.max(Number(route.query.ep || 1) - 1, 0))
const hasStarted = ref(false)

const { data: movie, pending, error } = await useFetch(`/api/movies/${route.params.slug}`, {
  query: {
    source: route.query.source,
  },
})

const servers = computed(() => movie.value?.servers ?? [])
const activeServer = computed(() => servers.value[selectedServer.value] ?? servers.value[0])
const activeEpisode = computed(() => activeServer.value?.episodes?.[selectedEpisode.value] ?? activeServer.value?.episodes?.[0])
const playerUrl = computed(() => activeEpisode.value?.linkEmbed || activeEpisode.value?.linkM3u8 || '')

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

function selectServer(index: number) {
  selectedServer.value = index
  selectedEpisode.value = 0
  hasStarted.value = false
}

function startPlayer() {
  hasStarted.value = true
}

watch(() => route.query, () => {
  selectedServer.value = Math.max(Number(route.query.server || 0), 0)
  selectedEpisode.value = Math.max(Number(route.query.ep || 1) - 1, 0)
  hasStarted.value = false
})

useHead(() => ({
  title: movie.value ? `Xem ${movie.value.name} - ${activeEpisode.value?.name || 'Tập 1'} - KR Phim` : 'Đang tải phim - KR Phim',
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

    <div v-if="pending" class="mx-auto min-h-screen max-w-390 px-4 pt-36 sm:px-6 lg:px-8 lg:pt-28 xl:px-10">
      <div class="aspect-video animate-pulse rounded-md bg-white/10" />
    </div>

    <div v-else-if="error || !movie" class="mx-auto flex min-h-screen max-w-4xl items-center px-4 pt-36 lg:pt-24">
      <div>
        <h1 class="text-3xl font-black">Không mở được phim</h1>
        <p class="mt-3 text-slate-300">Nguồn phim có thể đang chặn request hoặc phim chưa có tập xem.</p>
      </div>
    </div>

    <template v-else>
      <section class="mx-auto max-w-390 px-3 pb-16 pt-24 sm:px-6 sm:pt-36 lg:px-8 lg:pt-28 xl:px-10">
        <NuxtLink :to="{ path: `/phim/${route.params.slug}`, query: { source: route.query.source } }"
          class="text-sm font-bold text-slate-100 hover:text-sky-200">
          ‹ Chi tiết phim
        </NuxtLink>

        <div class="mt-4 overflow-hidden rounded-md border border-white/10 bg-black shadow-2xl shadow-black/40">
          <div class="relative aspect-video bg-slate-950">
            <iframe v-if="playerUrl && hasStarted" :src="playerUrl"
              :title="`${movie.name} - ${activeEpisode?.name || 'Tập phim'}`" class="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen />
            <button v-else type="button" class="absolute inset-0 text-white" :aria-label="`Phát ${movie.name}`"
              @click="startPlayer">
              <img :src="movie.poster || movie.thumb" :alt="movie.name" class="h-full w-full object-cover opacity-45">
              <div class="absolute inset-0 bg-black/45" />
              <div class="absolute inset-0 grid place-items-center">
                <span
                  class="grid size-16 place-items-center rounded-full bg-sky-400 text-slate-950 shadow-xl shadow-sky-950/30">
                  <Play class="size-7 fill-current" />
                </span>
              </div>
            </button>
          </div>

          <div
            class="flex items-center justify-center gap-7 border-t border-white/10 px-4 py-4 text-xs font-bold text-slate-100 sm:justify-start sm:gap-4 sm:py-3">
            <button type="button" class="inline-flex items-center gap-2 hover:text-sky-200">
              <Heart class="size-4 sm:size-3" /> Yêu thích
            </button>
            <button type="button" class="inline-flex items-center gap-2 hover:text-sky-200">
              <Plus class="size-4 sm:size-3" /> Thêm vào
            </button>
            <button type="button" class="inline-flex items-center gap-2 hover:text-sky-200">
              <Share2 class="size-4 sm:size-3" /> Chia sẻ
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section>
            <div class="flex gap-4">
              <img :src="movie.thumb || movie.poster" :alt="movie.name"
                class="hidden h-28 w-20 rounded-md object-cover sm:block">
              <div>
                <h1 class="text-[1.35rem] font-black leading-tight sm:text-2xl">{{ movie.name }}</h1>
                <p v-if="movie.originName" class="mt-1 text-sm font-bold text-sky-200">{{ movie.originName }}</p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs font-black">
                  <span v-if="movie.quality" class="rounded bg-white/12 px-2 py-1">{{ movie.quality }}</span>
                  <span v-if="movie.episode" class="rounded bg-white/12 px-2 py-1">{{ movie.episode }}</span>
                  <span v-if="movie.time" class="rounded bg-white/12 px-2 py-1">{{ movie.time }}</span>
                  <span v-if="movie.rating"
                    class="inline-flex items-center gap-1 rounded bg-sky-400 px-2 py-1 text-slate-950">
                    <Star class="size-3 fill-current" />
                    {{ movie.rating.toFixed(1) }}
                  </span>
                </div>
              </div>
            </div>

            <p v-if="movie.content" class="mt-4 text-sm leading-7 text-slate-200">{{ movie.content }}</p>

            <div class="mt-5 rounded-md bg-sky-400 px-4 py-3 text-sm font-black text-slate-950">
              Đang xem {{ activeEpisode?.name || 'Tập 1' }}
            </div>

            <div v-if="servers.length > 1" class="mt-4 flex gap-2 overflow-x-auto pb-2">
              <button v-for="(server, index) in servers" :key="server.name" type="button"
                class="shrink-0 rounded px-4 py-2 text-sm font-black"
                :class="selectedServer === index ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'"
                @click="selectServer(index)">
                {{ server.name }}
              </button>
            </div>

            <div v-if="activeServer?.episodes?.length"
              class="mt-3 grid grid-cols-3 gap-2 rounded-md border border-white/10 p-3 sm:grid-cols-4 lg:grid-cols-6">
              <NuxtLink v-for="(episode, index) in activeServer.episodes" :key="`${episode.name}-${index}`"
                :to="episodeLink(index)"
                class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-3 text-center text-sm font-black transition"
                :class="selectedEpisode === index ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'">
                <Play class="size-3 fill-current" />
                {{ episode.name }}
              </NuxtLink>
            </div>
          </section>

          <aside class="hidden rounded-md border border-white/10 bg-white/5 p-5 sm:block lg:self-start">
            <h2 class="text-base font-black">Thông tin phim</h2>
            <div class="mt-4 space-y-3 text-sm text-slate-300">
              <p><span class="font-black text-white">Số tập:</span> {{ movie.episode || 'Đang cập nhật' }}</p>
              <p v-if="movie.countries?.length"><span class="font-black text-white">Quốc gia:</span> {{
                movie.countries.join(', ') }}</p>
              <p v-if="movie.year"><span class="font-black text-white">Năm:</span> {{ movie.year }}</p>
              <p v-if="movie.actors?.length"><span class="font-black text-white">Diễn viên:</span> {{
                movie.actors.slice(0, 6).join(', ') }}</p>
            </div>
          </aside>
        </div>
      </section>
    </template>
  </main>
</template>
