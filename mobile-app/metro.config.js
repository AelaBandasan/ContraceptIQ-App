const { getDefaultConfig } = require("expo/metro-config");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

module.exports = wrapWithReanimatedMetroConfig((() => {
    const config = getDefaultConfig(__dirname);

    const { transformer, resolver } = config;

    config.transformer = {
        ...transformer,
        babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
    };
    config.resolver = {
        ...resolver,
        assetExts: [...resolver.assetExts.filter((ext) => ext !== "svg"), "onnx"],
        sourceExts: [...resolver.sourceExts, "svg"],
    };

    return config;
})());
