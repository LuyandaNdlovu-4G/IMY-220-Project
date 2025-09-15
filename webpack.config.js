const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { webpack } = require("webpack");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: "./frontend/src/index.js",
  
    output: {
        path: path.resolve(__dirname, "./frontend/dist"),
        filename: "bundle.js",
        publicPath: "/"
    },

    mode: "production",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    plugins: [
        // This plugin copies your index.html file to the output directory
        new HtmlWebpackPlugin({
            template: './frontend/public/index.html',
            filename: 'index.html', 
        }),

        new CopyPlugin({
            patterns: [
                { from: 'frontend/public/assets', to: 'assets'},
            ],
        }),
    ],
};
