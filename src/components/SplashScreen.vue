<template>
  <v-overlay
    :model-value="showSplashScreen"
    absolute
    opacity="0.6"
    :style="cssVars"
    id="splash-overlay"
  >
    <focus-trap>
    <div
      id="splash-screen"
      v-click-outside="closeSplashScreen"
      :style="cssVars"
    >
      <div
        id="first-splash-row"
      >
        <font-awesome-icon
          id="close-splash-button"
          @click="closeSplashScreen"
          @keyup.enter="closeSplashScreen"
          icon="xmark"
          tabindex="0"
          />
        <div id="splash-screen-text">
          <p>See the</p>
          <p class="highlight">{{ title }}</p>
          Images!
        </div>
      </div>

      <div>
        <v-btn
          class="splash-get-started"
          @click="closeSplashScreen"
          @keyup.enter="closeSplashScreen"
          color="secondary"
          :density="$vuetify.display.xs ? 'compact' : 'default'"
          :size="$vuetify.display.width < 250 ? 'large' : 'x-large'"
          variant="elevated"
          rounded="lg"
        >
          Get Started
        </v-btn>
      </div>
    
      <div id="splash-screen-acknowledgements">
        <div id="splash-screen-logos">
          <credit-logos
            :default-logos="['cosmicds', 'wwt']"
            :extra-logos = "[
              {
                alt: 'Vera C. Rubin Observatory',
                src: './rubin_white_2.png',
                href: 'https://rubinobservatory.org/',
                name: 'Rubin Observatory'
              },
                            {
                alt: 'INTUITIVE Planetarium at the U.S. Space & Rocket Center',
                src: './SpaceRocketCenterIntuitivePlanetarium-Logo-small.png',
                href: 'https://www.rocketcenter.com/INTUITIVEPlanetarium',
                name: 'INTUITIVE Planetarium at the U.S. Space & Rocket Center'
              }
            ]"
            logo-margin="10vmin"  
          />
        </div>
        <span>
        Brought to you by <a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">Cosmic Data Stories</a> and <a href="https://www.worldwidetelescope.org/home/" target="_blank" rel="noopener noreferrer">WorldWide Telescope</a>.
        </span>
      </div>
    </div>
    </focus-trap>
  </v-overlay>
</template>


<script setup lang="ts">
import { computed } from 'vue';
import { FocusTrap } from "focus-trap-vue";

export interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cssVars?: any;
  title: string;
  color?: string,
  highlightColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  cssVars: () => ({}),
});

const cssVars = computed(() => {
  return {
    ...props.cssVars,
    ...{'--accent-color': props.color == null ? props.cssVars['--accent-color'] : props.color},
    ...{'--accent-color2': props.highlightColor == null ? props.cssVars['--accent-color2'] : props.highlightColor}
  };
});

const emits = defineEmits(['close']);

const showSplashScreen = defineModel({ default: true });
const splash = new URLSearchParams(window.location.search).get("splash")?.toLowerCase() !== "false";
if (!splash) {
  showSplashScreen.value = false;
}


function closeSplashScreen() {
  showSplashScreen.value = false;
  emits('close');
}


</script>


<style lang="less">

#splash-overlay {
  align-items: center;
  justify-content: center;
  font-size: min(8vw, 7vh);
  transition: width 0.5s, height 0.5s;
}

#splash-screen {
  color: #E0E0E0;

  @media (max-width: 699px) {
    max-height: 80vh;
    max-width: 90vw;
  }

  @media (min-width: 700px) {
    max-height: 85vh;
    max-width: min(70vw, 800px);
  }


  background: var(--rubin-teal-7);
  justify-content: space-around;
  align-content: center;
  padding-top: 2rem;
  padding-bottom: 1rem;
  padding-inline: 2rem;

  border-radius: 30px;
  border: min(1.2vw, 0.9vh) solid var(--accent-color);
  overflow: auto;
  font-family: 'Source Sans 3', 'Roboto', sans-serif;

  div {
    margin-inline: auto;
    text-align: center;
  }
  // make a paragraph inside the div centered horizontally and vertically
  p {
    font-family: 'Source Sans 3', 'Roboto', sans-serif;
    font-weight: regular;
    vertical-align: middle;
  }
    
  p.highlight {
    color: rgb(var(--rubin-teal-2));
    text-transform: uppercase;
    font-weight: bold;
  }
  
  p.small {
    font-size: var(--default-font-size);
    font-weight: bold;
  }

  #first-splash-row {
    width: 100%;
  }

  #close-splash-button {
    position: absolute;
    top: 20px;
    right: 20px;
    text-align: end;
    color: var(--accent-color);
    font-size: min(5vw, 4vh);
    padding: 0.25rem;
    margin: -0.25rem;

    &:hover {
      cursor: pointer;
    }
  }

  #splash-screen-text {
    // in the grid, the text is in the 2nd column
    display: flex;
    flex-direction: column;
    line-height: 130%;
    
  }

  .splash-get-started {
    border: 2px solid white;
    font-size: calc(1.8 * var(--default-font-size));
    // margin-top: 5%;
    // margin-bottom: 2%;
    font-weight: bold !important;
  }

  #splash-screen-guide {
    margin-block: 1.5em;
    font-size: min(5vw, 4vh);
    line-height: 140%;
    width: 75%;

    .v-col{
      padding: 0;
    }
    
    .svg-inline--fa {
      color:var(--accent-color);
      margin: 0 10px;
    }
  }

  #splash-screen-acknowledgements {
    // margin-top: 3rem;
    margin: clamp(0.5rem, 3vh, 3rem) auto;
    font-size: calc(var(--default-font-size));
    line-height: calc(var(--default-line-height));
    width: 60%; 
  }

  #splash-screen-logos {
    margin-block: 0.75em;

    img {
    height: 5vmin;
    vertical-align: middle;
    margin: 2px;
    }

    @media only screen and (max-width: 600px) {
      img {
        height: 24px;
      }
    }

    svg {
      vertical-align: middle;
      height: 24px;
    }
  }
}

@media (max-height: 500px) {
  #splash-screen {
    // display: flex;
    // flex-direction: column;
    // max-width: 200vh;
    // justify-content: center;
    // align-items: center;
    // gap: calc(0.5 * var(--default-line-height));
    overflow: hidden;
  
  #splash-screen-text {
    line-height: 75%;
  }
  
  .splash-get-started {
    margin-top: 0;
    margin-bottom: 0;
  }
  
  #splash-screen-acknowledgements {
    font-size: calc(1.5 * var(--default-font-size));
  }
}
  
}

@media (max-height: 310px) {
  #splash-screen {
    width: 50vw;
    padding-block: 10px;
  }
  #splash-screen-acknowledgements  {
    display: none;
  }
}

</style>
