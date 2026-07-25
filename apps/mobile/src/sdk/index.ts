/**
 * The internal SDK — the UI-agnostic heart of the app.
 * Screens consume only these hooks/types, never the transport directly.
 */

// transport
export { trpc } from "./api/trpc";
export { TRPCProvider, queryClient } from "./api/TRPCProvider";
export { config } from "./config";
export { hlsUrlFor } from "./hls";

// auth + World ID gate (session flow lives in AuthProvider — the client
// only opens connectorURI and polls; zero World packages on the device)
export { AuthProvider, useAuth, type GateState } from "./auth/AuthProvider";
export { tokenStorage } from "./auth/tokenStorage";

// upload
export { useUploadVideo } from "./upload/useUploadVideo";
export { uploadToStream } from "./upload/streamUploader";

// queries
export { useFeed, useUserFeed } from "./queries/useFeed";
export { useVideo, useDeleteVideo } from "./queries/useVideo";
export { useProfileByHandle } from "./queries/useProfile";
export { useInbox, useSendConnect, useRespondConnect } from "./queries/useConnections";

// state
export { useUiStore, type Toast } from "./store/uiStore";

// types
export type * from "./types";
