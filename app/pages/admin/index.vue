<script setup lang="ts">
import { BarChart3, Film, Play, RefreshCw, TrendingUp, Tv, Users, X } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Dashboard - CineK Admin',
})

const { data: stats, refresh } = await useFetch('/api/admin/stats')
const syncing = ref(false)
const syncOpen = ref(false)
const syncSources = ref({ ophim: true, nguonc: true, kkphim: true })

async function handleSync() {
  const sources = Object.entries(syncSources.value)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)

  if (!sources.length) return

  syncing.value = true
  try {
    await $fetch('/api/admin/sync', {
      method: 'POST',
      body: { sources },
    })
    syncOpen.value = false
    await refresh()
  } catch (err) {
    console.error('Sync failed:', err)
  } finally {
    syncing.value = false
  }
}

function percentOf(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

// Donut chart helpers
function donutSegment(value: number, total: number, startAngle: number, radius = 40) {
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

// Bar chart max value
const maxViews = computed(() => {
  const movies = stats.value?.topMovies || []
  return Math.max(...movies.map(m => m.views || 0), 1)
})

function barWidth(views: number) {
  if (!maxViews.value) return 0
  return Math.max((views / maxViews.value) * 100, 4)
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-400">Tổng quan hệ thống CineK</p>
      </div>
      <button type="button"
        class="inline-flex h-10 items-center gap-2 rounded-lg bg-yellow-400 px-4 text-sm font-black text-slate-950 transition hover:bg-yellow-300"
        @click="syncOpen = true">
        <RefreshCw class="size-4" />
        Đồng bộ phim
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-white/20">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400">Tổng phim</p>
            <p class="mt-2 text-3xl font-black text-white">{{ stats?.total?.toLocaleString() || 0 }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-xl bg-yellow-400/10 text-yellow-400">
            <Film class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-white/20">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400">Đang hiển thị</p>
            <p class="mt-2 text-3xl font-black text-green-400">{{ stats?.active?.toLocaleString() || 0 }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-xl bg-green-400/10 text-green-400">
            <TrendingUp class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-white/20">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400">Phim bộ</p>
            <p class="mt-2 text-3xl font-black text-blue-400">{{ stats?.series?.toLocaleString() || 0 }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-xl bg-blue-400/10 text-blue-400">
            <Tv class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-white/20">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400">Phim lẻ</p>
            <p class="mt-2 text-3xl font-black text-purple-400">{{ stats?.single?.toLocaleString() || 0 }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-xl bg-purple-400/10 text-purple-400">
            <Play class="size-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="mb-6 grid gap-4 lg:grid-cols-3">
      <!-- Donut Chart: Source Distribution -->
      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
        <p class="text-sm font-semibold text-slate-400">Phân bổ nguồn phim</p>
        <div class="mt-4 flex items-center justify-center">
          <div class="relative">
            <svg viewBox="0 0 100 100" class="size-44">
              <!-- OPhim segment -->
              <template v-if="stats?.ophim">
                <path :d="donutSegment(stats.ophim, stats.total, 0)" fill="#facc15" />
              </template>
              <!-- NguonC segment -->
              <template v-if="stats?.nguonc">
                <path :d="donutSegment(stats.nguonc, stats.total, (stats.ophim || 0) / (stats.total || 1) * 360)" fill="#4ade80" />
              </template>
              <!-- KKPhim segment -->
              <template v-if="stats?.kkphim">
                <path :d="donutSegment(stats.kkphim, stats.total, ((stats.ophim || 0) + (stats.nguonc || 0)) / (stats.total || 1) * 360)" fill="#60a5fa" />
              </template>
              <!-- Inner circle for donut effect -->
              <circle cx="50" cy="50" r="24" fill="#0f172a" />
            </svg>
            <div class="absolute inset-0 grid place-items-center">
              <div class="text-center">
                <p class="text-2xl font-black text-white">{{ stats?.total?.toLocaleString() || 0 }}</p>
                <p class="text-[10px] text-slate-400">total</p>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-yellow-400" />
              <span class="text-slate-300">OPhim</span>
            </div>
            <span class="font-semibold text-white">{{ stats?.ophim || 0 }} <span class="text-slate-500">({{ percentOf(stats?.ophim || 0, stats?.total || 0) }}%)</span></span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-green-400" />
              <span class="text-slate-300">NguonC</span>
            </div>
            <span class="font-semibold text-white">{{ stats?.nguonc || 0 }} <span class="text-slate-500">({{ percentOf(stats?.nguonc || 0, stats?.total || 0) }}%)</span></span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-blue-400" />
              <span class="text-slate-300">KKPhim</span>
            </div>
            <span class="font-semibold text-white">{{ stats?.kkphim || 0 }} <span class="text-slate-500">({{ percentOf(stats?.kkphim || 0, stats?.total || 0) }}%)</span></span>
          </div>
        </div>
      </div>

      <!-- Donut Chart: Series vs Single -->
      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
        <p class="text-sm font-semibold text-slate-400">Phim bộ vs Phim lẻ</p>
        <div class="mt-4 flex items-center justify-center">
          <div class="relative">
            <svg viewBox="0 0 100 100" class="size-44">
              <template v-if="stats?.series">
                <path :d="donutSegment(stats.series, stats.total, 0)" fill="#3b82f6" />
              </template>
              <template v-if="stats?.single">
                <path :d="donutSegment(stats.single, stats.total, (stats.series || 0) / (stats.total || 1) * 360)" fill="#a855f7" />
              </template>
              <circle cx="50" cy="50" r="24" fill="#0f172a" />
            </svg>
            <div class="absolute inset-0 grid place-items-center">
              <div class="text-center">
                <p class="text-2xl font-black text-white">{{ stats?.total?.toLocaleString() || 0 }}</p>
                <p class="text-[10px] text-slate-400">total</p>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-blue-500" />
              <span class="text-slate-300">Phim bộ</span>
            </div>
            <span class="font-semibold text-white">{{ stats?.series || 0 }} <span class="text-slate-500">({{ percentOf(stats?.series || 0, stats?.total || 0) }}%)</span></span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-purple-500" />
              <span class="text-slate-300">Phim lẻ</span>
            </div>
            <span class="font-semibold text-white">{{ stats?.single || 0 }} <span class="text-slate-500">({{ percentOf(stats?.single || 0, stats?.total || 0) }}%)</span></span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-green-400" />
              <span class="text-slate-300">Đang hiển thị</span>
            </div>
            <span class="font-semibold text-green-400">{{ stats?.active || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-slate-500" />
              <span class="text-slate-300">Chưa hiển thị</span>
            </div>
            <span class="font-semibold text-slate-400">{{ stats?.inactive || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Bar Chart: Top Movies by Views -->
      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
        <p class="text-sm font-semibold text-slate-400">Top 5 phim nhiều lượt xem</p>
        <div class="mt-4 space-y-3">
          <div v-for="(movie, i) in stats?.topMovies || []" :key="movie.slug">
            <div class="mb-1 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-5 text-center text-xs font-black" :class="i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'">{{ i + 1 }}</span>
                <span class="truncate text-xs text-white">{{ movie.name }}</span>
              </div>
              <span class="text-xs font-semibold text-slate-400">{{ movie.views?.toLocaleString() }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full transition-all duration-500"
                :class="i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-300' : i === 2 ? 'bg-amber-500' : 'bg-slate-500'"
                :style="{ width: barWidth(movie.views || 0) + '%' }" />
            </div>
          </div>
          <p v-if="!stats?.topMovies?.length" class="text-center text-xs text-slate-500">Chưa có dữ liệu</p>
        </div>

        <div class="mt-5 border-t border-white/10 pt-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-400">Tổng lượt xem</span>
            <span class="text-lg font-black text-white">{{ stats?.totalViews?.toLocaleString() || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Active vs Inactive Comparison Bar -->
    <div class="mb-6 rounded-xl border border-white/10 bg-slate-900/50 p-5">
      <p class="text-sm font-semibold text-slate-400">Trạng thái hiển thị</p>
      <div class="mt-4 flex gap-6">
        <div class="flex-1">
          <div class="mb-2 flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-green-400" />
              <span class="text-white">Đang hiển thị</span>
            </div>
            <span class="font-semibold text-green-400">{{ stats?.active?.toLocaleString() || 0 }}</span>
          </div>
          <div class="h-4 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-green-400 transition-all duration-500" :style="{ width: percentOf(stats?.active || 0, stats?.total || 0) + '%' }" />
          </div>
          <p class="mt-1 text-right text-xs text-slate-500">{{ percentOf(stats?.active || 0, stats?.total || 0) }}%</p>
        </div>
        <div class="flex-1">
          <div class="mb-2 flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="size-3 rounded-full bg-slate-500" />
              <span class="text-white">Chưa hiển thị</span>
            </div>
            <span class="font-semibold text-slate-400">{{ stats?.inactive?.toLocaleString() || 0 }}</span>
          </div>
          <div class="h-4 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-slate-500 transition-all duration-500" :style="{ width: percentOf(stats?.inactive || 0, stats?.total || 0) + '%' }" />
          </div>
          <p class="mt-1 text-right text-xs text-slate-500">{{ percentOf(stats?.inactive || 0, stats?.total || 0) }}%</p>
        </div>
      </div>
    </div>

    <!-- Sync Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="syncOpen" class="fixed inset-0 z-70 grid place-items-center px-3">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="syncOpen = false" />
          <div class="relative w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button type="button"
              class="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-white transition hover:bg-white/10"
              @click="syncOpen = false">
              <X class="size-5" />
            </button>

            <h2 class="text-xl font-black text-white">Đồng bộ phim</h2>
            <p class="mt-1 text-sm text-slate-400">Chọn nguồn để đồng bộ phim vào hệ thống</p>

            <div class="mt-5 space-y-3">
              <label class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">OPhim</p>
                  <p class="text-xs text-slate-400">ophim1.com</p>
                </div>
                <AdminToggle v-model="syncSources.ophim" />
              </label>

              <label class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">NguonC</p>
                  <p class="text-xs text-slate-400">phim.nguonc.com</p>
                </div>
                <AdminToggle v-model="syncSources.nguonc" />
              </label>

              <label class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">KKPhim</p>
                  <p class="text-xs text-slate-400">phimapi.com</p>
                </div>
                <AdminToggle v-model="syncSources.kkphim" />
              </label>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button"
                class="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                @click="syncOpen = false">
                Huỷ
              </button>
              <button type="button"
                class="inline-flex h-10 items-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
                :disabled="syncing || !Object.values(syncSources).some(Boolean)"
                @click="handleSync">
                <RefreshCw class="size-4" :class="syncing ? 'animate-spin' : ''" />
                {{ syncing ? 'Đang đồng bộ...' : 'Đồng bộ' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
