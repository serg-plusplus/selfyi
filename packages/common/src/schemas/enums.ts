import { z } from "zod";

/**
 * `processing` — uploaded, Stream is still transcoding (owner-only visibility)
 * `ready`      — transcoded, playable, feed-eligible
 */
export const videoStatusSchema = z.enum(["processing", "ready"]);
export type VideoStatus = z.infer<typeof videoStatusSchema>;

/**
 * `pending`  — request sent, addressee has not responded
 * `approved` — both sides connected; contacts are mutually visible
 * `declined` — silently declined; requester may send a new request
 */
export const connectionStatusSchema = z.enum(["pending", "approved", "declined"]);
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;

/** Direction of a connection relative to the viewer. */
export const connectionDirectionSchema = z.enum(["incoming", "outgoing"]);
export type ConnectionDirection = z.infer<typeof connectionDirectionSchema>;
