<template>
  <div ref="root">
    <canvas class="scalebar-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { engineStore } from "@wwtelescope/engine-pinia";

interface ScalebarProps {
  breakpoints: [number, string][];
  height?: number;
  width?: number;
}

const text = ref<string | null>(null);
const root = ref<HTMLElement | null>(null);
let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;

const store = engineStore();
const { raRad, decRad, zoomDeg, rollRad } = storeToRefs(store);

const props = withDefaults(defineProps<ScalebarProps>(), {
  height: 40,
  width: 100,
});

let breakpoints = [...props.breakpoints].sort((first, second) => second[0] - first[0]);


function update() {
  const breakpoint = breakpoints.find(bkpt => bkpt[0] < zoomDeg.value);
  text.value = breakpoint?.["1"] ?? null;

  const worldDistance = breakpoint[0];
  const screenPoint = store.findScreenPointForRADec({ ra: raRad.value + worldDistance, dec: decRad.value });
  const screenDistance = Math.sqrt(screenPoint.x ** 2 + screenPoint.y ** 2);

  const context = getContext();
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function getCanvas(): HTMLCanvasElement {
  if (!canvas) {
    const rootElement = root.value;
    canvas = rootElement.querySelector(".scalebar-canvas") as HTMLCanvasElement;
  }
  return canvas;
}

function getContext(): CanvasRenderingContext2D {
  return context ?? getCanvas().getContext("2d");
}

function setCanvasDimensions() {
  canvas = getCanvas();
  canvas.style.width = `${props.width}px`;
  canvas.width = props.width;
  canvas.style.height = `${props.height}px`;
  canvas.height = props.height;
}

onMounted(() => {
  setCanvasDimensions();
  context = getContext();
});
</script>
