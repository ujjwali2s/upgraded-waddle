-- Drop tables if they exist (handling dependencies)
DROP TABLE IF EXISTS "public"."order_items" CASCADE;
DROP TABLE IF EXISTS "public"."orders" CASCADE;
DROP TABLE IF EXISTS "public"."wallets" CASCADE;
DROP TABLE IF EXISTS "public"."users" CASCADE;
DROP TABLE IF EXISTS "public"."products" CASCADE;

-- Create users table
CREATE TABLE "public"."users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "email" text NOT NULL UNIQUE,
    "password_hash" text NOT NULL,
    "full_name" text,
    "otp_code" text,
    "otp_expires_at" timestamp with time zone,
    "is_verified" boolean DEFAULT false,
    "role" text DEFAULT 'user',
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Disable RLS for users
ALTER TABLE "public"."users" DISABLE ROW LEVEL SECURITY;

-- Create wallets table
CREATE TABLE "public"."wallets" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "balance" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Disable RLS for wallets
ALTER TABLE "public"."wallets" DISABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE "public"."products" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "price" numeric NOT NULL DEFAULT 0,
    "availability" integer NOT NULL DEFAULT 0,
    "status" text DEFAULT 'active' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Disable RLS for products
ALTER TABLE "public"."products" DISABLE ROW LEVEL SECURITY;

-- Create orders table
CREATE TABLE "public"."orders" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "payment_method" text,
    "total" numeric NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Disable RLS for orders
ALTER TABLE "public"."orders" DISABLE ROW LEVEL SECURITY;

-- Create order_items table
CREATE TABLE "public"."order_items" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "order_id" uuid REFERENCES "public"."orders"("id") ON DELETE CASCADE,
    "product_id" uuid REFERENCES "public"."products"("id") ON DELETE SET NULL,
    "product_name" text NOT NULL,
    "price" numeric NOT NULL,
    "quantity" integer NOT NULL DEFAULT 1
);

-- Disable RLS for order_items
ALTER TABLE "public"."order_items" DISABLE ROW LEVEL SECURITY;

-- Insert Sample Products
INSERT INTO "public"."products" ("name", "slug", "description", "price", "availability", "status")
VALUES
('Premium FedEx Account', 'fedex-premium', 'Verified FedEx account with high limits.', 150.00, 50, 'active'),
('DHL Express Label', 'dhl-express-label', 'Instant DHL Express label generation.', 25.00, 100, 'active'),
('UPS Ground Account', 'ups-ground', 'UPS Ground shipping account for business.', 120.00, 30, 'active'),
('USPS Priority Mail', 'usps-priority', 'Priority mail labels with tracking.', 15.00, 200, 'active'),
('Bulk Shipping Suite', 'bulk-shipping-suite', 'All-in-one shipping solution for e-commerce.', 500.00, 10, 'active');

-- Optional: Create a test user or admin if needed (commented out)
-- INSERT INTO "public"."users" ("email", "password_hash", "full_name", "role", "is_verified") 
-- VALUES ('admin@example.com', '$2a$10$YourHashedPasswordHere', 'Admin User', 'admin', true);
