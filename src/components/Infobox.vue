<template>
  <expansion-wrapper
    v-if="place != null"
    class="infobox"
    :normally-open="true"
  >
    <template #title>
      <strong>{{ place?.get_name() }}</strong>
    </template>
    
    <template #content>
      <div v-html="place.htmlDescription"></div> 
    </template>
    
    <template #actions>
      <v-btn
        v-show="showReadMore"
        @click="readMoreClicked"
      >Read More</v-btn>
    </template>
  </expansion-wrapper>
</template>

<script setup lang="ts">
import { Place } from "@wwtelescope/engine";

interface Props {
  place: Place | null;
  showReadMore?: boolean;
}

withDefaults(defineProps<Props>(), {
  showReadMore: true,
});

const emit = defineEmits<{
  (event: "read-more"): void
}>();

function readMoreClicked() {
  emit("read-more");
}
</script>
