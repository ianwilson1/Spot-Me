module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@assets': './src/assets',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@context': './src/context',
          },
        },
      ],
    ],
  };
};
