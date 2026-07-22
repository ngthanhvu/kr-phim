<script setup lang="ts">
import { BarChart3, Film, TrendingUp, Users } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Dashboard - CineK Admin',
})

const stats = [
  {
    label: 'Tổng phim',
    value: '1,234',
    change: '+12%',
    icon: Film,
    color: 'yellow',
  },
  {
    label: 'Thành viên',
    value: '5,678',
    change: '+8%',
    icon: Users,
    color: 'blue',
  },
  {
    label: 'Lượt xem hôm nay',
    value: '45,678',
    change: '+23%',
    icon: TrendingUp,
    color: 'green',
  },
  {
    label: 'Doanh thu tháng',
    value: '12.5M',
    change: '+15%',
    icon: BarChart3,
    color: 'purple',
  },
]

const recentMovies = [
  { name: 'Phim Hàn Quốc 1', views: 1234, status: 'active' },
  { name: 'Phim Hàn Quốc 2', views: 890, status: 'active' },
  { name: 'Phim Hàn Quốc 3', views: 2345, status: 'active' },
  { name: 'Phim Hàn Quốc 4', views: 567, status: 'draft' },
  { name: 'Phim Hàn Quốc 5', views: 1890, status: 'active' },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-black text-white">Dashboard</h1>
      <p class="mt-1 text-sm text-slate-400">Tổng quan hệ thống CineK</p>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label"
        class="rounded-xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-white/20">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400">{{ stat.label }}</p>
            <p class="mt-2 text-3xl font-black text-white">{{ stat.value }}</p>
            <p class="mt-2 text-sm font-semibold text-green-400">{{ stat.change }} tháng này</p>
          </div>
          <div class="grid size-11 place-items-center rounded-xl"
            :class="{
              'bg-yellow-400/10 text-yellow-400': stat.color === 'yellow',
              'bg-blue-400/10 text-blue-400': stat.color === 'blue',
              'bg-green-400/10 text-green-400': stat.color === 'green',
              'bg-purple-400/10 text-purple-400': stat.color === 'purple',
            }">
            <component :is="stat.icon" class="size-5" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-black text-white">Phim gần đây</h2>
          <NuxtLink to="/admin/phim" class="text-sm font-semibold text-yellow-400 hover:text-yellow-300">
            Xem tất cả
          </NuxtLink>
        </div>

        <div class="space-y-3">
          <div v-for="movie in recentMovies" :key="movie.name"
            class="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition hover:border-white/10">
            <div class="flex items-center gap-3">
              <div class="grid size-10 place-items-center rounded-lg bg-yellow-400/10">
                <Film class="size-4 text-yellow-400" />
              </div>
              <div>
                <p class="text-sm font-semibold text-white">{{ movie.name }}</p>
                <p class="text-xs text-slate-400">{{ movie.views.toLocaleString() }} lượt xem</p>
              </div>
            </div>
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="movie.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-slate-400/10 text-slate-400'">
              {{ movie.status === 'active' ? 'Hoạt động' : 'Nháp' }}
            </span>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-black text-white">Hoạt động gần đây</h2>
        </div>

        <div class="space-y-4">
          <div class="flex gap-3">
            <div class="grid size-8 shrink-0 place-items-center rounded-full bg-green-400/10">
              <Film class="size-3.5 text-green-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-white">
                <span class="font-semibold">Phim mới</span> đã được thêm
              </p>
              <p class="mt-1 text-xs text-slate-400">2 phút trước</p>
            </div>
          </div>

          <div class="flex gap-3">
            <div class="grid size-8 shrink-0 place-items-center rounded-full bg-blue-400/10">
              <Users class="size-3.5 text-blue-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-white">
                <span class="font-semibold">15 thành viên</span> mới đăng ký
              </p>
              <p class="mt-1 text-xs text-slate-400">1 giờ trước</p>
            </div>
          </div>

          <div class="flex gap-3">
            <div class="grid size-8 shrink-0 place-items-center rounded-full bg-yellow-400/10">
              <TrendingUp class="size-3.5 text-yellow-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-white">
                Lượt xem tăng <span class="font-semibold">23%</span> so với hôm qua
              </p>
              <p class="mt-1 text-xs text-slate-400">3 giờ trước</p>
            </div>
          </div>

          <div class="flex gap-3">
            <div class="grid size-8 shrink-0 place-items-center rounded-full bg-purple-400/10">
              <BarChart3 class="size-3.5 text-purple-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-white">
                Doanh thu tháng đạt <span class="font-semibold">12.5M</span>
              </p>
              <p class="mt-1 text-xs text-slate-400">5 giờ trước</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
