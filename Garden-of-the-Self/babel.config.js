/** @type {import('react-native-unistyles/plugin').UnistylesPluginOptions} */
const unistylesPluginOptions = {
  // Must not resolve to project root (which contains node_modules)
  root: 'app',
  // Process any file that imports from Unistyles (e.g. lib/, utils/, components/)
  autoProcessImports: ['react-native-unistyles'],
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['react-native-unistyles/plugin', unistylesPluginOptions]],
  };
};
