<script setup lang="ts">
const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator color="#facc15" :height="2" />
  <NuxtLayout>
    <NuxtPage :key="$route.fullPath" />
  </NuxtLayout>
  <AppFooter v-if="!isAdmin" />
  <ScrollToTop v-if="!isAdmin" />
</template>
