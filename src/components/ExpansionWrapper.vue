<script setup lang="ts">

interface Props {
  title?: string;
  content?: string;
  normallyOpen?: boolean;
}

withDefaults(defineProps<Props>(), {
  normallyOpen: false,
});

</script>

<template>
  <details class="expansion-panel" :open="normallyOpen">
    <summary>
      <slot name="title" ><strong>{{ title }}</strong></slot>
    </summary>
    <article>
      <slot name="content">
        <div v-html="content"></div>
      </slot>
    </article>
    <div class="footer">
    <slot name="actions"></slot>
    </div>
  </details>
</template>

<style lang="less">
details.expansion-panel {
  background: #00000080;
  background: rgba(var(--v-theme-surface-variant), .7);
  color: inherit;
  font: inherit;
  cursor: pointer;
  border: 1px solid rgba(255,255,255, 0.3);
  padding: 10px 15px;
  border-radius: 5px;
  backdrop-filter: blur(5px);
}
details.expansion-panel > summary {
  list-style-position: outside;
  margin-left: 1em;
  // padding: 0.5em 0.5em;
  border-radius: 5px;
}

details.expansion-panel .footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 10px;
}
</style>
