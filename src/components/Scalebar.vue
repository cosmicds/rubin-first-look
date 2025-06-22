<template>
  <div
    v-show="show"
    ref="root"
    class="scalebar-root"
    :style="cssVars"
  >
    <canvas class="scalebar-canvas"></canvas>
    <p>{{ text }}</p>
    <div class="scalebar-bg"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { R2D } from "@wwtelescope/astro";
import { WWTControl } from "@wwtelescope/engine";
import { engineStore } from "@wwtelescope/engine-pinia";

type Breakpoints = [number, number, string][];

interface ScalebarProps {
  breakpoints: Breakpoints;
  height?: number;
  width?: number;
  color?: string;
  maxDeg?: number;
  minDeg?: number;
  visible?: boolean;
  backgroundColor?: string;
}

const text = ref<string | null>(null);
const root = ref<HTMLElement | null>(null);
let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;
const contentWidth = ref(0);

const store = engineStore();
const { raRad, decRad, zoomDeg, rollRad } = storeToRefs(store);

const props = withDefaults(defineProps<ScalebarProps>(), {
  height: 20,
  width: 1000,
  color: "white",
  visible: true,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
});

const show = computed(() => props.visible && ((props.maxDeg == null) || zoomDeg.value < props.maxDeg));

let sortedBreakpoints: Breakpoints;
updateBreakpoints(props.breakpoints);

function updateBreakpoints(newBreakpoints: Breakpoints) {
  sortedBreakpoints = [...newBreakpoints];
  sortedBreakpoints.sort((first, second) => second[0] - first[0]);
}

function update() {
  if (!show.value) {
    return;
  }
  const breakpoint = sortedBreakpoints.find(bkpt => zoomDeg.value / 6 > bkpt[0]);
  if (!breakpoint) {
    return;
  }

  const worldDistance = breakpoint[1];
  text.value = breakpoint[2];

  const screenPoint = store.findScreenPointForRADec({ ra: raRad.value * R2D + worldDistance, dec: decRad.value * R2D });
  const renderContext = WWTControl.singleton.renderContext;
  const center = { x: 0.5 * renderContext.width, y: 0.5 * renderContext.height };
  const screenDistance = Math.sqrt((screenPoint.x - center.x) ** 2 + (screenPoint.y - center.y) ** 2);

  canvas = getCanvas();
  context = getContext();
  if (!(context && canvas)) {
    return;
  }

  const end = canvas.width - 5;
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  const textElement = root.value?.querySelector("p");
  const width = Math.max(screenDistance, textElement?.clientWidth ?? 0) + 20;
  contentWidth.value = width;

  context.strokeStyle = props.color;
  context.lineWidth = 2;

  const endcapBottom = 0.9 * canvas.height;
  const endcapTop = 0.1 * canvas.height;

  context.beginPath();
  context.moveTo(end, endcapBottom);
  context.lineTo(end, endcapTop);
  context.stroke();

  context.beginPath();
  context.moveTo(end - screenDistance, endcapBottom);
  context.lineTo(end - screenDistance, endcapTop);
  context.stroke();

  const midpointY = 0.5 * canvas.height;
  context.beginPath();
  context.moveTo(end - screenDistance, midpointY);
  context.lineTo(end, midpointY);
  context.stroke();
}

function getCanvas(): HTMLCanvasElement | null {
  if (!canvas) {
    const rootElement = root.value;
    canvas = (rootElement?.querySelector(".scalebar-canvas") as HTMLCanvasElement) ?? null;
  }
  return canvas;
}

function getContext(): CanvasRenderingContext2D  | null {
  return context ?? getCanvas()?.getContext("2d") ?? null;
}

function setCanvasDimensions() {
  canvas = getCanvas();
  if (canvas) {
    canvas.style.width = `${props.width}px`;
    canvas.width = props.width;
    canvas.style.height = `${props.height}px`;
    canvas.height = props.height;
  }
}

const cssVars = computed(() => ({
  "--color": props.color,
  "--bg-color": props.backgroundColor,
  "--content-width": `${contentWidth.value}px`,
}));

onMounted(() => {
  setCanvasDimensions();
  context = getContext();
});

watch(() => [raRad.value, decRad.value, zoomDeg.value, rollRad.value], (_position) => {
  update();
});

watch(show, (value: boolean) => {
  if (value) {
    update();
  }
});

watch(() => props.breakpoints, updateBreakpoints);
watch(() => [props.color, props.backgroundColor], (_values) => update());
</script>

<style scoped lang="less">
.scalebar-root {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 5px;
  margin-right: 10px;
  margin-bottom: 5px;

  p {
    background: transparent;
    color: var(--color);
    z-index: 1;
  }

  canvas {
    z-index: 1;
  }

  .scalebar-bg {
    background: var(--bg-color);
    width: var(--content-width);
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 0;
    border-radius: 5px;
  }

}
</style>
