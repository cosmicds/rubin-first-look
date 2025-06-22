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

// Rubin Specific Colors
export const RUBIN_COLORS = {
  'rubin-turquoise': '#00BABC', // on light and dark backgrounds
  'rubin-teal': '#058B8C', // on light and dark backgrounds
  'rubin-charcoal': '#313333', // on light backgrounds
  'rubin-off-white': '#F5F5F5', // on dark backgrounds
  'rubin-purple': '#583671',
  'rubin-highlight-gold': '#C4A447',
  'rubin-gray-1': '#DcE0E3',
  'rubin-gray-2': '#6a6E6E',
  'rubin-deep-charcoal': "#1F2121",
  'rubin-teal-1': '#D9F7F6',
  'rubin-teal-2': '#B1F2EF',
  'rubin-teal-3': '#009FA1',
  'rubin-teal-4': '#12726D',
  'rubin-teal-5': '#0C4A47',
  'rubin-teal-6': '#062E2C',
  'rubin-teal-7': '#021A18',
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

    defaultTheme: 'rubinB',
    themes: {
      rubinB: {
        dark: false,
        colors: {
          // Core brand colors
          // Lighter button color
          primaryVariant: RUBIN_COLORS['rubin-turquoise'],
          // Darker accent color
          primary: RUBIN_COLORS['rubin-teal'],

          // Surface and backgrounds
          // Main "v-application" background color
          background: RUBIN_COLORS['rubin-deep-charcoal'],
          // Info Drawer background color (set by Vuetify default)
          surface: RUBIN_COLORS['rubin-deep-charcoal'],

          // "On-color" colors. These are only used by default on Vuetify components.
          // when you have set the color using color="blah", then the text color
          // will be "on-blah".
          "on-surface": RUBIN_COLORS['rubin-off-white'],
          "on-background": RUBIN_COLORS['rubin-off-white'],
          "on-primary": RUBIN_COLORS['rubin-off-white'],

          // Custom properties
          // Infobox background color
          "surface-variant": RUBIN_COLORS['rubin-deep-charcoal'],

          ...RUBIN_COLORS,
        },
      },
      // TODO: This is the same as B right now
      rubinA: {
        dark: false,
        colors: {
          // Core brand colors
          // Button color
          primaryVariant: RUBIN_COLORS['rubin-turquoise'],
          // Accent color
          primary: RUBIN_COLORS['rubin-deep-charcoal'],

          // Surface and backgrounds
          // Main "v-application" background color
          background: RUBIN_COLORS['rubin-deep-charcoal'],
          // Info Drawer background color (set by Vuetify default)
          surface: RUBIN_COLORS['rubin-deep-charcoal'],

          // "On-color" colors. These are only used by default on Vuetify components.
          // when you have set the color using color="blah", then the text color
          // will be "on-blah".
          "on-surface": RUBIN_COLORS['rubin-off-white'],
          "on-background": RUBIN_COLORS['rubin-off-white'],
          "on-primary": RUBIN_COLORS['rubin-off-white'],

          // Custom properties
          // Infobox background color
          "surface-variant": RUBIN_COLORS['rubin-deep-charcoal'],

          ...RUBIN_COLORS,
        }
      }
    },
  },
});



// Export for test.
//export { components, directives };
