const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  publicPath: '',
  pluginOptions: {
    cordovaPath: 'src-cordova'
  },
  configureWebpack: (config, ctx) => {
    if (process.env.NODE_ENV === 'development') {
      config.devtool = 'eval-source-map';
      config.output.devtoolModuleFilenameTemplate = info =>
  
        info.resourcePath.match(/\.vue$/) && !info.identifier.match(/type=script/)  // this is change ✨ 
          ? `webpack-generated:///${info.resourcePath}?${info.hash}`
          : `webpack-yourCode:///${info.resourcePath}`;
  
      config.output.devtoolFallbackModuleFilenameTemplate = 'webpack:///[resource-path]?[hash]'        
    }
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ })
    );
  },
  chainWebpack: config => {
    config.plugin('preload').tap(options => {
        options[0].as = (entry) => {
            if (/\.css$/.test(entry)) return 'style';
            if (/\.woff2$/.test(entry)) return 'font';
            if (/\.png$/.test(entry)) return 'image';
            return 'script';
          }
        options[0].include = 'allAssets'
        // options[0].fileWhitelist = [/\.wav/, /\.to/, /\.include/]
        // options[0].fileBlacklist = [/\.files/, /\.to/, /\.exclude/]
        return options
    })
  },
  devServer: {
    /*https: {
      //key: fs.readFileSync('../../../utility/localhost-ca/localhost.key'),
      //cert: fs.readFileSync('../../../utility/localhost-ca/localhost.crt'),
      key: fs.readFileSync('../../../utility/localhost-ca/localhost.key'),
      cert: fs.readFileSync('../../../utility/localhost-ca/localhost.crt'),
    },*/
    port: 8880
  }  
}
