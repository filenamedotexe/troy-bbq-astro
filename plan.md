**Instructions for Claude (Cursor) — BBQ Restaurant & Catering Platform**

**Deployment Architecture**
* **Frontend (Astro)** → deploy to **Vercel**
* **Backend (MedusaJS v2)** → deploy to **Vercel** (serverless functions)
* **Database** → **NeonDB (Serverless Postgres)**

**Core Technology Stack**
* **Astro** (latest with MedusaJS integration starter)
* **MedusaJS v2** for e-commerce (products, cart, checkout, order management)
* **Stripe + Square** payment providers (via official Medusa plugins)
* **NeonDB** for custom tables (admin_settings, catering_quotes, catering_addons)
* **Tailwind CSS + shadcn/ui** for styling and UI components
* **Lucide-react** for iconography
* **react-hook-form + Zod** for form handling and validation
* **TypeScript** in strict mode throughout

**Development Principles**
1. **Documentation-first approach** — Always consult official docs (Astro, MedusaJS, Stripe, Square, NeonDB, Vercel, shadcn/ui) before implementation
2. **Zero assumptions** — Verify all API signatures, configurations, and plugin implementations against current documentation
3. **Minimal viable complexity** — Build lean, focused features that deliver maximum business value
4. **Type safety** — Strict TypeScript with comprehensive Zod runtime validation
5. **Mobile-first responsive design** — All components and pages must work seamlessly across devices

**Business Context**
BBQ restaurant with dual revenue streams: retail ordering and custom catering services. The platform handles standard restaurant orders plus complex catering quote generation with dynamic pricing, location-based fees, and two-phase payment processing.

**Application Structure**

**Public Pages:**
* **Home** — Brand story, featured items, call-to-actions
* **About** — Restaurant history, team, values
* **Menu** — Product catalog from MedusaJS
* **Catering** — Interactive quote builder and service details
* **Contact** — Location, hours, contact form
* **Cart** — Shopping cart with upsells
* **Checkout** — Payment processing with provider selection

**Admin Dashboard:**
* **Settings Management** — Business configuration (fees, tax rates, service areas)
* **Menu Administration** — Product CRUD operations
* **Order Management** — Retail order fulfillment
* **Catering Quotes** — Quote review, approval, and payment tracking

**Feature Specifications**

**Retail Commerce:**
* Product browsing with filtering and search
* Cart management with real-time updates
* Checkout with order bumps and upsells
* Payment processing via Stripe or Square
* Order confirmation and tracking

**Catering System:**
* **Multi-step Quote Builder:**
  * Event classification (corporate/private events)
  * Guest count with appetite modifiers
  * Service location with distance-based pricing
  * Custom plate builder (protein + side combinations)
  * Add-on services (setup, equipment, staff)
* **Dynamic Pricing Engine:**
  * Base pricing per guest
  * Distance fees for delivery/setup
  * Tax calculation
  * Deposit requirements (configurable percentage)
  * Balance due calculation
* **Payment Workflow:**
  * Initial deposit collection
  * Balance payment link generation
  * Payment status tracking

**Database Schema**

**Custom NeonDB Tables:**
```sql
-- Single-row configuration store
admin_settings (
  id SERIAL PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Catering quote storage
catering_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  quote_data JSONB NOT NULL,
  pricing_breakdown JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  medusa_order_id VARCHAR(255), -- Links to deposit order
  balance_order_id VARCHAR(255), -- Links to balance order
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Configurable add-on services
catering_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**TypeScript Interfaces:**
```typescript
interface AdminSettings {
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

interface CateringQuote {
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
}
```

**Integration Architecture**

**Payment Processing:**
* **Retail Flow:** Direct MedusaJS checkout → Stripe/Square plugin
* **Catering Flow:** Quote approval → Medusa order creation for deposit → payment collection → balance payment link generation

**State Management:**
* MedusaJS handles cart state and order lifecycle
* Custom React context for catering quote builder
* Persistent storage for quote drafts

**Project Deliverables**

**Phase 1 - Foundation:**
1. Astro project initialization with MedusaJS starter integration
2. TypeScript configuration with strict mode enabled
3. NeonDB database setup with migration scripts
4. shadcn/ui component library integration
5. Basic responsive layout components

**Phase 2 - Core Features:**
1. Admin settings management interface with form validation
2. Product catalog display with filtering capabilities
3. Shopping cart and checkout flow implementation
4. Payment provider integration (Stripe + Square)

**Phase 3 - Catering System:**
1. Multi-step catering quote builder
2. Dynamic pricing calculation engine
3. Quote management dashboard
4. Two-phase payment workflow

**Phase 4 - Polish:**
1. Order tracking and status updates
2. Email notifications and confirmations
3. Performance optimization and SEO
4. Comprehensive error handling and user feedback

**Critical Requirements:**
⚡ **Documentation Verification** — Every implementation must reference current official documentation
⚡ **Type Safety** — All data structures must be strictly typed with runtime validation
⚡ **Responsive Design** — Every component must function properly on mobile, tablet, and desktop
⚡ **Error Handling** — Graceful degradation and user-friendly error messages throughout
⚡ **Performance** — Optimized loading, caching, and minimal bundle sizes

**Current Date Context:** September 2025 — Ensure all technology choices and implementation patterns reflect the current state of the ecosystem.