import { z } from 'zod';

// Business hours validation schema
export const businessHoursSchema = z.object({
  monday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
  tuesday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
  wednesday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
  thursday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
  friday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
  saturday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
  sunday: z.object({
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
});

// Store information schema
export const storeInformationSchema = z.object({
  businessName: z.string().min(1).max(255),
  address: z.object({
    street: z.string().min(1).max(255),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(50),
    zipCode: z.string().min(5).max(10),
    country: z.string().min(1).max(50).default('United States'),
  }),
  contact: z.object({
    phone: z.string().min(10).max(20),
    email: z.string().email(),
    website: z.string().url().optional(),
  }),
  description: z.string().max(1000).optional(),
  tagline: z.string().max(200).optional(),
});

// Branding settings schema
export const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#DC2626'),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#7C2D12'),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#F59E0B'),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  fonts: z.object({
    heading: z.string().default('Inter'),
    body: z.string().default('Inter'),
  }),
});

// Email and notification settings schema
export const notificationSettingsSchema = z.object({
  emailNotifications: z.object({
    orderUpdates: z.boolean().default(true),
    cateringInquiries: z.boolean().default(true),
    lowInventoryAlerts: z.boolean().default(true),
    dailyReports: z.boolean().default(false),
    weeklyReports: z.boolean().default(true),
  }),
  smsNotifications: z.object({
    enabled: z.boolean().default(false),
    orderUpdates: z.boolean().default(false),
    urgentAlerts: z.boolean().default(false),
  }),
  adminEmails: z.array(z.string().email()).min(1),
  customerEmailSettings: z.object({
    orderConfirmationTemplate: z.string().default('default'),
    orderStatusUpdateTemplate: z.string().default('default'),
    cateringQuoteTemplate: z.string().default('default'),
  }),
});

// Social media and marketing schema
export const socialMediaSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  twitter: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  youtube: z.string().url().optional(),
  tiktok: z.string().url().optional(),
  googleBusiness: z.string().url().optional(),
  yelp: z.string().url().optional(),
});

// Operational settings schema
export const operationalSettingsSchema = z.object({
  serviceOptions: z.object({
    pickup: z.boolean().default(true),
    delivery: z.boolean().default(true),
    catering: z.boolean().default(true),
    dineIn: z.boolean().default(false),
  }),
  orderTiming: z.object({
    minimumLeadTimeMinutes: z.number().int().min(0).default(30),
    maximumAdvanceOrderDays: z.number().int().min(1).max(365).default(30),
    cateringMinimumLeadTimeHours: z.number().int().min(1).default(48),
  }),
  specialHours: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isOpen: z.boolean(),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    note: z.string().max(200).optional(),
  })).default([]),
});

// Business Profile Schema (Core/Required)
export const businessProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(255),
  address: z.object({
    street: z.string().min(1, "Street address is required").max(255),
    city: z.string().min(1, "City is required").max(100),
    state: z.string().min(1, "State is required").max(50),
    zipCode: z.string().min(5, "ZIP code is required").max(10),
    country: z.string().min(1, "Country is required").max(50).default('United States'),
  }),
  contact: z.object({
    phone: z.string().min(10, "Phone number is required").max(20),
    email: z.string().email("Valid email is required"),
    website: z.string().url().optional(),
    emergencyContact: z.object({
      name: z.string().min(1, "Emergency contact name is required").max(100),
      phone: z.string().min(10, "Emergency contact phone is required").max(20),
      relationship: z.string().min(1, "Relationship is required").max(50),
    }),
  }),
  businessInfo: z.object({
    taxId: z.string().min(1, "Tax ID is required").max(50),
    businessLicense: z.string().min(1, "Business license is required").max(100),
    foodServicePermit: z.string().min(1, "Food service permit is required").max(100),
    operatingLicenses: z.array(z.string()).min(1, "At least one operating license required"),
  }),
  description: z.string().max(1000).optional(),
  tagline: z.string().max(200).optional(),
  businessHours: businessHoursSchema,
});

// Retail Operations Schema (Walk-in/Pickup/Delivery)
export const retailOperationsSchema = z.object({
  serviceOptions: z.object({
    walkIn: z.boolean().default(true),
    pickup: z.boolean().default(true),
    delivery: z.boolean().default(true),
    dineIn: z.boolean().default(false),
  }),
  pickupSettings: z.object({
    windowHours: z.object({
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
    capacity: z.number().int().min(1).max(50).default(10),
    averageWaitTime: z.number().int().min(1).max(120).default(15), // minutes
  }),
  deliverySettings: z.object({
    isEnabled: z.boolean().default(true),
    radius: z.number().min(0).max(100),
    baseFee: z.number().min(0),
    feePerMile: z.number().min(0),
    zones: z.array(z.object({
      name: z.string().max(100),
      description: z.string().max(200),
      polygon: z.array(z.object({
        lat: z.number(),
        lng: z.number(),
      })),
      deliveryFee: z.number().min(0),
      minimumOrder: z.number().min(0),
    })).default([]),
  }),
  pricingConfig: z.object({
    taxRate: z.number().min(0).max(1),
    minimumOrder: z.number().min(0),
    hungerMultipliers: z.object({
      normal: z.number().min(0.5).max(2).default(1.0),
      prettyHungry: z.number().min(0.5).max(2).default(1.25),
      reallyHungry: z.number().min(0.5).max(2).default(1.5),
    }),
    dailySpecials: z.object({
      enabled: z.boolean().default(false),
      currentSpecials: z.array(z.object({
        name: z.string().max(255),
        description: z.string().max(500),
        price: z.number().min(0),
        availableUntil: z.date().optional(),
        isActive: z.boolean().default(true),
      })).default([]),
    }),
  }),
  posIntegration: z.object({
    enabled: z.boolean().default(false),
    provider: z.enum(['square', 'toast', 'clover', 'none']).default('none'),
    settings: z.record(z.unknown()).default({}),
  }),
  diningSettings: z.object({
    seatingCapacity: z.number().int().min(0).default(0),
    tableManagement: z.boolean().default(false),
    waitlistEnabled: z.boolean().default(false),
  }),
});

// Catering Operations Schema (Events/Large Orders)
export const cateringOperationsSchema = z.object({
  isEnabled: z.boolean().default(true),
  pricingModel: z.object({
    baseMarkup: z.number().min(0).max(5).default(1.5), // multiplier for catering vs retail
    depositPercentage: z.number().min(0).max(1).default(0.3),
    minimumOrders: z.object({
      corporate: z.number().min(0).default(100),
      private: z.number().min(0).default(75),
      wedding: z.number().min(0).default(200),
    }),
    volumeDiscounts: z.array(z.object({
      minimumGuests: z.number().int().min(1),
      discountPercentage: z.number().min(0).max(0.5),
      description: z.string().max(200),
    })).default([]),
  }),
  leadTimeRequirements: z.object({
    standard: z.number().int().min(1).default(48), // hours
    corporate: z.number().int().min(1).default(72), // hours
    wedding: z.number().int().min(1).default(168), // hours (1 week)
    holiday: z.number().int().min(1).default(336), // hours (2 weeks)
  }),
  serviceOptions: z.object({
    delivery: z.boolean().default(true),
    setup: z.boolean().default(true),
    fullService: z.boolean().default(false),
    equipmentRental: z.boolean().default(false),
  }),
  deliverySettings: z.object({
    serviceRadius: z.number().min(0).max(200).default(50), // miles
    deliveryFees: z.object({
      base: z.number().min(0).default(25),
      perMile: z.number().min(0).default(2),
      setupFee: z.number().min(0).default(50),
    }),
    availableAreas: z.array(z.string()).default([]),
  }),
  equipment: z.object({
    available: z.array(z.object({
      name: z.string().max(255),
      description: z.string().max(500),
      rentalPrice: z.number().min(0),
      depositRequired: z.number().min(0),
      category: z.enum(['serving', 'heating', 'setup', 'dining']),
    })).default([]),
  }),
  staffing: z.object({
    serverAvailable: z.boolean().default(false),
    bartenderAvailable: z.boolean().default(false),
    hourlyRates: z.object({
      server: z.number().min(0).default(25),
      bartender: z.number().min(0).default(30),
      manager: z.number().min(0).default(40),
    }),
    minimumStaffingHours: z.number().int().min(1).default(4),
  }),
  paymentTerms: z.object({
    paymentMethods: z.array(z.enum(['card', 'check', 'invoice', 'cash'])).default(['card']),
    invoiceTerms: z.enum(['net_15', 'net_30', 'net_45']).default('net_30'),
    lateFeePercentage: z.number().min(0).max(0.2).default(0.05),
  }),
  taxHandling: z.object({
    cateringTaxRate: z.number().min(0).max(1),
    setupTaxable: z.boolean().default(true),
    deliveryTaxable: z.boolean().default(false),
    serviceFeeTaxable: z.boolean().default(true),
  }),
});

// Marketing & Customer Communication Schema
export const marketingSettingsSchema = z.object({
  socialMedia: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    youtube: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    googleBusiness: z.string().url().optional(),
    yelp: z.string().url().optional(),
  }),
  emailMarketing: z.object({
    enabled: z.boolean().default(false),
    provider: z.enum(['mailchimp', 'constant_contact', 'none']).default('none'),
    settings: z.record(z.unknown()).default({}),
    newsletterSignup: z.boolean().default(false),
  }),
  reviewPlatforms: z.object({
    googleReviews: z.object({
      enabled: z.boolean().default(false),
      autoRequest: z.boolean().default(false),
      businessId: z.string().optional(),
    }),
    yelpIntegration: z.object({
      enabled: z.boolean().default(false),
      businessId: z.string().optional(),
    }),
    facebookReviews: z.object({
      enabled: z.boolean().default(false),
      pageId: z.string().optional(),
    }),
  }),
  loyaltyProgram: z.object({
    enabled: z.boolean().default(false),
    pointsPerDollar: z.number().min(0).max(10).default(1),
    redemptionThreshold: z.number().min(0).default(100),
    rewards: z.array(z.object({
      name: z.string().max(255),
      pointsCost: z.number().int().min(1),
      description: z.string().max(500),
      isActive: z.boolean().default(true),
    })).default([]),
  }),
  customerNotifications: z.object({
    smsEnabled: z.boolean().default(false),
    emailEnabled: z.boolean().default(true),
    pushNotifications: z.boolean().default(false),
    orderUpdates: z.boolean().default(true),
    promotions: z.boolean().default(false),
    surveyRequests: z.boolean().default(false),
  }),
});

// Advanced Operations Schema (Optional/Power User)
export const advancedOperationsSchema = z.object({
  inventoryIntegration: z.object({
    enabled: z.boolean().default(false),
    provider: z.enum(['toast', 'resy', 'custom', 'none']).default('none'),
    settings: z.record(z.unknown()).default({}),
    lowStockAlerts: z.boolean().default(false),
    autoReorder: z.boolean().default(false),
  }),
  thirdPartyDelivery: z.object({
    ubereats: z.object({
      enabled: z.boolean().default(false),
      storeId: z.string().optional(),
      commission: z.number().min(0).max(0.5).default(0.3),
    }),
    doordash: z.object({
      enabled: z.boolean().default(false),
      storeId: z.string().optional(),
      commission: z.number().min(0).max(0.5).default(0.3),
    }),
    grubhub: z.object({
      enabled: z.boolean().default(false),
      storeId: z.string().optional(),
      commission: z.number().min(0).max(0.5).default(0.3),
    }),
  }),
  reporting: z.object({
    dailyReports: z.boolean().default(true),
    weeklyReports: z.boolean().default(true),
    monthlyReports: z.boolean().default(false),
    customReports: z.array(z.object({
      name: z.string().max(255),
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      metrics: z.array(z.string()),
      recipients: z.array(z.string().email()),
    })).default([]),
  }),
  staffManagement: z.object({
    timeClock: z.boolean().default(false),
    scheduleManagement: z.boolean().default(false),
    performanceTracking: z.boolean().default(false),
    roles: z.array(z.object({
      name: z.string().max(100),
      permissions: z.array(z.string()),
      description: z.string().max(500),
    })).default([]),
  }),
  multiLocation: z.object({
    enabled: z.boolean().default(false),
    locations: z.array(z.object({
      name: z.string().max(255),
      address: z.string().max(500),
      managerId: z.string().optional(),
      isActive: z.boolean().default(true),
    })).default([]),
    centralizedInventory: z.boolean().default(false),
    crossLocationOrders: z.boolean().default(false),
  }),
});

export const adminSettingsSchema = z.object({
  // Legacy pricing settings (maintained for backward compatibility)
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

  // Enhanced business configuration (legacy compatibility)
  businessHours: businessHoursSchema,
  storeInformation: storeInformationSchema,
  branding: brandingSchema,
  notifications: notificationSettingsSchema,
  socialMedia: socialMediaSchema,
  operations: operationalSettingsSchema,

  // New logical business settings structure
  businessProfile: businessProfileSchema.optional(),
  retailOperations: retailOperationsSchema.optional(),
  cateringOperations: cateringOperationsSchema.optional(),
  marketing: marketingSettingsSchema.optional(),
  advanced: advancedOperationsSchema.optional(),
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
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
export type RetailOperationsInput = z.infer<typeof retailOperationsSchema>;
export type CateringOperationsInput = z.infer<typeof cateringOperationsSchema>;
export type MarketingSettingsInput = z.infer<typeof marketingSettingsSchema>;
export type AdvancedOperationsInput = z.infer<typeof advancedOperationsSchema>;
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

// =====================================
// PRODUCT MANAGEMENT SCHEMAS
// =====================================

// Product validation schemas
export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  subtitle: z.string().max(255, "Subtitle must be less than 255 characters").optional(),
  description: z.string().max(10000, "Description must be less than 10000 characters").optional(),
  handle: z.string().regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens").max(255).optional(),
  status: z.enum(['draft', 'proposed', 'published', 'rejected']).optional().default('draft'),
  thumbnail: z.string().url("Thumbnail must be a valid URL").optional(),
  weight: z.number().min(0, "Weight cannot be negative").optional(),
  length: z.number().min(0, "Length cannot be negative").optional(),
  height: z.number().min(0, "Height cannot be negative").optional(),
  width: z.number().min(0, "Width cannot be negative").optional(),
  hs_code: z.string().max(50).optional(),
  origin_country: z.string().max(100).optional(),
  mid_code: z.string().max(50).optional(),
  material: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  is_giftcard: z.boolean().optional().default(false),
  discountable: z.boolean().optional().default(true),
  external_id: z.string().max(255).optional(),
  categories: z.array(z.string().uuid()).optional().default([]),
  collections: z.array(z.string().uuid()).optional().default([]),
  tags: z.array(z.string().max(255)).optional().default([]),
  variants: z.array(z.object({
    title: z.string().min(1).max(255),
    sku: z.string().max(255).optional(),
    barcode: z.string().max(255).optional(),
    ean: z.string().max(255).optional(),
    upc: z.string().max(255).optional(),
    variant_rank: z.number().int().min(0).optional().default(0),
    inventory_quantity: z.number().int().min(0).optional().default(0),
    allow_backorder: z.boolean().optional().default(false),
    manage_inventory: z.boolean().optional().default(true),
    price_cents: z.number().int().min(0, "Price cannot be negative"),
    weight: z.number().min(0).optional(),
    length: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    hs_code: z.string().max(50).optional(),
    origin_country: z.string().max(100).optional(),
    mid_code: z.string().max(50).optional(),
    material: z.string().max(255).optional(),
    metadata: z.record(z.unknown()).optional().default({})
  })).optional().default([]),
  images: z.array(z.object({
    url: z.string().url("Image URL must be valid"),
    alt_text: z.string().max(500).optional(),
    sort_order: z.number().int().min(0).optional().default(0),
    metadata: z.record(z.unknown()).optional().default({})
  })).optional().default([])
});

export const updateProductSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  subtitle: z.string().max(255).optional(),
  description: z.string().max(10000).optional(),
  handle: z.string().regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens").max(255).optional(),
  status: z.enum(['draft', 'proposed', 'published', 'rejected']).optional(),
  thumbnail: z.string().url().optional(),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  hs_code: z.string().max(50).optional(),
  origin_country: z.string().max(100).optional(),
  mid_code: z.string().max(50).optional(),
  material: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
  is_giftcard: z.boolean().optional(),
  discountable: z.boolean().optional(),
  external_id: z.string().max(255).optional()
});

export const productQuerySchema = z.object({
  search: z.string().max(255).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  collection_ids: z.array(z.string().uuid()).optional(),
  tag_values: z.array(z.string().max(255)).optional(),
  status: z.array(z.enum(['draft', 'proposed', 'published', 'rejected'])).optional(),
  price_min_cents: z.number().int().min(0).optional(),
  price_max_cents: z.number().int().min(0).optional(),
  is_giftcard: z.boolean().optional(),
  discountable: z.boolean().optional(),
  has_inventory: z.boolean().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'price_asc', 'price_desc']).optional().default('created_at'),
  sort_order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0)
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  handle: z.string().regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens").max(255).optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  parent_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).optional().default(0)
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  handle: z.string().regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens").max(255).optional(),
  description: z.string().max(1000).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional()
});

export const categoryQuerySchema = z.object({
  search: z.string().max(255).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  sort_by: z.enum(['name', 'sort_order', 'created_at']).optional().default('sort_order'),
  sort_order: z.enum(['ASC', 'DESC']).optional().default('ASC'),
  limit: z.number().int().min(1).max(100).optional().default(100),
  offset: z.number().int().min(0).optional().default(0)
});

// Product variant schemas
export const createVariantSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  sku: z.string().max(255).optional(),
  barcode: z.string().max(255).optional(),
  ean: z.string().max(255).optional(),
  upc: z.string().max(255).optional(),
  variant_rank: z.number().int().min(0).optional().default(0),
  inventory_quantity: z.number().int().min(0).optional().default(0),
  allow_backorder: z.boolean().optional().default(false),
  manage_inventory: z.boolean().optional().default(true),
  price_cents: z.number().int().min(0, "Price cannot be negative"),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  hs_code: z.string().max(50).optional(),
  origin_country: z.string().max(100).optional(),
  mid_code: z.string().max(50).optional(),
  material: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional().default({})
});

export const updateVariantSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  sku: z.string().max(255).optional(),
  barcode: z.string().max(255).optional(),
  ean: z.string().max(255).optional(),
  upc: z.string().max(255).optional(),
  variant_rank: z.number().int().min(0).optional(),
  inventory_quantity: z.number().int().min(0).optional(),
  allow_backorder: z.boolean().optional(),
  manage_inventory: z.boolean().optional(),
  price_cents: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  hs_code: z.string().max(50).optional(),
  origin_country: z.string().max(100).optional(),
  mid_code: z.string().max(50).optional(),
  material: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional()
});

// Product image schemas
export const createImageSchema = z.object({
  url: z.string().url("Image URL must be valid"),
  alt_text: z.string().max(500, "Alt text must be less than 500 characters").optional(),
  sort_order: z.number().int().min(0).optional().default(0),
  metadata: z.record(z.unknown()).optional().default({})
});

export const updateImageSchema = z.object({
  url: z.string().url().optional(),
  alt_text: z.string().max(500).optional(),
  sort_order: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional()
});

// Inventory adjustment schema
export const inventoryAdjustmentSchema = z.object({
  variant_id: z.string().uuid("Invalid variant ID"),
  quantity_change: z.number().int("Quantity change must be an integer"),
  reason: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional().default({})
});

// Upload schema
export const uploadImageSchema = z.object({
  file: z.any().refine((file) => file instanceof File, "Must be a valid file"),
  alt_text: z.string().max(500).optional(),
  folder: z.string().max(100).optional().default('products')
});

// Bulk operations schemas
export const bulkProductOperationSchema = z.object({
  product_ids: z.array(z.string().uuid()).min(1, "At least one product ID is required"),
  operation: z.enum(['delete', 'publish', 'unpublish', 'archive']),
  metadata: z.record(z.unknown()).optional()
});

export const bulkCategoryOperationSchema = z.object({
  category_ids: z.array(z.string().uuid()).min(1, "At least one category ID is required"),
  operation: z.enum(['delete', 'activate', 'deactivate']),
  metadata: z.record(z.unknown()).optional()
});

// Type exports for product management
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type BulkProductOperationInput = z.infer<typeof bulkProductOperationSchema>;
export type BulkCategoryOperationInput = z.infer<typeof bulkCategoryOperationSchema>;