const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

dotenv.config();

const fileExtensions = ["jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2"];
const moduleRules = [
  {
    test: /\.css$/,
    use: ["style-loader", "css-loader"],
    exclude: /node_modules/
  },
  {
    test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
    use: "file-loader?name=[name].[ext]",
    exclude: /node_modules/
  },
  {
    test: /\.html$/,
    use: {
      loader: "html-loader",
      options: {
        sources: false
      }
    },
    exclude: /node_modules/
  },
  {
    test: /\.tsx?$/,
    use: 'ts-loader',
    exclude: /node_modules/
  }
];

module.exports = (env, argv) => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    entry: {
      'contentscript/index': path.join(__dirname, "src", "contentscript", "index.ts"),
      popup: './src/popup.ts',
      options: './src/options.ts',
      background: './src/background.ts',
      tts: './src/tts.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js'
    },
    module: {
      rules: moduleRules
    },
    optimization: {
      minimize: isProduction,
      minimizer: [new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      })]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "src/css/*.css",
            to({ context, absoluteFilename }) {
              return "contentscript/[name][ext]";
            }
          },
          { from: 'src/manifest.json', to: 'manifest.json' },
          { from: 'src/popup.html', to: 'popup.html' },
          { from: 'src/popup.css', to: 'popup.css' },
          { from: 'src/languageStrings.json', to: 'languageStrings.json' },
          { from: 'src/48.png', to: '48.png' },
          { from: 'src/options.html', to: 'options.html' },
          { from: 'src/options.css', to: 'options.css' },
        ]
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || (isProduction ? 'production' : 'development')),
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
        'process.env.SPEECH_KEY': JSON.stringify(process.env.SPEECH_KEY),
        'process.env.SPEECH_REGION': JSON.stringify(process.env.SPEECH_REGION)
      })
    ],
    resolve: {
      extensions: ['.ts', '.js']
    }
  };
};