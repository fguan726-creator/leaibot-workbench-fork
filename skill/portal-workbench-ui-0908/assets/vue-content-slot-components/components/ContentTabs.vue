<script setup lang="ts">
defineProps<{ items: Array<{ key: string; label: string; count?: number; disabled?: boolean }>; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [key: string] }>()
</script>

<template>
  <div class="cs-content-tabs" role="tablist">
    <button v-for="item in items" :key="item.key" class="cs-content-tabs__tab" :class="{ 'is-selected': item.key === modelValue }" type="button" role="tab" :aria-selected="item.key === modelValue" :disabled="item.disabled" @click="emit('update:modelValue', item.key)">
      {{ item.label }}<span v-if="item.count != null"> {{ item.count }}</span>
    </button>
  </div>
</template>
