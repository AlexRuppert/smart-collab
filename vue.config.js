module.exports = {
  //transpileDependencies: ['vuetify'],
  productionSourceMap: false,

  publicPath: process.env.NODE_ENV === 'production' ? '/smart-collab/' : '/',
  outputDir: 'docs',

  pluginOptions: {
    ghPages: {
      dir: 'docs',
    },
  },
}
