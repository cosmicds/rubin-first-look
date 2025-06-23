import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { createVuetify } from 'vuetify';

// For test use. Do not include createVuetify()
// see https://next.vuetifyjs.com/en/features/treeshaking/
//import * as components from 'vuetify/components';
//import * as directives from 'vuetify/directives';

// Translations provided by Vuetify
import { en } from 'vuetify/locale';

// Styles
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

export const LAGOON_COLORS = {
  'charcoal': '#313333', 
  'off-white': '#F5F5F5', 
  'highlight-gold': '#C4A447', 
  'rubin-gray-1': '#DcE0E3',
  'deep-charcoal': "#1F2121",
  
  'cosmic-color-variant': '#E89C9F', 
  'cosmic-color': '#9E5A4C',
  'cosmic-color-1': '#EFDBD6',
  'cosmic-color-2': '#D99F92',
  'cosmic-color-3': '#CB6C57',
  'cosmic-color-4': '#A14B39',
  'cosmic-color-5': '#753B2E',
  'cosmic-color-6': '#552E25',
  'cosmic-color-7': '#0E0909',
} as const;


export default createVuetify({
  // Icon Fonts
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: { en },
  },
  theme: {
    // See https://rubin.canto.com/g/RubinVisualIdentity/index?viewIndex=0

    defaultTheme: 'rubinA',
    themes: {
      rubinA: {
        dark: true,
        colors: {
          // Core brand colors
          // Lighter button color
          primaryVariant: LAGOON_COLORS['cosmic-color-variant'],
          // Darker accent color
          primary: LAGOON_COLORS['cosmic-color'],

          // Surface and backgrounds
          // Main "v-application" background color
          background: LAGOON_COLORS['deep-charcoal'],
          // Info Drawer background color (set by Vuetify default)
          surface: LAGOON_COLORS['deep-charcoal'],

          // Thumbnail background color
          info: LAGOON_COLORS['charcoal'],

          // Thumbnail highlight color
          accent: LAGOON_COLORS['highlight-gold'],

          // "On-color" colors. These are only used by default on Vuetify components.
          // when you have set the color using color="blah", then the text color
          // will be "on-blah".
          "on-surface": LAGOON_COLORS['off-white'],
          "on-background": LAGOON_COLORS['off-white'],
          "on-primary": LAGOON_COLORS['off-white'],

          // Custom properties
          // Infobox background color, # also tooltip colors
          "surface-variant": LAGOON_COLORS['deep-charcoal'],
          "on-surface-variant": LAGOON_COLORS['off-white'],
          
          "text-color": LAGOON_COLORS['off-white'],
          "text-cosmic-color": LAGOON_COLORS['cosmic-color-2'],
          "text-cosmic-color-variant": LAGOON_COLORS['cosmic-color-variant'],
          
          "cosmic-background-variant": LAGOON_COLORS['cosmic-color-7'],

          ...LAGOON_COLORS,
        },
      },
      // TODO: This is the same as B right now
      rubinB: {
        dark: true,
        colors: {
          // Core brand colors
          // Button color
          primaryVariant: LAGOON_COLORS['cosmic-color-variant'],
          // Accent color
          primary: LAGOON_COLORS['charcoal'],

          // Surface and backgrounds
          // Main "v-application" background color
          background: LAGOON_COLORS['deep-charcoal'],
          // Info Drawer background color (set by Vuetify default)
          surface: LAGOON_COLORS['deep-charcoal'],

          // Thumbnail background color
          info: LAGOON_COLORS['cosmic-color'],

          // Thumbnail highlight color
          accent: LAGOON_COLORS['highlight-gold'],
          
          // "On-color" colors. These are only used by default on Vuetify components.
          // when you have set the color using color="blah", then the text color
          // will be "on-blah".
          "on-surface": LAGOON_COLORS['off-white'],
          "on-background": LAGOON_COLORS['off-white'],
          "on-primary": LAGOON_COLORS['off-white'],

          // Custom properties
          // Infobox background color
          "surface-variant": LAGOON_COLORS['deep-charcoal'],
          "on-surface-variant": LAGOON_COLORS['off-white'],
          
          "text-color": LAGOON_COLORS['off-white'],
          "text-cosmic-color": LAGOON_COLORS['cosmic-color-2'],
          "text-cosmic-color-variant": LAGOON_COLORS['cosmic-color-variant'],
          
          "cosmic-background-variant": LAGOON_COLORS['cosmic-color-7'],

          ...LAGOON_COLORS,
        }
      }
    },
  },
});



// Export for test.
//export { components, directives };
