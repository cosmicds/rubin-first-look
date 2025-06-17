<template>
  <expansion-wrapper
    v-if="show"
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
      <v-btn
        v-show="showReadMore"
        @click="readMoreClicked"
      >Read More</v-btn>
    </template>
  </expansion-wrapper>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { D2R, distance, H2R } from "@wwtelescope/astro";
import { Place, WWTControl } from "@wwtelescope/engine";
import { engineStore } from "@wwtelescope/engine-pinia";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { computed } from "vue";

interface Props {
  places: Place[];
  showReadMore?: boolean;
  zoomCutoff?: number;
}


const props = withDefaults(defineProps<Props>(), {
  zoomCutoff: 10,
  showReadMore: true,
});

const emit = defineEmits<{
  (event: "read-more"): void
}>();

const store = engineStore();
const { raRad, decRad, zoomDeg } = storeToRefs(store);

const closestPlace = ref<Place | null>(null);

function readMoreClicked() {
  emit("read-more");
}

function findClosest(places: Place[]): Place | null {
  let closestDist: number | null = null;
  let closest: Place | null = null;

  places.forEach(place => {
    const dist = distance(place.get_RA() * H2R, place.get_dec() * D2R, raRad.value, decRad.value);
    if ((!isNaN(dist)) && ((closestDist === null) || (dist < closestDist))) {
      closest = place;
      closestDist = dist;
    }
  });

  return closest !== null && placeInView(closest) ? closest : null;
}

function wwtSmallestFov() {
  const renderContext = WWTControl.singleton.renderContext;
  const fovH = renderContext.get_fovAngle() * D2R;
  const fovW = fovH * renderContext.width / renderContext.height;
  return Math.min(fovW, fovH);
}

function placeInView(place: Place, fraction=1/3): boolean {
  // checks if the center of place is in the current field of view
  // Assume the Zoom level corresponds to the size of the image
  // fraction_of_place is ~fraction of the place that must be in the current FOV
  // by default, allow 1/3 of the place to be visible and still be considered in view
  const iset = place.get_studyImageset() ?? place.get_backgroundImageset();
  if (iset == null) {
    return false;
  }

  const isetRa = iset.get_centerX() * D2R;
  const isetDec = iset.get_centerY() * D2R;
  const isetFov = (place.get_zoomLevel() / 6) * D2R;
  
  const curFov = wwtSmallestFov();

  const dist = distance(isetRa, isetDec, raRad.value, decRad.value) + (fraction - 0.5) * isetFov;
  return dist < curFov / 2;
}

const showFromZoom = computed(() => zoomDeg.value < props.zoomCutoff);
const show = computed(() => closestPlace.value !== null && showFromZoom.value);

function updateClosest() {
  if (!showFromZoom.value) {
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
