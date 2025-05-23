const { VuetifyPlugin } = require('webpack-plugin-vuetify');
const { defineConfig } = require("@vue/cli-service")
const webpack = require("webpack");
const path = require("path");

module.exports = defineConfig({
  publicPath: "./",
  
  configureWebpack: {
    plugins: [
      new VuetifyPlugin(),
      new webpack.DefinePlugin({
        // https://github.com/vuejs/vue-cli/pull/7443
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      })
    ],
    resolve: {
      alias: {
        vue: path.resolve("./node_modules/vue")
      }
    }
  },

  // Needed for BrowserStack/Safari testing as of 2023 March. This makes the
  // dev server insecure, but that's OK since we only use it in controlled
  // circumstances. https://stackoverflow.com/questions/43619644
  devServer: {
    allowedHosts: 'all',
    client: {
      overlay: false
    }
  }
});
