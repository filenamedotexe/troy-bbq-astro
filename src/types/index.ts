import type { z } from 'zod';

// MedusaJS Product Types
export interface ProductImage {
  id: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  prices: Array<{
    id: string;
    amount: number;
    currency_code: string;
  }>;
  inventory_quantity?: number;
  options?: Array<{
    id: string;
    value: string;
    option: {
      id: string;
      title: string;
    };
  }>;
}

export interface ProductCollection {
  id: string;
  title: string;
  handle: string;
  metadata?: Record<string, unknown>;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  parent_category?: ProductCategory;
  category_children?: ProductCategory[];
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  handle: string;
  is_giftcard: boolean;
  status: string;
  thumbnail?: string;
  images?: ProductImage[];
  variants: ProductVariant[];
  collection?: ProductCollection;
  categories?: ProductCategory[];
  tags?: Array<{
    id: string;
    value: string;
  }>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  products: Product[];
  count: number;
  offset: number;
  limit: number;
}

export interface ProductFilters {
  search?: string;
  category_id?: string[];
  collection_id?: string[];
  tags?: string[];
  price_min?: number;
  price_max?: number;
  sort?: 'created_at' | 'title' | 'price_asc' | 'price_desc';
}

// Cart Types
export interface CartLineItem {
  id: string;
  cart_id: string;
  title: string;
  quantity: number;
  variant_id: string;
  product_id: string;
  unit_price: number;
  total: number;
  variant: ProductVariant;
  product: Product;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
}

export interface CartAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

export interface Cart {
  id: string;
  email?: string;
  region_id: string;
  currency_code: string;
  items: CartLineItem[];
  shipping_address?: CartAddress;
  billing_address?: CartAddress;
  total: number;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  item_total: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateCartInput {
  region_id?: string;
  email?: string;
  shipping_address?: CartAddress;
  billing_address?: CartAddress;
}

export interface AddToCartInput {
  variant_id: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateLineItemInput {
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface AdminSettings {
  deliveryRadius: number;
  baseFeePerMile: number;
  taxRate: number;
  depositPercentage: number;
  hungerMultipliers: {
    normal: number;
    prettyHungry: number;
    reallyHungry: number;
  };
  minimumOrder: number;
}

export interface CateringQuote {
  id: string;
  customerEmail: string;
  eventDetails: {
    type: 'corporate' | 'private';
    date: string;
    guestCount: number;
    hungerLevel: 'normal' | 'prettyHungry' | 'reallyHungry';
    location: {
      address: string;
      distanceMiles: number;
    };
  };
  menuSelections: Array<{
    proteinId: string;
    sideId: string;
    quantity: number;
  }>;
  addOns: Array<{
    addOnId: string;
    quantity: number;
  }>;
  pricing: {
    subtotalCents: number;
    taxCents: number;
    deliveryFeeCents: number;
    totalCents: number;
    depositCents: number;
    balanceCents: number;
  };
  status: 'pending' | 'approved' | 'deposit_paid' | 'confirmed' | 'completed' | 'cancelled';
  medusaOrderId?: string;
  balanceOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CateringAddon {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  isActive: boolean;
  category: string | null;
  createdAt: Date;
}

export interface DatabaseAdminSettings {
  id: number;
  config: AdminSettings;
  updated_at: Date;
}

export interface DatabaseCateringQuote {
  id: string;
  customer_email: string;
  quote_data: CateringQuote['eventDetails'] & {
    menuSelections: CateringQuote['menuSelections'];
    addOns: CateringQuote['addOns'];
  };
  pricing_breakdown: CateringQuote['pricing'];
  status: CateringQuote['status'];
  medusa_order_id: string | null;
  balance_order_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseCateringAddon {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
  category: string | null;
  created_at: Date;
}

export type EventType = 'corporate' | 'private';
export type HungerLevel = 'normal' | 'prettyHungry' | 'reallyHungry';
export type QuoteStatus = 'pending' | 'approved' | 'deposit_paid' | 'confirmed' | 'completed' | 'cancelled';

export interface LocationDetails {
  address: string;
  distanceMiles: number;
}

export interface MenuSelection {
  proteinId: string;
  sideId: string;
  quantity: number;
}

export interface AddOnSelection {
  addOnId: string;
  quantity: number;
}

export interface PricingBreakdown {
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  depositCents: number;
  balanceCents: number;
}

export interface QuoteFormData {
  customerEmail: string;
  eventType: EventType;
  eventDate: string;
  guestCount: number;
  hungerLevel: HungerLevel;
  address: string;
  menuSelections: MenuSelection[];
  addOns: AddOnSelection[];
}