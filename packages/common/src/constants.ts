/**
 * Cross-cutting constants shared by backend and mobile.
 * Keeping these in one place prevents the two sides from drifting (e.g. a max
 * duration enforced on the client but not the server).
 */

// --- Recording / upload limits ---
/** Hard cap for a recorded clip. Enforced by the iOS camera UI AND by Stream. */
export const MAX_VIDEO_DURATION_SEC = 30;

// --- Pagination ---
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// --- Auth ---
export const JWT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// --- Mock users (demo mode) ---
/** Pending requests addressed to a mock user auto-approve after 5–30s. */
export const MOCK_APPROVE_DELAY_MIN_SEC = 5;
export const MOCK_APPROVE_DELAY_MAX_SEC = 30;

// --- Feed cache ---
/** TTL for the KV-cached first feed page. */
export const FEED_CACHE_TTL_SEC = 30;
