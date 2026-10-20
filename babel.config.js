module.exports = function (api) {
  api.cache(true);
  return {presets: [[require.resolve('expo/internal/babel-preset'), {web: {unstable_transformImportMeta: true}}]]};
};
