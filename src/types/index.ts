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
export interface CartItem {
  id: string;
  variant_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  product: {
    id: string;
    title: string;
    thumbnail?: string;
    handle: string;
  };
  variant: {
    id: string;
    title: string;
    sku?: string;
    inventory_quantity?: number;
  };
}

// Legacy alias for backward compatibility
export interface CartLineItem extends CartItem {
  cart_id: string;
  title: string;
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
  region_id?: string;
  currency_code?: string;
  items: CartItem[];
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

// Business hours type
export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

// Store information type
export interface StoreInformation {
  businessName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  description?: string;
  tagline?: string;
}

// Branding settings type
export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  fonts: {
    heading: string;
    body: string;
  };
}

// Notification settings type
export interface NotificationSettings {
  emailNotifications: {
    orderUpdates: boolean;
    cateringInquiries: boolean;
    lowInventoryAlerts: boolean;
    dailyReports: boolean;
    weeklyReports: boolean;
  };
  smsNotifications: {
    enabled: boolean;
    orderUpdates: boolean;
    urgentAlerts: boolean;
  };
  adminEmails: string[];
  customerEmailSettings: {
    orderConfirmationTemplate: string;
    orderStatusUpdateTemplate: string;
    cateringQuoteTemplate: string;
  };
}

// Social media settings type
export interface SocialMediaSettings {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  googleBusiness?: string;
  yelp?: string;
}

// Operational settings type
export interface OperationalSettings {
  serviceOptions: {
    pickup: boolean;
    delivery: boolean;
    catering: boolean;
    dineIn: boolean;
  };
  orderTiming: {
    minimumLeadTimeMinutes: number;
    maximumAdvanceOrderDays: number;
    cateringMinimumLeadTimeHours: number;
  };
  specialHours: Array<{
    date: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    note?: string;
  }>;
}

export interface AdminSettings {
  // Legacy pricing settings (maintained for backward compatibility)
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

  // Enhanced business configuration
  businessHours: BusinessHours;
  storeInformation: StoreInformation;
  branding: BrandingSettings;
  notifications: NotificationSettings;
  socialMedia: SocialMediaSettings;
  operations: OperationalSettings;
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

// Payment Types
export interface PaymentResult {
  success: boolean;
  paymentIntent?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    client_secret?: string;
  };
  transactionId?: string;
  provider?: string;
  error?: string;
  orderId?: string;
  quoteId?: string;
}

export interface PaymentStatus {
  quoteId: string;
  depositPaid: boolean;
  balancePaid?: boolean;
  status: QuoteStatus;
  depositAmount: number;
  balanceAmount: number;
  totalAmount?: number;
  medusaOrderId?: string;
  balanceOrderId?: string;
  eventDate: string;
  timeline?: {
    hoursUntilEvent: number;
    paymentRequired: boolean;
    eventPassed: boolean;
  };
}

export interface PaymentWorkflowState {
  currentPhase: 'deposit' | 'balance' | 'completed';
  progress: {
    deposit: {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      transactionId?: string;
      completedAt?: Date;
      error?: string;
    };
    balance: {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      transactionId?: string;
      completedAt?: Date;
      error?: string;
    };
  };
}

// Order Tracking Types
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderStatusEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  message?: string;
  timestamp: Date;
  estimatedTime?: Date;
  location?: {
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  metadata?: Record<string, unknown>;
}

export interface OrderTrackingDetails {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  currentStatusMessage?: string;
  estimatedDeliveryTime?: Date;
  events: OrderStatusEvent[];
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    variant_title?: string;
    thumbnail?: string;
  }>;
  deliveryAddress?: {
    name: string;
    address_1: string;
    address_2?: string;
    city: string;
    province: string;
    postal_code: string;
    phone?: string;
  };
  payment: {
    total: number;
    currency: string;
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  };
  createdAt: Date;
  updatedAt: Date;
  isDelivery: boolean;
  isCatering?: boolean;
  cateringDetails?: {
    eventDate: Date;
    guestCount: number;
    eventType: EventType;
  };
}

export interface OrderLookupInput {
  identifier: string; // email or phone
  orderNumber?: string;
}

export interface OrderLookupResponse {
  orders: OrderTrackingDetails[];
  totalOrders: number;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  message?: string;
  estimatedTime?: Date;
  notifyCustomer: boolean;
  metadata?: Record<string, unknown>;
}

export interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  allowedRoles: ('admin' | 'staff' | 'system')[];
  requiresEstimatedTime?: boolean;
  autoAdvance?: {
    afterMinutes: number;
    conditions?: string[];
  };
}

export interface AdminOrderFilters {
  status?: OrderStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customerSearch?: string;
  orderType?: ('regular' | 'catering' | 'all');
  deliveryType?: ('pickup' | 'delivery' | 'all');
  limit?: number;
  offset?: number;
}

export interface AdminOrderListResponse {
  orders: OrderTrackingDetails[];
  totalCount: number;
  statusCounts: Record<OrderStatus, number>;
  filters: AdminOrderFilters;
}

export interface RealTimeOrderUpdate {
  type: 'status_change' | 'estimated_time_update' | 'location_update' | 'new_order';
  orderId: string;
  data: Partial<OrderTrackingDetails>;
  timestamp: Date;
}

export interface OrderTrackingState {
  orders: OrderTrackingDetails[];
  currentOrder: OrderTrackingDetails | null;
  isLoading: boolean;
  error: string | null;
  filters: AdminOrderFilters;
  realTimeConnection: boolean;
}

// =====================================
// DATABASE PRODUCT MANAGEMENT TYPES
// =====================================

// Database representation of product categories
export interface DatabaseProductCategory {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  parent_id: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// Database representation of products
export interface DatabaseProduct {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  handle: string;
  status: 'draft' | 'proposed' | 'published' | 'rejected';
  thumbnail: string | null;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  hs_code: string | null;
  origin_country: string | null;
  mid_code: string | null;
  material: string | null;
  metadata: Record<string, unknown>;
  is_giftcard: boolean;
  discountable: boolean;
  external_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// Database representation of product variants
export interface DatabaseProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  ean: string | null;
  upc: string | null;
  variant_rank: number;
  inventory_quantity: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
  price_cents: number;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  hs_code: string | null;
  origin_country: string | null;
  mid_code: string | null;
  material: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// Database representation of product images
export interface DatabaseProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// Database representation of product collections
export interface DatabaseProductCollection {
  id: string;
  title: string;
  handle: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// Database representation of product tags
export interface DatabaseProductTag {
  id: string;
  value: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// =====================================
// PRODUCT MANAGEMENT INPUT TYPES
// =====================================

// Input type for creating products
export interface CreateProductInput {
  title: string;
  subtitle?: string;
  description?: string;
  handle?: string; // Auto-generated from title if not provided
  status?: 'draft' | 'proposed' | 'published' | 'rejected';
  thumbnail?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  metadata?: Record<string, unknown>;
  is_giftcard?: boolean;
  discountable?: boolean;
  external_id?: string;
  categories?: string[]; // Array of category IDs
  collections?: string[]; // Array of collection IDs
  tags?: string[]; // Array of tag values
  variants?: CreateProductVariantInput[];
  images?: CreateProductImageInput[];
}

// Input type for updating products
export interface UpdateProductInput {
  title?: string;
  subtitle?: string;
  description?: string;
  handle?: string;
  status?: 'draft' | 'proposed' | 'published' | 'rejected';
  thumbnail?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  metadata?: Record<string, unknown>;
  is_giftcard?: boolean;
  discountable?: boolean;
  external_id?: string;
}

// Input type for creating product categories
export interface CreateProductCategoryInput {
  name: string;
  handle?: string; // Auto-generated from name if not provided
  description?: string;
  parent_id?: string;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
  sort_order?: number;
}

// Input type for updating product categories
export interface UpdateProductCategoryInput {
  name?: string;
  handle?: string;
  description?: string;
  parent_id?: string;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
  sort_order?: number;
}

// Input type for creating product variants
export interface CreateProductVariantInput {
  title: string;
  sku?: string;
  barcode?: string;
  ean?: string;
  upc?: string;
  variant_rank?: number;
  inventory_quantity?: number;
  allow_backorder?: boolean;
  manage_inventory?: boolean;
  price_cents: number;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  metadata?: Record<string, unknown>;
}

// Input type for updating product variants
export interface UpdateProductVariantInput {
  title?: string;
  sku?: string;
  barcode?: string;
  ean?: string;
  upc?: string;
  variant_rank?: number;
  inventory_quantity?: number;
  allow_backorder?: boolean;
  manage_inventory?: boolean;
  price_cents?: number;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  metadata?: Record<string, unknown>;
}

// Input type for creating product images
export interface CreateProductImageInput {
  url: string;
  alt_text?: string;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

// Input type for updating product images
export interface UpdateProductImageInput {
  url?: string;
  alt_text?: string;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

// Input type for creating product collections
export interface CreateProductCollectionInput {
  title: string;
  handle?: string; // Auto-generated from title if not provided
  metadata?: Record<string, unknown>;
}

// Input type for updating product collections
export interface UpdateProductCollectionInput {
  title?: string;
  handle?: string;
  metadata?: Record<string, unknown>;
}

// =====================================
// PRODUCT QUERY AND RESPONSE TYPES
// =====================================

// Extended product filters for database queries
export interface ProductQueryFilters {
  search?: string;
  category_ids?: string[];
  collection_ids?: string[];
  tag_values?: string[];
  status?: ('draft' | 'proposed' | 'published' | 'rejected')[];
  price_min_cents?: number;
  price_max_cents?: number;
  is_giftcard?: boolean;
  discountable?: boolean;
  has_inventory?: boolean;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'price_asc' | 'price_desc';
  sort_order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

// Category query filters
export interface CategoryQueryFilters {
  search?: string;
  parent_id?: string | null;
  is_active?: boolean;
  sort_by?: 'name' | 'sort_order' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

// Product list response with aggregated data
export interface ProductListQueryResponse {
  products: (DatabaseProduct & {
    variants: DatabaseProductVariant[];
    images: DatabaseProductImage[];
    categories: DatabaseProductCategory[];
    collections: DatabaseProductCollection[];
    tags: DatabaseProductTag[];
  })[];
  total_count: number;
  has_more: boolean;
  filters: ProductQueryFilters;
}

// Category list response with hierarchy support
export interface CategoryListQueryResponse {
  categories: (DatabaseProductCategory & {
    children?: DatabaseProductCategory[];
    product_count?: number;
  })[];
  total_count: number;
  has_more: boolean;
  filters: CategoryQueryFilters;
}

// Inventory tracking for variants
export interface InventoryAdjustmentInput {
  variant_id: string;
  quantity_change: number; // Positive for increase, negative for decrease
  reason?: string;
  metadata?: Record<string, unknown>;
}

// Batch operations for efficiency
export interface BatchProductOperation {
  operation: 'create' | 'update' | 'delete';
  data: CreateProductInput | (UpdateProductInput & { id: string }) | { id: string };
}

// Bulk import/export types
export interface ProductExportOptions {
  format: 'json' | 'csv';
  include_variants?: boolean;
  include_images?: boolean;
  include_categories?: boolean;
  filters?: ProductQueryFilters;
}

export interface ProductImportResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    data?: Record<string, unknown>;
  }>;
  created_product_ids: string[];
}