<script setup lang="ts">
export interface ApplicationProgressStep {
  title: string
  detail: string
  state?: 'current' | 'done' | 'rejected' | 'waiting'
}

withDefaults(defineProps<{
  title: string
  status: string
  tone?: 'success' | 'danger'
  steps: ApplicationProgressStep[]
}>(), { tone: 'success' })
</script>

<template>
  <section class="application-progress-summary" :class="tone">
    <div class="progress-heading" role="status" aria-live="polite">
      <span class="progress-icon" aria-hidden="true">{{ tone === 'danger' ? '!' : '✓' }}</span>
      <span class="progress-label">{{ status }}</span>
      <h1>{{ title }}</h1>
      <p class="progress-description"><slot /></p>
    </div>
    <ol class="approval-flow" aria-label="审批流程">
      <li v-for="(step, index) in steps" :key="index" :class="step.state" :aria-current="step.state === 'current' ? 'step' : undefined">
        <span class="step-number" aria-hidden="true">{{ index + 1 }}</span>
        <b>{{ step.title }}</b>
        <small>{{ step.detail }}</small>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.application-progress-summary { min-width: 0; text-align: center; }
.progress-icon { display: grid; place-items: center; width: 52px; height: 52px; margin: 0 auto var(--space-5, 20px); border-radius: 50%; background: var(--color-success); color: var(--color-on-primary); font-size: var(--text-3xl, 30px); }
.progress-label { display: inline-flex; border-radius: var(--radius-pill, 999px); padding: var(--space-1, 4px) var(--space-3, 12px); background: var(--color-success-subtle); color: var(--color-success); font-size: var(--text-xs, 12px); font-weight: var(--font-weight-bold, 700); }
.danger .progress-icon { background: var(--color-danger); }
.danger .progress-label { background: var(--color-danger-subtle); color: var(--color-danger); }
h1 { margin: 0; color: var(--color-text); font-size: var(--text-2xl, 24px); line-height: 1.35; }
.progress-description { margin: var(--space-3, 12px) 0 0; color: var(--color-text-secondary); line-height: 1.7; overflow-wrap: anywhere; }
.approval-flow { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr)); gap: var(--space-3, 12px); margin: var(--space-5, 20px) 0 0; padding: 0; list-style: none; text-align: left; }
.approval-flow li { min-width: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md, 8px); padding: var(--space-4, 16px); overflow-wrap: anywhere; }
.approval-flow li.current { border-color: var(--color-primary); background: var(--color-primary-subtle); }
.approval-flow li.rejected { border-color: var(--color-danger); background: var(--color-danger-subtle); }
.step-number { display: grid; place-items: center; width: var(--space-6, 24px); height: var(--space-6, 24px); margin-bottom: var(--space-3, 12px); border-radius: 50%; background: var(--color-surface-muted); color: var(--color-text-secondary); font-size: var(--text-xs, 12px); font-weight: var(--font-weight-bold, 700); }
.done .step-number { background: var(--color-success-subtle); color: var(--color-success); }
.approval-flow b, .approval-flow small { display: block; }
.approval-flow small { margin-top: var(--space-2, 8px); color: var(--color-text-secondary); font-size: var(--text-xs, 12px); }
</style>
