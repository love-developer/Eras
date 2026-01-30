/**
 * 🗑️ PRODUCTION TRASH CLEANUP CRON JOB
 * 
 * Runs daily to permanently delete capsules that have been in trash for >30 days
 * with batch processing, safety limits, and comprehensive logging.
 * 
 * Schedule: Daily at 2 AM UTC
 * Triggered by: Supabase Cron or external scheduler
 * 
 * Setup Instructions:
 * 1. Deploy this function: supabase functions deploy trash-cleanup
 * 
 * 2. Set DRY_RUN mode for testing (IMPORTANT - test first!):
 *    supabase secrets set DRY_RUN=true
 * 
 * 3. Test manually via GET request:
 *    curl https://your-project.supabase.co/functions/v1/trash-cleanup
 * 
 * 4. When ready for production:
 *    supabase secrets set DRY_RUN=false
 * 
 * 5. Set up cron in Supabase Dashboard:
 *    - Go to Edge Functions → trash-cleanup → Settings
 *    - Add cron schedule: "0 2 * * *" (2 AM daily)
 * 
 * Configuration:
 * - DRY_RUN: Set to 'true' to simulate without deleting (default: false)
 * - Batch size: 100 capsules per batch
 * - Safety limit: 500 capsules max per run
 * - Retention: 30 days
 */

import { createClient } from 'jsr:@supabase/supabase-js';

// CORS headers for function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CONFIGURATION
// ============================================================================

interface CleanupTarget {
  schema: string;
  table: string;
  retentionDays: number;
  batchSize: number;
  archiveTable: string | null;
}

const TARGETS: CleanupTarget[] = [
  {
    schema: 'public',
    table: 'capsules',
    retentionDays: 30,
    batchSize: 100, // Conservative for media-heavy records
    archiveTable: null, // No archiving yet - permanent deletion
  },
];

const SAFETY_LIMIT = 500; // Max records to delete in one run

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface CleanupStats {
  targetTable: string;
  dryRun: boolean;
  cutoffDate: string;
  capsulesFound: number;
  capsulesDeleted: number;
  mediaFilesDeleted: number;
  mediaDeleteErrors: number;
  batches: number;
  errors: string[];
  warnings: string[];
  skipped?: number;
}

/**
 * Delete media files from storage for a capsule
 */
async function deleteMediaFiles(
  supabase: any,
  capsule: any,
  dryRun: boolean
): Promise<{ deleted: number; errors: number }> {
  let deleted = 0;
  let errors = 0;

  if (!capsule.media || !Array.isArray(capsule.media)) {
    return { deleted, errors };
  }

  for (const mediaItem of capsule.media) {
    if (mediaItem.url) {
      try {
        // Extract file path from URL
        // URL format: https://{project}.supabase.co/storage/v1/object/public/capsule-media/{user_id}/{filename}
        const urlParts = mediaItem.url.split('/');
        const filename = urlParts[urlParts.length - 1];

        if (filename) {
          if (dryRun) {
            console.log(`  [DRY RUN] Would delete: ${capsule.user_id}/${filename}`);
            deleted++;
          } else {
            // Delete from storage
            const { error: storageError } = await supabase.storage
              .from('capsule-media')
              .remove([`${capsule.user_id}/${filename}`]);

            if (storageError) {
              console.warn(`  ⚠️ Failed to delete media file: ${filename}`, storageError.message);
              errors++;
            } else {
              deleted++;
            }
          }
        }
      } catch (mediaError) {
        console.warn('  ⚠️ Error processing media item:', mediaError);
        errors++;
      }
    }
  }

  return { deleted, errors };
}

/**
 * Process cleanup for a single target table
 */
async function processTarget(
  supabase: any,
  target: CleanupTarget,
  dryRun: boolean
): Promise<CleanupStats> {
  const stats: CleanupStats = {
    targetTable: target.table,
    dryRun,
    cutoffDate: '',
    capsulesFound: 0,
    capsulesDeleted: 0,
    mediaFilesDeleted: 0,
    mediaDeleteErrors: 0,
    batches: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - target.retentionDays);
    stats.cutoffDate = cutoffDate.toISOString();

    console.log(`\n🗑️  Processing ${target.table}`);
    console.log(`   Cutoff date: ${stats.cutoffDate}`);
    console.log(`   Batch size: ${target.batchSize}`);
    console.log(`   Dry run: ${dryRun ? 'YES' : 'NO'}`);

    // Find capsules to delete (deleted more than retention days ago)
    const { data: capsulesToDelete, error: selectError } = await supabase
      .from(target.table)
      .select('id, media, user_id, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', stats.cutoffDate)
      .limit(SAFETY_LIMIT + 1); // Fetch one extra to check if we hit limit

    if (selectError) {
      stats.errors.push(`Failed to fetch capsules: ${selectError.message}`);
      console.error(`❌ Error fetching capsules:`, selectError);
      return stats;
    }

    if (!capsulesToDelete || capsulesToDelete.length === 0) {
      console.log('✅ No capsules to delete');
      return stats;
    }

    stats.capsulesFound = capsulesToDelete.length;

    // Check if we hit safety limit
    if (capsulesToDelete.length > SAFETY_LIMIT) {
      stats.warnings.push(
        `Found ${capsulesToDelete.length} capsules, exceeding safety limit of ${SAFETY_LIMIT}. ` +
        `Processing first ${SAFETY_LIMIT} only. Run again to process remaining.`
      );
      console.warn(`⚠️  Safety limit reached! Processing only ${SAFETY_LIMIT} capsules.`);
      capsulesToDelete.splice(SAFETY_LIMIT); // Keep only first SAFETY_LIMIT
      stats.skipped = stats.capsulesFound - SAFETY_LIMIT;
    }

    console.log(`📦 Found ${capsulesToDelete.length} capsules to delete`);

    // Process in batches
    const batches = [];
    for (let i = 0; i < capsulesToDelete.length; i += target.batchSize) {
      batches.push(capsulesToDelete.slice(i, i + target.batchSize));
    }

    stats.batches = batches.length;
    console.log(`🔄 Processing ${batches.length} batches...`);

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length}: ${batch.length} capsules`);

      // Delete media files for each capsule in batch
      for (const capsule of batch) {
        const { deleted, errors } = await deleteMediaFiles(supabase, capsule, dryRun);
        stats.mediaFilesDeleted += deleted;
        stats.mediaDeleteErrors += errors;
      }

      // Delete capsules from database
      const capsuleIds = batch.map(c => c.id);

      if (dryRun) {
        console.log(`  [DRY RUN] Would delete ${capsuleIds.length} capsules from database`);
        stats.capsulesDeleted += capsuleIds.length;
      } else {
        const { error: deleteError } = await supabase
          .from(target.table)
          .delete()
          .in('id', capsuleIds);

        if (deleteError) {
          const errorMsg = `Batch ${batchIndex + 1} delete failed: ${deleteError.message}`;
          stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        } else {
          stats.capsulesDeleted += capsuleIds.length;
          console.log(`  ✅ Deleted ${capsuleIds.length} capsules from database`);
        }
      }
    }

    console.log(`\n✅ Completed ${target.table}: ${stats.capsulesDeleted} capsules deleted`);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    stats.errors.push(`Fatal error: ${errorMsg}`);
    console.error(`❌ Fatal error processing ${target.table}:`, error);
  }

  return stats;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const dryRun = Deno.env.get('DRY_RUN') === 'true';

  console.log('\n' + '='.repeat(80));
  console.log('🗑️  TRASH CLEANUP STARTED');
  console.log('='.repeat(80));
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`🔧 Mode: ${dryRun ? 'DRY RUN (simulation only)' : 'PRODUCTION (real deletion)'}`);
  console.log(`📊 Targets: ${TARGETS.length}`);
  console.log(`🛡️  Safety limit: ${SAFETY_LIMIT} records per target`);

  // Handle GET request (health check / manual trigger)
  if (req.method === 'GET') {
    const message = dryRun 
      ? '🧪 DRY RUN mode - Set DRY_RUN=false for production'
      : '✅ Production mode - Will permanently delete data';

    return new Response(
      JSON.stringify({
        status: 'ready',
        mode: dryRun ? 'dry-run' : 'production',
        message,
        targets: TARGETS.map(t => ({
          table: t.table,
          retentionDays: t.retentionDays,
          batchSize: t.batchSize,
        })),
        safetyLimit: SAFETY_LIMIT,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Initialize Supabase client with service role (full access)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Process each target
    const allStats: CleanupStats[] = [];

    for (const target of TARGETS) {
      const stats = await processTarget(supabase, target, dryRun);
      allStats.push(stats);
    }

    // Calculate totals
    const totals = {
      capsulesFound: allStats.reduce((sum, s) => sum + s.capsulesFound, 0),
      capsulesDeleted: allStats.reduce((sum, s) => sum + s.capsulesDeleted, 0),
      mediaFilesDeleted: allStats.reduce((sum, s) => sum + s.mediaFilesDeleted, 0),
      mediaDeleteErrors: allStats.reduce((sum, s) => sum + s.mediaDeleteErrors, 0),
      batches: allStats.reduce((sum, s) => sum + s.batches, 0),
      errors: allStats.flatMap(s => s.errors),
      warnings: allStats.flatMap(s => s.warnings),
      skipped: allStats.reduce((sum, s) => sum + (s.skipped || 0), 0),
    };

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(80));
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📦 Capsules found: ${totals.capsulesFound}`);
    console.log(`🗑️  Capsules deleted: ${totals.capsulesDeleted}`);
    console.log(`📁 Media files deleted: ${totals.mediaFilesDeleted}`);
    if (totals.mediaDeleteErrors > 0) {
      console.log(`⚠️  Media errors: ${totals.mediaDeleteErrors}`);
    }
    if (totals.skipped > 0) {
      console.log(`⏭️  Skipped (safety limit): ${totals.skipped}`);
    }
    console.log(`🔄 Batches processed: ${totals.batches}`);
    if (totals.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${totals.warnings.length}`);
    }
    if (totals.errors.length > 0) {
      console.log(`❌ Errors: ${totals.errors.length}`);
    }
    console.log('='.repeat(80) + '\n');

    const hasErrors = totals.errors.length > 0;
    const status = hasErrors ? 'completed_with_errors' : 'success';

    return new Response(
      JSON.stringify({
        status,
        dryRun,
        summary: {
          duration: `${duration}s`,
          capsulesFound: totals.capsulesFound,
          capsulesDeleted: totals.capsulesDeleted,
          mediaFilesDeleted: totals.mediaFilesDeleted,
          mediaDeleteErrors: totals.mediaDeleteErrors,
          skipped: totals.skipped,
          batches: totals.batches,
          warnings: totals.warnings,
          errors: totals.errors,
        },
        targets: allStats,
        completedAt: new Date().toISOString(),
        message: dryRun 
          ? '🧪 DRY RUN completed - no data was deleted'
          : '✅ Cleanup completed successfully',
      }),
      {
        status: hasErrors ? 500 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    console.error('='.repeat(80) + '\n');

    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'Fatal error during cleanup',
        details: error instanceof Error ? error.message : 'Unknown error',
        dryRun,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
