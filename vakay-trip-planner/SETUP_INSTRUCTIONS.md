# 🚨 CRITICAL SETUP INSTRUCTIONS

## **Database Schema Issues - MUST FIX FIRST**

Your database schema is missing the `name_normalized` column that the application requires. This will cause **runtime errors** if not fixed.

### **Option 1: Fresh Database (Recommended for new setups)**

```sql
-- Run the complete setup script
\i setup-popular-destinations.sql
```

### **Option 2: Migrate Existing Database**

If you already have data in `popular_destinations` table:

```sql
-- Run the migration script
\i migrate-add-name-normalized.sql
```

### **Option 3: Manual Fix**

```sql
-- 1. Add the missing column
ALTER TABLE popular_destinations 
ADD COLUMN IF NOT EXISTS name_normalized TEXT;

-- 2. Populate with normalized names (using unaccent extension)
UPDATE popular_destinations
SET name_normalized = unaccent(name);

-- 3. Make it NOT NULL
ALTER TABLE popular_destinations 
ALTER COLUMN name_normalized SET NOT NULL;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_popular_destinations_name_normalized 
ON popular_destinations (name_normalized);
```

## **Required Extensions**

Make sure you have the `unaccent` extension enabled:

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
```

## **Verify Setup**

After running the migration, verify with:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'popular_destinations' 
AND column_name = 'name_normalized';

-- Check if data is populated
SELECT name, name_normalized 
FROM popular_destinations 
LIMIT 5;
```

## **Expected Result**

You should see:
- `name_normalized` column exists and is NOT NULL
- Data is populated (e.g., "Phú Quốc" → "Phu Quoc")
- Index exists for performance

## **If You Still Get Errors**

1. **Check database connection** - Ensure Supabase is accessible
2. **Verify table structure** - Run the verification queries above
3. **Check console logs** - Look for specific error messages
4. **Test with debug endpoint** - Use `/api/locations/debug?q=test`

## **Next Steps After Fix**

1. ✅ Database schema fixed
2. ✅ API routes updated
3. ✅ Type definitions aligned
4. 🧪 Test the search functionality
5. 🚀 Deploy your external data pipeline

---

**⚠️ IMPORTANT**: Do not test the application until the database schema is fixed. It will cause errors!
