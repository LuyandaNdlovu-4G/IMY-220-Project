const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: path.resolve(__dirname, "./frontend/src/index.js"),

    output: {
        path: path.resolve(__dirname, "./frontend/dist"),
        filename: "bundle.js",
        publicPath: "/"
    },

    mode: "production", // change to "production" for production builds

    module: {
        rules: [
            {
                test: /\.(js|jsx)$/, // handle both .js and .jsx files
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-env",
                            "@babel/preset-react"
                        ]
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            }
        ]
    },

    resolve: {
        extensions: [".js", ".jsx"]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "./frontend/public/index.html"),
            filename: "index.html"
        })
    ],
};
