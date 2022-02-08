const path = require("path");
const mode = process.env.NODE_ENV || "development";
const minimize = mode === "production";
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const plugins = [];

if (mode === "production") {
	plugins.push(new CssMinimizerPlugin({
		minimizerOptions: {
			preset: [ "advanced" ],
		},
	}));
}

module.exports = {
	mode,
	devtool: "source-map",
	entry: [
		path.resolve(__dirname, "index.js"),
	],
	optimization: {
		minimize,
	},
	externals: {
		osjs: "OSjs"
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				"logo.svg"
			]
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css"
		}),
		...plugins
	],
	module: {
		rules: [
			{
				test: /\.(svg|png|jpe?g|gif|webp)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "file-loader"
					}
				]
			},
			{
				test: /\.(sa|sc|c)ss$/,
				exclude: /node_modules/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							sourceMap: true
						}
					},
					{
						loader: "sass-loader",
						options: {
							sourceMap: true
						}
					}
				]
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			}
		]
	}
};
