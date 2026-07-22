<script setup lang="ts">
import { Clock3, Heart, Mail, UserRound } from 'lucide-vue-next'

const authOpen = ref(false)
const { user, logout: doLogout, fetchUser } = useAuth()
await fetchUser()

const memberName = computed(() => {
  if (!user.value) return 'Thành viên'
  return user.value.name || user.value.email?.split('@')[0] || 'Thành viên'
})

const memberInitial = computed(() => memberName.value.charAt(0).toUpperCase())

async function handleLogout() {
  await doLogout()
}

useHead({
  title: 'Thành viên - CineK',
  meta: [
    {
      name: 'description',
      content: 'Quản lý tài khoản CineK, lịch sử xem và danh sách yêu thích.',
    },
  ],
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <AppHeader />

    <section class="mx-auto max-w-390 px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32 xl:px-10">
      <div class="mb-6">
        <p class="text-sm font-black uppercase text-yellow-300">Tài khoản</p>
        <h1 class="mt-2 text-3xl font-black sm:text-4xl">Thành viên</h1>
      </div>

      <div v-if="user" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="rounded-lg border border-white/10 bg-white/6 p-5 sm:p-6">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div class="grid size-24 shrink-0 place-items-center rounded-full bg-yellow-400/10 ring-4 ring-yellow-300/30">
              <span class="text-3xl font-black text-yellow-400">{{ memberInitial }}</span>
            </div>
            <div class="min-w-0">
              <h2 class="truncate text-2xl font-black">{{ memberName }}</h2>
              <p class="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Mail class="size-4 text-yellow-300" />
                {{ user.email }}
              </p>
              <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                Tài khoản CineK của bạn. Quản lý lịch sử xem và các phim yêu thích.
              </p>
              <button type="button"
                class="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-400/20"
                @click="handleLogout">
                Đăng xuất
              </button>
            </div>
          </div>
        </section>

        <aside class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <NuxtLink to="/lich-su"
            class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/6 p-4 transition hover:bg-white/10">
            <span class="grid size-10 place-items-center rounded-md bg-yellow-300 text-slate-950">
              <Clock3 class="size-5" />
            </span>
            <span>
              <span class="block font-black">Lịch sử xem</span>
              <span class="text-sm text-slate-400">Xem tiếp phim đang dở</span>
            </span>
          </NuxtLink>
          <NuxtLink to="/yeu-thich"
            class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/6 p-4 transition hover:bg-white/10">
            <span class="grid size-10 place-items-center rounded-md bg-white/10 text-yellow-300">
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
        <UserRound class="size-10 text-yellow-300" />
        <h2 class="mt-4 text-xl font-black">Bạn chưa đăng nhập</h2>
        <p class="mt-2 text-sm leading-6 text-slate-300">
          Đăng nhập hoặc đăng ký tài khoản để trải nghiệm đầy đủ các tính năng trên CineK.
        </p>
        <div class="mt-4">
          <button type="button"
            class="inline-flex h-10 items-center justify-center rounded-lg bg-yellow-300 px-5 text-sm font-black text-slate-950 transition hover:bg-white"
            @click="authOpen = true">
            Đăng nhập / Đăng ký
          </button>
        </div>
      </div>
    </section>

    <AuthModal v-model="authOpen" />
  </main>
</template>
