const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: ['some-dependency'],
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  chainWebpack: config => {
    // 删除 Vue CLI 默认的 progress 插件（避免不兼容的 Progress 插件被注入）
    config.plugins.delete('progress')
  }
})