CREATE OR REPLACE FUNCTION public.decrement_availability(product_id UUID, qty INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET availability = GREATEST(0, availability - qty),
      updated_at = now()
  WHERE id = product_id;
END;
$$;
