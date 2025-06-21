<template>
<v-app
  id="app"
  :style="cssVars"
>
  <div
    id="main-content"
  >
    <WorldWideTelescope
      :wwt-namespace="wwtNamespace"
    ></WorldWideTelescope>

    <wwt-tracked-content
    :ra="10.5"
    :dec="41.3"
    name="Andromeda Galaxy"
    :store="store"
    center-on-click
    v-slot="props"
    :zoomDeg="8"
  >
    <div class="custom-content" v-on="props.on">
      <p>Track Andromeda Galaxy</p>
    </div>
  </wwt-tracked-content>
    
    <wwt-tracked-content
      v-for="(place, index) in lowerLevelPlaces"
      :key="index"
      :place="place"
      :name="place.get_name()"
      :store="store"
      :visible="showLabels && !atTopLevel"
      v-slot="props"
      debug
      @click="handleSelection(place, 'click')"
      @dblclick="handleSelection(place, 'dblclick')"
    >
        <div class="tracked-places" v-on="props.on">{{ place.get_name() }}</div>
    </wwt-tracked-content>

    <wwt-tracked-content
      v-for="(place, index) in topLevelPlaces"
      :key="index"
      :place="place"
      :name="place.get_name()"
      :store="store"
      :visible="showLabels && atTopLevel"
      v-slot="props"
      debug
      @click="handleSelection(place, 'click')"
      @dblclick="handleSelection(place, 'dblclick')"
    >
        <div class="tracked-places" v-on="props.on">{{ place.get_name() }}</div>
    </wwt-tracked-content>
    

    <splash-screen
      title="Rubin First Look"
      :cssVars="cssVars"
      @close="closeSplashScreen"
    ></splash-screen>

    <transition name="fade">
      <div
        class="modal"
        id="modal-loading"
        v-show="isLoading"
      >
        <div class="container">
          <div class="spinner"></div>
          <p>Loading …</p>
        </div>
      </div>
    </transition>

    <!-- This block contains the elements (e.g. icon buttons displayed at/near the top of the screen -->

    <div id="top-content">
      <div id="left-buttons" v-hide="fullscreen">
        <folder-view
          v-show="folder.get_children()?.length ?? 0 > 0"
          :class="['folder-view', smallSize ? 'folder-view-tall' : '']"
          :root-folder="folder"
          :background-color="accentColor"
          flex-direction="column"
          @select="({ item, type }) => handleSelection(item, type)"
        >
          <template #header="{ toggleExpanded, expanded }">
            <div class="fv-header">
              <span>Explore {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}</span>
              <font-awesome-icon
                :icon="expanded ? 'chevron-up' : 'chevron-down'"
                @click="toggleExpanded()"
                @keyup.enter="toggleExpanded()"
                tabindex="0"
              >
              </font-awesome-icon>
            </div>
          </template>
        </folder-view>
      </div>
      <div id="center-buttons" v-hide="fullscreen">
      </div>
      <div id="right-buttons">
        <div
          id="goto-other-image"
          @click="gotoMainImage((mode == 'a') ? 'b' : 'a', false)"
          @dblclick="gotoMainImage((mode == 'a') ? 'b' : 'a', true)"
        >
          Go to Image {{ mode == 'a' ? 'B' : 'A' }}
        </div>
        <div v-hide="fullscreen">
          <icon-button
            id="info-icon"
            v-model="showTextSheet"
            fa-icon="info"
            :color="buttonColor"
            tooltip-text="Show information"
            tooltip-location="start"
          >
          </icon-button>
        </div>
        <div v-hide="fullscreen">
          <icon-button
            v-model="showVideoSheet"
            fa-icon="video"
            :color="buttonColor"
            tooltip-text="Watch video"
            tooltip-location="start"
          >
          </icon-button>
        </div>
        <icon-button
          id="fullscreen-icon"
          @activate="fullscreen = !fullscreen"
          :fa-icon="fullscreen ? 'compress' : 'expand'"
          :color="buttonColor"
          :tooltip-text="`${fullscreen ? 'Exit' : 'Make'} fullscreen`"
          tooltip-location="start"
        >
        </icon-button>
        <div
          id="options"
          v-hide="fullscreen"
        >
          <div id="options-top-row">
            <icon-button
              id="options-toggle"
              :fa-icon="showOptions ? 'chevron-up' : 'sliders'"
              :color="buttonColor"
              @activate="showOptions = !showOptions"
              tabindex="0"
              :border="false"
              background-color="transparent"
            ></icon-button>
          </div>
          <div
            id="options-content"
            v-if="showOptions"
          >
            <v-checkbox
              v-model="showCircle"
              label="Show circle"
              :color="accentColor"
              hide-details
              density="compact"
            ></v-checkbox>
            <v-checkbox
              v-model="showLabels"
              label="Show labels"
              :color="accentColor"
              hide-details
              density="compact"
            ></v-checkbox>
            <v-checkbox
              v-model="showConstellations"
              label="Show constellations"
              :color="accentColor"
              hide-details
              density="compact"
            ></v-checkbox>
          </div>
        </div>

      </div>
    </div>

    <div
      :class="['selected-info', smallSize ? 'selected-info-tall' : '']"
      v-show="showPlaceHighlights"
    > 
  </div>
    

    <!-- This block contains the elements (e.g. the project icons) displayed along the bottom of the screen -->

    <div
      id="bottom-content"
      v-hide="fullscreen"
    >
      <div id="body-logos" v-if= "!smallSize">
        <credit-logos
          :default-logos="['cosmicds', 'wwt']"
          :extra-logos = "[
              {
                alt: 'Vera C. Rubin Observatory',
                src: './rubin_white_2.png',
                href: 'https://rubinobservatory.org/',
                name: 'Rubin Observatory'
              }
            ]"
        />
      </div>
    </div>

    <infobox
      v-hide="fullscreen"
      :place="currentPlace"
      :small="smallSize"
    >
    </infobox>

    <!-- This dialog contains the video that is displayed when the video icon is clicked -->

    <v-dialog
      id="video-container"
      v-model="showVideoSheet"
      transition="slide-y-transition"
      fullscreen
    >
      <div class="video-wrapper">
        <font-awesome-icon
          id="video-close-icon"
          class="close-icon"
          icon="times"
          size="lg"
          @click="showVideoSheet = false"
          @keyup.enter="showVideoSheet = false"
          tabindex="0"
        ></font-awesome-icon>
        <video
          controls
          id="info-video"
        >
          <source src="" type="video/mp4">
        </video>
      </div>
    </v-dialog>


    <!-- This dialog contains the informational content that is displayed when the book icon is clicked -->

    <v-dialog
      :style="cssVars"
      :class="['info-sheet', `info-sheet-${infoSheetLocation}`]"
      id="text-info-sheet"
      hide-overlay
      persistent
      no-click-animation
      absolute
      :scrim="false"
      location="end"
      v-model="showTextSheet"
      :transition="infoSheetTransition"
    >
      <v-card height="100%">
        <v-tabs
          v-model="tab"
          height="32px"
          :color="accentColor"
          :slider-color="accentColor"
          id="tabs"
          dense
        >
          <v-tab class="info-tabs" tabindex="0"><h3>Information</h3></v-tab>
          <v-tab class="info-tabs" tabindex="0"><h3>Using WWT</h3></v-tab>
        </v-tabs>
        <font-awesome-icon
          id="close-text-icon"
          class="control-icon"
          icon="times"
          size="lg"
          @click="showTextSheet = false"
          @keyup.enter="showTextSheet = false"
          tabindex="0"
        ></font-awesome-icon>
        <v-window v-model="tab" id="tab-items" class="pb-2 no-bottom-border-radius">
          <v-window-item>
            <v-card class="no-bottom-border-radius scrollable">
              <v-card-text class="info-text no-bottom-border-radius">
                Information goes here
                <v-spacer class="end-spacer"></v-spacer>
              </v-card-text>
            </v-card>
          </v-window-item>
          <v-window-item>
            <v-card class="no-bottom-border-radius scrollable">
              <v-card-text class="info-text no-bottom-border-radius">
                <v-container>
                  <v-row align="center">
                  <v-col cols="4">
                      <v-chip
                        label
                        outlined
                      >
                        Pan
                      </v-chip>
                    </v-col>
                    <v-col cols="8" class="pt-1">
                      <strong>{{ touchscreen ? "press + drag" : "click + drag" }}</strong>  {{ touchscreen ? ":" : "or" }}  <strong>{{ touchscreen ? ":" : "W-A-S-D" }}</strong> {{ touchscreen ? ":" : "keys" }}<br>
                    </v-col>
                  </v-row>
                  <v-row align="center">
                    <v-col cols="4">
                      <v-chip
                        label
                        outlined
                      >
                        Zoom
                      </v-chip>
                    </v-col>
                    <v-col cols="8" class="pt-1">
                      <strong>{{ touchscreen ? "pinch in and out" : "scroll in and out" }}</strong> {{ touchscreen ? ":" : "or" }} <strong>{{ touchscreen ? ":" : "I-O" }}</strong> {{ touchscreen ? ":" : "keys" }}<br>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <div class="credits">
                      <h3>Credits:</h3>
                      <h4><a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">CosmicDS</a> Vue Data Stories Team:</h4>
                      John Lewis<br>
                      Jon Carifio<br>
                      Pat Udomprasert<br>
                      Alyssa Goodman<br>
                      Mary Dussault<br>
                      Harry Houghton<br>
                      Anna Nolin<br>
                      Evaluator: Sue Sunbury<br>
                      <br>
                      <h4>WorldWide Telescope Team:</h4>
                      Peter Williams<br>
                      A. David Weigel<br>
                      Jon Carifio<br>
                      </div>
                      <v-spacer class="end-spacer"></v-spacer>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <funding-acknowledgement/>
                    </v-col>
                  </v-row>
                </v-container>              
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card>
    </v-dialog>
    
  </div>
</v-app>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { useFullscreen } from "./composables/useFullscreen";
import { D2R, distance, H2R } from "@wwtelescope/astro";
import { Circle, Folder, Imageset, Place, WWTControl } from "@wwtelescope/engine";
import { ImageSetType, Thumbnail } from "@wwtelescope/engine-types";
import { GotoRADecZoomParams, engineStore } from "@wwtelescope/engine-pinia";
import { BackgroundImageset, skyBackgroundImagesets, supportsTouchscreen, blurActiveElement, useWWTKeyboardControls } from "@cosmicds/vue-toolkit";
import { RUBIN_COLORS } from "../plugins/vuetify";
import { useDisplay, useTheme } from "vuetify";
import { type FolderViewSelectionType } from "./types";

type SheetType = "text" | "video";
type CameraParams = Omit<GotoRADecZoomParams, "instant">;
export interface RubinFirstLookProps {
  wwtNamespace?: string;
  initialCameraParams?: CameraParams;
}

const store = engineStore();
const { raRad, decRad, zoomDeg } = storeToRefs(store);

useWWTKeyboardControls(store);

const fullscreen = useFullscreen();

const touchscreen = supportsTouchscreen();
// TODO: Determine this in a better way
const display = useDisplay();
const theme = useTheme();

const props = withDefaults(defineProps<RubinFirstLookProps>(), {
  wwtNamespace: "rubin-first-look",
  initialCameraParams: () => {
    return {
      raRad: 0,
      decRad: 0,
      zoomDeg: 60
    };
  }
});

const backgroundImagesets = reactive<BackgroundImageset[]>([]);
const sheet = ref<SheetType | null>(null);
const layersLoaded = ref(false);
const positionSet = ref(false);
// See https://rubin.canto.com/g/RubinVisualIdentity/index?viewIndex=0
const accentColor = computed(() => theme.global.current.value.colors.primaryVariant);
const buttonColor = computed(() => theme.global.current.value.colors.primary);
const tab = ref(0);

const domain = "http://localhost:12345";
// const wtmlUrl = `${domain}/index.wtml`;
const imageAPlacesURL = `${domain}/a_places.wtml`;
const imageBPlacesURL= `${domain}/b_places.wtml`;
const selectedItem = ref<Thumbnail | null>(null);

const lowerLevelPlaces: Place[] = [];
const topLevelPlaces: Place[] = [];
const highlightsA = ref(new Folder());
const highlightsB = ref(new Folder());
const currentPlace = ref<Place | null>(null);

type Mode = "a" | "b";
const mode = ref<Mode>("b");
const folder = computed(() => mode.value == "a" ? highlightsA.value : highlightsB.value);

const INFOBOX_ZOOM_CUTOFF = 10;
const SMALL_LABELS_ZOOM = 25;
let circle: Circle | null = null;
const showOptions = ref(false);
const showCircle = ref(true);
const showLabels = ref(false);
const showConstellations = ref(false);
const highlightPlaceFromZoom = computed(() => zoomDeg.value < INFOBOX_ZOOM_CUTOFF);
const showPlaceHighlights = computed(() => !showTextSheet.value && currentPlace.value !== null && highlightPlaceFromZoom.value);
const atTopLevel = computed(() => zoomDeg.value > SMALL_LABELS_ZOOM);

import { useTrackedElements } from "./composables/useTrackedElements";
const ute = useTrackedElements("", store);

onMounted(() => {
  store.waitForReady().then(async () => {
    skyBackgroundImagesets.forEach(iset => backgroundImagesets.push(iset));
    store.gotoRADecZoom({
      ...props.initialCameraParams,
      instant: true
    }).then(() => positionSet.value = true);

    const loadPromises = [imageAPlacesURL, imageBPlacesURL].map(url => {
      return store.loadImageCollection({
        url,
        loadChildFolders: false,
      });
    });
    Promise.all(loadPromises).then(loadedFolders => {
      loadedFolders.forEach((loadedFolder, index) => {
        const children = loadedFolder.get_children();
        const highlightsFolder = index === 0 ? highlightsA : highlightsB;
        children?.forEach((item, index) => {
          if (item instanceof Place) {
            if (index === 0) {
              highlightsFolder.value.addChildPlace(item);
              topLevelPlaces.push(item);
            } else {
              if (item.get_names().length == 1) {
                highlightsFolder.value.addChildPlace(item);
              }
              lowerLevelPlaces.push(item);
            }
          }
        });
      });
    }).then(() => layersLoaded.value = true);
    
    store.loadImageCollection({
      url: "bg.wtml",
      loadChildFolders: false,
    }).then(bgFolder => {
      const children = bgFolder.get_children();
      if (children !== null) {
        const item = children[0];
        if (item instanceof Imageset) {
          store.setBackgroundImageByName(item.get_name());
        }
      }
    });

    updateClosestPlace();

  }).then(() => {
    ute.hideElementByName("JWST Carina MIRI");
  });
});

function findClosest(places: Place[]): Place | null {
  let closest = currentPlace.value;
  let closestDist = closest === null ? null : distance(closest.get_RA() * H2R, closest.get_dec() * D2R, raRad.value, decRad.value);

  places.forEach(place => {
    const dist = distance(place.get_RA() * H2R, place.get_dec() * D2R, raRad.value, decRad.value);
    if ((!isNaN(dist)) && ((closestDist === null) || (dist < closestDist))) {
      closest = place;
      closestDist = dist;
    }
  });

  return closest !== null && placeInView(closest) ? closest : null;
}

function updateClosestPlace() {
  currentPlace.value = findClosest(atTopLevel.value ? topLevelPlaces : lowerLevelPlaces);
}

function updateCircle(place: Place | null) {
  if (!highlightPlaceFromZoom.value || place === null) {
    circle?.set_opacity(0);
    return;
  }

  if (circle === null) {
    circle = new Circle();
    circle.set_id("infobox");
    circle.set_lineWidth(3);
    circle.set_lineColor("#ffffff");
    circle.set_skyRelative(true);
    store.addAnnotation(circle);
  }

  circle.set_opacity(showCircle.value ? 1 : 0);
  circle.setCenter(place.get_RA() * 15, place.get_dec());
  circle.set_radius(place?.angularSize);
}

function gotoMainImage(image: Mode, instant=false) {
  const index = image === "a" ? 0 : 1;
  store.gotoTarget({
    place: topLevelPlaces[index],
    noZoom: false,
    instant,
    trackObject: false,
  });
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

function handleSelection(item: Thumbnail, selection: FolderViewSelectionType) {
  if (item instanceof Imageset) {
    store.setForegroundImageByName(item.get_name());
    const type = item.get_dataSetType();
    if (type === ImageSetType.planet) {
      store.setBackgroundImageByName(item.get_name());
    }
  } else if (item instanceof Place) {
    const imageset = item.get_backgroundImageset() ?? item.get_studyImageset();
    if (imageset !== null) {
      store.setForegroundImageByName(imageset.get_name());
    }

    const instant = selection === "dblclick";
    if (selection !== "folder") {

      store.gotoTarget({
        place: item,
        noZoom: false,
        instant,
        trackObject: true,
      });
    }
  }  

  selectedItem.value = item;
}

const ready = computed(() => layersLoaded.value && positionSet.value);

/* `isLoading` is a bit redundant here, but it could potentially have independent logic */
const isLoading = computed(() => !ready.value);

/* Properties related to device/screen characteristics */
const smallSize = computed(() => {
  return display.smAndDown.value && (display.height.value > 1.2 * display.width.value);
});

const infoFraction = 34;
const infoSheetLocation = computed(() => smallSize.value ? "bottom" : "right");
const infoSheetHeight = computed(() => infoSheetLocation.value === "bottom" ? `${infoFraction}%` : "100%");
const infoSheetWidth = computed(() => infoSheetLocation.value === "bottom" ? "100%" : `${infoFraction}%`);
const infoTextHeight = computed(() => infoSheetLocation.value === "bottom" ? `calc(${infoFraction}vh - 25px)` : "calc(100vh - 25px)");
const infoSheetTransition = computed(() => infoSheetLocation.value === "bottom" ? "dialog-bottom-transition" : "tab-reverse-transition");

/* This lets us inject component data into element CSS */
const cssVars = computed(() => {
  const rubinColors = Object.keys(RUBIN_COLORS).reduce((acc: Record<string, string>, key: string) => {
    acc[`--${key}`] = RUBIN_COLORS[key];
    return acc;
  }, {});
  return {
    ...rubinColors,
    "--accent-color": accentColor.value,
    "--app-content-height": showTextSheet.value && infoSheetLocation.value === "bottom" ? `${100 - infoFraction}vh` : "100vh",
    "--app-content-width": showTextSheet.value && infoSheetLocation.value === "right" ? `${100 - infoFraction}vw` : "100vw",
    "--info-sheet-width": infoSheetWidth.value,
    "--info-sheet-height": infoSheetHeight.value,
    "--info-text-height": infoTextHeight.value,
  };
});


/**
  Computed flags that control whether the relevant dialogs display.
  The `sheet` data member stores which sheet is open, so these are just
  computed wrappers around modifying/querying that which can be used as
  dialog v-model values
*/
const showTextSheet = computed({
  get() {
    return sheet.value === "text";
  },
  set(_value: boolean) {
    selectSheet("text");
  }
});

const showVideoSheet = computed({
  get() {
    return sheet.value === "video";
  },
  set(value: boolean) {
    selectSheet("video");
    if (!value) {
      const video = document.querySelector("#info-video") as HTMLVideoElement;
      video.pause();
    }
  }
});

/**
  This is convenient if there's any other logic that we want to run
  when the splash screen is closed
*/
function closeSplashScreen() {
  // showSplashScreen.value = false;
}

function selectSheet(sheetType: SheetType | null) {
  if (sheet.value === sheetType) {
    sheet.value = null;
    nextTick(() => {
      blurActiveElement();
    });
  } else {
    sheet.value = sheetType;
  }
}

function onMove() {
  if (placeInView(topLevelPlaces[0])) {
    mode.value = "a";
  } else if (placeInView(topLevelPlaces[1])) {
    mode.value = "b";
  }
  updateClosestPlace();
}

function onZoomChange(_zoomDeg: number) {
  updateClosestPlace();
  updateCircle(currentPlace.value);
}

watch(raRad, (_ra: number) => onMove());
watch(decRad, (_dec: number) => onMove());
watch(zoomDeg, onZoomChange);
watch(showCircle, (_show: boolean) => updateCircle(currentPlace.value));
watch(showConstellations, (show: boolean) => {
  store.applySetting(["showConstellationFigures", show]);
  store.applySetting(["showConstellationLabels", show]);
});
watch(currentPlace, updateCircle);
watch(mode, (newMode: Mode) => {
  theme.global.name.value = newMode === "b" ? "rubinB" : "rubinA";
});
</script>

<style lang="less">
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');

:root {
  --default-font-size: clamp(0.7rem, min(1.7vh, 1.7vw), 1.1rem);
  --default-line-height: clamp(1rem, min(2.2vh, 2.2vw), 1.6rem);
}

html {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #000;
  overflow: hidden;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

body {
  position: fixed;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;

  font-family: "Source Sans 3", Helvetica, sans-serif;
  font-weight: regular;
}

#main-content {
  position: fixed;
  height: var(--app-content-height);
  width: var(--app-content-width);
  overflow: hidden;

  transition: width 0.1s ease-in-out;
}

#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 11pt;

  .wwtelescope-component {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    border-style: none;
    border-width: 0;
    margin: 0;
    padding: 0;
  }
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.modal {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 100;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

#modal-loading {
  background-color: #000;
  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    .spinner {
      background-image: url("https://projects.cosmicds.cfa.harvard.edu/cds-website/misc/lunar_loader.gif");
      background-repeat: no-repeat;
      background-size: contain;
      width: 3rem;
      height: 3rem;
    }
    p {
      margin: 0 0 0 1rem;
      padding: 0;
      font-size: 150%;
    }
  }
}

#top-content {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: calc(100% - 2rem);
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

#left-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .icon-wrapper {
    width: fit-content;
  }
}

#right-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  height: auto;
}

#info-icon-button {
  padding: 5px 12px;
}

#bottom-content {
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  right: 0;
  width: calc(100% - 2rem);
  pointer-events: none;
  align-items: center;
  gap: 5px;
}

#body-logos {
  align-self: flex-end;
}


// From Sara Soueidan (https://www.sarasoueidan.com/blog/focus-indicators/) & Erik Kroes (https://www.erikkroes.nl/blog/the-universal-focus-state/)
:focus-visible,
button:focus-visible,
.focus-visible,
.v-selection-control--focus-visible .v-selection-control__input {
  outline: 9px double white !important;
  box-shadow: 0 0 0 6px black !important;
  border-radius: .125rem;
}

.video-wrapper {
  height: 100%;
  background: black;
  text-align: center;
  z-index: 1000;

  #video-close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 15;
    
    &:hover {
      cursor: pointer;
    }

    &:focus {
      color: white;
      border: 2px solid white;
    }
  }
}

video {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

#info-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  overflow: hidden;
  padding: 0px;
  z-index: 10;
}

.info-sheet {
  .v-overlay__content {
    align-self: flex-end;
    padding: 0;
    margin: 0;
    max-width: 100%;
    height: var(--info-sheet-height);
    width: var(--info-sheet-width);
  }

  &.info-sheet-right .v-overlay__content {
    position: absolute;
    top: 0;
    right: 0;
    max-height: 100%;
    & .v-card, & .v-card .v-window {
      height: 100%;
    }
    
    & .info-tabs h3 {
      font-size: 10pt;
    }
  }

  #tabs {
    width: calc(100% - 3em);
    align-self: left;
  }
  
  .info-text {
    height: var(--info-text-height);
    padding-bottom: 25px;
  
    & a {
      text-decoration: none;
    }
  }
  
  .close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 15;
  
    &:hover {
      cursor: pointer;
    }
  
    &:focus {
      color: white;
      border: 2px solid white;
    }
  }
  
  .scrollable {
    overflow-y: auto;
  }
  
  #tab-items {
    // padding-bottom: 2px !important;
  
    .v-card-text {
      font-size: ~"max(14px, calc(0.7em + 0.3vw))";
      padding-top: ~"max(2vw, 16px)";
      padding-left: ~"max(4vw, 16px)";
      padding-right: ~"max(4vw, 16px)";
  
      .end-spacer {
        height: 25px;
      }
    }
  
  }
  
  #close-text-icon {
    position: absolute;
    top: 0.25em;
    right: calc((3em - 0.6875em) / 3); // font-awesome-icons have width 0.6875em
    color: white;
  }

  // This prevents the tabs from having some extra space to the left when the screen is small
  // (around 400px or less)
  .v-tabs:not(.v-tabs--vertical).v-tabs--right>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__next, .v-tabs:not(.v-tabs--vertical):not(.v-tabs--right)>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__prev {
    display: none;
  }
}

.selected-info {
  position: absolute;
  padding: 10px;
  top: 10px;
  right: 10px;
  max-width: 30%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.selected-info.selected-info-tall {
  max-width: 60%;
  top: 20px;
}

// make sure we get the scrollbar for the folder view
.fv-root { // account for button and padding
  max-height: calc(var(--app-content-height) - 2rem - 2rem);
}




.tracked-element {
  pointer-events: auto;
  transition: scale 0.2s ease-in-out;
}

.tracked-element:hover {
  scale: 1.2;
  z-index: 10;
}

.tracked-places {
  width: max-content;
  padding: 0.5em;
  color: white;
  background-color: rgba(0, 0, 0, 0.51);
  backdrop-filter: blur(5px);
  border-radius: 5px;
  // transform: translate(-50%, -50%); // center on the point
  position: absolute;
}

#options {
  background: black;
  border: 1px solid var(--accent-color);
  border-radius: 20px;
  pointer-events: auto;

  .icon-wrapper {
    border: none;
  }

  #options-top-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  #options-content {
    padding: 5px;
  }
}

.fv-header {
  font-size: 10pt;

  svg {
    padding: 0px 5px;
    cursor: pointer;
  }
}

.infobox {
  position: fixed;
  left: 5px;
  bottom: 5px;
  max-width: 50%;
}

#goto-other-image {
  background: var(--accent-color);
  border: 1px solid black;
  pointer-events: auto;
  cursor: pointer;
  padding: 5px 10px;
  font-size: 16pt;
  border-radius: 10px;
}
</style>
