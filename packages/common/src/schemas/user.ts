import { z } from "zod";
import { isoDateSchema, ulidSchema } from "./common";

/** @handle — letters, digits, underscore; 2–30 chars */
export const handleSchema = z
  .string()
  .min(2)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Handle may only contain letters, digits and underscores");

/** Public-facing user (safe to show to anyone). */
export const userSchema = z.object({
  id: ulidSchema,
  handle: z.string(),
  avatar_url: z.string().nullable(),
  is_mock: z.boolean(),
  created_at: isoDateSchema,
});
export type User = z.infer<typeof userSchema>;

/** Shareable contact details, entered once and stored on the profile. */
export const contactsSchema = z.object({
  instagram: z.string().nullable(),
  whatsapp: z.string().nullable(),
});
export type Contacts = z.infer<typeof contactsSchema>;

/** The authenticated user's own profile. */
export const meSchema = userSchema.extend({
  /** false until the user picked a @handle on the onboarding screen */
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

/** One-time (editable) contact entry from the "Share contact" popup. */
export const updateContactsInputSchema = z
  .object({
    instagram: contactValue.optional(),
    whatsapp: contactValue.optional(),
  })
  .refine((v) => v.instagram !== undefined || v.whatsapp !== undefined, {
    message: "Provide at least one contact",
  });
export type UpdateContactsInput = z.infer<typeof updateContactsInputSchema>;
