import { create } from "zustand";

export interface Toast {
  message: string;
  href?: string;
}

type FabState = "idle" | "uploading";

interface UiState {
  muted: boolean;
  toggleMuted: () => void;
  fabState: FabState;
  setFabState: (s: FabState) => void;
  toast: Toast | null;
  showToast: (t: Toast) => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  muted: false,
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  fabState: "idle",
  setFabState: (fabState) => set({ fabState }),
  toast: null,
  showToast: (toast) => set({ toast }),
  hideToast: () => set({ toast: null }),
}));
