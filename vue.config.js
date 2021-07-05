const webpack = require('webpack');
const fs = require('fs');

function httpMode() {
  if (process.env.FORCE_HTTP) {
    return { 
      port: 8881,
      host: 'localhost'
    }
  } else {
    return {
      https: {
        key: fs.readFileSync('../../../utility/localhost-ca/localhost.key'),
        cert: fs.readFileSync('../../../utility/localhost-ca/localhost.crt'),
      },
      port: 8880,
      host: 'localhost'
    }  
  }
}

module.exports = {
  //publicPath: '/', // history mode
  publicPath: '', // hash mode
  outputDir: './dist',
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
            //if (/\.wav$/.test(entry)) return 'sound';
            return 'script';
          }
        //options[0].include = 'allAssets'
        // options[0].fileWhitelist = [/\.wav/, /\.to/, /\.include/]
        // options[0].fileBlacklist = [/\.files/, /\.to/, /\.exclude/]
        return options
    }),
    config.optimization.minimize(false)
  },
  devServer: httpMode()
}
