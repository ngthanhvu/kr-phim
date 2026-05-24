<script setup lang="ts">
import { Circle, Heart, Play } from 'lucide-vue-next'

const props = defineProps<{
  movie: {
    source: string
    slug: string
    name: string
    originName?: string
    thumb?: string
    poster?: string
    year?: number
    time?: string
    episode?: string
    quality?: string
    lang?: string
    categories?: string[]
    countries?: string[]
    sources?: { source: string, slug: string }[]
  }
}>()

const isPreviewVisible = ref(false)
const previewStyle = ref<Record<string, string>>({})
let hideTimer: ReturnType<typeof setTimeout> | undefined

const movieSourcesQuery = computed(() =>
  (props.movie.sources || [{ source: props.movie.source, slug: props.movie.slug }])
    .filter((source) => source.source && source.slug)
    .map((source) => `${source.source}:${source.slug}`)
    .join(','),
)

const movieLink = computed(() => ({
  path: `/phim/${props.movie.slug}`,
  query: {
    source: props.movie.source,
    srcs: movieSourcesQuery.value || undefined,
  },
}))

function showPreview(event: MouseEvent) {
  if (window.matchMedia('(max-width: 639px)').matches) return
  if (hideTimer) clearTimeout(hideTimer)

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const width = 408
  const height = 344
  const gap = 14
  const left = Math.min(Math.max(rect.left - 10, 16), window.innerWidth - width - 16)
  const top = Math.min(Math.max(rect.top - gap, 86), window.innerHeight - height - 16)

  previewStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  }
  isPreviewVisible.value = true
}

function scheduleHide() {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    isPreviewVisible.value = false
  }, 90)
}

function keepPreview() {
  if (hideTimer) clearTimeout(hideTimer)
}

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<template>
  <NuxtLink :to="movieLink"
    class="group relative block h-78 w-44 shrink-0 snap-start transition duration-300 hover:z-30 hover:-translate-y-1 sm:h-82 sm:w-52 xl:w-56"
    @mouseenter="showPreview" @mouseleave="scheduleHide" @focus="showPreview" @blur="scheduleHide">
    <div
      class="absolute inset-0 overflow-hidden rounded-md bg-slate-900 shadow-xl shadow-black/25 ring-1 ring-white/10 transition duration-300 group-hover:ring-yellow-300/60">
      <img :src="movie.thumb || movie.poster" :alt="movie.name"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
      <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-transparent p-3">
        <p class="line-clamp-2 text-sm font-bold leading-snug text-white">{{ movie.name }}</p>
        <p class="mt-1 truncate text-xs text-yellow-100">{{ movie.episode || movie.year || movie.quality }}</p>
      </div>
      <span v-if="movie.sources?.length && movie.sources.length > 1"
        class="absolute left-2 top-2 rounded bg-yellow-400 px-2 py-1 text-xs font-black text-slate-950">
        {{ movie.sources.length }} server
      </span>
    </div>
  </NuxtLink>

  <Teleport to="body">
    <Transition enter-active-class="transition duration-180 ease-out" enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100" leave-active-class="transition duration-120 ease-in"
      leave-from-class="scale-100 opacity-100" leave-to-class="scale-95 opacity-0">
      <NuxtLink v-if="isPreviewVisible" :to="movieLink"
        class="fixed z-90 hidden origin-top-left overflow-hidden rounded-xl bg-[#07111d] text-white shadow-2xl shadow-black/60 ring-1 ring-yellow-300/45 sm:block"
        :style="previewStyle" @mouseenter="keepPreview" @mouseleave="scheduleHide">
        <div class="relative h-44 overflow-hidden">
          <img :src="movie.poster || movie.thumb" :alt="movie.name" class="h-full w-full object-cover">
          <div class="absolute inset-0 bg-linear-to-t from-[#07111d] via-[#07111d]/30 to-transparent" />
          <div class="absolute inset-x-0 bottom-0 p-4">
            <h3 class="line-clamp-2 text-xl font-black leading-tight text-white">
              {{ movie.name }}
            </h3>
            <p v-if="movie.originName" class="mt-1 truncate text-sm font-semibold text-slate-200">
              {{ movie.originName }}
            </p>
          </div>
        </div>

        <div class="p-4 pt-3">
          <div class="grid grid-cols-[1fr_6.25rem_6.25rem] gap-2">
            <span
              class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-black text-slate-950 transition hover:bg-white">
              <Play class="size-4 fill-current" />
              Xem ngay
            </span>
            <span class="grid h-10 place-items-center rounded-md border border-white/30 bg-white/8 text-white">
              <Heart class="size-5 fill-current" />
            </span>
            <span class="grid h-10 place-items-center rounded-md border border-white/30 bg-white/8 text-white">
              <Circle class="size-5 fill-current" />
            </span>
          </div>

          <div class="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <span v-if="movie.quality" class="rounded bg-black/28 px-2.5 py-1.5 text-white ring-1 ring-white/10">{{
              movie.quality }}</span>
            <span v-if="movie.lang" class="rounded bg-yellow-300 px-2.5 py-1.5 text-slate-950">{{ movie.lang }}</span>
            <span v-if="movie.time" class="rounded bg-white px-2.5 py-1.5 text-slate-950">{{ movie.time }}</span>
            <span v-if="movie.episode" class="rounded bg-black/28 px-2.5 py-1.5 text-white ring-1 ring-white/10">{{
              movie.episode }}</span>
          </div>

          <p class="mt-3 line-clamp-2 text-xs font-bold leading-6 text-slate-200">
            <template v-if="movie.countries?.length">{{ movie.countries.slice(0, 2).join(' • ') }}</template>
            <template v-if="movie.countries?.length && movie.categories?.length"> • </template>
            <template v-if="movie.categories?.length">{{ movie.categories.slice(0, 3).join(' • ') }}</template>
            <template v-if="!movie.countries?.length && !movie.categories?.length">Phim Hàn Quốc Vietsub mới cập
              nhật</template>
          </p>
        </div>
      </NuxtLink>
    </Transition>
  </Teleport>
</template>
