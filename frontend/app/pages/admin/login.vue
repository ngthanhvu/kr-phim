<script setup lang="ts">
import { apiFetch } from '~/utils/api'

const { settings, loadSettings } = useAppSettings()
onMounted(loadSettings)

definePageMeta({
  layout: false,
  middleware: [],
})

useHead({
  title: `Đăng nhập ${settings?.siteName || 'CineK'} - Admin`,
})

onMounted(async () => {
  await loadSettings()
  const { user, fetchUser } = useAuth()
  await fetchUser()
  if (user.value?.role === 'admin') {
    navigateTo('/admin')
  }
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const data: any = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })

    if (data?.token) {
      localStorage.setItem('auth_token', data.token)
    }

    if (data?.user?.role === 'admin') {
      const { fetchUser } = useAuth()
      await fetchUser()
      window.location.href = '/admin'
    } else {
      error.value = 'Tài khoản không có quyền admin'
    }
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Đăng nhập thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-zinc-50 p-4">
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-zinc-100/20 via-transparent to-transparent" />
    <div class="relative w-full max-w-md">
      <div class="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg">
        <div class="mb-8 text-center">
          <div class="mb-4 inline-flex items-center gap-3">
            <div class="grid size-12 place-items-center rounded-xl bg-zinc-950">
              <span class="text-xl font-black text-white">C</span>
            </div>
            <div class="text-left">
              <span class="block text-2xl font-bold tracking-tight text-zinc-900">{{ settings?.siteName || 'CineK' }} Admin</span>
              <span class="text-xs text-zinc-500">Quản lý hệ thống</span>
            </div>
          </div>
          <p class="text-sm text-zinc-500">Đăng nhập để tiếp tục</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Email</label>
              <div class="relative">
                <AppIcon name="mail" class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input v-model="email" type="email" required placeholder="admin@cinek.vn"
                  class="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400" />
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-zinc-700">Mật khẩu</label>
              <div class="relative">
                <AppIcon name="lock" class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="6"
                  placeholder="Nhập mật khẩu"
                  class="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-10 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition placeholder:text-zinc-400">
                <button type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600"
                  @click="showPassword = !showPassword">
                  <AppIcon name="eye-off" v-if="showPassword" class="size-4" />
                  <AppIcon name="eye" v-else class="size-4" />
                </button>
              </div>
            </div>
          </div>

          <button type="submit"
            class="mt-6 w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 active:bg-zinc-900 disabled:opacity-50"
            :disabled="loading">
            <AppIcon name="log-in" class="size-4 mr-2 inline" />
            {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </button>

          <p v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
            {{ error }}
          </p>
        </form>
      </div>

      <p class="mt-6 text-center text-xs text-zinc-400">
        Chỉ tài khoản admin mới có quyền truy cập.
      </p>
    </div>
  </div>
</template>
