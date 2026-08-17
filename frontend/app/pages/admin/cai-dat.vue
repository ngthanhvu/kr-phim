<script setup lang="ts">
import { apiFetch } from '~/utils/api'
import { refreshAppSettings } from '~/composables/useAppSettings'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Cài đặt - CineK Admin',
})

const siteName = ref('')
const siteDescription = ref('')
const maintenanceMode = ref(false)
const allowRegistration = ref(true)
const siteLogo = ref('')
const siteFavicon = ref('/favicon.ico')
const contactEmail = ref('support@cinek.app')
const facebookUrl = ref('')
const telegramUrl = ref('')
const tiktokUrl = ref('')
const youtubeUrl = ref('')
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)

async function loadSettings() {
  loading.value = true
  try {
    const data: any = await apiFetch('/api/admin/settings')
    siteName.value = data.siteName || 'CineK'
    siteDescription.value = data.siteDescription || ''
    maintenanceMode.value = data.maintenanceMode === '1'
    allowRegistration.value = data.allowRegistration !== '0'
    siteLogo.value = data.siteLogo || ''
    siteFavicon.value = data.siteFavicon || '/favicon.ico'
    contactEmail.value = data.contactEmail || 'support@cinek.app'
    facebookUrl.value = data.facebookUrl || ''
    telegramUrl.value = data.telegramUrl || ''
    tiktokUrl.value = data.tiktokUrl || ''
    youtubeUrl.value = data.youtubeUrl || ''
  } catch (err) {
    console.error('Failed to load settings:', err)
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  saved.value = false
  try {
    await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        siteName: siteName.value,
        siteDescription: siteDescription.value,
        maintenanceMode: maintenanceMode.value,
        allowRegistration: allowRegistration.value,
        siteLogo: siteLogo.value,
        siteFavicon: siteFavicon.value,
        contactEmail: contactEmail.value,
        facebookUrl: facebookUrl.value,
        telegramUrl: telegramUrl.value,
        tiktokUrl: tiktokUrl.value,
        youtubeUrl: youtubeUrl.value,
      },
    })
    saved.value = true
    refreshAppSettings() // Broadcast to all tabs
    setTimeout(() => { saved.value = false }, 3000)
  } catch (err: any) {
    alert(err?.message || 'Lưu thất bại')
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-zinc-900">Cài đặt</h1>
      <p class="mt-1 text-sm text-zinc-500">Quản lý cài đặt hệ thống {{ siteName }}</p>
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
              <h2 class="text-lg font-semibold text-zinc-900">Thông tin website</h2>
              <p class="text-sm text-zinc-500">Tên, mô tả và thương hiệu</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Tên website</label>
              <input v-model="siteName" type="text"
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Mô tả website</label>
              <textarea v-model="siteDescription" rows="3"
                class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400"></textarea>
            </div>
          </div>
        </div>

        <!-- Logo & Favicon -->
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div class="mb-5 flex items-center gap-3">
            <div class="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600">
              <AppIcon name="image" class="size-5" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-zinc-900">Logo & biểu tượng</h2>
              <p class="text-sm text-zinc-500">Tùy chỉnh logo và favicon của website</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-lg border border-zinc-200 p-4">
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">URL Logo</label>
              <input v-model="siteLogo" type="url" placeholder="https://example.com/logo.png"
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
              <p v-if="siteLogo" class="mt-2">
                <img :src="siteLogo" alt="Logo preview" class="h-8 rounded-md border border-zinc-200 bg-white p-1 object-contain">
              </p>
            </div>

            <div class="rounded-lg border border-zinc-200 p-4">
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">URL Favicon</label>
              <input v-model="siteFavicon" type="url" placeholder="/favicon.ico hoặc https://..."
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
              <p v-if="siteFavicon" class="mt-2">
                <img :src="siteFavicon" alt="Favicon preview" class="h-6 w-6 rounded-md border border-zinc-200 bg-white p-1 object-contain">
              </p>
            </div>
          </div>
        </div>

        <!-- Social links -->
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div class="mb-5 flex items-center gap-3">
            <div class="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600">
              <AppIcon name="share-2" class="size-5" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-zinc-900">Liên kết mạng xã hội</h2>
              <p class="text-sm text-zinc-500">Các liên kết sẽ hiển thị ở footer</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Facebook</label>
              <input v-model="facebookUrl" type="url" placeholder="https://facebook.com/cinek"
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Telegram</label>
              <input v-model="telegramUrl" type="url" placeholder="https://t.me/cinek"
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">TikTok</label>
              <input v-model="tiktokUrl" type="url" placeholder="https://tiktok.com/@cinek"
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">YouTube</label>
              <input v-model="youtubeUrl" type="url" placeholder="https://youtube.com/@cinek"
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
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

        <!-- Contact email -->
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 class="mb-5 text-lg font-semibold text-zinc-900">Liên hệ hỗ trợ</h2>
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Email hỗ trợ</label>
              <input v-model="contactEmail" type="email"
                class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <span v-if="saved" class="text-sm text-emerald-600">Đã lưu thành công!</span>
          <button type="button" @click="saveSettings"
            class="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 active:bg-zinc-900 disabled:opacity-50"
            :disabled="saving || loading">
            <AppIcon name="check" v-if="saved" class="size-4" />
            <AppIcon name="save" v-else class="size-4" />
            {{ loading ? 'Đang tải...' : saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-5">
        <div class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 class="mb-2 text-lg font-semibold text-zinc-900">Cần giúp đỡ?</h3>
          <p class="text-sm leading-relaxed text-zinc-500">
            Các cài đặt này ảnh hưởng đến toàn bộ hệ thống. Thay đổi logo/favicon sẽ áp dụng ngay trên trang chủ.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
