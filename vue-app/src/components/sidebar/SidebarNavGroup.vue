<template>
  <div class="nav-group" :data-group="groupKey">
    <div
      class="nav-item"
      :class="{ active }"
      :data-tip="group.label"
      role="button"
      tabindex="0"
      :aria-expanded="open ? 'true' : 'false'"
      @click="$emit('toggle', groupKey)"
      @keydown.enter.prevent="$emit('toggle', groupKey)"
      @keydown.space.prevent="$emit('toggle', groupKey)"
    >
      <span class="ni" v-html="group.icon"></span>
      <span>{{ group.label }}</span>
      <span class="arrow" :class="{ open }">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>

    <div class="nav-sub" :class="{ open }">
      <template v-for="(entry, index) in navigationEntries" :key="entry.key">
        <template v-if="entry.section">
          <div
            v-if="open"
            class="nav-item nav-section-toggle"
            :class="{ active: entry.pages.some(item => item.pageId === currentPageId) }"
            role="button"
            tabindex="0"
            :aria-expanded="openSections.has(entry.section) ? 'true' : 'false'"
            :aria-controls="`${groupKey}-section-${index}`"
            @click="toggleSection(entry.section)"
            @keydown.enter.prevent="toggleSection(entry.section)"
            @keydown.space.prevent="toggleSection(entry.section)"
          >
            <span>{{ entry.section }}</span>
            <span class="arrow" :class="{ open: openSections.has(entry.section) }">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
          <div
            v-if="open && openSections.has(entry.section)"
            :id="`${groupKey}-section-${index}`"
            class="nav-section-items"
          >
            <div
              v-for="{ page, pageId } in entry.pages"
              :key="pageId"
              class="nav-item"
              :class="{ active: currentPageId === pageId }"
              :aria-current="currentPageId === pageId ? 'page' : undefined"
              role="button"
              tabindex="0"
              @click="$emit('navigate', page.path, pageId)"
              @keydown.enter.prevent="$emit('navigate', page.path, pageId)"
              @keydown.space.prevent="$emit('navigate', page.path, pageId)"
            >
              <span>{{ page.label }}</span>
            </div>
          </div>
        </template>
        <div
          v-else
          class="nav-item"
          :class="{ active: currentPageId === entry.pageId }"
          role="button"
          tabindex="0"
          @click="$emit('navigate', entry.page.path, entry.pageId)"
          @keydown.enter.prevent="$emit('navigate', entry.page.path, entry.pageId)"
          @keydown.space.prevent="$emit('navigate', entry.page.path, entry.pageId)"
        >
          <span>{{ entry.page.label }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  groupKey: {
    type: String,
    required: true
  },
  currentPageId: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: false
  },
  open: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle', 'navigate'])

const navigationEntries = computed(() => {
  const entries = []
  const sections = new Map()
  for (const [pageId, page] of Object.entries(props.group.children || {})) {
    if (!page.section) {
      entries.push({ key: pageId, pageId, page })
      continue
    }
    if (!sections.has(page.section)) {
      const section = { key: `section:${page.section}`, section: page.section, pages: [] }
      sections.set(page.section, section)
      entries.push(section)
    }
    sections.get(page.section).pages.push({ pageId, page })
  }
  return entries
})

const openSections = ref(new Set())
watch(() => [props.currentPageId, props.group], () => {
  const section = props.group.children?.[props.currentPageId]?.section
  if (section) openSections.value = new Set([...openSections.value, section])
}, { immediate: true })

function toggleSection(section) {
  const next = new Set(openSections.value)
  if (next.has(section)) next.delete(section)
  else next.add(section)
  openSections.value = next
}
</script>

<style scoped>
.nav-section-items {
  margin-left: var(--space-3, 12px);
}
</style>
