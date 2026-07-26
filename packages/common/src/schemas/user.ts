import { z } from "zod";
import { isoDateSchema, ulidSchema } from "./common";

export const handleSchema = z
  .string()
  .min(2)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Handle may only contain letters, digits and underscores");

export const userSchema = z.object({
  id: ulidSchema,
  handle: z.string(),
  avatar_url: z.string().nullable(),
  is_mock: z.boolean(),
  created_at: isoDateSchema,
});
export type User = z.infer<typeof userSchema>;

export const contactsSchema = z.object({
  instagram: z.string().nullable(),
  whatsapp: z.string().nullable(),
});
export type Contacts = z.infer<typeof contactsSchema>;

export const meSchema = userSchema.extend({
  onboarded: z.boolean(),
  ...contactsSchema.shape,
});
export type Me = z.infer<typeof meSchema>;

const contactValue = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .transform((s) => s.replace(/^@/, ""));

export const updateContactsInputSchema = z
  .object({
    instagram: contactValue.optional(),
    whatsapp: contactValue.optional(),
  })
  .refine((v) => v.instagram !== undefined || v.whatsapp !== undefined, {
    message: "Provide at least one contact",
  });
export type UpdateContactsInput = z.infer<typeof updateContactsInputSchema>;
