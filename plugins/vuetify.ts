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

    defaultTheme: 'rubinDark',
    themes: {
      rubinDark: {
        dark: true,
        colors: {
          // Core brand colors
          primary: '#00BABC',     // Rubin turquoise
          primaryVariant: '#058B8C', // Rubin teal 
          secondary: '#583671',   // Rubin purple
          accent: '#c4a447',      // Highlight gold

          // Surface and backgrounds
          background: '#1f2121',  // Deep charcoal
          surface: '#313333',     // # rubin charcoal
          surfaceVariant: '#062E2C', // Teal-toned surface

          // Text colors
          onPrimary: '#F5F5F5',
          onSecondary: '#F5F5F5',
          onSurface: '#F5F5F5',
          textPrimary: '#F5F5F5',
          textMuted: '#333333',
          
          // Rubin Specific Colors
          'rubin-turquoise': '#00BABC', 
          'rubin-teal': '#058B8C', 
          'rubin-charcoal': '#313333', 
          'rubin-off-white': '#F5F5F5',
          'rubin-teal-1':  '#D9F7F6',
          'rubin-teal-2':  '#B1F2EF',
          'rubin-teal-3':  '#009FA1',
          'rubin-teal-4': '#12726D',
          'rubin-teal-5': '#0C4A47',
          'rubin-teal-6': '#062E2C',
          'rubin-teal-7': '#021A18',
        },
      },
    },
  },
});



// Export for test.
//export { components, directives };
