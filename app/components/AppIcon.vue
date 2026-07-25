<script setup lang="ts">
import type { IconName } from '~/lib/icons'
import { getIcon } from '~/lib/icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps<{
  name: IconName
  class?: string
}>()

const icon = computed(() => getIcon(props.name))
</script>

<template>
  <FontAwesomeIcon :icon="icon" :class="props.class" />
</template>
