<script setup lang="ts">
import { Clock3, Heart, Mail, UserRound } from 'lucide-vue-next'

const { user, loading, initAuth } = useSupabaseAuth()

const defaultAvatar = 'https://thumbs.dreamstime.com/b/avatar-vietnam-character-your-project-others-avatar-vietnam-character-274539000.jpg'
const memberName = computed(() => {
  const metadata = user.value?.user_metadata || {}
  const name = metadata.name || metadata.full_name || metadata.user_name
  if (typeof name === 'string' && name.trim()) return name.trim()
  return user.value?.email?.split('@')[0] || 'Thành viên'
})

const memberAvatar = computed(() => {
  const metadata = user.value?.user_metadata || {}
  return typeof metadata.avatar_url === 'string' && metadata.avatar_url ? metadata.avatar_url : defaultAvatar
})

onMounted(() => {
  initAuth()
})

useHead({
  title: 'Trang cá nhân - KR Phim',
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <AppHeader />

    <section class="mx-auto max-w-390 px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32 xl:px-10">
      <div class="mb-6">
        <p class="text-sm font-black uppercase text-emerald-300">Thành viên</p>
        <h1 class="mt-2 text-3xl font-black sm:text-4xl">Trang cá nhân</h1>
      </div>

      <div v-if="loading" class="rounded-lg border border-white/10 bg-white/6 p-5">
        <div class="h-24 animate-pulse rounded-md bg-white/10" />
      </div>

      <div v-else-if="user" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="rounded-lg border border-white/10 bg-white/6 p-5 sm:p-6">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img :src="memberAvatar" :alt="memberName"
              class="size-24 shrink-0 rounded-full object-cover ring-4 ring-emerald-300/30">
            <div class="min-w-0">
              <h2 class="truncate text-2xl font-black">{{ memberName }}</h2>
              <p class="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Mail class="size-4 text-emerald-300" />
                {{ user.email }}
              </p>
              <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                Tài khoản này dùng để đồng bộ lịch sử xem và các dữ liệu cá nhân của bạn trên KR Phim.
              </p>
            </div>
          </div>
        </section>

        <aside class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <NuxtLink to="/lich-su"
            class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/6 p-4 transition hover:bg-white/10">
            <span class="grid size-10 place-items-center rounded-md bg-emerald-300 text-slate-950">
              <Clock3 class="size-5" />
            </span>
            <span>
              <span class="block font-black">Lịch sử xem</span>
              <span class="text-sm text-slate-400">Xem tiếp phim đang dở</span>
            </span>
          </NuxtLink>
          <NuxtLink to="/yeu-thich"
            class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/6 p-4 transition hover:bg-white/10">
            <span class="grid size-10 place-items-center rounded-md bg-white/10 text-emerald-300">
              <Heart class="size-5 fill-current" />
            </span>
            <span>
              <span class="block font-black">Yêu thích</span>
              <span class="text-sm text-slate-400">Phim bạn đã lưu</span>
            </span>
          </NuxtLink>
        </aside>
      </div>

      <div v-else class="rounded-lg border border-white/10 bg-white/6 p-6">
        <UserRound class="size-10 text-emerald-300" />
        <h2 class="mt-4 text-xl font-black">Bạn chưa đăng nhập</h2>
        <p class="mt-2 text-sm leading-6 text-slate-300">
          Bấm nút Thành viên trên header để đăng nhập hoặc đăng ký tài khoản.
        </p>
      </div>
    </section>
  </main>
</template>
