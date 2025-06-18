import { ref, watch, onUnmounted, onMounted, type Ref, computed, toValue, toRef } from 'vue';
import { engineStore } from '@wwtelescope/engine-pinia';
export interface WWTEngineStore extends ReturnType<typeof engineStore> {
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
}

type UseTrackedElementsReturn = {
  trackedElements: Ref<TrackedHTMLElement[]>;
  createTrackedElement: (pt: TrackedElementData, tag?: string, name?: string) => TrackedHTMLElement;
  addClassToElement: (element: HTMLElement, class_name: string) => void;
  removeTrackedElement: (el: TrackedHTMLElement) => void;
  updateElements: () => void;
  addElement: (element: TrackedHTMLElement) => void;
  addElements: (elements: TrackedHTMLElement[]) => void;
  updateOffScreenElements: Ref<boolean>;
  isMarkerVisible: (el: TrackedHTMLElement) => [ScreenPosition, boolean];
  placeElement: (el: HTMLElement, pt: LocationDegrees) => TrackedHTMLElement;
  getMarkerLayer: () => HTMLElement | null;
  hideElementByName: (name: string) => void;
  showElementByName: (name: string) => void;
};


export function useTrackedPosition(_ra: Ref<Degree> | Degree, _dec: Ref<Degree> | Degree, store: WWTEngineStore)  {
  const ready = ref(false);
  store.waitForReady().then(() => {
    ready.value = true;
    updatePosition = () => {
      if (!ready.value) {
        console.warn('WWT Engine is not ready yet.');
        return;
      }
      screenPoint.value = store.findScreenPointForRADec(worldPoint.value);
    };
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
export function useTrackedElements(parentID: string | null, store: WWTEngineStore): UseTrackedElementsReturn {
  // WWT setup
  const parentElement = ref<HTMLElement | null>(null);

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

  const parentElementRect = ref(null as DOMRect | null);
  const resizeObserver = ref(null as ResizeObserver | null);

  const trackedElements = ref<TrackedHTMLElement[]>([]);
  const updateOffScreenElements = ref(false);
  

  // Element Creation

  /**
   * Places an HTML element at a specified RA/Dec location.
   */
  function placeElement(el: HTMLElement, pt: LocationDegrees): TrackedHTMLElement {
    const { x, y } = store.findScreenPointForRADec(pt);
    el.style.position = 'absolute';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    el.classList.add('tracked-element');
    (el as TrackedHTMLElement).trackedData = pt as TrackedElementData;

    trackedElements.value.push(el as TrackedHTMLElement);

    return el as TrackedHTMLElement;
  } 

  /**
   * Creates a new HTML element at a specified screen position.
   */
  function createElement(pt: { x: number, y: number }, tag = "div"): HTMLElement {
    const marker = document.createElement(tag);
    marker.style.position = 'absolute';
    marker.style.left = `${pt.x}px`;
    marker.style.top = `${pt.y}px`;
    return marker;
  }

  /**
   * Creates a new tracked HTML element at a specified RA/Dec location.
   * @param pt {ra: number, dec: number, ...} The RA/Dec location of the element.
   */
  function createTrackedElement(pt: TrackedElementData, tag = 'div', name = ''): TrackedHTMLElement {
    const { x, y } = store.findScreenPointForRADec({ra: pt.ra, dec: pt.dec});
    const element = createElement({ x, y }, tag) as TrackedHTMLElement;
    element.classList.add('tracked-element');

    if (name) {
      element.dataset.name = name;
      const validName = name.replace(/[^a-zA-Z0-9-_]/g, ''); // sanitize name for CSS class usage
      
      element.classList.add(`tracked-element__${validName}`);
    }

    element.trackedData = pt;
    element.dataset.ra = pt.ra.toString();
    element.dataset.dec = pt.dec.toString();
    element.dataset.screenX = x.toString();
    element.dataset.screenY = y.toString();

    trackedElements.value.push(element);
    return element;
  }

  function addClassToElement(element: HTMLElement, class_name: string) {
    element.classList.add(class_name);
  }

  /**
   * Adds a tracked element to the list of tracked elements.
   */
  const addElement = (element: TrackedHTMLElement) => {
    trackedElements.value.push(element);
  };

  /**
   * Adds multiple tracked elements to the list of tracked elements.
   */
  const addElements = (elements: TrackedHTMLElement[]) => {
    elements.forEach(addElement);
  };

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
  function isMarkerVisible(el: TrackedHTMLElement): [ScreenPosition, boolean] {
    const screen = store.findScreenPointForRADec(el.trackedData);
    const visible = checkPointContainedByDiv(screen, parentElementRect.value);

    // Update dataset entries for screen position
    el.dataset.screenX = screen.x.toString();
    el.dataset.screenY = screen.y.toString();

    return [screen, visible];
  }

  /**
   * Updates the screen positions of all tracked elements, hiding those that are off-screen.
   */
  function updateElements() {
    trackedElements.value.forEach((el) => {
      const [screenPos, onscreen] = isMarkerVisible(el as TrackedHTMLElement);

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

  function getMarkerLayer(): HTMLElement | null {
    return parentElement.value as HTMLElement ?? null;
  }

  function getElementByName(name: string): TrackedHTMLElement | null {
    return trackedElements.value.find((el) => el.dataset.name === name) as TrackedHTMLElement || null;
  }

  function hideElementByName(name: string) {
    const el = getElementByName(name);
    if (el) {
      el.style.visibility = 'hidden';
    }
  }

  function showElementByName(name: string) {
    const el = getElementByName(name);
    if (el) {
      el.style.visibility = 'visible';
    }
  }

  // Watchers, Lifecycle, and Cleanup

  watch(parentElement, (newElement) => {
    if (newElement) {
      parentElementRect.value = newElement.getBoundingClientRect();
    }
  });

  watch(() => [store.raRad, store.decRad, store.zoomDeg, store.rollRad], () => {
    updateElements();
  });

  watch(parentElementRect, () => {
    updateElements();
  });

  watch(updateOffScreenElements, () => {
    updateElements();
  });

  onMounted(() => {
    store.waitForReady().then(() => {
      initializeParentElement();
      if (parentElement.value !== null) {
        resizeObserver.value = new ResizeObserver(() => {
          if (parentElement.value === null) return;
          parentElementRect.value = parentElement.value.getBoundingClientRect();
        });
        if (resizeObserver.value) {
          resizeObserver.value.observe(parentElement.value as HTMLElement);
        }
        
      }
    });
  });

  onUnmounted(() => {
    resizeObserver.value?.disconnect();
    trackedElements.value.forEach((el) => el.remove());
  });

  return {
    trackedElements: trackedElements as Ref<TrackedHTMLElement[]>,
    createTrackedElement,
    addClassToElement,
    removeTrackedElement,
    updateElements,
    addElement,
    addElements,
    updateOffScreenElements,
    isMarkerVisible,
    placeElement,
    getMarkerLayer,
    hideElementByName,
    showElementByName,
  };
}
