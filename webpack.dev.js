const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/gubongo',
    output: {
        publicPath: '/',
        path: path.resolve(__dirname, 'dist'),
        filename: 'gubongo.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
         template: 'index.html',
        }),
        new CopyWebpackPlugin([ { from: 'images', to: 'images' } ]),
      ],
    devtool: 'inline-source-map',
    devServer: {
      contentBase: './src',
      watchContentBase: true,
      hot: true,
    },
};
