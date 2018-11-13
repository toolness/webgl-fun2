const path = require('path');
const isDevServer = /webpack-dev-server/.test(process.argv[1]);

module.exports = {
  mode: isDevServer ? "development" : "production",
  devtool: isDevServer ? "inline-source-map" : "source-map",
  entry: "./src/main.tsx",
  output: {
    filename: "main.bundle.js",
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
