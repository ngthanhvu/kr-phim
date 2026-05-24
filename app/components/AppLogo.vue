<script setup lang="ts">
import { Play } from 'lucide-vue-next'
</script>

<template>
  <NuxtLink to="/"
    class="group inline-flex h-8 min-w-24 shrink-0 flex-row flex-nowrap items-center gap-2 whitespace-nowrap sm:h-10 sm:min-w-29.5 sm:gap-2.5"
    aria-label="CineK">
    <span
      class="grid size-7 shrink-0 place-items-center rounded-lg border border-yellow-200/80 bg-black/30 text-white shadow-lg shadow-black/20 transition group-hover:border-yellow-300 group-hover:text-yellow-200 sm:size-9">
      <Play class="ml-0.5 size-4 fill-current sm:size-5" />
    </span>
    <span class="inline-flex items-baseline text-xl font-black leading-none tracking-normal sm:text-2xl">
      <span class="text-white">Cine</span><span class="text-yellow-300">K</span>
    </span>
  </NuxtLink>
</template>
