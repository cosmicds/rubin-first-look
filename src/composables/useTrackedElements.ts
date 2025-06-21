import { ref, watch, onUnmounted, onMounted, type Ref, computed, toValue, toRef } from 'vue';
import { WWTControl } from '@wwtelescope/engine';
import { engineStore } from '@wwtelescope/engine-pinia';
interface WWTEngineStore extends ReturnType<typeof engineStore> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $wwt?: any;
}

export type ScreenLoc = { x: number; y: number };

type BoundingClientRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export function checkPointContainedByDiv(point: { x: number; y: number }, divRect: BoundingClientRect | null = null): boolean {
  if (divRect) {
    return (
      point.x >= divRect.left &&
      point.x <= divRect.right &&
      point.y >= divRect.top &&
      point.y <= divRect.bottom
    );
  }
  return point.x >= 0 && point.x <= window.innerWidth && point.y >= 0 && point.y <= window.innerHeight;
}


// Element Creation
function resolveElement(el: HTMLElement | string | null): HTMLElement | null {
  if (el === null) return null;
  if (typeof el === 'string') {
    const foundElement = document.getElementById(el);
    if (foundElement) {
      return foundElement;
    } else {
      console.warn(`Element with ID '${el}' not found.`);
      return null;
    }
  }
  if (el instanceof HTMLElement) {
    return el;
  }
  console.warn('Provided element is not a valid HTMLElement or string ID.');
  return null;
}
  
  
export type Degree = number;
export type Radian = number;
export type HourAngle = number;

export type LocationDegrees = {
  ra: Degree;
  dec: Degree;
};

export type ScreenPosition = {
  x: number;
  y: number;
};

export type TrackedElementData = LocationDegrees & Record<string, string | number>;

export interface TrackedHTMLElement extends HTMLElement {
  trackedData: TrackedElementData;
  move: (pt: LocationDegrees) => void;
}

export type UseTrackedElementsReturn = {
  trackedElements: Ref<TrackedHTMLElement[]>;
  createTrackedElement: (pt: TrackedElementData, tag?: string, name?: string) => TrackedHTMLElement;
  removeTrackedElement: (el: TrackedHTMLElement) => void;
  updateElements: () => void;
  addTrackedElement: (element: TrackedHTMLElement) => void;
  updateOffScreenElements: Ref<boolean>;
  getScreenPositionAndVisibility: (el: TrackedHTMLElement) => [ScreenPosition, boolean];
  placeElement: (_el: HTMLElement | string | null, pt: LocationDegrees, name: string) => TrackedHTMLElement;
  getMarkerLayer: () => HTMLElement | null;
  hideElementByName: (name: string) => void;
  showElementByName: (name: string) => void;
  moveElementByName: (name: string, pt: LocationDegrees) => void;
};

let wwtReady = false;
async function waitForWWTReady(store: WWTEngineStore): Promise<void> {
  if (wwtReady) {
    return;
  }
  return store.waitForReady().then(() => {
    WWTControl.singleton.renderOneFrame();
    wwtReady = true;
  });
}

export function useTrackedPosition(_ra: Ref<Degree> | Degree, _dec: Ref<Degree> | Degree, store: WWTEngineStore)  {
  const ready = ref(false);
  const resizeObserver = ref<ResizeObserver | null>(null);
  
  waitForWWTReady(store).then(() => {
    ready.value = true;
    updatePosition = () => {
      if (!ready.value) {
        console.warn('WWT Engine is not ready yet.');
        return;
      }
      screenPoint.value = store.findScreenPointForRADec(worldPoint.value);
    };
    
    const parentElement = store.$wwt.inst.ctl.canvas.parentElement as HTMLElement;
    if (parentElement) {
      resizeObserver.value = new ResizeObserver(() => {
        updatePosition();
      });
      resizeObserver.value.observe(parentElement);
    }
    
  });
  
  onUnmounted(() => {
    resizeObserver.value?.disconnect();
  });
  
  const ra = toRef(_ra) as Ref<Degree>;
  const dec = toRef(_dec) as Ref<Degree>;
  
  const worldPoint = computed(() => {
    return { ra: toValue(ra) as Degree, dec: toValue(dec) as Degree };
  });
  
  const toRad = ({ ra, dec }: LocationDegrees): { ra: Radian; dec: Radian } => {
    return {
      ra: (ra * Math.PI) / 180 as Radian,
      dec: (dec * Math.PI) / 180 as Radian,
    };
  };
  
  const worldPointRad = computed(() => toRad(worldPoint.value));
  
  
  const screenPoint = ref<ScreenPosition>({ x: 0, y: 0 });

  let updatePosition = () => {
    console.warn('WWT Engine is not ready yet.');
  };

  watch(() => [store.raRad, store.decRad, store.zoomDeg, store.rollRad], () => {
    updatePosition();
  });
  
  watch([ra, dec], () => {
    console.log(`Updating position for RA: ${ra.value}, Dec: ${dec.value}`);
    updatePosition();
  });
  
  
  updatePosition();
 
  return { screenPoint, worldPoint, worldPointRad, ra, dec };
}

/**
 * Sets up and manages tracked HTML elements that move with the WWT frame.
 */
let instance: UseTrackedElementsReturn | null = null;
export function useTrackedElements(parentID: string | null, store: WWTEngineStore): UseTrackedElementsReturn {
  if (instance) {
    return instance as UseTrackedElementsReturn;
  }
  // WWT setup
  const parentElement = ref<HTMLElement | null>(null);
  const ready = ref(false);
  const trackedElements = ref<TrackedHTMLElement[]>([]);
  const parentElementRect = ref(null as DOMRect | null);
  const resizeObserver = ref(null as ResizeObserver | null);
  const updateOffScreenElements = ref(false);

  const elementVisibilityCache = new Map<string, 'hidden' | 'visible'>();
  const observer = new MutationObserver(() => {
    elementVisibilityCache.forEach((visibility, name) => {
      const el = getElementByName(name);
      if (el) {
        el.style.visibility = visibility;
        elementVisibilityCache.delete(name);
      }
    });
  });

  function initializeParentElement() {
    if (parentID !== null && parentID !== '') {
      const element = document.getElementById(parentID);
      if (element) {
        parentElement.value = element as HTMLElement;
        return;
      }
    }
    console.error(`Element with ID '${parentID}' does not exist.`);
    parentElement.value = store.$wwt.inst.ctl.canvas.parentElement as HTMLElement;
  }

  
  function getMarkerLayer(): HTMLElement | null {
    return parentElement.value as HTMLElement ?? null;
  }

  const addTrackedElement = (element: TrackedHTMLElement) => {
    trackedElements.value.push(element);
  };
  
  function applyUniformStyles(el: TrackedHTMLElement) {
    el.style.position = 'absolute';
    el.style.transformOrigin = 'center center';
    el.move = (pt: LocationDegrees) => {
      if (!ready.value) {
        console.warn('WWT Engine is not ready yet.');
        return;
      }
      el.trackedData.ra = pt.ra;
      el.trackedData.dec = pt.dec;
      const screenPos = store.findScreenPointForRADec(pt);
      updateElementScreenPosition(el as TrackedHTMLElement, screenPos);
    };
    
  }

  /**
   * Places an HTML element at a specified RA/Dec location.
   * @param _el {HTMLElement | string | null} The ID for the element (or the element itself).
   * @param pt {ra: Degree, dec: Degree, ....} Other values will be added to the elements trackedData attribute
   */
  function placeElement(_el: HTMLElement | string | null, pt: TrackedElementData, name: string): TrackedHTMLElement {
    const el = resolveElement(_el) as TrackedHTMLElement;
    if (el === null) {
      console.warn('Element is null, cannot place it.');
      return null as unknown as TrackedHTMLElement;
    }

    applyUniformStyles(el);

    el.classList.add('tracked-element');
    el.trackedData = pt as TrackedElementData;
    el.dataset.name = name;

    addTrackedElement(el);

    return el;
  } 

  function _createElement(pt: { x: number, y: number }, tag = "div"): HTMLElement {
    const marker = document.createElement(tag);
    applyUniformStyles(marker as TrackedHTMLElement);
    marker.style.left = `${pt.x}px`;
    marker.style.top = `${pt.y}px`;
    return marker;
  }

  /**
   * Creates a new tracked HTML element at a specified RA/Dec location.
   * @param pt {ra: Degree, dec: Degree, ...} The RA/Dec location of the element.
   * @param tag {string} The HTML tag to use for the element (default is 'div').
   * @param name {string} An optional name for the element, used to create a custom CSS class.
   */
  function createTrackedElement(pt: TrackedElementData, tag = 'div', name = ''): TrackedHTMLElement {
    
    const element = _createElement({ x: 0, y: 0 }, tag) as TrackedHTMLElement;
    element.classList.add('tracked-element');

    if (name) {
      element.dataset.name = name;
      const validName = name.replace(/[^a-zA-Z0-9-_]/g, ''); // sanitize name for CSS class usage
      
      element.classList.add(`tracked-element__${validName}`);
    }

    element.trackedData = pt;

    addTrackedElement(element);
    return element;
  }

  // Element Updating

  /**
   * Updates the screen position of a tracked element.
   */
  function updateElementScreenPosition(el: TrackedHTMLElement, screenPos: ScreenPosition) {
    el.style.left = `${screenPos.x}px`;
    el.style.top = `${screenPos.y}px`;
    el.dataset.screenX = screenPos.x.toString();
    el.dataset.screenY = screenPos.y.toString();
  }

  /**
   * Checks if a tracked element is visible on the screen and returns its screen position.
   */
  function getScreenPositionAndVisibility(el: TrackedHTMLElement): [ScreenPosition, boolean] {
    const screen = store.findScreenPointForRADec({ra: el.trackedData.ra, dec: el.trackedData.dec});
    const visible = checkPointContainedByDiv(screen, parentElementRect.value);
    return [screen, visible];
  }

  /**
   * Updates the screen positions of all tracked elements, hiding those that are off-screen.
   */
  function updateElements() {
    if (!ready.value || parentElement.value === null) {
      console.warn('WWT Engine is not ready or parent element is not set.');
      return;
    }
    
    trackedElements.value.forEach((el) => {
      const [screenPos, onscreen] = getScreenPositionAndVisibility(el as TrackedHTMLElement);

      if (onscreen || updateOffScreenElements.value) {
        updateElementScreenPosition(el as TrackedHTMLElement, screenPos);
      }
      el.style.display = onscreen ? 'block' : 'none';
    });
  }

  /**
   * Removes a tracked element from the list and from the DOM.
   */
  function removeTrackedElement(el: TrackedHTMLElement) {
    const index = trackedElements.value.indexOf(el);
    if (index > -1) {
      trackedElements.value.splice(index, 1);
    }
    el.remove();
  }

  

  function getElementByName(name: string): TrackedHTMLElement | null {
    return trackedElements.value.find((el) => el.dataset.name === name) as TrackedHTMLElement || null;
  }

  function hideElementByName(name: string) {
    const el = getElementByName(name);
    if (el) {
      el.style.visibility = 'hidden';
    } else {
      elementVisibilityCache.set(name, 'hidden');
    }
  }

  function showElementByName(name: string) {
    const el = getElementByName(name);
    if (el) {
      el.style.visibility = 'visible';
    } else {
      elementVisibilityCache.set(name, 'visible');
    }
  }
  
  function moveElementByName(name: string, pt: LocationDegrees) {
    const el = getElementByName(name);
    if (el) {
      const screenPos = store.findScreenPointForRADec(pt);
      updateElementScreenPosition(el, screenPos);
    } else {
      console.warn(`Element with name '${name}' not found.`);
    }
  }

  // Watchers, Lifecycle, and Cleanup

  watch(parentElement, (newElement) => {
    if (newElement) {
      parentElementRect.value = newElement.getBoundingClientRect();
    }
  });
  
  watch(ready, updateElements);
  watch(() => [store.raRad, store.decRad, store.zoomDeg, store.rollRad], updateElements);
  watch(parentElementRect, updateElements);
  watch(updateOffScreenElements, updateElements);

  onMounted(() => {
    waitForWWTReady(store).then(() => {

      // 1. Make sure we have a parent element
      initializeParentElement();
      
      // 2. Set up the Resize Observer
      if (parentElement.value !== null) {
        resizeObserver.value = new ResizeObserver(() => {
          if (parentElement.value === null) return;
          parentElementRect.value = parentElement.value.getBoundingClientRect();
        });
        if (resizeObserver.value) {
          resizeObserver.value.observe(parentElement.value as HTMLElement);
        }
        ready.value = true;
      }
      
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });

  onUnmounted(() => {
    resizeObserver.value?.disconnect();
    trackedElements.value.forEach((el) => el.remove());
    observer.disconnect();
  });

  instance = {
    trackedElements: trackedElements as Ref<TrackedHTMLElement[]>,
    createTrackedElement,
    removeTrackedElement,
    updateElements,
    addTrackedElement,
    updateOffScreenElements,
    getScreenPositionAndVisibility,
    placeElement,
    getMarkerLayer,
    hideElementByName,
    showElementByName,
    moveElementByName,
  };
  
  return instance;
}
