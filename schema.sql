-- Drop products table if it exists
DROP TABLE IF EXISTS "public"."products" CASCADE;

-- Create products table
CREATE TABLE "public"."products" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "price" numeric NOT NULL DEFAULT 0,
    "availability" integer NOT NULL DEFAULT 0,
    "status" text DEFAULT 'active' NOT NULL,
    "category_id" uuid, -- Removed foreign key constraint for standalone creation
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;

-- Permissive Policy
CREATE POLICY "Allow all operations for products" ON "public"."products"
AS PERMISSIVE FOR ALL TO public
USING (true) WITH CHECK (true);

-- Insert Sample Data
INSERT INTO "public"."products" ("name", "slug", "description", "price", "availability", "status")
VALUES
('Premium FedEx Account', 'fedex-premium', 'Verified FedEx account with high limits.', 150.00, 50, 'active'),
('DHL Express Label', 'dhl-express-label', 'Instant DHL Express label generation.', 25.00, 100, 'active'),
('UPS Ground Account', 'ups-ground', 'UPS Ground shipping account for business.', 120.00, 30, 'active'),
('USPS Priority Mail', 'usps-priority', 'Priority mail labels with tracking.', 15.00, 200, 'active'),
('Bulk Shipping Suite', 'bulk-shipping-suite', 'All-in-one shipping solution for e-commerce.', 500.00, 10, 'active');
