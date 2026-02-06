-- Fix recursive RLS policies on profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

-- Fix wallets policy to avoid recursive profile lookup
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Fix orders policy
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Fix order_items policy
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);
