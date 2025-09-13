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
    "minimumOrder": 5000
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

-- Grant necessary permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;