const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './background.js',
    content: './content.js',
    'popup/popup': './popup/popup.js',
    'options/options': './options/options.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',  // Change this to 'production' for the final build
  devtool: 'inline-source-map',  // This helps with debugging
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "popup/popup.html", to: "popup/popup.html" },
        { from: "popup/popup.css", to: "popup/popup.css" },
        { from: "options/options.html", to: "options/options.html" },
        { from: "options/options.css", to: "options/options.css" },
        { from: "images", to: "images" },
      ],
    }),
  ],
};