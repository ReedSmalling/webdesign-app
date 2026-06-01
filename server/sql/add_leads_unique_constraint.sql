-- Required for leads upsert: onConflict 'business_name,city'
-- Run in Supabase Dashboard → SQL Editor → New query → Run

-- Remove duplicate rows (keep the newest per business_name + city)
DELETE FROM leads a
USING leads b
WHERE a.id < b.id
  AND a.business_name IS NOT DISTINCT FROM b.business_name
  AND a.city IS NOT DISTINCT FROM b.city;

-- Add unique constraint matching upsert onConflict
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_business_name_city_key'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_business_name_city_key UNIQUE (business_name, city);
  END IF;
END $$;
