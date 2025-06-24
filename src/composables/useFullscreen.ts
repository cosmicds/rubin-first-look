import { ref, onMounted, onUnmounted, watch, Ref } from "vue";
import screenfull from "screenfull";

/**
  * A composable that encapsulates fullscreen behavior.
  * @returns A reactive variable indicating whether or not fullscreen mode is active
  */ 
export function useFullscreen(): Ref<boolean> {
  const fullscreenModeActive = ref(false);
  function update(_event: Event) {
    fullscreenModeActive.value = screenfull.isFullscreen;
  }

  onMounted(() => {
    if (screenfull.isEnabled) {
      screenfull.on("change", update);
    }
  });

  onUnmounted(() => {
    if (screenfull.isEnabled) {
      screenfull.off("change", update);
    }
  });

  watch(fullscreenModeActive, (active: boolean) => {
    if (active) {
      screenfull.request();
    } else {
      screenfull.exit();
    }
  });

  return fullscreenModeActive;
}
