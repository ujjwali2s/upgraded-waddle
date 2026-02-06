-- Create custom users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Safety measure, though we access via server 'posts')
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- No policies needed for now as we access via server-side 'pg' client which bypasses RLS
-- (or we can add specific ones later if we expose it via REST)

-- Create Update Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
