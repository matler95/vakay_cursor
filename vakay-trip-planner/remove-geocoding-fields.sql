-- Remove geocoding-related fields from accommodations table
-- This reverts the geocoding feature that was added

-- Remove the latitude and longitude columns
ALTER TABLE IF EXISTS accommodations 
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude;

-- Drop the index on coordinates
DROP INDEX IF EXISTS idx_accommodations_lat_lon;
