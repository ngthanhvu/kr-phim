<script setup lang="ts">
import { Play } from 'lucide-vue-next'
</script>

<template>
  <NuxtLink
    to="/"
    class="group inline-flex h-8 min-w-[100px] shrink-0 flex-row flex-nowrap items-center gap-2 whitespace-nowrap sm:h-10 sm:min-w-[132px] sm:gap-2.5"
    aria-label="KR PHIM"
  >
    <span class="grid size-7 shrink-0 place-items-center rounded-lg border border-emerald-200/80 bg-black/30 text-white shadow-lg shadow-black/20 transition group-hover:border-emerald-300 group-hover:text-emerald-200 sm:size-9">
      <Play class="ml-0.5 size-4 fill-current sm:size-5" />
    </span>
    <span class="inline-flex items-baseline text-xl font-black uppercase leading-none tracking-tight sm:text-2xl">
      <span class="text-emerald-300">KR</span><span class="text-white">PHIM</span>
    </span>
  </NuxtLink>
</template>
