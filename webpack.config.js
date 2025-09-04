const path = require("path");

module.exports = {
    entry: "./frontend/src/index.js",
    output: {
        path: path.resolve(__dirname, "./frontend/public"),
        filename: "bundle.js",
        publicPath: "/"
    },
    mode: "development",
    devtool: "inline-source-map",
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
    devServer: {
        static: {
            directory: path.join(__dirname, './frontend/public'),
        },
        port: 3001,
        open: true,
        hot: true,
        liveReload: true,
        historyApiFallback: {
            index: '/index.html'
        },
        watchFiles: [
            'frontend/src/**/*',
            'frontend/public/**/*'
        ],
        compress: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        }
    }
}