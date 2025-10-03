const path = require("path");

module.exports = {
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "./public"),
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
            directory: path.join(__dirname, './public'),
        },
        port: 3001,
        open: true,
        hot: true,
        liveReload: true,
        historyApiFallback: {
            index: '/index.html'
        },
        watchFiles: [
            'src/**/*',
            'public/**/*'
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