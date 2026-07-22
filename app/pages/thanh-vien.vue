<script setup lang="ts">
import { Clock3, Heart } from 'lucide-vue-next'

useHead({
  title: 'Thư viện - CineK',
  meta: [
    {
      name: 'description',
      content: 'Quản lý lịch sử xem, danh sách yêu thích và các phim muốn xem sau trên CineK.',
    },
  ],
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <AppHeader />

    <section class="mx-auto max-w-390 px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32 xl:px-10">
      <div class="mb-6">
        <p class="text-sm font-black uppercase text-yellow-300">Thư viện</p>
        <h1 class="mt-2 text-3xl font-black sm:text-4xl">Của bạn</h1>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
      </div>
    </section>
  </main>
</template>
