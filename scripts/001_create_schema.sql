-- =============================================
-- ShipsPro Database Schema
-- =============================================

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  availability INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'wallet' CHECK (payment_method IN ('wallet', 'gateway')),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

-- =============================================
-- Enable RLS on all tables
-- =============================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Categories: everyone can read, only admins can write
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_admin" ON public.categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "categories_update_admin" ON public.categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "categories_delete_admin" ON public.categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: everyone can read active, admins can CRUD all
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert_admin" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles: users can read/update own, admins can read/update all
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Wallets: users see own, admins see all
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "wallets_insert_own" ON public.wallets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wallets_update_own" ON public.wallets FOR UPDATE USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders: users see own, admins see all
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order items: same as orders
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- =============================================
-- Trigger: auto-create profile + wallet on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Seed: sample categories and products
-- =============================================
INSERT INTO public.categories (name, slug, description) VALUES
  ('FedEx Accounts', 'fedex-accounts', 'FedEx shipping accounts with email access'),
  ('DHL Accounts', 'dhl-accounts', 'DHL shipping account numbers and credentials'),
  ('UPS Accounts', 'ups-accounts', 'UPS shipping labels and FTID accounts'),
  ('USPS Labels', 'usps-labels', 'USPS shipping labels and postage')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, price, category_id, availability, status) VALUES
  ('FedEx US Personal Account', 'fedex-us-personal', 'FedEx Personal Account with email access (2024-2025, US/CA)', 60.00, (SELECT id FROM public.categories WHERE slug = 'fedex-accounts'), 72, 'active'),
  ('FedEx US Business Account 2025', 'fedex-us-business-2025', 'FedEx Business account with email access. US, CA, TX, CO, NY, MI, MA and all remaining states available.', 65.00, (SELECT id FROM public.categories WHERE slug = 'fedex-accounts'), 75, 'active'),
  ('FedEx Canada Personal Account', 'fedex-canada-personal', 'FedEx Canada Personal Account with email access (2024-2025, CA)', 95.00, (SELECT id FROM public.categories WHERE slug = 'fedex-accounts'), 6, 'active'),
  ('FedEx Canada Business Account', 'fedex-canada-business', 'FedEx Canada Business Account with email access (2024-2025, CA)', 95.00, (SELECT id FROM public.categories WHERE slug = 'fedex-accounts'), 41, 'active'),
  ('FedEx UK Business Account', 'fedex-uk-business', 'UK Business Account with email access. 2025 Accounts, mostly all new opened.', 135.00, (SELECT id FROM public.categories WHERE slug = 'fedex-accounts'), 42, 'active'),
  ('DHL Random Accounts', 'dhl-random', 'DHL Account Numbers Only (2024-2025, US, CA, PA, IN, NY, DE, CN, HK, SG, VE)', 40.00, (SELECT id FROM public.categories WHERE slug = 'dhl-accounts'), 141, 'active'),
  ('DHL US Accounts', 'dhl-us-accounts', 'DHL USA Account Numbers (2024-2025, US, CA, FL, PA, IN, MI, MA, MO, TX)', 50.00, (SELECT id FROM public.categories WHERE slug = 'dhl-accounts'), 31, 'active'),
  ('DHL Account With User ID', 'dhl-account-user-id', 'DHL Account with User ID. You get mydhl.express.dhl user ID with an account number issued on it.', 50.00, (SELECT id FROM public.categories WHERE slug = 'dhl-accounts'), 7, 'active'),
  ('UPS FTID Label', 'ups-ftid-label', 'UPS FTID shipping label for domestic US shipments.', 35.00, (SELECT id FROM public.categories WHERE slug = 'ups-accounts'), 50, 'active'),
  ('UPS International Label', 'ups-int-label', 'UPS International shipping label for worldwide shipments.', 55.00, (SELECT id FROM public.categories WHERE slug = 'ups-accounts'), 30, 'active'),
  ('USPS Priority Label', 'usps-priority', 'USPS Priority Mail shipping label.', 25.00, (SELECT id FROM public.categories WHERE slug = 'usps-labels'), 100, 'active'),
  ('USPS Express Label', 'usps-express', 'USPS Express Mail shipping label for fast delivery.', 45.00, (SELECT id FROM public.categories WHERE slug = 'usps-labels'), 60, 'active')
ON CONFLICT (slug) DO NOTHING;
