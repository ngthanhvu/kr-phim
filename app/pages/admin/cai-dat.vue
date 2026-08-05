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
  <div>
    <div class="mb-6">
      <h1 class="admin-section-title">Cài đặt</h1>
      <p class="admin-section-subtitle mt-1">Quản lý cài đặt hệ thống CineK</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <div class="admin-card p-5">
          <div class="mb-5 flex items-center gap-3">
            <div class="grid size-11 place-items-center rounded-xl bg-yellow-400/10">
              <AppIcon name="settings" class="size-5 text-yellow-400" />
            </div>
            <div>
              <h2 class="text-lg font-black text-white">Cài đặt chung</h2>
              <p class="text-sm text-slate-400">Thông tin cơ bản về website</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-semibold text-white">Tên website</label>
              <input v-model="siteName" type="text" class="admin-input">
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-white">Mô tả website</label>
              <textarea v-model="siteDescription" rows="3"
                class="w-full rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-yellow-400/50 focus:bg-white/5 focus:ring-2 focus:ring-yellow-400/20"></textarea>
            </div>
          </div>
        </div>

        <div class="admin-card p-5">
          <h2 class="mb-5 text-lg font-black text-white">Tùy chọn hệ thống</h2>

          <div class="space-y-3">
            <label class="flex cursor-pointer items-center justify-between rounded-xl border border-white/6 bg-white/3 p-4 transition hover:border-white/10 hover:bg-white/5">
              <div>
                <p class="text-sm font-bold text-white">Chế độ bảo trì</p>
                <p class="mt-1 text-xs text-slate-400">Tạm thời tắt website để bảo trì</p>
              </div>
              <AdminToggle v-model="maintenanceMode" />
            </label>

            <label class="flex cursor-pointer items-center justify-between rounded-xl border border-white/6 bg-white/3 p-4 transition hover:border-white/10 hover:bg-white/5">
              <div>
                <p class="text-sm font-bold text-white">Cho phép đăng ký</p>
                <p class="mt-1 text-xs text-slate-400">Cho phép người dùng mới đăng ký tài khoản</p>
              </div>
              <AdminToggle v-model="allowRegistration" />
            </label>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="button" class="admin-btn-primary">
            <AppIcon name="save" class="size-4" />
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div class="space-y-6">
        <div class="admin-card-gradient p-5">
          <h3 class="mb-2 text-lg font-black text-white">Cần giúp đỡ?</h3>
          <p class="text-sm leading-relaxed text-slate-400">
            Các cài đặt này ảnh hưởng đến toàn bộ hệ thống. Hãy cẩn thận khi thay đổi chế độ bảo trì.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
