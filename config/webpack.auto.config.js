const path = require("path")
const JavascriptObfuscator = require("webpack-obfuscator")

const dictionary = []
for (let i = 1024; i < 2048; i++) {
    // dictionary.push(i.toString(2).replace(/1/g, "ᐛ").replace(/0/g, "ᐖ"))
    dictionary.push(i.toString(2).replace(/1/g, "ν").replace(/0/g, "v"))
    // dictionary.push(i.toString(3).replace(/2/g, 'ف').replace(/1/g, "با").replace(/0/g, "ب"))
    // dictionary.push(i.toString(3).replace(/2/g, '🧡').replace(/1/g, "🖤").replace(/0/g, "❤️"))
}

module.exports = {
    entry: {
        app: path.resolve(__dirname, "../src/index.js"),
        // app: path.resolve(__dirname, "../config/decode.js"),
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "../dist"),
        libraryTarget: "commonjs2",
    },
    target: "node",
    mode: "production",
    plugins: [
        new JavascriptObfuscator({
            compact: true,
            identifierNamesGenerator: "dictionary",
            identifiersDictionary: dictionary,
            target: "browser-no-eval",
            unicodeEscapeSequence: false,
            transformObjectKeys: true,
        }),
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader",
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: {
                    loader: "url-loader",
                },
            },
        ],
    },
    resolve: {
        extensions: [".js", ".ts", ".json"],
        alias: {
            "@": path.resolve(__dirname, "../src"),
        },
    },
}
