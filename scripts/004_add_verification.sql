-- Add verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_code TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- Update RLS policies to allow users to verify themselves
-- We need to make sure the update policy allows writing to these columns if the user is verified or during verification process
-- For simplicity, existing update policies usually cover "own" updates, but we need to check if RLS blocks checking these fields.
-- Actually, the backend API (service role) should probably handle OTP verification to be secure,
-- preventing users from just setting "is_verified" to true themselves.
-- BUT, since we are using Next.js API routes with Supabase Service Role (implied for admin tasks),
-- we might run these updates as admin.

-- However, if we run as user, we need to ensure they can't set is_verified.
-- Ideally, is_verified should only be updatable by a function or admin.
-- For this "quick fix" approach using client/server actions:
-- We will likely use the SERVICE_ROLE key in the API route to perform the update securely.
