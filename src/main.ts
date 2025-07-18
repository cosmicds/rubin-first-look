import Vue, { createApp, type Plugin } from "vue";

import { FundingAcknowledgement, IconButton, CreditLogos } from "@cosmicds/vue-toolkit";
import RubinFirstLook from "./RubinFirstLook.vue";
import FolderView from "./components/FolderView.vue";
import ExpansionWrapper from "./components/ExpansionWrapper.vue";
import Infobox from "./components/Infobox.vue";
import Scalebar from "./components/Scalebar.vue";
import SplashScreen from "./components/SplashScreen.vue";
import WWTTrackedContent from "./components/WWTTrackedContent.vue";
import vuetify from "../plugins/vuetify";


import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import { WWTComponent, wwtPinia } from "@wwtelescope/engine-pinia";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faChevronDown,
  faChevronUp,
  faCompress,
  faExpand,
  faInfo,
  faSliders,
  faTimes,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";

library.add(faChevronDown);
library.add(faChevronUp);
library.add(faCompress);
library.add(faExpand);
library.add(faInfo);
library.add(faSliders);
library.add(faTimes);
library.add(faVideo);

/** v-hide directive taken from https://www.ryansouthgate.com/2020/01/30/vue-js-v-hide-element-whilst-keeping-occupied-space/ */
// Extract the function out, up here, so I'm not writing it twice
const update = (el: HTMLElement, binding: Vue.DirectiveBinding) => el.style.visibility = (binding.value) ? "hidden" : "";

createApp(RubinFirstLook, {
  wwtNamespace: "rubin-first-look"
})
 
  // Plugins
  .use(wwtPinia as unknown as Plugin<[]>)
  .use(vuetify)

  // Directives
  .directive(
    /**
    * Hides an HTML element, keeping the space it would have used if it were visible (css: Visibility)
    */
    "hide", {
      // Run on initialisation (first render) of the directive on the element
      beforeMount(el, binding, _vnode, _prevVnode) {
        update(el, binding);
      },
      // Run on subsequent updates to the value supplied to the directive
      updated(el, binding, _vnode, _prevVnode) {
        update(el, binding);
      }
    })

  // Components
  .component("WorldWideTelescope", WWTComponent)
  .component('font-awesome-icon', FontAwesomeIcon)
  .component('icon-button', IconButton)
  .component('funding-acknowledgement', FundingAcknowledgement)
  .component('credit-logos', CreditLogos)
  .component('splash-screen', SplashScreen)
  .component('folder-view', FolderView)
  .component('expansion-wrapper', ExpansionWrapper)
  .component('infobox', Infobox)
  .component('wwt-tracked-content', WWTTrackedContent)
  .component('scalebar', Scalebar)

  // Mount
  .mount("#app");
