<template>
  <div class="infobox">
    <v-overlay
      v-if="small"
      absolute
      opacity="0.6"
      class="infobox-overlay"
      scrim="#00000030"
    >
      <template #activator="{ props: activatorProps }">
        <strong
          v-bind="activatorProps"
          class="infobox-mobile infobox-activator"
        >
          {{ place?.get_name() }}
        </strong>
      </template>
      <template #default>
        <article
          class="infobox-mobile infobox-content"
          v-html="place?.htmlDescription"
        >
        </article>
      </template>
    </v-overlay>
    <expansion-wrapper
      class="infobox-content"
      v-else-if="place != null"
      :normally-open="false"
      :title="place.get_name()"
    >
      <template #content>
        <div v-html="place.htmlDescription"></div> 
      </template>
    </expansion-wrapper>
  </div>
</template>

<script setup lang="ts">
import { Place } from "@wwtelescope/engine";

interface Props {
  place: Place | null;
  showReadMore?: boolean;
  small?: boolean;
}

withDefaults(defineProps<Props>(), {
  showReadMore: true,
  small: false,
});
</script>

<style scoped lang="less">
.infobox-overlay {
  align-items: center;
  justify-content: center;
  transition: width 0.5s, height 0.5s;
}

.infobox-mobile {
  background: #00000080;
  background: rgba(var(--v-theme-surface-variant), .9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  padding: 5px;
}

.infobox-content {
  pointer-events: auto;
  overflow-y: auto;
}

.infobox-mobile.infobox-content {
  margin: auto;
  max-width: 75%;
  max-height: 75vh;
}
</style>
