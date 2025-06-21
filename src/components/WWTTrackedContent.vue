<script setup lang="ts">
/*  eslint-disable @typescript-eslint/no-unused-vars */
import { onMounted, ref, watch } from 'vue';
import { useTrackedElements, UseTrackedElementsReturn, TrackedHTMLElement } from '@/composables/useTrackedElements';

import { Place } from '@wwtelescope/engine';
import { engineStore } from '@wwtelescope/engine-pinia';
import { computed } from 'vue';
interface WWTEngineStore extends ReturnType<typeof engineStore> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $wwt?: any;
}

type Degree = number;
type Radian = number;
type HourAngle = number;
type Pixel = number;

interface WWTTrackedContentProps {
  containerID?: string;
  ra?: Degree;
  dec?: Degree;
  name?: string
  place?: Place; // Optional place object, if needed
  offsetRA?: Degree;
  offsetDec?: Degree;
  store: WWTEngineStore;
  visible?: boolean;
  centerOnClick?: boolean;
  zoomDeg?: Degree | null; // Optional zoom level, if needed
  clickInstant?: boolean; // Optional, if you want to control the instant navigation
  doubleClickInstant?: boolean; // Optional, if you want to control the instant navigation
  goToPlace?: boolean; // Optional, if you want it to go to the place and ignore zoomDeg
  debug?: boolean; // Optional, for debugging purposes
}

const props = withDefaults(defineProps<WWTTrackedContentProps>(), {
  offsetRA: 0,
  offsetDec: 0,
  visible: true,
  containerID: '',
  centerOnClick: false,
  zoomDeg: null, // use current zoom level if not provided
  clickInstant: false,
  doubleClickInstant: true,
  place: undefined,
  goToPlace: false,
  debug: false,
});

const ra = ref(props.ra);
const dec = ref(props.dec);
const name = ref(props.name);
const offsetRA = ref(props.offsetRA);
const offsetDec = ref(props.offsetDec);
const zoomDeg = computed(() => {
  return props.zoomDeg !== null ? props.zoomDeg : props.store.zoomDeg;
});

if (props.place) {
  const iset = props.place.get_backgroundImageset() ?? props.place.get_studyImageset();
  
  if (iset === null) {
    console.warn(`Place ${props.place.get_name()} does not have a background or study imageset.`);
  } else {
    ra.value = (props.place.get_RA() as HourAngle) * 15 as Degree;
    dec.value = props.place.get_dec();
    name.value = props.name ?? iset.get_name();
  }
}


const ready = ref(false);
const parent = ref<HTMLElement | null>(null);
const trackedElement = ref<TrackedHTMLElement | null>(null);

function goTo(instant=false) {
  if (ready.value && trackedElement.value !== null) {
    console.log("Current zoomDeg", zoomDeg.value);
    console.log("Current wwt zoomDeg", props.store.zoomDeg);
    if (props.place && props.goToPlace) {
      props.store.gotoTarget({
        place: props.place,
        instant,
        noZoom: false,
        trackObject: true,
      });
      
    } else if (ra.value && dec.value) {
      props.store.gotoRADecZoom({
        raRad: ra.value * (Math.PI / 180), 
        decRad: dec.value * (Math.PI / 180), 
        zoomDeg: zoomDeg.value,
        instant: false,
      });
    }
    
  }
}

function onClick() {
  if (props.centerOnClick && ready.value && trackedElement.value !== null) {
    goTo(props.clickInstant);
  }
}

function onDoubleClick() {
  if (props.centerOnClick && ready.value && trackedElement.value !== null) {
    goTo(props.doubleClickInstant);
  }
}

const ute = ref<UseTrackedElementsReturn | null>(null);


onMounted(() => {
  props.store.waitForReady().then(() => {
    ute.value = useTrackedElements(props.containerID, props.store) as unknown as typeof ute.value;
    if (!ute.value) {
      console.error('useTrackedElements returned null');
      return;
    }
    trackedElement.value = ute.value.placeElement(
      parent.value as HTMLElement | null,
      {
        ra: ra.value + offsetRA.value,
        dec: dec.value + offsetDec.value
      },
      name.value
    );
    updateVisibility(props.visible);
  })
    .then(() => {
      ready.value = true;
    })
    .catch((error) => {
      console.error(error);
    });
});

function updateVisibility(visible: boolean) {
  const element = trackedElement.value;
  if (element) {
    element.style.visibility = visible ? "visible" : "hidden";
  }
}

watch(() => props.visible, updateVisibility);

watch(() => [props.ra, props.dec], ([newRa, newDec]) => {
  if (!trackedElement.value) return;
  trackedElement.value.trackedData.dec = newDec + offsetDec.value;
  trackedElement.value.trackedData.ra = newRa + offsetRA.value;
  if (ready.value && ute.value) {
    ute.value.updateElements();
  }
}, { immediate: true });




const slots = defineSlots<{
  default: { on: Record<string, (event: Event) => void> };
}>();


</script>

<template>
  <div 
    class="wwt-tracked-content" 
    ref="parent" 
    tabindex="0" 

    >
    <slot :on="{'click': onClick, 'onDoubleClick': onDoubleClick, 'keydown.enter': onClick}" >
      <div 
        :class="['default-wwt-tracked-content-content', { debug: debug }]" 
        @click="onClick" 
        @dblclick="onDoubleClick" 
        @keydown.enter="onClick"
      >
      </div>
    </slot>
    <div v-if="debug" class="tracking-debug-circle tracked-element" ></div>
      
  </div>
</template>

<style lang="less">
.wwt-tracked-content {
  pointer-events: auto;
  user-select: none;
  cursor: pointer;
}

.wwt-tracked-content.debug {
  outline: 1px solid red;
}

.default-wwt-tracked-content-content {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
}

.tracking-debug-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: red;
  // transform: translate(-50%, -50%);
}

</style>
