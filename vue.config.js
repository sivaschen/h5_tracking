
// vue.config.js
module.exports = {
    devServer: {
      proxy: {
        '/api': {
          target: 'url',
          changeOrigin: true,
          pathRewrite: {
            '^/api': ''
          }
        }
      },
      // 此处开启 https
      https: true
    }
  }
