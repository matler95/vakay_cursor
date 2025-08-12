-- Migration script to add name_normalized column to existing popular_destinations table
-- Run this if you already have data in the table

-- 1. Add the name_normalized column
ALTER TABLE popular_destinations 
ADD COLUMN IF NOT EXISTS name_normalized TEXT;

-- 2. Update existing records to populate name_normalized
-- Option A: Use unaccent extension (recommended)
UPDATE popular_destinations
SET name_normalized = unaccent(name)
WHERE name_normalized IS NULL;

-- Option B: Simple fallback if unaccent is not available
-- UPDATE popular_destinations
-- SET name_normalized = lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'))
-- WHERE name_normalized IS NULL;

-- 3. Make the column NOT NULL after populating
ALTER TABLE popular_destinations 
ALTER COLUMN name_normalized SET NOT NULL;

-- 4. Create index for efficient searching
CREATE INDEX IF NOT EXISTS idx_popular_destinations_name_normalized 
ON popular_destinations (name_normalized);

-- 5. Verify the migration
SELECT 
  COUNT(*) as total_records,
  COUNT(name_normalized) as records_with_normalized,
  COUNT(*) FILTER (WHERE name_normalized IS NOT NULL) as non_null_normalized
FROM popular_destinations;
