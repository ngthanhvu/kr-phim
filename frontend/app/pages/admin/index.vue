<script setup lang="ts">
const { settings, loadSettings } = useAppSettings()
onMounted(loadSettings)

definePageMeta({
  layout: 'admin',
})

useHead({
  title: `Dashboard - ${settings?.siteName || 'CineK'} Admin`,
})
const { data: stats, refresh } = await useFetch('/api/admin/stats')
function percentOf(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}
function donutSegment(value: number, total: number, startAngle: number, radius = 38) {
  if (!total || !value) return ''
  const angle = (value / total) * 360
  const startRad = ((startAngle - 90) * Math.PI) / 180
  const endRad = (((startAngle + angle) - 90) * Math.PI) / 180
  const x1 = 50 + radius * Math.cos(startRad)
  const y1 = 50 + radius * Math.sin(startRad)
  const x2 = 50 + radius * Math.cos(endRad)
  const y2 = 50 + radius * Math.sin(endRad)
  const largeArc = angle > 180 ? 1 : 0
  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
}
const sourceSegments = computed(() => {
  const total = stats.value?.total || 0
  const ophim = stats.value?.ophim || 0
  const nguonc = stats.value?.nguonc || 0
  const kkphim = stats.value?.kkphim || 0
  if (!total) return []
  return [
    { key: 'ophim', label: 'OPhim', value: ophim, pct: (ophim / total) * 100, color: '#fbbf24' },
    { key: 'nguonc', label: 'NguonC', value: nguonc, pct: (nguonc / total) * 100, color: '#34d399' },
    { key: 'kkphim', label: 'KKPhim', value: kkphim, pct: (kkphim / total) * 100, color: '#60a5fa' },
  ].filter(s => s.value > 0)
})
const maxViews = computed(() => {
  const movies = stats.value?.topMovies || []
  return Math.max(...movies.map(m => m.views || 0), 1)
})
function barWidth(views: number) {
  if (!maxViews.value) return 0
  return Math.max((views / maxViews.value) * 100, 3)
}
</script>
<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
      <p class="mt-1 text-sm text-zinc-500">Tổng quan hệ thống CineK</p>
    </div>

    <!-- Bento grid: KPI cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
      <!-- Hero card: Total movies (col-span-2, row-span-2) -->
      <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:col-span-2 lg:row-span-2 relative overflow-hidden">
        <div class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-zinc-100 blur-3xl" />
        <div class="relative flex h-full flex-col">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Tổng số phim</p>
              <p class="mt-3 text-5xl font-bold leading-none tracking-tight text-zinc-900 tabular-nums sm:text-6xl">{{ stats?.total?.toLocaleString() || 0 }}</p>
            </div>
            <div class="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600">
              <AppIcon name="film" class="size-5" />
            </div>
          </div>
          <!-- Source distribution bar -->
          <div class="mt-8">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Phân bổ theo nguồn</p>
              <span class="text-xs text-zinc-400">{{ sourceSegments.length }} nguồn</span>
            </div>
            <div v-if="sourceSegments.length" class="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
              <div v-for="seg in sourceSegments" :key="seg.key" class="h-full transition-all duration-700"
                :style="{ width: seg.pct + '%', backgroundColor: seg.color }"
                :title="`${seg.label}: ${seg.value} (${Math.round(seg.pct)}%)`" />
            </div>
            <div v-else class="h-3 w-full rounded-full bg-zinc-100" />
            <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              <div v-for="seg in sourceSegments" :key="seg.key" class="flex items-center gap-2">
                <span class="size-2 rounded-full" :style="{ backgroundColor: seg.color }" />
                <span class="text-xs text-zinc-500">{{ seg.label }}</span>
                <span class="text-xs font-semibold text-zinc-700">{{ seg.value.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          <!-- Footer mini stats -->
          <div class="mt-auto grid grid-cols-2 gap-4 border-t border-zinc-100 pt-5">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Đang hiển thị</p>
              <p class="mt-1.5 flex items-baseline gap-2">
                <span class="text-xl font-bold text-zinc-900 tabular-nums">{{ stats?.active?.toLocaleString() || 0 }}</span>
                <span class="text-xs font-medium text-emerald-600">{{ percentOf(stats?.active || 0, stats?.total || 0) }}%</span>
              </p>
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Chưa hiển thị</p>
              <p class="mt-1.5 flex items-baseline gap-2">
                <span class="text-xl font-bold text-zinc-900 tabular-nums">{{ stats?.inactive?.toLocaleString() || 0 }}</span>
                <span class="text-xs font-medium text-zinc-400">{{ percentOf(stats?.inactive || 0, stats?.total || 0) }}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Top movies card (col-span-2) -->
      <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-2">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Top phim xem nhiều</p>
          <span class="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">Top 5</span>
        </div>
        <div class="mt-4 space-y-3.5">
          <div v-for="(movie, i) in stats?.topMovies || []" :key="movie.slug">
            <div class="mb-1.5 flex items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2.5">
                <span class="flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                  :class="i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'">
                  {{ i + 1 }}
                </span>
                <span class="truncate text-sm font-medium text-zinc-700">{{ movie.name }}</span>
              </div>
              <span class="shrink-0 text-xs font-semibold text-zinc-500 tabular-nums">{{ movie.views?.toLocaleString() }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div class="h-full rounded-full transition-all duration-700"
                :class="i === 0 ? 'bg-zinc-900' : 'bg-zinc-400'"
                :style="{ width: barWidth(movie.views || 0) + '%' }" />
            </div>
          </div>
          <p v-if="!stats?.topMovies?.length" class="py-6 text-center text-sm text-zinc-400">Chưa có dữ liệu</p>
        </div>
      </div>
    </div>

    <!-- Status comparison card -->
    <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex items-center justify-between">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Trạng thái hiển thị</p>
        <span class="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">{{ stats?.total?.toLocaleString() || 0 }} phim</span>
      </div>
      <div class="grid gap-6 md:grid-cols-2">
        <div>
          <div class="mb-2 flex items-center justify-between text-sm">
            <span class="text-zinc-500">Đang hiển thị</span>
            <span class="font-semibold text-emerald-600 tabular-nums">{{ stats?.active?.toLocaleString() || 0 }} · {{ percentOf(stats?.active || 0, stats?.total || 0) }}%</span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-zinc-100">
            <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
              :style="{ width: percentOf(stats?.active || 0, stats?.total || 0) + '%' }" />
          </div>
        </div>
        <div>
          <div class="mb-2 flex items-center justify-between text-sm">
            <span class="text-zinc-500">Chưa hiển thị</span>
            <span class="font-semibold text-zinc-500 tabular-nums">{{ stats?.inactive?.toLocaleString() || 0 }} · {{ percentOf(stats?.inactive || 0, stats?.total || 0) }}%</span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-zinc-100">
            <div class="h-full rounded-full bg-zinc-400 transition-all duration-700"
              :style="{ width: percentOf(stats?.inactive || 0, stats?.total || 0) + '%' }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Series vs Single donut card -->
    <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-5">Thể loại phim</p>
      <div class="flex items-center gap-8">
        <div class="relative">
          <svg viewBox="0 0 100 100" class="size-36">
            <template v-if="stats?.series">
              <path :d="donutSegment(stats.series, stats.total, 0)" fill="#3b82f6" />
            </template>
            <template v-if="stats?.single">
              <path :d="donutSegment(stats.single, stats.total, (stats.series || 0) / (stats.total || 1) * 360)"
                fill="#a855f7" />
            </template>
            <circle cx="50" cy="50" r="22" fill="white" />
          </svg>
          <div class="absolute inset-0 grid place-items-center">
            <div class="text-center">
              <p class="text-lg font-bold text-zinc-900 tabular-nums">{{ stats?.total?.toLocaleString() || 0 }}</p>
              <p class="text-[10px] uppercase tracking-widest text-zinc-400">phim</p>
            </div>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-zinc-500" />
              <span class="text-zinc-600">Phim bộ</span>
            </div>
            <span class="font-semibold text-zinc-900">{{ stats?.series || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-zinc-700" />
              <span class="text-zinc-600">Phim lẻ</span>
            </div>
            <span class="font-semibold text-zinc-900">{{ stats?.single || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
