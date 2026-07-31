<script setup lang="ts">
const props = defineProps<{
  movie: {
    source: string;
    slug: string;
    name: string;
    originName?: string;
    thumb?: string;
    poster?: string;
    year?: number;
    time?: string;
    episode?: string;
    episodeTotal?: string;
    quality?: string;
    lang?: string;
    categories?: string[];
    countries?: string[];
    sources?: { source: string; slug: string }[];
  };
}>();

const episodeDisplay = computed(() => {
  const raw = getEpisodeDisplay(props.movie.episode, props.movie.episodeTotal, 'PĐ.')
  if (!raw) return ''
  const slashIdx = raw.indexOf('/')
  if (slashIdx !== -1) return raw.slice(0, slashIdx).trim()
  return raw
})

const isPreviewVisible = ref(false);
const isDescriptionExpanded = ref(false);
const previewStyle = ref<Record<string, string>>({});
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const movieLink = computed(() => ({
  path: `/phim/${props.movie.slug}`,
}));

function showPreview(event: MouseEvent) {
  if (window.matchMedia("(max-width: 639px)").matches) return;
  if (hideTimer) clearTimeout(hideTimer);

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const width = 408;
  const height = 344;
  const gap = 14;
  const left = Math.min(
    Math.max(rect.left - 10, 16),
    window.innerWidth - width - 16,
  );
  const top = Math.min(
    Math.max(rect.top - gap, 86),
    window.innerHeight - height - 16,
  );

  previewStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
  isPreviewVisible.value = true;
}

function scheduleHide() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    isPreviewVisible.value = false;
    isDescriptionExpanded.value = false;
  }, 90);
}

function keepPreview() {
  if (hideTimer) clearTimeout(hideTimer);
}

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer);
});
</script>

<template>
  <div class="w-44 shrink-0 snap-start sm:w-52 xl:w-56">
    <!-- Movie Card -->
    <NuxtLink :to="movieLink" class="group block" @mouseenter="showPreview" @mouseleave="scheduleHide"
      @focus="showPreview" @blur="scheduleHide">
      <!-- Poster wrapper -->
      <div class="relative aspect-2/3">
        <div class="h-full w-full overflow-hidden rounded-t-[7px] bg-slate-900 shadow-xl shadow-black/25 ring-1 ring-white/10">
          <img :src="movie.thumb || movie.poster" :alt="movie.name"
            class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
        <span v-if="episodeDisplay"
          class="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-t-md bg-blue-600 px-2 py-1 text-[11px] font-semibold leading-none text-white">
          {{ episodeDisplay }}
        </span>
      </div>
      <!-- Movie name & originName -->
      <div class="mt-2 px-0.5">
        <p
          class="truncate text-[14px] font-normal leading-5 text-white transition-colors duration-200 group-hover:text-yellow-300">
          {{ movie.name }}
        </p>
        <p v-if="movie.originName" class="mt-0.5 truncate text-[13px] leading-5 text-slate-500">
          {{ movie.originName }}
        </p>
      </div>
    </NuxtLink>

    <!-- Desktop hover preview -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-180 ease-out" enter-from-class="scale-95 opacity-0"
        enter-to-class="scale-100 opacity-100" leave-active-class="transition duration-120 ease-in"
        leave-from-class="scale-100 opacity-100" leave-to-class="scale-95 opacity-0">
        <NuxtLink v-if="isPreviewVisible" :to="movieLink"
          class="fixed z-90 hidden origin-top-left overflow-hidden rounded-xl bg-[#07111d] text-white shadow-2xl shadow-black/60 ring-1 ring-yellow-300/45 sm:block"
          :style="previewStyle" @mouseenter="keepPreview" @mouseleave="scheduleHide">
          <!-- Preview image -->
          <div class="relative h-44 overflow-hidden">
            <img :src="movie.poster || movie.thumb" :alt="movie.name" class="h-full w-full object-cover object-top" />
            <!-- Gradient -->
            <div class="absolute inset-0 bg-linear-to-t from-[#07111d] via-[#07111d]/30 to-transparent" />
            <!-- Movie title -->
            <div class="absolute inset-x-0 bottom-0 p-4">
              <h3 class="line-clamp-2 text-xl font-black leading-tight text-white">
                {{ movie.name }}
              </h3>
              <p v-if="movie.originName" class="mt-1 truncate text-sm font-semibold text-slate-200">
                {{ movie.originName }}
              </p>
            </div>
          </div>

          <!-- Preview content -->
          <div class="p-4 pt-3">
            <!-- Actions -->
            <div class="grid grid-cols-[1fr_6.25rem_6.25rem] gap-2">
              <!-- Watch -->
              <span
                class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-black text-slate-950 transition hover:bg-white">
                <AppIcon name="play" class="size-4 fill-current" />
                Xem ngay
              </span>
              <!-- Favorite -->
              <span class="grid h-10 place-items-center rounded-md border border-white/30 bg-white/8 text-white">
                <AppIcon name="heart" class="size-5 fill-current" />
              </span>
              <!-- Other action -->
              <span class="grid h-10 place-items-center rounded-md border border-white/30 bg-white/8 text-white">
                <AppIcon name="circle" class="size-5 fill-current" />
              </span>
            </div>
            <!-- Movie meta -->
            <div class="mt-3 flex flex-wrap gap-2 text-xs font-black">
              <!-- Quality -->
              <span v-if="movie.quality" class="rounded bg-black/28 px-2.5 py-1.5 text-white ring-1 ring-white/10">
                {{ movie.quality }}
              </span>
              <!-- Language -->
              <span v-if="movie.lang" class="rounded bg-yellow-300 px-2.5 py-1.5 text-slate-950">
                {{ movie.lang }}
              </span>
              <!-- Time -->
              <span v-if="movie.time" class="rounded bg-white px-2.5 py-1.5 text-slate-950">
                {{ movie.time }}
              </span>
              <!-- Episode -->
              <span v-if="episodeDisplay" class="rounded bg-black/28 px-2.5 py-1.5 text-white ring-1 ring-white/10">
                {{ episodeDisplay }}
              </span>
            </div>
            <!-- Description -->
            <div class="mt-3">
              <p class="text-xs font-bold leading-6 text-slate-200"
                :class="isDescriptionExpanded ? '' : 'line-clamp-1'">
                <template v-if="movie.countries?.length">
                  {{ movie.countries.slice(0, 2).join(" • ") }}
                </template>
                <template v-if="movie.countries?.length && movie.categories?.length">
                  •
                </template>
                <template v-if="movie.categories?.length">
                  {{ movie.categories.slice(0, 3).join(" • ") }}
                </template>
                <template v-if="!movie.countries?.length && !movie.categories?.length">
                  Phim Hàn Quốc Vietsub mới cập nhật
                </template>
              </p>
              <!-- Expand description -->
              <button type="button"
                class="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-yellow-300 transition hover:text-yellow-200"
                @click.stop="isDescriptionExpanded = !isDescriptionExpanded">
                <template v-if="isDescriptionExpanded">
                  Thu gọn
                  <AppIcon name="chevron-up" class="size-3" />
                </template>
                <template v-else>
                  Xem thêm
                  <AppIcon name="chevron-down" class="size-3" />
                </template>
              </button>
            </div>
          </div>
        </NuxtLink>
      </Transition>
    </Teleport>
  </div>
</template>
