const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: "./src/app.ts",
  output: {
    filename: "app.bundle.js",
    path: path.join(__dirname, 'static')
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".glsl"]
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, exclude: /node_modules/, loader: "ts-loader" },
      { test: /\.glsl$/, exclude: /node_modules/,
        loader: path.resolve(__dirname, 'glsl-loader.js') }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'static')
  }
};
