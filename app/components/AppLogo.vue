<script setup lang="ts">
import { Play } from 'lucide-vue-next'
</script>

<template>
  <NuxtLink
    to="/"
    class="group inline-flex h-10 min-w-[132px] shrink-0 flex-row flex-nowrap items-center gap-2.5 whitespace-nowrap"
    aria-label="KR PHIM"
  >
    <span class="grid size-9 shrink-0 place-items-center rounded-lg border border-sky-200/80 bg-black/30 text-white shadow-lg shadow-black/20 transition group-hover:border-sky-300 group-hover:text-sky-200">
      <Play class="ml-0.5 size-5 fill-current" />
    </span>
    <span class="inline-flex items-baseline text-2xl font-black uppercase leading-none tracking-tight">
      <span class="text-sky-300">KR</span><span class="text-white">PHIM</span>
    </span>
  </NuxtLink>
</template>
