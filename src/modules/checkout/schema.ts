import { z } from "zod";
import { isValidBDPhone } from "@/lib/phone";

/**
 * Shared by the checkout form (client) and placeOrder (server — authoritative).
 * Messages are dictionary keys, translated for display in the visitor's language.
 */
export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "validation.name").max(80),
  phone: z.string().trim().refine(isValidBDPhone, "validation.phone"),
  email: z.union([z.literal(""), z.string().trim().email("validation.email").max(120)]).optional(),
  districtId: z.coerce.number().int().positive("validation.district"),
  upazilaId: z.coerce.number().int().positive("validation.area"),
  addressLine: z.string().trim().min(8, "validation.address").max(300),
  deliveryInstructions: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(["COD", "BKASH", "NAGAD", "CARD"], { message: "validation.payment" }),
  saveAddress: z.boolean().optional(),
  acceptTerms: z.literal(true, { message: "validation.terms" }),
  idempotencyKey: z.string().uuid(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
