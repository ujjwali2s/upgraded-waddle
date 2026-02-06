-- Script to insert sample products into the database
-- Run this with: node run_migration.js scripts/005_insert_sample_products.sql

-- First, let's make sure we have some categories
INSERT INTO public.categories (id, name, slug, description, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'FedEx Accounts', 'fedex-accounts', 'Premium FedEx shipping accounts', NOW(), NOW()),
    (gen_random_uuid(), 'DHL Accounts', 'dhl-accounts', 'International DHL shipping accounts', NOW(), NOW()),
    (gen_random_uuid(), 'UPS Accounts', 'ups-accounts', 'Reliable UPS shipping accounts', NOW(), NOW()),
    (gen_random_uuid(), 'USPS Labels', 'usps-labels', 'Discounted USPS shipping labels', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO public.products (id, name, slug, description, price, category_id, availability, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'FedEx Premium Account',
    'fedex-premium-account',
    'Verified FedEx account with discounted rates for domestic and international shipping',
    299.99,
    (SELECT id FROM public.categories WHERE slug = 'fedex-accounts' LIMIT 1),
    15,
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'fedex-premium-account');

INSERT INTO public.products (id, name, slug, description, price, category_id, availability, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'DHL Express Account',
    'dhl-express-account',
    'International DHL Express account with priority shipping rates',
    349.99,
    (SELECT id FROM public.categories WHERE slug = 'dhl-accounts' LIMIT 1),
    10,
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'dhl-express-account');

INSERT INTO public.products (id, name, slug, description, price, category_id, availability, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'UPS Ground Account',
    'ups-ground-account',
    'UPS Ground shipping account with commercial rates',
    249.99,
    (SELECT id FROM public.categories WHERE slug = 'ups-accounts' LIMIT 1),
    20,
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'ups-ground-account');

INSERT INTO public.products (id, name, slug, description, price, category_id, availability, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'USPS Priority Labels (10 Pack)',
    'usps-priority-labels-10',
    'Pack of 10 USPS Priority Mail shipping labels at discounted rates',
    89.99,
    (SELECT id FROM public.categories WHERE slug = 'usps-labels' LIMIT 1),
    50,
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'usps-priority-labels-10');

INSERT INTO public.products (id, name, slug, description, price, category_id, availability, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'FedEx International Account',
    'fedex-international-account',
    'FedEx International Priority account for worldwide shipping',
    399.99,
    (SELECT id FROM public.categories WHERE slug = 'fedex-accounts' LIMIT 1),
    8,
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'fedex-international-account');

INSERT INTO public.products (id, name, slug, description, price, category_id, availability, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'DHL Economy Account',
    'dhl-economy-account',
    'Budget-friendly DHL account for non-urgent shipments',
    199.99,
    (SELECT id FROM public.categories WHERE slug = 'dhl-accounts' LIMIT 1),
    5,
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'dhl-economy-account');
