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

// Admin form schemas for catering add-ons
export const createCateringAddonSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  priceCents: z.number().int().min(0, "Price cannot be negative"),
  isActive: z.boolean().optional().default(true),
  category: z.string().max(100, "Category must be less than 100 characters").optional(),
});

export const updateCateringAddonSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  priceCents: z.number().int().min(0, "Price cannot be negative").optional(),
  isActive: z.boolean().optional(),
  category: z.string().max(100, "Category must be less than 100 characters").optional(),
});

export const bulkUpdateAddonsSchema = z.object({
  addonIds: z.array(z.string().uuid()).min(1, "At least one add-on must be selected"),
  action: z.enum(['activate', 'deactivate', 'delete']),
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
export type CreateCateringAddonInput = z.infer<typeof createCateringAddonSchema>;
export type UpdateCateringAddonInput = z.infer<typeof updateCateringAddonSchema>;
export type BulkUpdateAddonsInput = z.infer<typeof bulkUpdateAddonsSchema>;

// Order Tracking Schemas
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']);

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const orderStatusEventSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  status: orderStatusSchema,
  message: z.string().max(500).optional(),
  timestamp: z.date(),
  estimatedTime: z.date().optional(),
  location: z.object({
    address: z.string().max(500).optional(),
    coordinates: coordinatesSchema.optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const deliveryAddressSchema = z.object({
  name: z.string().min(1).max(100),
  address_1: z.string().min(1).max(255),
  address_2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  postal_code: z.string().min(1).max(20),
  phone: z.string().max(20).optional(),
});

export const orderTrackingDetailsSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(20).optional(),
  status: orderStatusSchema,
  currentStatusMessage: z.string().max(500).optional(),
  estimatedDeliveryTime: z.date().optional(),
  events: z.array(orderStatusEventSchema),
  items: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(255),
    quantity: z.number().int().min(1),
    variant_title: z.string().max(255).optional(),
    thumbnail: z.string().url().optional(),
  })),
  deliveryAddress: deliveryAddressSchema.optional(),
  payment: z.object({
    total: z.number().int().min(0),
    currency: z.string().length(3),
    paymentStatus: z.enum(['pending', 'paid', 'refunded', 'partially_refunded']),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  isDelivery: z.boolean(),
  isCatering: z.boolean().optional(),
  cateringDetails: z.object({
    eventDate: z.date(),
    guestCount: z.number().int().min(1),
    eventType: z.enum(['corporate', 'private']),
  }).optional(),
});

export const orderLookupInputSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required").refine((val) => {
    // Check if it's a valid email or phone number
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return emailRegex.test(val) || phoneRegex.test(val);
  }, {
    message: "Must be a valid email or phone number",
  }),
  orderNumber: z.string().max(50).optional(),
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: orderStatusSchema,
  message: z.string().max(500).optional(),
  estimatedTime: z.date().optional(),
  notifyCustomer: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const adminOrderFiltersSchema = z.object({
  status: z.array(orderStatusSchema).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
  customerSearch: z.string().max(255).optional(),
  orderType: z.enum(['regular', 'catering', 'all']).optional(),
  deliveryType: z.enum(['pickup', 'delivery', 'all']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const bulkOrderStatusUpdateSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1, "At least one order must be selected"),
  status: orderStatusSchema,
  message: z.string().max(500).optional(),
  notifyCustomers: z.boolean().default(true),
});

export const orderSearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(255),
  filters: adminOrderFiltersSchema.optional(),
});

export const estimatedTimeUpdateSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  estimatedTime: z.date(),
  reason: z.string().max(500).optional(),
  notifyCustomer: z.boolean().default(true),
});

export const customerNotificationSchema = z.object({
  orderId: z.string().min(1),
  type: z.enum(['sms', 'email', 'both']),
  templateId: z.string().optional(),
  customMessage: z.string().max(500).optional(),
});

// Type exports for order tracking
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
export type OrderStatusEventInput = z.infer<typeof orderStatusEventSchema>;
export type OrderTrackingDetailsInput = z.infer<typeof orderTrackingDetailsSchema>;
export type OrderLookupInput = z.infer<typeof orderLookupInputSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type AdminOrderFiltersInput = z.infer<typeof adminOrderFiltersSchema>;
export type BulkOrderStatusUpdateInput = z.infer<typeof bulkOrderStatusUpdateSchema>;
export type OrderSearchInput = z.infer<typeof orderSearchSchema>;
export type EstimatedTimeUpdateInput = z.infer<typeof estimatedTimeUpdateSchema>;
export type CustomerNotificationInput = z.infer<typeof customerNotificationSchema>;