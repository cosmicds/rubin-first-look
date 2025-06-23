<script setup lang="ts">
//  eslint-disable @typescript-eslint/no-unused-vars 
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
// type Radian = number;
type HourAngle = number;
// type Pixel = number;
const D2R = Math.PI / 180;
// const R2D = 180 / Math.PI;
interface WWTTrackedContentProps {
  containerID?: string;
  ra?: Degree;
  dec?: Degree;
  name?: string
  place?: Place; // Optional place object, if needed
  offsetRa?: Degree;
  offsetDec?: Degree;
  offsetX?: Degree; // Degree offset in the screen X direction
  offsetY?: Degree; // Degree offset in the screen Y direction
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
  visible: true,
  containerID: '',
  centerOnClick: false,
  zoomDeg: null, // use current zoom level if not provided
  clickInstant: false,
  doubleClickInstant: true,
  place: undefined,
  goToPlace: false,
  debug: false,
  name: 'default name',
});

const ra = ref<number>(props.ra as unknown as number);
const dec = ref<number>(props.dec as unknown as number);
const name = ref(props.name);
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
        raRad: ra.value * (D2R), 
        decRad: dec.value * (D2R), 
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

const _rot = computed(() => {
  return {'sin': Math.sin(props.store.rollRad), 'cos': Math.cos(props.store.rollRad)};
});

if (props.offsetX !== undefined && props.offsetY !== undefined) {
  console.error('While supported, I am not sure the he simple 2D rotation transforms for offsetX and offsetY are correct.');
}


// This will get
const offsetRA = ref<Degree>(props.offsetRa ?? 0);
const offsetDec = ref<Degree>(props.offsetDec ?? 0);

if (props.offsetX !== undefined && props.offsetY !== undefined ) {
  // throw and error and return if offsetX and offsetY are provided
  console.error('offsetX and offsetY ARE not setup. Rotate the coordinates before passing them to the component.');
  throw new Error('offsetX and offsetY are not supported yet. Please use offsetRa and offsetDec instead.');
}


// If we want it maintain the same orientation relative to the Screen we need to use this
// const offsetRA = computed(() => {
//   if (props.offsetX !== undefined && props.offsetY !== undefined ) {
//     return (props.offsetX)  * rot.value.cos + props.offsetY * rot.value.sin;
//   }
//   return props.offsetRa ?? 0;
// });

// const offsetDec = computed(() => {
//   if (props.offsetX !== undefined && props.offsetY !== undefined ) {
//     return -(props.offsetX) * rot.value.sin + props.offsetY * rot.value.cos;
//   }
//   return props.offsetDec ?? 0;
// });

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

watch(() => [props.ra, props.dec, offsetRA.value, offsetDec.value], ([newRa, newDec, newOffsetRA, newOffsetDec]) => {
  if (!trackedElement.value) return;
  trackedElement.value.move({
    ra: (newRa ?? ra.value) + (newOffsetRA ?? offsetRA.value),
    dec: (newDec ?? dec.value) + (newOffsetDec ?? offsetDec.value)
  });
  if (ready.value && ute.value) {
    ute.value.updateElements();
  }
}, { immediate: true });


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const slots = defineSlots<{
  default: { 
    on: {
      click: (event: MouseEvent) => void,
      'keydown.enter': (event: KeyboardEvent) => void
    },
  };
}>();


</script>

<template>
  <div 
    class="wwt-tracked-content" 
    ref="parent" 
    tabindex="0" 

    >
    <slot 
      :on="{'click': onClick, 'onDoubleClick': onDoubleClick, 'keydown.enter': onClick}" 
      :ra="ra" 
      :dec="dec" 
      :_name="name"
      :offsetDec="offsetDec" 
      :offsetRa="offsetRA"
      >
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
  background-color: transparent;
  border: 2px solid red;
  transform: translate(-50%, -50%);
}

</style>
