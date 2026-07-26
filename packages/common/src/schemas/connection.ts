import { z } from "zod";
import { isoDateSchema, pageSchema, paginationInputSchema, ulidSchema } from "./common";
import { connectionDirectionSchema, connectionStatusSchema } from "./enums";
import { contactsSchema, userSchema } from "./user";

export const connectionSchema = z.object({
  id: ulidSchema,
  status: connectionStatusSchema,
  direction: connectionDirectionSchema,
  other: userSchema,
  other_contacts: contactsSchema.nullable(),
  created_at: isoDateSchema,
  updated_at: isoDateSchema,
});
export type Connection = z.infer<typeof connectionSchema>;

export const connectionPageSchema = pageSchema(connectionSchema);
export type ConnectionPage = z.infer<typeof connectionPageSchema>;

export const inboxInputSchema = paginationInputSchema;

export const sendConnectInputSchema = z.object({
  userId: ulidSchema,
});
export type SendConnectInput = z.infer<typeof sendConnectInputSchema>;

export const respondConnectInputSchema = z.object({
  id: ulidSchema,
  action: z.enum(["approve", "decline"]),
});
export type RespondConnectInput = z.infer<typeof respondConnectInputSchema>;

export const profileConnectionSchema = z
  .object({
    id: ulidSchema,
    status: connectionStatusSchema,
    direction: connectionDirectionSchema,
  })
  .nullable();

export const profileSchema = userSchema.extend({
  connection: profileConnectionSchema,
});
export type Profile = z.infer<typeof profileSchema>;
