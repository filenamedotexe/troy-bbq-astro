-- Troy BBQ Database Schema
-- This file contains the custom table definitions for NeonDB

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Single-row configuration store for admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration if table is empty
INSERT INTO admin_settings (config)
SELECT '{
    "deliveryRadius": 25,
    "baseFeePerMile": 150,
    "taxRate": 0.08,
    "depositPercentage": 0.30,
    "hungerMultipliers": {
        "normal": 1.0,
        "prettyHungry": 1.25,
        "reallyHungry": 1.5
    },
    "minimumOrder": 5000,
    "businessHours": {
        "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"},
        "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"},
        "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"},
        "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"},
        "friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"},
        "saturday": {"isOpen": true, "openTime": "11:00", "closeTime": "21:00"},
        "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "19:00"}
    },
    "storeInformation": {
        "businessName": "Troy BBQ",
        "address": {
            "street": "123 BBQ Street",
            "city": "Troy",
            "state": "Texas",
            "zipCode": "75001",
            "country": "United States"
        },
        "contact": {
            "phone": "(555) 123-4567",
            "email": "info@troybbq.com",
            "website": "https://troybbq.com"
        },
        "description": "Authentic Texas BBQ with house-smoked meats and traditional sides",
        "tagline": "Smokin Good BBQ Since Day One"
    },
    "branding": {
        "primaryColor": "#DC2626",
        "secondaryColor": "#7C2D12",
        "accentColor": "#F59E0B",
        "fonts": {
            "heading": "Inter",
            "body": "Inter"
        }
    },
    "notifications": {
        "emailNotifications": {
            "orderUpdates": true,
            "cateringInquiries": true,
            "lowInventoryAlerts": true,
            "dailyReports": false,
            "weeklyReports": true
        },
        "smsNotifications": {
            "enabled": false,
            "orderUpdates": false,
            "urgentAlerts": false
        },
        "adminEmails": ["admin@troybbq.com"],
        "customerEmailSettings": {
            "orderConfirmationTemplate": "default",
            "orderStatusUpdateTemplate": "default",
            "cateringQuoteTemplate": "default"
        }
    },
    "socialMedia": {
        "facebook": "https://facebook.com/troybbq",
        "instagram": "https://instagram.com/troybbq"
    },
    "operations": {
        "serviceOptions": {
            "pickup": true,
            "delivery": true,
            "catering": true,
            "dineIn": false
        },
        "orderTiming": {
            "minimumLeadTimeMinutes": 30,
            "maximumAdvanceOrderDays": 30,
            "cateringMinimumLeadTimeHours": 48
        },
        "specialHours": []
    }
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);

-- Catering quote storage
CREATE TABLE IF NOT EXISTS catering_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email VARCHAR(255) NOT NULL,
    quote_data JSONB NOT NULL,
    pricing_breakdown JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'deposit_paid', 'confirmed', 'completed', 'cancelled')
    ),
    medusa_order_id VARCHAR(255),
    balance_order_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurable add-on services
CREATE TABLE IF NOT EXISTS catering_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    is_active BOOLEAN DEFAULT true,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_catering_quotes_customer_email ON catering_quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_catering_quotes_status ON catering_quotes(status);
CREATE INDEX IF NOT EXISTS idx_catering_quotes_created_at ON catering_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_catering_addons_active ON catering_addons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_catering_addons_category ON catering_addons(category) WHERE category IS NOT NULL;

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to catering_quotes
DROP TRIGGER IF EXISTS update_catering_quotes_updated_at ON catering_quotes;
CREATE TRIGGER update_catering_quotes_updated_at
    BEFORE UPDATE ON catering_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply update trigger to admin_settings
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default catering add-ons
INSERT INTO catering_addons (name, description, price_cents, category) VALUES
    ('Setup Service', 'Professional setup and breakdown of catering equipment', 15000, 'service'),
    ('Disposable Plates & Utensils', 'Eco-friendly disposable dinnerware for all guests', 250, 'equipment'),
    ('Chafing Dishes', 'Professional warming trays to keep food at optimal temperature', 2500, 'equipment'),
    ('Serving Staff (per hour)', 'Professional catering staff to serve your guests', 2500, 'service'),
    ('Tablecloths & Linens', 'Premium linens for buffet tables', 1500, 'equipment'),
    ('Beverage Service', 'Sweet tea, lemonade, and water service', 300, 'beverage')
ON CONFLICT DO NOTHING;

-- =====================================
-- PRODUCT MANAGEMENT SYSTEM TABLES
-- =====================================

-- Product categories with hierarchical support
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    handle VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main products table following MedusaJS patterns
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    handle VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN ('draft', 'proposed', 'published', 'rejected')
    ),
    thumbnail VARCHAR(500),
    weight INTEGER,
    length INTEGER,
    height INTEGER,
    width INTEGER,
    hs_code VARCHAR(50),
    origin_country VARCHAR(2),
    mid_code VARCHAR(50),
    material VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    is_giftcard BOOLEAN DEFAULT false,
    discountable BOOLEAN DEFAULT true,
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants with pricing and inventory
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(255) UNIQUE,
    barcode VARCHAR(255),
    ean VARCHAR(255),
    upc VARCHAR(255),
    variant_rank INTEGER DEFAULT 0,
    inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
    allow_backorder BOOLEAN DEFAULT false,
    manage_inventory BOOLEAN DEFAULT true,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    weight INTEGER,
    length INTEGER,
    height INTEGER,
    width INTEGER,
    hs_code VARCHAR(50),
    origin_country VARCHAR(2),
    mid_code VARCHAR(50),
    material VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product images with ordering support
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for product-category relationships (many-to-many)
CREATE TABLE IF NOT EXISTS product_category_relations (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (product_id, category_id)
);

-- Product collections for grouping products
CREATE TABLE IF NOT EXISTS product_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    handle VARCHAR(255) UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for product-collection relationships
CREATE TABLE IF NOT EXISTS product_collection_relations (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (product_id, collection_id)
);

-- Product tags for flexible categorization
CREATE TABLE IF NOT EXISTS product_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value VARCHAR(255) UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for product-tag relationships
CREATE TABLE IF NOT EXISTS product_tag_relations (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (product_id, tag_id)
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_handle ON products(handle);
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_metadata ON products USING gin(metadata);

-- Product variant indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_variants_price ON product_variants(price_cents);
CREATE INDEX IF NOT EXISTS idx_product_variants_inventory ON product_variants(inventory_quantity) WHERE manage_inventory = true;

-- Product category indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_handle ON product_categories(handle);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_categories_sort ON product_categories(sort_order);

-- Product image indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_product_category_relations_category ON product_category_relations(category_id);
CREATE INDEX IF NOT EXISTS idx_product_collection_relations_collection ON product_collection_relations(collection_id);
CREATE INDEX IF NOT EXISTS idx_product_tag_relations_tag ON product_tag_relations(tag_id);

-- Collection and tag indexes
CREATE INDEX IF NOT EXISTS idx_product_collections_handle ON product_collections(handle);
CREATE INDEX IF NOT EXISTS idx_product_tags_value ON product_tags(value);

-- =====================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================

-- Apply update triggers to new product tables
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_categories_updated_at ON product_categories;
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_collections_updated_at ON product_collections;
CREATE TRIGGER update_product_collections_updated_at
    BEFORE UPDATE ON product_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- SAMPLE DATA
-- =====================================

-- Insert default product categories
INSERT INTO product_categories (name, handle, description, sort_order) VALUES
    ('BBQ Meats', 'bbq-meats', 'Our signature smoked meats', 1),
    ('Sides', 'sides', 'Traditional BBQ sides and accompaniments', 2),
    ('Desserts', 'desserts', 'Sweet treats to complete your meal', 3),
    ('Beverages', 'beverages', 'Drinks to complement your BBQ', 4),
    ('Catering Packages', 'catering-packages', 'Complete catering solutions', 5),
    ('Sauces & Rubs', 'sauces-rubs', 'House-made sauces and dry rubs', 6)
ON CONFLICT (handle) DO NOTHING;

-- Insert sample products
WITH category_ids AS (
    SELECT id, handle FROM product_categories
)
INSERT INTO products (title, subtitle, description, handle, status, thumbnail) VALUES
    ('Brisket', 'House Specialty', 'Our signature slow-smoked brisket, cooked for 14 hours with our secret dry rub', 'brisket', 'published', '/images/brisket.jpg'),
    ('Pulled Pork', 'Customer Favorite', 'Tender pulled pork shoulder smoked low and slow', 'pulled-pork', 'published', '/images/pulled-pork.jpg'),
    ('Mac & Cheese', 'Comfort Food Classic', 'Creamy three-cheese mac with a crispy breadcrumb topping', 'mac-cheese', 'published', '/images/mac-cheese.jpg'),
    ('Coleslaw', 'Traditional Recipe', 'Fresh cabbage slaw with our tangy house dressing', 'coleslaw', 'published', '/images/coleslaw.jpg'),
    ('Troy BBQ Sauce', 'Original Recipe', 'Our signature BBQ sauce - tangy, sweet, and smoky', 'troy-bbq-sauce', 'published', '/images/bbq-sauce.jpg')
ON CONFLICT (handle) DO NOTHING;

-- Insert sample product variants with pricing
WITH product_ids AS (
    SELECT id, handle FROM products
)
INSERT INTO product_variants (product_id, title, sku, price_cents, inventory_quantity)
SELECT
    p.id,
    CASE
        WHEN p.handle = 'brisket' THEN 'Half Pound'
        WHEN p.handle = 'pulled-pork' THEN 'Half Pound'
        WHEN p.handle = 'mac-cheese' THEN 'Regular Serving'
        WHEN p.handle = 'coleslaw' THEN 'Regular Serving'
        WHEN p.handle = 'troy-bbq-sauce' THEN '16oz Bottle'
        ELSE 'Default Variant'
    END as title,
    CASE
        WHEN p.handle = 'brisket' THEN 'BRSK-0.5LB'
        WHEN p.handle = 'pulled-pork' THEN 'PORK-0.5LB'
        WHEN p.handle = 'mac-cheese' THEN 'MAC-REG'
        WHEN p.handle = 'coleslaw' THEN 'SLAW-REG'
        WHEN p.handle = 'troy-bbq-sauce' THEN 'SAUCE-16OZ'
        ELSE NULL
    END as sku,
    CASE
        WHEN p.handle = 'brisket' THEN 1899
        WHEN p.handle = 'pulled-pork' THEN 1599
        WHEN p.handle = 'mac-cheese' THEN 599
        WHEN p.handle = 'coleslaw' THEN 399
        WHEN p.handle = 'troy-bbq-sauce' THEN 899
        ELSE 999
    END as price_cents,
    100 as inventory_quantity
FROM product_ids p
WHERE p.handle IN ('brisket', 'pulled-pork', 'mac-cheese', 'coleslaw', 'troy-bbq-sauce')
ON CONFLICT (sku) DO NOTHING;

-- Insert product-category relationships
WITH product_data AS (
    SELECT p.id as product_id, p.handle as product_handle, c.id as category_id, c.handle as category_handle
    FROM products p
    CROSS JOIN product_categories c
    WHERE (p.handle IN ('brisket', 'pulled-pork') AND c.handle = 'bbq-meats')
       OR (p.handle IN ('mac-cheese', 'coleslaw') AND c.handle = 'sides')
       OR (p.handle = 'troy-bbq-sauce' AND c.handle = 'sauces-rubs')
)
INSERT INTO product_category_relations (product_id, category_id)
SELECT product_id, category_id FROM product_data
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;