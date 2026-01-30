-- ============================================================================
-- PHASE 0: PRODUCTION STABILIZATION - DATABASE MIGRATION
-- ============================================================================
-- 
-- This migration adds support for the Trash/Undo system
-- Run this SQL in your Supabase SQL Editor
--
-- Features Added:
-- 1. Soft delete support (deleted_at column)
-- 2. Track who deleted (trashed_by column)
-- 3. Performance index for trash queries
-- 4. Automatic cleanup function (30-day retention)
-- 5. Row Level Security (RLS) policies
--
-- ============================================================================

-- 1. Add soft delete columns to capsules table
-- ----------------------------------------------------------------------------
ALTER TABLE capsules 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trashed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN capsules.deleted_at IS 'Timestamp when capsule was moved to trash. NULL = active, NOT NULL = in trash';
COMMENT ON COLUMN capsules.trashed_by IS 'User ID who deleted the capsule. Used for audit trail';

-- 2. Create index for performance (trash queries)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_capsules_deleted_at 
ON capsules(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_capsules_active 
ON capsules(user_id, deleted_at) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_capsules_deleted_at IS 'Optimizes trash queries';
COMMENT ON INDEX idx_capsules_active IS 'Optimizes active capsule queries (filters out trash)';

-- 3. Update existing queries to exclude trashed capsules
-- ----------------------------------------------------------------------------
-- NOTE: You need to update your application queries to filter out trashed capsules:
-- 
-- Before:
--   SELECT * FROM capsules WHERE user_id = ?
--
-- After:
--   SELECT * FROM capsules WHERE user_id = ? AND deleted_at IS NULL
--
-- The application should handle this automatically, but existing stored procedures
-- or views may need updating.

-- 4. Create automatic cleanup function (deletes capsules older than 30 days)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_cleanup_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
  media_count INT := 0;
  capsule_record RECORD;
BEGIN
  -- Log cleanup start
  RAISE NOTICE 'Starting automatic trash cleanup at %', NOW();
  
  -- Find capsules to delete (deleted more than 30 days ago)
  FOR capsule_record IN 
    SELECT id, media 
    FROM capsules 
    WHERE deleted_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Note: Media deletion happens in application code (Supabase Storage API)
    -- This just marks the count
    IF capsule_record.media IS NOT NULL THEN
      media_count := media_count + 1;
    END IF;
    
    -- Delete the capsule permanently
    DELETE FROM capsules WHERE id = capsule_record.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  -- Log cleanup results
  RAISE NOTICE 'Trash cleanup complete: % capsules deleted, % had media files', 
    deleted_count, media_count;
END;
$$;

COMMENT ON FUNCTION auto_cleanup_trash IS 'Permanently deletes capsules that have been in trash for >30 days. Run daily via cron.';

-- 5. Create Supabase Edge Function cron job (INSTRUCTIONS)
-- ----------------------------------------------------------------------------
-- You need to create a cron job to run this function daily.
-- 
-- Option A: Supabase Dashboard
--   1. Go to Database → Extensions → Enable pg_cron
--   2. Run this SQL:
--
-- SELECT cron.schedule(
--   'trash-cleanup',              -- job name
--   '0 2 * * *',                  -- 2 AM daily (UTC)
--   $$SELECT auto_cleanup_trash()$$
-- );
--
-- Option B: Edge Function (if pg_cron not available)
--   Create a scheduled edge function at /supabase/functions/trash-cleanup
--   that calls auto_cleanup_trash() daily

-- 6. Update Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
-- Update existing policies to exclude trashed capsules from normal queries

-- Drop and recreate the "Users can view their own capsules" policy
DROP POLICY IF EXISTS "Users can view their own capsules" ON capsules;
CREATE POLICY "Users can view their own capsules"
ON capsules FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  AND deleted_at IS NULL  -- NEW: Exclude trashed capsules from normal view
);

-- Create new policy for viewing trash
CREATE POLICY "Users can view their own trash"
ON capsules FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  AND deleted_at IS NOT NULL  -- Only show trashed capsules
);

-- Update the update policy to allow un-deleting
DROP POLICY IF EXISTS "Users can update their own capsules" ON capsules;
CREATE POLICY "Users can update their own capsules"
ON capsules FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can still "delete" (soft delete) their own capsules
-- The existing delete policy should work, but let's make it explicit
DROP POLICY IF EXISTS "Users can delete their own capsules" ON capsules;
CREATE POLICY "Users can delete their own capsules"
ON capsules FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policy for permanent deletion (only capsules already in trash)
CREATE POLICY "Users can permanently delete trashed capsules"
ON capsules FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  AND deleted_at IS NOT NULL  -- Can only permanently delete if already trashed
);

-- 7. Verification queries
-- ----------------------------------------------------------------------------
-- Run these to verify the migration worked:

-- Check that columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'capsules' 
-- AND column_name IN ('deleted_at', 'trashed_by');

-- Check that indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'capsules' 
-- AND indexname LIKE '%deleted%';

-- Check that policies were created
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'capsules';

-- 8. Rollback script (if needed)
-- ----------------------------------------------------------------------------
-- CAUTION: Only run this if you need to undo the migration
-- This will PERMANENTLY DELETE all trashed capsules!

-- DROP POLICY IF EXISTS "Users can view their own trash" ON capsules;
-- DROP POLICY IF EXISTS "Users can permanently delete trashed capsules" ON capsules;
-- DROP FUNCTION IF EXISTS auto_cleanup_trash();
-- DROP INDEX IF EXISTS idx_capsules_deleted_at;
-- DROP INDEX IF EXISTS idx_capsules_active;
-- ALTER TABLE capsules DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE capsules DROP COLUMN IF EXISTS trashed_by;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set up daily cron job for auto_cleanup_trash()
-- 3. Update frontend queries to filter deleted_at IS NULL
-- 4. Test the TrashManager component
-- 5. Verify RLS policies work correctly
--
-- ============================================================================
