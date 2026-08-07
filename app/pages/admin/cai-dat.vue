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
            <div class="grid size-11 place-items-center rounded-xl bg-sky-50">
              <AppIcon name="settings" class="size-5 text-sky-600" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900">Cài đặt chung</h2>
              <p class="text-sm text-slate-400">Thông tin cơ bản về website</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-semibold text-slate-900">Tên website</label>
              <input v-model="siteName" type="text" class="admin-input">
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-slate-900">Mô tả website</label>
              <textarea v-model="siteDescription" rows="3"
                class="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:bg-slate-100/60 focus:ring-2 focus:ring-sky-500/20"></textarea>
            </div>
          </div>
        </div>

        <div class="admin-card p-5">
          <h2 class="mb-5 text-lg font-black text-slate-900">Tùy chọn hệ thống</h2>

          <div class="space-y-3">
            <label class="flex cursor-pointer items-center justify-between rounded-xl border border-white/6 bg-slate-100 p-4 transition hover:border-white/10 hover:bg-slate-100/60">
              <div>
                <p class="text-sm font-bold text-slate-900">Chế độ bảo trì</p>
                <p class="mt-1 text-xs text-slate-400">Tạm thời tắt website để bảo trì</p>
              </div>
              <AdminToggle v-model="maintenanceMode" />
            </label>

            <label class="flex cursor-pointer items-center justify-between rounded-xl border border-white/6 bg-slate-100 p-4 transition hover:border-white/10 hover:bg-slate-100/60">
              <div>
                <p class="text-sm font-bold text-slate-900">Cho phép đăng ký</p>
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
          <h3 class="mb-2 text-lg font-black text-slate-900">Cần giúp đỡ?</h3>
          <p class="text-sm leading-relaxed text-slate-400">
            Các cài đặt này ảnh hưởng đến toàn bộ hệ thống. Hãy cẩn thận khi thay đổi chế độ bảo trì.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
