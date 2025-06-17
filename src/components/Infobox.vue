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
import { ref, watch } from "vue";
import { D2R, distance, H2R } from "@wwtelescope/astro";
import { Place } from "@wwtelescope/engine";
import { engineStore } from "@wwtelescope/engine-pinia";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

interface Props {
  places: Place[];
  showReadMore?: boolean;
  zoomCutoff?: number;
}


const props = withDefaults(defineProps<Props>(), {
  zoomCutoff: 10,
  showReadMore: true,
});

const store = engineStore();
const { raRad, decRad, zoomDeg } = storeToRefs(store);

const closestPlace = ref<Place | null>(null);

function findClosest(places: Place[]): Place | null {
  let closestDist: number | null = null;
  let closestPlace: Place | null = null;

  places.forEach(place => {
    const dist = distance(place.get_RA() * H2R, place.get_dec() * D2R, raRad.value, decRad.value);
    if ((!isNaN(dist)) && ((closestDist === null) || (dist < closestDist))) {
      closestPlace = place;
      closestDist = dist;
    }
  });

  return closestPlace;
}

function updateClosest() {
  if (zoomDeg.value > props.zoomCutoff) {
    closestPlace.value = null;
    return;
  }
  closestPlace.value = findClosest(props.places);
}

onMounted(updateClosest);

watch(raRad, (_ra: number) => updateClosest());
watch(decRad, (_dec: number) => updateClosest());
watch(zoomDeg, (_zoom: number) => updateClosest());
</script>
