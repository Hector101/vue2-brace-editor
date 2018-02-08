const webpack = require('webpack');
const UglifyJsWebpackPlugin  = require('uglifyjs-webpack-plugin');
const base = require('./webpack.config.base');


module.exports = {
  ...base,
  plugins: [
    new UglifyJsWebpackPlugin({
      cache: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    })
  ]
};
