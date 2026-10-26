const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
const { resolve: metroResolve } = require("metro-resolver");

/** @type {import('expo/metro-config').MetroConfig} */
const config = withNativewind(getDefaultConfig(__dirname));

// NativeWind v5 swaps `react-native` for its own wrapper, which doesn't export
// `AssetRegistry`. expo-asset needs it, so give these packages the real one
// on native. On web, `react-native` must keep resolving to react-native-web.
const needsRealReactNative = /[\\/]node_modules[\\/](expo-asset|expo-image)[\\/]/;
const nativewindResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== "web" && moduleName === "react-native" && needsRealReactNative.test(context.originModulePath)) {
    // Metro's own resolver, skipping NativeWind's override
    return metroResolve({ ...context, resolveRequest: metroResolve }, moduleName, platform);
  }
  return nativewindResolveRequest(context, moduleName, platform);
};

module.exports = config;
