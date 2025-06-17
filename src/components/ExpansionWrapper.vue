<script setup lang="ts">
import { ref } from 'vue';


const props = defineProps({
  title: String,
  content: String,
  normallyOpen: { type: Boolean, default: false }
});


const panel = ref<string[]>([]);
function openPanel() {
  panel.value = ['panel'];
}

if (props.normallyOpen) {
  openPanel();
}


</script>

<template>
  <details class="expansion-panel" :open="normallyOpen">
    <summary>
      <slot name="title">{{ title }}</slot>
    </summary>
    
    <slot name="content">
      <div v-html="content"></div>
    </slot>
    
    <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
      <slot name="footer">
        <span style="color: #fff;">{{ title }}</span>
      </slot>
    <slot name="actions"></slot>
    </div>
  </details>
</template>

<style lang="less">
details.expansion-panel {
  border: none;
  background: #00000080;
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
</style>