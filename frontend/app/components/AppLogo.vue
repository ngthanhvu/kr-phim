<script setup lang="ts">
const { settings, loadSettings } = useAppSettings()
onMounted(loadSettings)
</script>

<template>
  <NuxtLink to="/"
    class="group inline-flex h-8 min-w-24 shrink-0 flex-row flex-nowrap items-center gap-2 whitespace-nowrap sm:h-10 sm:min-w-29.5 sm:gap-2.5"
    :aria-label="settings?.siteName || 'CineK'">
    <!-- Custom logo image or default icon -->
    <span v-if="settings?.siteLogo" class="shrink-0 overflow-hidden rounded-lg sm:h-10 sm:w-32">
      <img :src="settings.siteLogo" :alt="settings.siteName || 'CineK'" class="h-full w-auto object-contain">
    </span>
    <span v-else
      class="grid size-7 shrink-0 place-items-center rounded-lg border border-yellow-200/80 bg-black/30 text-white shadow-lg shadow-black/20 transition group-hover:border-yellow-300 group-hover:text-yellow-200 sm:size-9">
      <AppIcon name="play" class="ml-0.5 size-4 fill-current sm:size-5" />
    </span>
    <!-- Text logo -->
    <span v-if="!settings?.siteLogo" class="inline-flex items-baseline text-xl font-black leading-none tracking-normal sm:text-2xl">
      <span class="text-white">Cine</span><span class="text-yellow-300">K</span>
    </span>
  </NuxtLink>
</template>
