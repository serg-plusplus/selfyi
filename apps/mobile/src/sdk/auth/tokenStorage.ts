import * as SecureStore from "expo-secure-store";

const JWT_KEY = "selfie.jwt";
const MOCK_NULLIFIER_KEY = "selfie.mockNullifier";

export const tokenStorage = {
  getToken: () => SecureStore.getItemAsync(JWT_KEY),
  setToken: (t: string) => SecureStore.setItemAsync(JWT_KEY, t),
  clearToken: () => SecureStore.deleteItemAsync(JWT_KEY),

  async getMockNullifier(): Promise<string> {
    const existing = await SecureStore.getItemAsync(MOCK_NULLIFIER_KEY);
    if (existing) return existing;
    const fresh = `mock-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await SecureStore.setItemAsync(MOCK_NULLIFIER_KEY, fresh);
    return fresh;
  },
};
