<template>
  <svg class="agent-activity-icon" :data-activity-icon="resolvedName" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(path, index) in icon.paths" :key="index" :d="path" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { AGENT_ACTIVITY_ICONS } from '@/utils/agentActivityIcons'

const props = defineProps({ name: { type: String, default: 'wait' } })
const resolvedName = computed(() => Object.hasOwn(AGENT_ACTIVITY_ICONS, props.name) ? props.name : 'wait')
const icon = computed(() => AGENT_ACTIVITY_ICONS[resolvedName.value])
</script>

<style scoped>
.agent-activity-icon { display: block; width: var(--icon-sm, 16px); height: var(--icon-sm, 16px); flex-shrink: 0; }
</style>
