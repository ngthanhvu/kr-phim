<script setup lang="ts">
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
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-zinc-900">Cài đặt</h1>
      <p class="mt-1 text-sm text-zinc-500">Quản lý cài đặt hệ thống CineK</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="space-y-5 lg:col-span-2">
        <!-- General settings card -->
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div class="mb-5 flex items-center gap-3">
            <div class="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600">
              <AppIcon name="settings" class="size-5" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-zinc-900">Cài đặt chung</h2>
              <p class="text-sm text-zinc-500">Thông tin cơ bản về website</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Tên website</label>
              <input v-model="siteName" type="text"
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Mô tả website</label>
              <textarea v-model="siteDescription" rows="3"
                class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400"></textarea>
            </div>
          </div>
        </div>

        <!-- System options card -->
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 class="mb-5 text-lg font-semibold text-zinc-900">Tùy chọn hệ thống</h2>

          <div class="space-y-3">
            <label class="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-300 hover:bg-zinc-100">
              <div>
                <p class="text-sm font-semibold text-zinc-900">Chế độ bảo trì</p>
                <p class="mt-1 text-xs text-zinc-500">Tạm thời tắt website để bảo trì</p>
              </div>
              <AdminToggle v-model="maintenanceMode" />
            </label>

            <label class="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-300 hover:bg-zinc-100">
              <div>
                <p class="text-sm font-semibold text-zinc-900">Cho phép đăng ký</p>
                <p class="mt-1 text-xs text-zinc-500">Cho phép người dùng mới đăng ký tài khoản</p>
              </div>
              <AdminToggle v-model="allowRegistration" />
            </label>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 active:bg-zinc-900 disabled:opacity-50">
            <AppIcon name="save" class="size-4" />
            Lưu thay đổi
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-5">
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 class="mb-2 text-lg font-semibold text-zinc-900">Cần giúp đỡ?</h3>
          <p class="text-sm leading-relaxed text-zinc-500">
            Các cài đặt này ảnh hưởng đến toàn bộ hệ thống. Hãy cẩn thận khi thay đổi chế độ bảo trì.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
