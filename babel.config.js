module.exports = function(api) {
  api.cache(true);

  let expoPreset = 'babel-preset-expo';
  try {
    require.resolve(expoPreset);
  } catch (error) {
    // Fallback for environments where npm did not hoist babel-preset-expo.
    expoPreset = require.resolve('expo/node_modules/babel-preset-expo');
  }

  return {
    presets: [expoPreset],
    plugins: [
      'react-native-reanimated/plugin',
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
