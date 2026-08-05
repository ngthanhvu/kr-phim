<script setup lang="ts">
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
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0B0E] p-4">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%)]" />

    <div class="relative w-full max-w-md">
      <div class="rounded-3xl border border-white/[0.06] bg-[#131418]/80 p-1 shadow-2xl backdrop-blur-sm">
        <div class="rounded-[22px] bg-gradient-to-b from-white/[0.08] to-transparent p-6">
          <div class="mb-8 text-center">
            <div class="mb-4 inline-flex items-center gap-3">
              <div class="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-400/20">
                <span class="text-xl font-black text-slate-950">C</span>
              </div>
              <div class="text-left">
                <span class="block text-2xl font-black text-white">CineK Admin</span>
                <span class="text-xs text-slate-400">Quản lý hệ thống</span>
              </div>
            </div>
            <p class="text-sm text-slate-400">Đăng nhập để tiếp tục</p>
          </div>

          <form @submit.prevent="handleLogin">
            <div class="space-y-4">
              <div>
                <label class="mb-2 block text-sm font-semibold text-white">Email</label>
                <div class="relative">
                  <AppIcon name="mail" class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input v-model="email" type="email" required placeholder="admin@cinek.vn"
                    class="admin-input pl-10">
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-white">Mật khẩu</label>
                <div class="relative">
                  <AppIcon name="lock" class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="6"
                    placeholder="Nhập mật khẩu"
                    class="admin-input pl-10 pr-10">
                  <button type="button"
                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                    @click="showPassword = !showPassword">
                    <AppIcon name="eye-off" v-if="showPassword" class="size-4" />
                    <AppIcon name="eye" v-else class="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <button type="submit"
              class="admin-btn-primary mt-6 w-full"
              :disabled="loading">
              <AppIcon name="log-in" class="size-4" />
              {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
            </button>

            <p v-if="error" class="mt-4 rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-300">
              {{ error }}
            </p>
          </form>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-slate-500">
        Chỉ tài khoản admin mới có quyền truy cập.
      </p>
    </div>
  </div>
</template>
