<script setup lang="ts">
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: [],
})

useHead({
  title: 'Đăng nhập Admin - CineK',
})

const { data: currentUser } = await useFetch('/api/auth/me', {
  headers: useRequestHeaders(['cookie']),
})

if (currentUser.value?.role === 'admin') {
  await navigateTo('/admin')
}

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })

    if (data.value?.user?.role === 'admin') {
      await navigateTo('/admin')
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
  <div class="flex min-h-screen items-center justify-center bg-slate-950 p-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mb-4 inline-flex items-center gap-2">
          <div class="grid size-10 place-items-center rounded-xl bg-yellow-400">
            <span class="text-lg font-black text-slate-950">C</span>
          </div>
          <span class="text-2xl font-black text-white">CineK Admin</span>
        </div>
        <p class="text-sm text-slate-400">Đăng nhập để quản lý hệ thống</p>
      </div>

      <div class="rounded-xl border border-white/10 bg-slate-900/50 p-6">
        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-semibold text-white">Email</label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input v-model="email" type="email" required placeholder="admin@cinek.vn"
                  class="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-white">Mật khẩu</label>
              <div class="relative">
                <LockKeyhole class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="6"
                  placeholder="Nhập mật khẩu"
                  class="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                <button type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  @click="showPassword = !showPassword">
                  <EyeOff v-if="showPassword" class="size-4" />
                  <Eye v-else class="size-4" />
                </button>
              </div>
            </div>
          </div>

          <button type="submit"
            class="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
            :disabled="loading">
            <LogIn class="size-4" />
            {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </button>

          <p v-if="error" class="mt-4 rounded-lg bg-red-500/12 p-3 text-center text-sm text-red-300">
            {{ error }}
          </p>
        </form>
      </div>

      <p class="mt-6 text-center text-xs text-slate-500">
        Chỉ tài khoản admin mới có quyền truy cập.
      </p>
    </div>
  </div>
</template>
