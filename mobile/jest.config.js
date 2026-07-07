module.exports = {
  preset: '@react-native/jest-preset',
  // Only run our pure-logic unit tests; component/native tests would require
  // an extensive native-module mock setup (Mapbox, geolocation, keychain).
  testMatch: ['**/__tests__/**/*.test.ts'],
};
