/**
 * Zod schemas for API request validation.
 * Centralised here so API routes stay slim.
 */

import { z } from "zod";

// ── Reusable primitives ──────────────────────────────────────

const safeString = (maxLen = 500) =>
  z.string().max(maxLen).trim();

const email = z.string().email().max(320);

const usState = z.string().length(2).regex(/^[A-Z]{2}$/);

const zipCode = z.string().regex(/^\d{5}(-\d{4})?$/);

// ── Address ──────────────────────────────────────────────────

export const addressSchema = z.object({
  name: safeString(200).optional(),
  address_line1: safeString(200),
  address_line2: safeString(200).optional().default(""),
  address_city: safeString(100),
  address_state: usState,
  address_zip: zipCode,
});

// Address with required name field (matches MailingAddress type)
const mailingAddressSchema = addressSchema.extend({
  name: safeString(200),
});

export type ValidatedAddress = z.infer<typeof addressSchema>;

// ── Mail: Verify address ─────────────────────────────────────

export const verifyAddressSchema = z.object({
  address_line1: safeString(200),
  address_line2: safeString(200).optional().default(""),
  address_city: safeString(100),
  address_state: usState,
  address_zip: zipCode,
});

// ── Mail: Create checkout ────────────────────────────────────

const recipientSchema = z.object({
  repName: safeString(200),
  repOfficeAddress: addressSchema,
});

export const createCheckoutSchema = z.object({
  contactLogId: safeString(100),
  senderAddress: addressSchema,
  senderEmail: email.optional(),
  letterContent: safeString(10_000),
  // Multi-rep format
  recipients: z.array(recipientSchema).min(1).max(10).optional(),
  // Legacy single-rep format
  repName: safeString(200).optional(),
  repOfficeAddress: addressSchema.optional(),
});

// ── Mail: Send (direct Lob send) ─────────────────────────────

export const sendMailSchema = z.object({
  senderAddress: mailingAddressSchema,
  recipientAddress: mailingAddressSchema,
  recipientTitle: safeString(50).optional().default("Representative"),
  recipientLastName: safeString(100),
  letterContent: safeString(10_000),
  contactLogId: safeString(100),
  repName: safeString(200),
});

// ── Email sending ────────────────────────────────────────────

export const sendEmailSchema = z.object({
  to: email,
  subject: safeString(500),
  body: safeString(10_000),
});

// ── Regulations comment ──────────────────────────────────────

export const regulationsCommentSchema = z.object({
  documentId: safeString(100),
  comment: safeString(5_000),
  firstName: safeString(100),
  lastName: safeString(100),
  email,
});

// ── Lookup ───────────────────────────────────────────────────

export const lookupSchema = z.object({
  address: safeString(500).min(1),
});

// ── Mail status ──────────────────────────────────────────────

export const mailStatusSchema = z.object({
  session_id: safeString(200).startsWith("cs_"),
});

// ── Helper to parse & return error response ──────────────────

import { NextResponse } from "next/server";

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  return {
    success: false,
    response: NextResponse.json(
      { error: "Validation failed", details: errors },
      { status: 400 }
    ),
  };
}
