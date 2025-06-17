<template>
  <expansion-wrapper
    v-show="closestPlace"
    :normally-open="true"
  >
    <template #title>
      <strong>{{ closestPlace?.get_name() }}</strong>
    </template>
    
    <template #content>
      <div v-if="closestPlace instanceof Place">
        <div v-html="closestPlace.htmlDescription"></div> 
      </div>
    </template>
    
    <template #actions>
      <v-btn @click="showReadMore">Read More</v-btn>
    </template>
  </expansion-wrapper>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Place } from "@wwtelescope/engine";
// import { engineStore } from "@wwtelescope/engine-pinia";

interface Props {
  places: Place[];
  showReadMore?: boolean;
}

// const store = engineStore();

withDefaults(defineProps<Props>(), {
  showReadMore: true,
});

const closestPlace = ref<Place | null>(null);

</script>
