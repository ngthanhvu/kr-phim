<script setup lang="ts">
import { Save, Settings as SettingsIcon } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Cài đặt - CineK Admin',
})

const siteName = ref('CineK')
const siteDescription = ref('Xem phim Hàn Quốc online với phụ đề Vietsub')
const maintenanceMode = ref(false)
const allowRegistration = ref(true)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-black text-white">Cài đặt</h1>
      <p class="mt-1 text-sm text-slate-400">Quản lý cài đặt hệ thống CineK</p>
    </div>

    <div class="space-y-6">
      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
        <div class="mb-5 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-lg bg-yellow-400/10">
            <SettingsIcon class="size-4 text-yellow-400" />
          </div>
          <div>
            <h2 class="text-lg font-black text-white">Cài đặt chung</h2>
            <p class="text-sm text-slate-400">Thông tin cơ bản về website</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-semibold text-white">Tên website</label>
            <input v-model="siteName" type="text"
              class="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-yellow-400/50">
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-white">Mô tả website</label>
            <textarea v-model="siteDescription" rows="3"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50"></textarea>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
        <h2 class="mb-5 text-lg font-black text-white">Tùy chọn hệ thống</h2>

        <div class="space-y-4">
          <label class="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4 transition hover:border-white/10">
            <div>
              <p class="text-sm font-semibold text-white">Chế độ bảo trì</p>
              <p class="mt-1 text-xs text-slate-400">Tạm thời tắt website để bảo trì</p>
            </div>
            <input v-model="maintenanceMode" type="checkbox"
              class="h-5 w-5 cursor-pointer rounded border-white/20 bg-white/5 text-yellow-400 focus:ring-yellow-400/50">
          </label>

          <label class="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4 transition hover:border-white/10">
            <div>
              <p class="text-sm font-semibold text-white">Cho phép đăng ký</p>
              <p class="mt-1 text-xs text-slate-400">Cho phép người dùng mới đăng ký tài khoản</p>
            </div>
            <input v-model="allowRegistration" type="checkbox"
              class="h-5 w-5 cursor-pointer rounded border-white/20 bg-white/5 text-yellow-400 focus:ring-yellow-400/50">
          </label>
        </div>
      </div>

      <div class="flex justify-end">
        <button type="button"
          class="inline-flex h-10 items-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-black text-slate-950 transition hover:bg-yellow-300">
          <Save class="size-4" />
          Lưu thay đổi
        </button>
      </div>
    </div>
  </div>
</template>
