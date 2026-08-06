<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})
useHead({
  title: 'Dashboard - CineK Admin',
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
// Stacked source bar segments
const sourceSegments = computed(() => {
  const total = stats.value?.total || 0
  const ophim = stats.value?.ophim || 0
  const nguonc = stats.value?.nguonc || 0
  const kkphim = stats.value?.kkphim || 0
  if (!total) return []
  return [
    { key: 'ophim', label: 'OPhim', value: ophim, pct: (ophim / total) * 100, color: '#facc15' },
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
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="admin-section-title">Dashboard</h1>
        <p class="admin-section-subtitle mt-1">Tổng quan hệ thống CineK</p>
      </div>
    </div>
    <!-- Bento: KPI grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
      <!-- Hero: Total movies (col-span-2, row-span-2) -->
      <div class="admin-card-gradient relative overflow-hidden p-6 sm:col-span-2 lg:row-span-2">
        <!-- subtle accent glow -->
        <div class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-yellow-400/10 blur-3xl" />
        <div class="relative flex h-full flex-col">
          <div class="flex items-start justify-between">
            <div>
              <p class="admin-label">Tổng số phim</p>
              <p class="admin-num mt-3 text-5xl leading-none sm:text-6xl">{{ stats?.total?.toLocaleString() || 0 }}</p>
            </div>
            <div class="grid size-10 place-items-center rounded-xl border border-white/8 bg-white/3 text-yellow-400">
              <AppIcon name="film" class="size-5" />
            </div>
          </div>
          <!-- Stacked source distribution bar -->
          <div class="mt-8">
            <div class="mb-2 flex items-center justify-between">
              <p class="admin-label">Phân bổ theo nguồn</p>
              <span class="text-xs text-zinc-500">{{ sourceSegments.length }} nguồn</span>
            </div>
            <div v-if="sourceSegments.length" class="flex h-3 w-full overflow-hidden rounded-full bg-white/4">
              <div v-for="seg in sourceSegments" :key="seg.key" class="h-full transition-all duration-700"
                :style="{ width: seg.pct + '%', backgroundColor: seg.color }"
                :title="`${seg.label}: ${seg.value} (${Math.round(seg.pct)}%)`" />
            </div>
            <div v-else class="h-3 w-full rounded-full bg-white/4" />
            <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              <div v-for="seg in sourceSegments" :key="seg.key" class="flex items-center gap-2">
                <span class="size-2 rounded-full" :style="{ backgroundColor: seg.color }" />
                <span class="text-xs text-zinc-400">{{ seg.label }}</span>
                <span class="text-xs font-semibold text-zinc-200">{{ seg.value.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          <!-- Footer mini stats -->
          <div class="mt-auto grid grid-cols-2 gap-4 border-t border-white/6 pt-5">
            <div>
              <p class="admin-label">Đang hiển thị</p>
              <p class="mt-1.5 flex items-baseline gap-2">
                <span class="admin-num text-xl">{{ stats?.active?.toLocaleString() || 0 }}</span>
                <span class="text-xs font-medium text-emerald-400">{{ percentOf(stats?.active || 0, stats?.total || 0)
                }}%</span>
              </p>
            </div>
            <div>
              <p class="admin-label">Chưa hiển thị</p>
              <p class="mt-1.5 flex items-baseline gap-2">
                <span class="admin-num text-xl text-zinc-300">{{ stats?.inactive?.toLocaleString() || 0 }}</span>
                <span class="text-xs font-medium text-zinc-500">{{ percentOf(stats?.inactive || 0, stats?.total || 0)
                }}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <!-- KPI: Đang hiển thị -->
      <div class="admin-card p-5">
        <div class="flex items-start justify-between">
          <p class="admin-label">Đang hiển thị</p>
          <div class="grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-400">
            <AppIcon name="trending-up" class="size-4" />
          </div>
        </div>
        <p class="admin-num mt-4 text-3xl">{{ stats?.active?.toLocaleString() || 0 }}</p>
        <p class="mt-1 text-xs text-zinc-500">{{ percentOf(stats?.active || 0, stats?.total || 0) }}% tổng phim</p>
      </div>
      <!-- KPI: Phim bộ -->
      <div class="admin-card p-5">
        <div class="flex items-start justify-between">
          <p class="admin-label">Phim bộ</p>
          <div class="grid size-8 place-items-center rounded-lg bg-blue-400/10 text-blue-400">
            <AppIcon name="tv" class="size-4" />
          </div>
        </div>
        <p class="admin-num mt-4 text-3xl">{{ stats?.series?.toLocaleString() || 0 }}</p>
        <p class="mt-1 text-xs text-zinc-500">{{ percentOf(stats?.series || 0, stats?.total || 0) }}% tổng phim</p>
      </div>
      <!-- KPI: Phim lẻ -->
      <div class="admin-card p-5">
        <div class="flex items-start justify-between">
          <p class="admin-label">Phim lẻ</p>
          <div class="grid size-8 place-items-center rounded-lg bg-purple-400/10 text-purple-400">
            <AppIcon name="play" class="size-4" />
          </div>
        </div>
        <p class="admin-num mt-4 text-3xl">{{ stats?.single?.toLocaleString() || 0 }}</p>
        <p class="mt-1 text-xs text-zinc-500">{{ percentOf(stats?.single || 0, stats?.total || 0) }}% tổng phim</p>
      </div>
      <!-- KPI: Tổng lượt xem -->
      <div class="admin-card p-5">
        <div class="flex items-start justify-between">
          <p class="admin-label">Tổng lượt xem</p>
          <div class="grid size-8 place-items-center rounded-lg bg-yellow-400/10 text-yellow-400">
            <AppIcon name="bar-chart" class="size-4" />
          </div>
        </div>
        <p class="admin-num mt-4 text-3xl">{{ stats?.totalViews?.toLocaleString() || 0 }}</p>
        <p class="mt-1 text-xs text-zinc-500">trên {{ stats?.total?.toLocaleString() || 0 }} phim</p>
      </div>
    </div>
    <!-- Bento: Charts row -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <!-- Donut: Source distribution -->
      <div class="admin-card p-5">
        <div class="flex items-center justify-between">
          <p class="admin-label">Phân bổ nguồn</p>
          <span class="admin-badge bg-white/5 text-zinc-400">Nguồn</span>
        </div>
        <div class="mt-4 flex items-center justify-center">
          <div class="relative">
            <svg viewBox="0 0 100 100" class="size-40">
              <template v-if="stats?.ophim">
                <path :d="donutSegment(stats.ophim, stats.total, 0)" fill="#facc15" />
              </template>
              <template v-if="stats?.nguonc">
                <path :d="donutSegment(stats.nguonc, stats.total, (stats.ophim || 0) / (stats.total || 1) * 360)"
                  fill="#34d399" />
              </template>
              <template v-if="stats?.kkphim">
                <path
                  :d="donutSegment(stats.kkphim, stats.total, ((stats.ophim || 0) + (stats.nguonc || 0)) / (stats.total || 1) * 360)"
                  fill="#60a5fa" />
              </template>
              <circle cx="50" cy="50" r="22" fill="#131418" />
            </svg>
            <div class="absolute inset-0 grid place-items-center">
              <div class="text-center">
                <p class="admin-num text-xl">{{ stats?.total?.toLocaleString() || 0 }}</p>
                <p class="text-[10px] uppercase tracking-widest text-zinc-500">phim</p>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 space-y-1.5">
          <div v-for="s in [
            { key: 'ophim', label: 'OPhim', color: 'bg-yellow-400' },
            { key: 'nguonc', label: 'NguonC', color: 'bg-emerald-400' },
            { key: 'kkphim', label: 'KKPhim', color: 'bg-blue-400' },
          ]" :key="s.key" class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full" :class="s.color" />
              <span class="text-zinc-400">{{ s.label }}</span>
            </div>
            <span class="font-semibold text-zinc-200">{{ stats?.[s.key] || 0 }}</span>
          </div>
        </div>
      </div>
      <!-- Donut: Series vs Single -->
      <div class="admin-card p-5">
        <div class="flex items-center justify-between">
          <p class="admin-label">Bộ vs Lẻ</p>
          <span class="admin-badge bg-white/5 text-zinc-400">Loại</span>
        </div>
        <div class="mt-4 flex items-center justify-center">
          <div class="relative">
            <svg viewBox="0 0 100 100" class="size-40">
              <template v-if="stats?.series">
                <path :d="donutSegment(stats.series, stats.total, 0)" fill="#3b82f6" />
              </template>
              <template v-if="stats?.single">
                <path :d="donutSegment(stats.single, stats.total, (stats.series || 0) / (stats.total || 1) * 360)"
                  fill="#a855f7" />
              </template>
              <circle cx="50" cy="50" r="22" fill="#131418" />
            </svg>
            <div class="absolute inset-0 grid place-items-center">
              <div class="text-center">
                <p class="admin-num text-xl">{{ stats?.total?.toLocaleString() || 0 }}</p>
                <p class="text-[10px] uppercase tracking-widest text-zinc-500">phim</p>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-blue-500" />
              <span class="text-zinc-400">Phim bộ</span>
            </div>
            <span class="font-semibold text-zinc-200">{{ stats?.series || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-purple-500" />
              <span class="text-zinc-400">Phim lẻ</span>
            </div>
            <span class="font-semibold text-zinc-200">{{ stats?.single || 0 }}</span>
          </div>
        </div>
      </div>
      <!-- Top movies (col-span-2) -->
      <div class="admin-card p-5 sm:col-span-2 lg:col-span-2">
        <div class="flex items-center justify-between">
          <p class="admin-label">Top phim xem nhiều</p>
          <span class="admin-badge bg-yellow-400/10 text-yellow-400">Top 5</span>
        </div>
        <div class="mt-4 space-y-3.5">
          <div v-for="(movie, i) in stats?.topMovies || []" :key="movie.slug">
            <div class="mb-1.5 flex items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2.5">
                <span class="flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                  :class="i === 0 ? 'bg-yellow-400 text-zinc-950' : 'bg-white/6 text-zinc-400'">
                  {{ i + 1 }}
                </span>
                <span class="truncate text-sm text-zinc-100">{{ movie.name }}</span>
              </div>
              <span class="shrink-0 text-xs font-semibold text-zinc-400 tabular-nums">{{ movie.views?.toLocaleString()
              }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-white/4">
              <div class="h-full rounded-full transition-all duration-700"
                :class="i === 0 ? 'bg-yellow-400' : 'bg-zinc-500'"
                :style="{ width: barWidth(movie.views || 0) + '%' }" />
            </div>
          </div>
          <p v-if="!stats?.topMovies?.length" class="py-6 text-center text-sm text-zinc-500">Chưa có dữ liệu</p>
        </div>
      </div>
    </div>
    <!-- Status comparison (full width) -->
    <div class="admin-card p-6">
      <div class="mb-5 flex items-center justify-between">
        <p class="admin-label">Trạng thái hiển thị</p>
        <span class="admin-badge bg-white/5 text-zinc-400">{{ stats?.total?.toLocaleString() || 0 }} phim</span>
      </div>
      <div class="grid gap-6 md:grid-cols-2">
        <div>
          <div class="mb-2 flex items-center justify-between text-sm">
            <span class="text-zinc-400">Đang hiển thị</span>
            <span class="font-semibold text-emerald-400 tabular-nums">{{ stats?.active?.toLocaleString() || 0 }} · {{
              percentOf(stats?.active || 0, stats?.total || 0) }}%</span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-white/4">
            <div class="h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
              :style="{ width: percentOf(stats?.active || 0, stats?.total || 0) + '%' }" />
          </div>
        </div>
        <div>
          <div class="mb-2 flex items-center justify-between text-sm">
            <span class="text-zinc-400">Chưa hiển thị</span>
            <span class="font-semibold text-zinc-400 tabular-nums">{{ stats?.inactive?.toLocaleString() || 0 }} · {{
              percentOf(stats?.inactive || 0, stats?.total || 0) }}%</span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-white/4">
            <div class="h-full rounded-full bg-zinc-600 transition-all duration-700"
              :style="{ width: percentOf(stats?.inactive || 0, stats?.total || 0) + '%' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
