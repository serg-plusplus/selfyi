import { create } from "zustand";

export interface Toast {
  message: string;
  /** optional route to push when the toast is tapped */
  href?: string;
}

type FabState = "idle" | "uploading";

/** Lightweight client-only UI state. Server state lives in React Query. */
interface UiState {
  muted: boolean;
  toggleMuted: () => void;
  /** camera FAB: idle | uploading (spinner) */
  fabState: FabState;
  setFabState: (s: FabState) => void;
  /** one visible toast at a time ("Published" etc.) */
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
