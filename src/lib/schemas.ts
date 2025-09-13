import { z } from 'zod';

export const adminSettingsSchema = z.object({
  deliveryRadius: z.number().min(0).max(100),
  baseFeePerMile: z.number().min(0),
  taxRate: z.number().min(0).max(1),
  depositPercentage: z.number().min(0).max(1),
  hungerMultipliers: z.object({
    normal: z.number().min(0.5).max(2),
    prettyHungry: z.number().min(0.5).max(2),
    reallyHungry: z.number().min(0.5).max(2),
  }),
  minimumOrder: z.number().min(0),
});

export const menuSelectionSchema = z.object({
  proteinId: z.string().uuid(),
  sideId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const addOnSelectionSchema = z.object({
  addOnId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const locationDetailsSchema = z.object({
  address: z.string().min(5).max(500),
  distanceMiles: z.number().min(0).max(100),
});

export const eventDetailsSchema = z.object({
  type: z.enum(['corporate', 'private']),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  guestCount: z.number().int().min(1).max(1000),
  hungerLevel: z.enum(['normal', 'prettyHungry', 'reallyHungry']),
  location: locationDetailsSchema,
});

export const pricingBreakdownSchema = z.object({
  subtotalCents: z.number().int().min(0),
  taxCents: z.number().int().min(0),
  deliveryFeeCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  depositCents: z.number().int().min(0),
  balanceCents: z.number().int().min(0),
});

export const cateringQuoteSchema = z.object({
  id: z.string().uuid(),
  customerEmail: z.string().email(),
  eventDetails: eventDetailsSchema,
  menuSelections: z.array(menuSelectionSchema).min(1),
  addOns: z.array(addOnSelectionSchema).optional().default([]),
  pricing: pricingBreakdownSchema,
  status: z.enum(['pending', 'approved', 'deposit_paid', 'confirmed', 'completed', 'cancelled']),
  medusaOrderId: z.string().optional(),
  balanceOrderId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const cateringAddonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(0),
  isActive: z.boolean(),
  category: z.string().max(100).optional(),
  createdAt: z.date(),
});

export const quoteFormSchema = z.object({
  customerEmail: z.string().email(),
  eventType: z.enum(['corporate', 'private']),
  eventDate: z.string().refine((date) => {
    const parsed = Date.parse(date);
    return !isNaN(parsed) && parsed > Date.now();
  }, {
    message: "Event date must be in the future",
  }),
  guestCount: z.number().int().min(1).max(1000),
  hungerLevel: z.enum(['normal', 'prettyHungry', 'reallyHungry']),
  address: z.string().min(5).max(500),
  menuSelections: z.array(menuSelectionSchema).min(1, "At least one menu selection is required"),
  addOns: z.array(addOnSelectionSchema).optional().default([]),
});

export const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15).optional(),
  message: z.string().min(10).max(1000),
});

export type AdminSettingsInput = z.infer<typeof adminSettingsSchema>;
export type MenuSelectionInput = z.infer<typeof menuSelectionSchema>;
export type AddOnSelectionInput = z.infer<typeof addOnSelectionSchema>;
export type LocationDetailsInput = z.infer<typeof locationDetailsSchema>;
export type EventDetailsInput = z.infer<typeof eventDetailsSchema>;
export type PricingBreakdownInput = z.infer<typeof pricingBreakdownSchema>;
export type CateringQuoteInput = z.infer<typeof cateringQuoteSchema>;
export type CateringAddonInput = z.infer<typeof cateringAddonSchema>;
export type QuoteFormInput = z.infer<typeof quoteFormSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;