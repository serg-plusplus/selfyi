import { z } from "zod";

export const videoStatusSchema = z.enum(["processing", "ready"]);
export type VideoStatus = z.infer<typeof videoStatusSchema>;

export const connectionStatusSchema = z.enum(["pending", "approved", "declined"]);
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;

export const connectionDirectionSchema = z.enum(["incoming", "outgoing"]);
export type ConnectionDirection = z.infer<typeof connectionDirectionSchema>;
