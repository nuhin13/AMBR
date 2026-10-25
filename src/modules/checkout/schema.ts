import { z } from "zod";
import { isValidBDPhone } from "@/lib/phone";

/** Shared by the checkout form (client) and placeOrder (server — authoritative). */
export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z.string().trim().refine(isValidBDPhone, "Enter a valid Bangladeshi mobile number, e.g. 01712345678"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address").max(120)]).optional(),
  districtId: z.coerce.number().int().positive("Choose your district"),
  upazilaId: z.coerce.number().int().positive("Choose your area / upazila"),
  addressLine: z.string().trim().min(8, "Please add house, road and area so the courier can find you").max(300),
  deliveryInstructions: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(["COD", "BKASH", "NAGAD", "CARD"], { message: "Choose a payment method" }),
  saveAddress: z.boolean().optional(),
  acceptTerms: z.literal(true, { message: "Please accept the terms to continue" }),
  idempotencyKey: z.string().uuid(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
