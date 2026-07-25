import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastHost } from "@/components/ToastHost";
import { AuthProvider, TRPCProvider } from "@/sdk";

function RootNavigator() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        animation: "default",
        headerStyle: { backgroundColor: "#000" },
        headerTintColor: "#fff",
        contentStyle: { backgroundColor: "#000" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="verify" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="video/[id]"
        options={{ title: "", headerTransparent: true, headerBlurEffect: "systemUltraThinMaterial" }}
      />
      <Stack.Screen name="user/[handle]" options={{ title: "" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <TRPCProvider>
            <AuthProvider>
              <ThemeProvider value={DarkTheme}>
                <StatusBar style="light" />
                <RootNavigator />
                <ToastHost />
              </ThemeProvider>
            </AuthProvider>
          </TRPCProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
