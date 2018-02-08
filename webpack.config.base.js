module.exports = {
  output: {
    library: 'VueAce',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /(\.js)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.vue'],
  },
}