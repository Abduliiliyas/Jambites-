// webpack.config.js
const createExpoWebpackConfig = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfig(env, argv);
  
  // Fix for expo-sqlite WASM issue
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: false,
  };
  
  // Exclude problematic modules from web bundle
  if (env.platform === 'web') {
    config.resolve.alias = {
      ...config.resolve.alias,
      'expo-sqlite': require.resolve('./empty-module.js'),
    };
  }
  
  return config;
};