import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Selfie",
  slug: "selfieapp",
  scheme: "selfie",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  icon: './icon.png',
  ios: {
    bundleIdentifier: "com.selfyi.selfie",
    supportsTablet: false,
    icon: './icon.png',
  },
  android: {
    package: "com.selfyi.selfie",
    adaptiveIcon: {
      foregroundImage: './icon.png',
      backgroundColor: '#ffffff',
    },
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
  runtimeVersion: { policy: "sdkVersion" },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    streamCustomerCode: process.env.EXPO_PUBLIC_STREAM_CUSTOMER_CODE,
    worldMock: process.env.EXPO_PUBLIC_WORLD_MOCK,
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
