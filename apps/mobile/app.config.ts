import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Expo Go workflow (Decision 2, revised): NO custom native modules, NO
 * prebuild. The app runs inside Expo Go; delivery to testers = `eas update`
 * link/QR. Bundle ids / plugins below only matter if you ever move to a
 * standalone build — they are inert in Expo Go.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Selfie",
  slug: "selfie",
  scheme: "selfie",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  ios: {
    bundleIdentifier: "com.selfyi.selfie",
    supportsTablet: false,
  },
  android: {
    package: "com.selfyi.selfie",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-image-picker",
      {
        cameraPermission: "Selfie needs your camera to record videos.",
        microphonePermission: "Selfie needs your microphone to record audio.",
      },
    ],
  ],
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
    fallbackToCacheTimeout: 0,
  },
  // Expo Go loads updates by SDK version — do NOT use the appVersion policy here.
  runtimeVersion: { policy: "sdkVersion" },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    streamCustomerCode: process.env.EXPO_PUBLIC_STREAM_CUSTOMER_CODE,
    // World ID lives entirely on the backend; only the dev-mock toggle is client-side.
    worldMock: process.env.EXPO_PUBLIC_WORLD_MOCK,
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
