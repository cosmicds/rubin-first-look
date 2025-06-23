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
      v-for="(place, index) in lowerLevelPlaces"
      :key="index"
      :place="place"
      :name="place.get_name()"
      :offset-ra="offsets[place.get_name()]?.raOff ?? 0"
      :offset-dec="offsets[place.get_name()]?.decOff ?? 0"
      :store="store"
      :visible="showLabels && !atTopLevel"
      v-slot="props"
      @click="handleSelection(place, 'click')"
      @dblclick="handleSelection(place, 'dblclick')"
    >
        <div :class='["tracked-places", {"star": place.angularSize < 0.02}]' v-on="props.on">{{ place.get_name() }}</div>
    </wwt-tracked-content>

    <wwt-tracked-content
      v-for="(place, index) in topLevelPlaces"
      :key="index"
      :place="place"
      :name="place.get_name()"
      :offset-ra="offsets[place.get_name()]?.raOff ?? 0"
      :offset-dec="offsets[place.get_name()]?.decOff ?? 0"
      :store="store"
      :visible="showLabels && atTopLevel"
      v-slot="props"
      @click="handleSelection(place, 'click')"
      @dblclick="handleSelection(place, 'dblclick')"
    >
        <div class="tracked-places top-level-place" v-on="props.on">{{ place.get_name() }}</div>
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
          :thumbnail-color="thumbnailColor"
          :highlight-color="highlightColor"
          :text-color="textColor"
          flex-direction="column"
          @select="({ item, type }) => handleSelection(item, type)"
        >
          <template #header="{ toggleExpanded, expanded }">
            <div class="fv-header">
              <span>Explore</span>
              <font-awesome-icon
                :icon="expanded ? 'chevron-up' : 'chevron-down'"
                @click="toggleExpanded()"
                @keyup.enter="toggleExpanded()"
                tabindex="0"
                aria-role="button"
                :aria-pressed="expanded"
                aria-hidden="false"
                aria-label="Toggle folder view"
              >
              </font-awesome-icon>
            </div>
          </template>
        </folder-view>
      </div>
      <div id="center-buttons" v-hide="fullscreen">
        <v-slider
          v-if="!smallSize && showSlider && mainImageInView"
          v-model="opacity"
          :min="0"
          :max="100"
          color="secondary"
          class="opacity-slider"
          hide-details
        >
          <template #prepend>
            NOIRLab All-Sky/DSS
          </template>
          <template #append>
            {{ store.foregroundImageset?.get_name() }}
          </template>
        </v-slider>
      </div>
      <div id="right-buttons">
        <div
          v-if="!fullscreen && topLevelPlaces.length > 1"
          :class="[{'go-to-a': mode == 'b', 'go-to-b': mode == 'a'}]"
          id="goto-other-image"
          @click="gotoMainImage((mode == 'a') ? 'b' : 'a', false)"
          @dblclick="gotoMainImage((mode == 'a') ? 'b' : 'a', true)"
        >
          Go to {{ mode == 'a' ? 'the' : '' }} {{ topLevelPlaces[mode=='a'? 1 : 0]?.get_name() }}
        </div>
        <div>
        <div v-if="!fullscreen">
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
        <div v-if="!fullscreen">
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
              v-model="showLabels"
              label="Object Labels"
              :color="buttonColor"
              hide-details
              density="compact"
            ></v-checkbox>
            <v-checkbox
              v-model="showCircle"
              label="Region Markers"
              :color="buttonColor"
              hide-details
              density="compact"
            ></v-checkbox>
            <v-checkbox
              v-model="showScalebar"
              label="Scale Bar"
              :color="buttonColor"
              hide-details
              density="compact"
            ></v-checkbox>
            <v-checkbox
              v-if="!smallSize"
              v-model="showSlider"
              label="Opacity Slider"
              :color="accentColor"
              hide-details
              density="compact"
            ></v-checkbox>
            <v-checkbox
              v-model="showConstellations"
              label="Constellations"
              :color="buttonColor"
              hide-details
              density="compact"
            ></v-checkbox>
          </div>
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
      <scalebar
        :width="1920"
        :breakpoints="breakpoints"
        :visible="showScalebar && !zooming"
        class="scalebar"
      ></scalebar>
      <div id="body-logos" v-if= "!smallSize">
        <credit-logos
          :default-logos="['cosmicds', 'wwt']"
          :extra-logos = "[
              {
                alt: 'INTUITIVE Planetarium at the U.S. Space & Rocket Center',
                src: './SpaceRocketCenterIntuitivePlanetarium-Logo-small.png',
                href: 'https://www.rocketcenter.com/INTUITIVEPlanetarium',
                name: 'INTUITIVE'
              },
              {
                alt: 'Vera C. Rubin Observatory',
                src: './rubin_white_2.png',
                href: 'https://rubinobservatory.org/',
                name: 'RubinObservatory'
              }
            ]"
        />
      </div>
      <infobox
        :class="[{'with-scalebar': showScalebar}, {'small-size': smallSize}]"
        v-hide="fullscreen"
        :place="currentPlace"
        :small="smallSize"
      >
      </infobox>
    </div>


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
          color="rubin-turquoise"
          slider-color="rubin-teal"
          id="tabs"
          dense
        >
          <v-tab class="info-tabs" tabindex="0"><h3>Rubin's Science</h3></v-tab>
          <v-tab class="info-tabs" tabindex="0"><h3>User Guide</h3></v-tab>
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
                <v-container class="pa-0">
                  <p>
                    This text is excerpted from the <a href="https://noirlab.edu/public/news/noirlab2521/" target="_blank" rel="noopener noreferrer">Rubin First Look Press Release</a>. See the full release for more information.
                  </p>
                  <h4 class="user-guide-header">About Rubin Observatory</h4>  
                  <div class="background-header-image"></div>
                  <p>
                    The NSF–DOE Vera C. Rubin Observatory, a major new scientific facility jointly funded by the U.S. National Science Foundation and the U.S. Department of Energy's Office of Science, released its first imagery on June 23, 2025 at an event in Washington, D.C. The imagery shows cosmic phenomena captured at an unprecedented scale. In just over 10 hours of test observations, NSF–DOE Rubin Observatory has already captured millions of galaxies and Milky Way stars and thousands of asteroids. The imagery is a small preview of Rubin Observatory's upcoming 10-year scientific mission to explore and understand some of the Universe's biggest mysteries. 
                  </p>
                  <p>
                    The result of more than two decades of work, Rubin Observatory is perched at the summit of Cerro Pachón in Chile, where dry air and dark skies provide one of the world's best observing locations. Rubin's innovative 8.4-meter telescope has the largest digital camera ever built, which feeds a powerful data processing system. Later in 2025, Rubin will begin its primary mission, the Legacy Survey of Space and Time, in which it will ceaselessly scan the sky nightly for 10 years to precisely capture every visible change.
                  </p>
                  <p>
                    The result will be an ultrawide, ultra-high-definition time-lapse record of the Universe. It will bring the sky to life with a treasure trove of billions of scientific discoveries. The images will reveal asteroids and comets, pulsating stars, supernova explosions, far-off galaxies and perhaps cosmic phenomena that no one has seen before.
                  </p>
                  <h4 class="user-guide-header">Who was Vera Rubin?</h4>
                  <p class="pb-5">
                    Rubin Observatory is named in honor of trailblazing U.S. astronomer Vera C. Rubin, who found conclusive evidence of vast quantities of invisible material known as dark matter. Understanding the nature of dark matter, dark energy and other large-scale cosmic mysteries is a central focus of Rubin Observatory's mission. Dark energy is what scientists call the mysterious and colossally powerful force that appears to be causing galaxies in the Universe to move away from each other at an accelerating rate. Although dark matter and dark energy collectively comprise 95% of the Universe, their properties remain unknown.
                  </p>
                  <div class="background-rubin-image"></div>
                  <p>
                    <cite>
                      Observatory Image Credit: RubinObs/NOIRLab/SLAC/NSF/DOE/AURA/B. Quint <a href="https://noirlab.edu/public/images/iotw2229a/" target="_blank" rel="noopener noreferrer">Link to original</a>
                    </cite><br/>
                    <cite>
                      Vera Rubin Image Credit: Carnegie Institution for Science/NOIRLab. <a href="https://noirlab.edu/public/images/VeraRubin-6-enlarged-CC/" target="_blank" rel="noopener noreferrer">Link to original</a>
                    </cite>
                  </p>
                  <v-spacer class="end-spacer"></v-spacer>
                </v-container>
                  
                <!-- <a href="https://rubin.canto.com/g/RubinVisualIdentity/index?viewIndex=0" target="_blank" rel="noopener noreferrer">Rubin Visual Identity</a>
                <v-spacer class="end-spacer"></v-spacer> -->
              </v-card-text>
            </v-card>
          </v-window-item>
          <v-window-item>
            <v-card class="no-bottom-border-radius scrollable">
              <v-card-text class="info-text no-bottom-border-radius">
                <v-container class="pa-0">
                  <p>
                    This <a href="https://www.worldwidetelescope.org/home" target="_blank" rel="noopener noreferrer">WorldWide Telescope</a> (WWT) interactive visualization provides a contextual, deep dive into the stunning new imagery from the Rubin Observatory.
                  </p>    
                  <h4 class="user-guide-header">Navigation & Information</h4>  
                  <ul class="text-list mx-5">
                    <li>
                      To navigate the WWT view, use the following controls:
                    </li>
                  </ul>            
                  <v-row align="center" class="mt-2 mx-3">
                    <v-col cols="4">
                      <v-chip
                        label
                        outlined
                      >
                        Pan
                      </v-chip>
                    </v-col>
                    <v-col cols="8" class="pt-1">
                      <strong>{{ touchscreen ? "press + drag" : "click + drag" }}</strong>  {{ touchscreen ? "" : "or" }}  <strong>{{ touchscreen ? "" : "W-A-S-D" }}</strong> {{ touchscreen ? "" : "keys" }}<br>
                    </v-col>
                  </v-row>
                  <v-row align="center" class="mx-3">
                    <v-col cols="4">
                      <v-chip
                        label
                        outlined
                      >
                        Zoom
                      </v-chip>
                    </v-col>
                    <v-col cols="8" class="pt-1">
                      <strong>{{ touchscreen ? "pinch in and out" : "scroll in and out" }}</strong> {{ touchscreen ? "" : "or" }} <strong>{{ touchscreen ? "" : "I-O" }}</strong> {{ touchscreen ? "" : "keys" }}<br>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col class="pt-0">
                      <ul class="text-list mx-5">
                        <li>
                          <strong>{{ touchscreen ? "Tap" : "Click" }}</strong> the <strong>Go to Image {{ mode == 'a' ? 'B' : 'A' }}</strong> button in the upper right to switch the view to that image.
                        </li>
                        <li>
                          <strong>{{ touchscreen ? "Tap" : "Click" }}</strong> on an object <strong>Image Thumbnail</strong> or <strong>Label</strong> to pan to that object.
                        </li>
                        <li>
                          <strong>Double-{{ touchscreen ? "tap" : "click" }}</strong> on an object <strong>Image Thumbnail</strong> or <strong>Label</strong> to move instantly to that object.
                        </li>
                        <li>
                          <strong>{{ touchscreen ? "Tap" : "Click" }}</strong> on the object <strong>Information Box</strong> in the lower left to learn more about it.
                        </li>
                      </ul>   
                    </v-col>  
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <h4 class="user-guide-header">Main View Buttons</h4>
                      <ul class="text-list mx-5">
                        <li>
                          <font-awesome-icon
                            class="bullet-icon"
                            icon="info"
                            size="lg" 
                          ></font-awesome-icon>
                           open or close this information panel
                        </li>
                        <li><font-awesome-icon
                            class="bullet-icon"
                            icon="video"
                            size="lg" 
                          ></font-awesome-icon>
                          view a video tutorial about this visualization
                        </li>
                        <li><font-awesome-icon
                            class="bullet-icon"
                            icon="expand"
                            size="lg" 
                          ></font-awesome-icon>
                          toggle fullscreen mode ( view only the imagery with no user interface.)
                        </li>
                        <li> <font-awesome-icon
                            class="bullet-icon"
                            icon="compress"
                            size="lg" 
                          ></font-awesome-icon>
                          return to the normal user interface.
                        </li>
                        <li><font-awesome-icon
                            class="bullet-icon"
                            icon="sliders"
                            size="lg" 
                          ></font-awesome-icon>
                          open more control options
                        </li>
                      </ul>
                      <h4 class="user-guide-header mt-5">Controls</h4>
                      <ul class="text-list mx-5">
                        <li>
                          <strong>Object Labels</strong>: Display or hide the names of objects in the view.
                        </li>
                        <li>
                          <strong>Region Markers</strong>: Display or hide the boxes that roughly delineate the labeled objects.
                        </li>
                        <li>
                          <strong>Scale Bar</strong>: Display or hide the scale bar that contextualizes how much of the sky you are seeing.
                        </li>                           
                        <li>
                          <strong>Opacity Slider</strong>: Display or hide the opacity slider that lets you compare the new Rubin imagery with a background sky from NOIRLab and the Digitized Sky Survey.
                        </li>                        
                        <li>
                          <strong>Constellations</strong>: Display or hide the constellation lines and labels to orient yourself in the sky.
                        </li>          
                      </ul>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <div class="credits">
                      <h4>Credits:</h4>
                      <p>
                        Rubin imagery and informational text provided by <strong><a href="https://noirlab.edu/">NOIRLab</a></strong>.
                      </p>
                      <h5><a href="https://www.rocketcenter.com/INTUITIVEPlanetarium" target="_blank" rel="noopener noreferrer"><em>INTUITIVE</em>&reg; Planetarium at the U.S. Space & Rocket Center</a></h5>
                      <p>David Weigel</p>
                      <h5><a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">CosmicDS</a></h5>
                      <p>Alyssa Goodman</p>
                      <p>Pat Udomprasert</p>
                      <p>Jon Carifio</p>
                      <p>John Lewis</p>

                      <h5><a href="https://www.worldwidetelescope.org/home" target="_blank" rel="noopener noreferrer">WorldWide Telescope</a></h5>
                      <p>Peter Williams</p>
                      <p>Jon Carifio</p>
                      <p>David Weigel</p>
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
import { D2R, H2R, distance } from "@wwtelescope/astro";
import { Circle, Folder, Imageset, Place, WWTControl } from "@wwtelescope/engine";
import { ImageSetType, Thumbnail } from "@wwtelescope/engine-types";
import { GotoRADecZoomParams, engineStore } from "@wwtelescope/engine-pinia";
import { BackgroundImageset, skyBackgroundImagesets, supportsTouchscreen, blurActiveElement, useWWTKeyboardControls } from "@cosmicds/vue-toolkit";
import { RUBIN_COLORS } from "../plugins/vuetify";
import { useDisplay, useTheme } from "vuetify";
import { type ItemSelectionType } from "./types";

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

withDefaults(defineProps<RubinFirstLookProps>(), {
  wwtNamespace: "rubin-first-look",
});

const breakpoints = [
  [15, 3.5, "~ Rubin Field of View (3.5 degrees)"],
  [4, 3.5, "Rubin Field of View (3.5 degrees)"],
  [1, 0.5, "Full Moon (0.5 degrees)"],
  [0.25, 5 / 60, "JWST Field of View (5 arcmin)"],
  [5 / 60, 1 / 60, "1 arcmin"],
  [1 / 60, 30 / 3600, "0.5 arcmin"],
  [0, 1 / 3600, "1 arcsec"],
];

/* Properties related to device/screen characteristics */
const smallSize = computed(() => {
  return display.smAndDown.value && (display.height.value > 1.2 * display.width.value);
});

const backgroundImagesets = reactive<BackgroundImageset[]>([]);
const sheet = ref<SheetType | null>(null);
const layersLoaded = ref(false);
const positionSet = ref(false);
const zooming = ref(false);
const opacity = ref(100);

let zoomTimeout: ReturnType<typeof setTimeout> | null = null;
// See https://rubin.canto.com/g/RubinVisualIdentity/index?viewIndex=0
const accentColor = computed(() => theme.global.current.value.colors.primary);
const buttonColor = computed(() => theme.global.current.value.colors.primaryVariant);
const thumbnailColor = computed(() => theme.global.current.value.colors.info);
const highlightColor = computed(() => theme.global.current.value.colors.accent);
const textColor = computed(() => theme.global.current.value.colors["on-background"]);
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
const mainImageInView = ref(false);

type Mode = "a" | "b";
const mode = ref<Mode>("a");
const folder = computed(() => mode.value == "a" ? highlightsA.value : highlightsB.value);

const INFOBOX_ZOOM_CUTOFF = 25;
const SMALL_LABELS_ZOOM = 25;
let circle: Circle | null = null;
const showOptions = ref(false);
const showCircle = ref(false);
const showLabels = ref(false);
const showScalebar = ref(!smallSize.value);
const showSlider = ref(false);
const showConstellations = ref(false);
const highlightPlaceFromZoom = computed(() => zoomDeg.value < INFOBOX_ZOOM_CUTOFF);
const showPlaceHighlights = computed(() => !showTextSheet.value && currentPlace.value !== null && highlightPlaceFromZoom.value);
const atTopLevel = computed(() => zoomDeg.value > SMALL_LABELS_ZOOM);

import { useTrackedElements } from "./composables/useTrackedElements";
const _ute = useTrackedElements("", store);

// Offsets are in RA/Dec 
// If you passt them to :offset-x, or :offset-y instead
// offset ra will be how left/right the label is offset and 
// // offset dec will be how up/down the label is offset
interface Offset {
  raOff: number;
  decOff: number;
  rollDeg?: number; // then name of the top-level
}

type OffsetRecords = Record<string, Offset>;
const offsets = ref<OffsetRecords>({});

function rotateOffsetToScreen(offset: Offset): Offset {
  // Rotate the offset to the screen orientation
  const cosRoll = Math.cos((offset.rollDeg ?? 0) * D2R);
  const sinRoll = Math.sin((offset.rollDeg ?? 0) * D2R);
  return {
    raOff: offset.raOff * cosRoll + offset.decOff * sinRoll,
    decOff: -offset.raOff * sinRoll + offset.decOff * cosRoll,
  };
}



fetch(`${domain}/offsets.json`)
  .then(response => response.json())
  .then(data => {
    const keys = Object.keys(data);
    keys.forEach(key => {
      const offset = data[key] as Offset;
      // Rotate the offset to the screen orientation
      data[key] = rotateOffsetToScreen(offset);
    });
    offsets.value = data as OffsetRecords;
    
  })
  .catch(error => {
    console.error("Error fetching offsets:", error);
  });
  
onMounted(() => {
  store.waitForReady().then(async () => {
    // window.addEventListener('contextmenu', function(event) {
    //   event.stopImmediatePropagation();
    // }, true);
    skyBackgroundImagesets.forEach(iset => backgroundImagesets.push(iset));
    const loadPromises = [imageAPlacesURL, imageBPlacesURL].map(url => {
      return store.loadImageCollection({
        url,
        loadChildFolders: false,
      });
    });
    Promise.all(loadPromises).then(loadedFolders => {
      loadedFolders.forEach((loadedFolder, index) => {
        const children = loadedFolder.get_children();
        const highlightsFolder = new Folder();
        children?.forEach((item, index) => {
          if (item instanceof Place) {
            if (index === 0) {
              highlightsFolder.addChildPlace(item);
              topLevelPlaces.push(item);
            } else {
              if (item.get_names().length == 1) {
                highlightsFolder.addChildPlace(item);
              }
              lowerLevelPlaces.push(item);
            }
          }
        });
        const highlightsRef = index === 0 ? highlightsA : highlightsB;
        highlightsRef.value = highlightsFolder;
      });
    }).then(() => {
      positionSet.value = true;
      layersLoaded.value = true;
      gotoMainImage(mode.value, true);
    });
    
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

  });
});

function findClosest(places: Place[]): Place | null {
  let closest = currentPlace.value;
  let closestDist = closest === null ? null : distanceFromCenter(closest);

  places.forEach(place => {
    const dist = distanceFromCenter(place);
    if ((!isNaN(dist)) && ((closestDist === null) || (dist < closestDist))) {
      closest = place;
      closestDist = dist;
    }
  });

  return closest !== null && placeInView(closest) ? closest : null;
}

const closestPlace = ref<Place | null>(null);
function updateClosestPlace() {
  currentPlace.value = findClosest(atTopLevel.value ? topLevelPlaces : lowerLevelPlaces);
  closestPlace.value = currentPlace.value;
}

const forceShowCircle = ref(false);
const _onMarkerHover = (place: Place, show: boolean) => {
  forceShowCircle.value = show;
  console.log(place.get_name(), closestPlace.value?.get_name());
  currentPlace.value = show ? place : closestPlace.value; 
};

function updateCircle(place: Place | null) {
  if (!highlightPlaceFromZoom.value || place === null) {
    if (!forceShowCircle.value) {
      circle?.set_opacity(0);
      return;
    }
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

function distanceFromCenter(place: Place): number {
  return distance(place.get_RA() * H2R, place.get_dec() * D2R, raRad.value, decRad.value);
}

function placeInView(place: Place, fraction=0.5): boolean {
  // checks if the center of place is in the current field of view
  // Assume the Zoom level corresponds to the size of the image
  // fraction is ~fraction of the place that must be in the current FOV
  // by default, allow 1/2 of the place to be visible and still be considered in view
  if (place == null) {
    return false;
  }
  const iset = place.get_studyImageset() ?? place.get_backgroundImageset();
  if (iset == null) {
    return false;
  }

  let dist = distanceFromCenter(place);
  const isetFov = (place.get_zoomLevel() / 6) * D2R;
  const curFov = wwtSmallestFov();

  dist += (fraction - 0.5) * isetFov;
  return dist < curFov / 2;
}

function handleSelection(item: Thumbnail, selection: ItemSelectionType) {
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
    "--button-color": buttonColor.value,
    "--thumbnail-color": thumbnailColor.value,
    "--app-content-height": showTextSheet.value && infoSheetLocation.value === "bottom" ? `${100 - infoFraction}vh` : "100dvh",
    "--app-content-width": showTextSheet.value && infoSheetLocation.value === "right" ? `${100 - infoFraction}vw` : "100dvw",
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
    mainImageInView.value = true;
  } else if (placeInView(topLevelPlaces[1])) {
    mode.value = "b";
    mainImageInView.value = true;
  } else {
    mainImageInView.value = false;
  }
  updateClosestPlace();
}

function onZoomChange(newZoom: number, oldZoom: number) {
  zooming.value = Math.abs((newZoom - oldZoom) / oldZoom) > 0.01;
  updateClosestPlace();
  updateCircle(currentPlace.value);
  if (zooming.value) {
    zoomTimeout = setTimeout(() => {
      zooming.value = false;
    }, 100);
  } else if (zoomTimeout) {
    clearTimeout(zoomTimeout);
  }

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
  theme.global.name.value = newMode === "a" ? "rubinA" : "rubinB";
  opacity.value = 100;
});
watch(opacity, store.setForegroundOpacity);
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
  scrollbar-color: rgb(var(--v-theme-rubin-teal-2)) transparent;
  
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
  color: rgb(var(--v-theme-on-background));
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

.icon-wrapper {
  border-radius: 0.75em;
}
.svg-inline--fa {
  aspect-ratio: 1.3 / 1;
}

#right-buttons, #right-buttons > div {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  height: auto;
}

@media (max-width: 600px) {
  .icon-wrapper {
    font-size: 0.8em;
  }
}


#bottom-content {
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  right: 0;
  width: fit-content;
  align-items: flex-end;
  pointer-events: none;
  align-items: flex-end;
  gap: 10px;
}

#body-logos {
  align-self: flex-end;
  img{
    margin-inline: 1rem;
  }
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
  
  div.background-header-image {
    width: 100%;
    height: 100px;
    background-image: url("https://storage.noirlab.edu/media/archives/images/screen/iotw2229a.jpg");
    background-size: cover;
    background-position: center;
    position: relative;
    margin-bottom: 2em;
  }
  
  div.background-rubin-image {
    width: 80%;
    aspect-ratio: 1 / 1;;
    background-image: url("@/assets/Vera_Rubin_measuring_spectra.jpg");
    background-size: cover;
    background-position: center;
    position: relative;
    margin-bottom: 2em;
  }
  
  cite {
      color: rgb(var(--v-theme-rubin-teal-3));
      font-size:0.9em;
  }
  
  .info-text {
    height: var(--info-text-height);
    padding-bottom: 25px;

    p {
      margin-block: 0.5em;
    }

    a {
      color: var(--rubin-teal-2)
    }


    h4 {
      font-size: 1.2em;
    }

    h5 {
      font-size: 1em;
      font-weight: bold;
      margin-top: 1em;
    }

    li {
      margin-block: 0.5em;
    }
  }

  .bullet-icon {
    color: var(--button-color);
    width: 1.6em;
    padding-right: 0.5em;
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
      padding: 1em;
  
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
  font-size: 0.8em;
  padding: 0.25em 0.5em;
  color: white;
  background-color: rgba(0, 0, 0, 0.51);
  border: 0.5px solid rgb(var(--v-theme-rubin-teal-4));
  backdrop-filter: blur(5px);
  border-radius: 5px;
  // transform: translate(-50%, -50%); // center on the point
  transform: translateY(-50%) translateX(1.5em);
  position: absolute;
}

.tracked-places.top-level-place {
  font-size: 1em;
  padding: 0.5em 1em;
  color: rgb(var(--v-theme-rubin-teal-2));
  transform: translate(-50%, -100%); 
}


.tracked-places.star {
  transform: translateY(-50%) translateX(0.5em);
}

// .tracked-places:not(.star):before {
//   position: absolute;
//   content:'';
//   box-shadow: 0px 0px 0px 2px black, 0px 0px 0px 4px white;
//   width: 0.5em;
//   height: 0px;
//   border-radius: 50%;
//   top: 50%;
//   left: -1em;
//   transform: translateY(-50%) translateX(-50%);
// }




#options {
  background: black;
  border: 1px solid rgb(var(--v-theme-primaryVariant));
  border-radius: 0.75em;
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
  
  input[type="checkbox"] {
    color: rgb(var(--v-theme-rubin-teal-2));
  }
}

.fv-header {
  font-size: 11pt;
  font-weight: bold;

  svg {
    padding: 0px 5px;
    cursor: pointer;
    float: right;
  }
}

.infobox {
  position: fixed;
  left: 5px;
  bottom: 5px;
  max-width: 50%;
  max-height: 50dvh;
  overflow-y: scroll;
  scrollbar-color: rgb(var(--v-theme-rubin-teal-2)) transparent;
}

.infobox.small-size {
  overflow-y: visible;
}
#app details.expansion-panel[open] > summary > strong {
  font-size: 1.2em;
}

@media (max-width: 592px) {
  .infobox.small-size.with-scalebar {
    bottom: 70px;
    left: 25%;
    transform: translateX(-50%);
  }
}

#center-buttons {
  min-width: 2rem;
}
#goto-other-image {
  pointer-events: auto;
  cursor: pointer;
  padding: 5px 10px;
  font-size: min(16px, 5vw);
  border-radius: 10px;
  user-select: none;

  @media only screen and (max-width: 600px) {
    font-size: 11pt;
  }
}

@media (max-width: 960px) {
  #goto-other-image {
    font-size: min(16px, 4vw);
    padding: 5px 5px;
  }
}

// when in mode-a we want to show the button with mode-b colors
#goto-other-image.go-to-b {
  --bg: var(--v-theme-rubin-deep-charcoal);
  // background-color: rgb(var(--bg)); // fallback
  background: radial-gradient(circle, rgba(var(--bg), 0.8) 0%, rgba(var(--bg), 0.6) 100%);
  backdrop-filter: blur(5px); 
  color: rgb(var(--v-theme-rubin-off-white));
  border: 1px solid rgb(var(--v-theme-rubin-teal));
}

// when in mode-b we want to show the button with mode-a colors
#goto-other-image.go-to-a {
  --bg: var(--v-theme-rubin-teal);
  // background-color: rgb(var(--v-theme-rubin-teal)); // fallback
  background: radial-gradient(circle, rgba(var(--bg), 0.9) 0%, rgba(var(--bg), 0.8) 100%);
  color: rgb(var(--v-theme-rubin-off-white));
  border: 1px solid rgb(var(--v-theme-rubin-off-white));
}


#app details.expansion-panel {
  border-radius: 0.5em;
}
#app .fv-root.folder-view {
  border-radius: 0.5em;
  padding: calc(0.75em / 2);
  
  .item-name {
    font-size: 0.9em;
    line-height: 1.1;
  }
}

.infobox-content {
  p {
    margin-bottom: 1em;
  }
}

a {
  color: rgb(var(--rubin-teal-2));
  text-decoration: underline;
  font-weight: regular;
}

a:visited {
  color: rgb(var(--rubin-teal-2));
}

h4 {
  color: var(--rubin-gray-1);
  font-weight: bold;
}

.scalebar {
  display: inline-block;
  width: fit-content;
  border-radius: 5px;
}

.opacity-slider {
  background-color: rgba(33, 33, 33, 0.7);
  padding-inline: 0.5em;
  border-radius: 5px;
}

#center-buttons {
  width: 50%;
}

.v-slider {
  width: 100% !important;
  pointer-events: auto;
}
</style>
