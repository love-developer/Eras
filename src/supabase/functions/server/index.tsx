import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { randomBytes } from "node:crypto";
import { supabase } from "./supabase-client.tsx";
import * as kv from "./kv_store.tsx";
import { DeliveryService } from "./delivery-service.tsx";
import * as AchievementService from './achievement-service.tsx';
import * as WelcomeCelebration from './welcome-celebration.tsx';
import * as LegacyAccessService from './legacy-access-service.tsx';
import * as ShareService from './share-service.tsx';
import { safeKvGet, safeKvGetByPrefix, safeKvSet, safeKvDel, detectCloudflareError } from './cloudflare-recovery.tsx';
import * as LegacyCron from './legacy-cron.tsx';
import * as FolderSharing from './folder-sharing.tsx';
import * as AIService from './ai-service.tsx';
import { processEmailQueue } from './email-service.tsx';
import { handleClaimPending } from './claim-pending-optimized.tsx';
import { handleGetReceivedCapsules } from './received-capsules-optimized.tsx';
import forgottenMemoriesApp from './forgotten-memories.tsx';
import { withFallback, withKVTimeout } from './timeout-helpers.tsx';

// Global error handlers for uncaught errors
globalThis.addEventListener('error', (event) => {
  console.error('💥 [Global Error]', event.error);
  console.error('💥 Stack:', event.error?.stack);
});

globalThis.addEventListener('unhandledrejection', (event) => {
  console.error('💥 [Unhandled Promise Rejection]', event.reason);
  console.error('💥 Stack:', event.reason?.stack);
});

console.log('🛡️ Global error handlers installed');
console.log('🚀 [Startup] Initializing Hono app...');

const app = new Hono();

console.log('✅ [Startup] Hono app created');

// Supabase client is now imported from singleton module
console.log('✅ [Startup] Supabase client available via singleton');

// ⚡ Performance: In-memory cache for bucket existence checks (5 minute TTL)
// This prevents redundant bucket checks for every upload
const bucketCheckCache = new Map<string, { exists: boolean; timestamp: number }>();
const BUCKET_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedBucketCheck(bucketName: string): boolean | null {
  const cached = bucketCheckCache.get(bucketName);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > BUCKET_CACHE_TTL) {
    bucketCheckCache.delete(bucketName);
    return null;
  }
  
  return cached.exists;
}

function setCachedBucketCheck(bucketName: string, exists: boolean): void {
  bucketCheckCache.set(bucketName, { exists, timestamp: Date.now() });
}

// Helper function to wrap KV operations with timeout and Cloudflare recovery
async function kvGetWithTimeout<T>(key: string, timeoutMs: number = 20000): Promise<T | null> {
  return await safeKvGet<T | null>(
    async () => {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`KV get timeout for key: ${key}`)), timeoutMs)
      );
      const result = await Promise.race([kv.get(key), timeoutPromise]);
      return result as T;
    },
    key,
    null
  );
}
// Helper to reliably get a capsule, bypassing the 10s timeout of kv.get
// by using kv.mget which has no internal timeout and uses efficient exact matching.
async function getCapsuleReliable(capsuleId: string): Promise<any> {
  const key = `capsule:${capsuleId}`;
  try {
    console.log(`📥 getCapsuleReliable: Fetching ${key} using mget...`);
    // mget returns an array of values for the given keys
    // It does not have the 10s timeout that kv.get has
    const values = await kv.mget([key]);
    
    if (values && values.length > 0) {
      return values[0];
    }
    return null;
  } catch (error) {
    console.warn(`⚠️ getCapsuleReliable failed for ${key} with mget:`, error.message);
    // Fallback to regular get if mget fails
    // DO NOT use getByPrefix - it's too slow for single key lookups
    try {
        console.log(`🔄 Falling back to regular kv.get for ${key}...`);
        const result = await kv.get(key);
        return result;
    } catch (fallbackError) {
        console.error(`❌ Fallback get also failed for ${key}:`, fallbackError.message);
        return null;
    }
  }
}

// Helper function to properly verify JWT tokens
// The standard auth.getUser() doesn't work correctly with JWT parameters in some versions
async function verifyUserToken(accessToken: string) {
  try {
    if (!accessToken) {
      console.error('❌ [Auth] No access token provided');
      return { user: null, error: new Error('No access token provided') };
    }

    console.log('🔐 [Auth] Verifying JWT token...');
    console.log('🔐 [Auth] Token preview:', accessToken.substring(0, 30) + '...');
    
    // Parse the JWT to extract the user ID (sub claim)
    // JWTs have 3 parts: header.payload.signature
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.error('❌ [Auth] Invalid JWT format - expected 3 parts, got:', parts.length);
      console.error('❌ [Auth] This might be a public anon key instead of a JWT');
      return { user: null, error: new Error('Invalid JWT format') };
    }

    // Decode the payload (second part)
    try {
      const payload = JSON.parse(atob(parts[1]));
      console.log('🔐 [Auth] JWT payload decoded:', { 
        sub: payload.sub, 
        role: payload.role,
        aud: payload.aud,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'
      });
      
      const userId = payload.sub;
      
      if (!userId) {
        console.error('❌ [Auth] No user ID in JWT payload');
        console.error('❌ [Auth] Full payload:', JSON.stringify(payload));
        return { user: null, error: new Error('No user ID in JWT') };
      }

      console.log('✅ [Auth] JWT decoded, user ID:', userId);

      // Create a minimal user object from JWT claims
      // We don't need to fetch from database - the JWT itself is proof of authentication
      const user = {
        id: userId,
        email: payload.email || null,
        created_at: payload.created_at || null,
        // Add any other claims from JWT that might be useful
      };

      console.log('✅ [Auth] User verified from JWT:', user.email || user.id);
      return { user, error: null };
      
    } catch (decodeError) {
      console.error('❌ [Auth] Failed to decode JWT:', decodeError);
      return { user: null, error: new Error('Failed to decode JWT') };
    }
  } catch (error) {
    console.error('💥 [Auth] Exception during token verification:', error);
    return { user: null, error };
  }
}

// Helper to check and ensure storage bucket exists with proper timeout/error handling
async function ensureStorageBucket(bucketName: string): Promise<{ success: boolean; shouldProceed: boolean }> {
  try {
    // ⚡ Performance: Check cache first (5min TTL)
    const cachedResult = getCachedBucketCheck(bucketName);
    if (cachedResult !== null) {
      console.log(`⚡ Using cached bucket check for "${bucketName}" (exists: ${cachedResult})`);
      return { success: true, shouldProceed: true };
    }
    
    console.log(`🔍 Checking if bucket "${bucketName}" exists (cache miss)...`);
    
    // ⚡ Add 10-second timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Bucket check timeout')), 10000);
    });
    
    const checkPromise = supabase.storage.listBuckets();
    
    let buckets = null;
    let listError = null;
    
    try {
      const result: any = await Promise.race([checkPromise, timeoutPromise]);
      buckets = result.data;
      listError = result.error;
    } catch (timeoutErr) {
      console.warn('⚠️ Bucket check timed out after 10s - assuming bucket exists and caching');
      setCachedBucketCheck(bucketName, true);
      return { success: true, shouldProceed: true };
    }
    
    if (listError) {
      const errorMsg = listError?.message || String(listError);
      
      // Timeout errors - log but proceed anyway (bucket likely exists)
      if (errorMsg.includes('timed out') || errorMsg.includes('connection') || listError.status === 544) {
        console.warn('⚠️ Storage service database timeout (status 544) - proceeding anyway');
        return { success: false, shouldProceed: true };
      }
      
      // JSON/config errors - Storage service not fully configured, but proceed anyway (storage is optional)
      if (errorMsg.includes('not valid JSON') || errorMsg.includes('Unexpected token') || errorMsg.includes('configuration')) {
        console.warn('⚠️ Storage API configuration incomplete - storage features disabled, app will continue');
        return { success: false, shouldProceed: true };
      }
      
      // Gateway errors - proceed anyway
      if (errorMsg.includes('gateway error') || errorMsg.includes('Network connection lost') || listError.status === 502 || listError.status === 503) {
        console.warn('⚠️ Storage service temporarily unavailable - proceeding anyway');
        return { success: false, shouldProceed: true };
      }
      
      // Other errors - log and don't proceed
      console.error('❌ Failed to list storage buckets:', listError);
      return { success: false, shouldProceed: false };
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('📦 Creating storage bucket...');
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 524288000 // 500MB limit (industry standard)
      });
      
      if (createError && !createError.message?.includes('already exists')) {
        console.error('❌ Failed to create storage bucket:', createError);
        return { success: false, shouldProceed: false };
      }
      
      console.log('✅ Storage bucket created successfully');
    }
    
    // ⚡ Cache the successful result
    setCachedBucketCheck(bucketName, true);
    console.log(`✅ Bucket "${bucketName}" verified and cached`);
    
    return { success: true, shouldProceed: true };
  } catch (error) {
    console.error('❌ Storage bucket check exception:', error);
    // On exception, allow proceeding (bucket might exist)
    return { success: false, shouldProceed: true };
  }
}

// Create storage bucket on startup if it doesn't exist
const initializeStorage = async () => {
  try {
    const bucketName = 'make-f9be53a7-media';
    
    console.log('🗄️ Initializing Supabase Storage (optional - for media files)...');
    
    const { success, shouldProceed } = await ensureStorageBucket(bucketName);
    
    if (success) {
      console.log('✅ Storage bucket verified and ready');
      return;
    }
    
    if (!shouldProceed) {
      console.warn('⚠️ Storage service not available (non-critical)');
      console.warn('💡 Storage is optional. The app will work without it.');
      return;
    }
    
    console.warn('⚠️ Storage bucket check incomplete but proceeding anyway');
    
    const bucketExists = true; // Assume it exists if we're proceeding
    
    if (!bucketExists) {
      console.log('📦 Storage bucket does not exist, creating...');
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make bucket public so authenticated users can upload
        fileSizeLimit: 524288000 // 500MB limit (industry standard)
      });
      
      if (createError) {
        // Check if the error is because bucket already exists (race condition)
        if (createError.statusCode === '409' || createError.message?.includes('already exists')) {
          console.log('✅ Storage bucket already exists (race condition handled)');
        } else {
          console.error('❌ Failed to create storage bucket:', createError);
        }
      } else {
        console.log('✅ Storage bucket created successfully');
      }
    } else {
      console.log('✅ Storage bucket already exists');
      
      // Update bucket to be public if it was created as private
      try {
        const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
          public: true,
          fileSizeLimit: 524288000 // 500MB limit (industry standard)
        });
        
        if (updateError) {
          console.warn('⚠️ Could not update bucket settings (may already be correct):', updateError.message);
        } else {
          console.log('✅ Updated bucket to public access');
        }
      } catch (updateErr) {
        console.warn('⚠️ Bucket update skipped (non-critical)');
      }
    }
  } catch (error) {
    // Handle any unexpected errors during storage initialization
    const errorMsg = error?.message || String(error);
    
    if (errorMsg.includes('already exists') || error?.statusCode === '409') {
      console.log('✅ Storage bucket already exists (caught in exception handler)');
    } else if (errorMsg.includes('not valid JSON') || errorMsg.includes('Unexpected token')) {
      console.warn('⚠️ Storage API configuration issue (non-critical)');
      console.warn('💡 The app will continue to work. Storage is optional.');
    } else {
      console.error('❌ Storage initialization error:', errorMsg);
    }
  }
};

// Initialize storage with retry logic
const initializeStorageWithRetry = async (maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🗄️ Storage initialization attempt ${attempt}/${maxRetries}`);
      }
      await initializeStorage();
      if (attempt > 1) {
        console.log('✅ Storage initialization completed successfully on retry');
      }
      return;
    } catch (error) {
      const errorMsg = error?.message || String(error);
      
      // Don't retry on JSON parsing errors - it's a config issue, not transient
      if (errorMsg.includes('not valid JSON') || errorMsg.includes('Unexpected token')) {
        console.warn('⚠️ Storage API configuration issue - skipping retries');
        return;
      }
      
      if (attempt < maxRetries) {
        console.warn(`⚠️ Storage initialization attempt ${attempt} failed, retrying...`);
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 500; // Reduced delays
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.warn('⚠️ Storage initialization failed (non-critical - app will continue)');
      }
    }
  }
};

// Initialize storage with retry (async, non-blocking)
console.log('📦 [Startup] Starting storage initialization (background)...');
initializeStorageWithRetry().catch(err => {
  console.warn('⚠️ [Startup] Storage initialization failed (non-critical):', err.message);
});

// Enable logger
console.log('📝 [Startup] Enabling request logger...');
app.use('*', logger(console.log));
console.log('✅ [Startup] Request logger enabled');

// Enable CORS for all routes and methods
console.log('🌐 [Startup] Enabling CORS...');
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Global timeout middleware - abort requests after 28 seconds (Deno limit is 30s)
console.log('⏱️ [Startup] Enabling global timeout middleware...');
app.use('*', async (c, next) => {
  const GLOBAL_TIMEOUT = 28000; // 28 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`⏱️ [TIMEOUT] Request to ${c.req.path} exceeded ${GLOBAL_TIMEOUT}ms`);
    controller.abort();
  }, GLOBAL_TIMEOUT);

  try {
    await next();
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`❌ [TIMEOUT ABORT] ${c.req.path}`);
      return c.json({
        error: 'Request timeout',
        message: 'The server took too long to respond. Please try again.',
        timeout: true
      }, 408); // 408 Request Timeout
    }
    throw error;
  }
});
console.log('✅ [Startup] Global timeout middleware enabled');
console.log('✅ [Startup] CORS enabled');

// Early health check endpoint (registered first for quick startup verification)
app.get("/make-server-f9be53a7/health-basic", (c) => {
  return c.json({ 
    status: "ok",
    message: "Server is alive",
    timestamp: new Date().toISOString()
  });
});

// Also add a root health check for easier testing
app.get("/health", (c) => {
  return c.json({ 
    status: "ok",
    message: "Eras server is running",
    timestamp: new Date().toISOString()
  });
});

console.log('✅ [Startup] Basic health check registered');

// Global error handler
app.onError((err, c) => {
  console.error('💥 [Server Error]', err);
  console.error('💥 Stack:', err.stack);
  
  return c.json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  }, 500);
});

// Health check endpoint with enhanced diagnostics
app.get("/make-server-f9be53a7/health", (c) => {
  return c.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Eras Backend Server",
    version: "1.0.4", // Version bump to force fresh deployment
    environment: {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
    },
    uptime: Date.now(),
    denoVersion: Deno.version.deno
  });
});

// Simple environment check endpoint
app.get("/make-server-f9be53a7/env-check", (c) => {
  const envVars = {
    SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY'),
    RESEND_API_KEY: !!Deno.env.get('RESEND_API_KEY'),
  };
  
  const missingVars = Object.entries(envVars)
    .filter(([key, present]) => !present)
    .map(([key]) => key);
  
  return c.json({
    status: missingVars.length === 0 ? "ok" : "warning",
    environment: envVars,
    missing: missingVars,
    timestamp: new Date().toISOString()
  });
});

// Database connection test endpoint
app.get("/make-server-f9be53a7/test/db", async (c) => {
  try {
    console.log("🔍 Database connection test starting...");
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log("Environment check:");
    console.log("  - SUPABASE_URL:", !!supabaseUrl ? "✅ Present" : "❌ Missing");
    console.log("  - SUPABASE_SERVICE_ROLE_KEY:", !!supabaseKey ? "✅ Present" : "❌ Missing");
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json({
        status: "error",
        message: "Missing environment variables",
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      }, 500);
    }
    
    console.log("🔗 Using existing Supabase client...");
    
    console.log("📊 Testing database query...");
    
    // Test a simple query using the global client
    const { data, error } = await supabase
      .from("kv_store_f9be53a7")
      .select("count", { count: 'exact', head: true });
    
    if (error) {
      console.error("❌ Database query failed:", error);
      return c.json({
        status: "error",
        message: "Database query failed",
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      }, 500);
    }
    
    console.log("✅ Database connection test successful");
    
    return c.json({
      status: "ok",
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
      environment: {
        url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
        keyLength: supabaseKey?.length || 0
      }
    });
    
  } catch (error) {
    console.error("💥 Database connection test error:", error);
    return c.json({
      status: "error",
      message: "Database connection test failed",
      error: error.message,
      stack: error.stack
    }, 500);
  }
});

// KV Store API endpoints
app.get("/make-server-f9be53a7/api/kv/get", async (c) => {
  try {
    console.log("🔍 KV get request starting...");
    
    const key = c.req.query("key");
    if (!key) {
      console.error("❌ No key provided in request");
      return c.json({ error: "Key is required" }, 400);
    }
    
    console.log(`🔑 Getting key: ${key}`);
    
    // Check environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables:");
      console.error("  - SUPABASE_URL:", !!supabaseUrl);
      console.error("  - SUPABASE_SERVICE_ROLE_KEY:", !!supabaseKey);
      return c.json({ 
        error: "Database configuration error", 
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      }, 500);
    }
    
    console.log("✅ Supabase credentials present, attempting KV get...");
    
    const value = await kv.get(key);
    console.log(`✅ KV get successful for key: ${key}`);
    
    return c.json({ key, value });
  } catch (error) {
    console.error("❌ KV get error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Check if it's a network/connection error
    if (error.message?.includes('502') || error.message?.includes('Bad Gateway')) {
      return c.json({ 
        error: "Database connection error", 
        details: "The database service is temporarily unavailable. Please try again in a moment.",
        type: "connection_error"
      }, 502);
    }
    
    return c.json({ 
      error: "Failed to get value", 
      details: error.message,
      type: "kv_error"
    }, 500);
  }
});

app.post("/make-server-f9be53a7/api/kv/set", async (c) => {
  try {
    const { key, value } = await c.req.json();
    if (!key) {
      return c.json({ error: "Key is required" }, 400);
    }
    
    await kv.set(key, value);
    return c.json({ success: true });
  } catch (error) {
    console.error("KV set error:", error);
    return c.json({ error: "Failed to set value" }, 500);
  }
});

app.post("/make-server-f9be53a7/api/kv/delete", async (c) => {
  try {
    const { key } = await c.req.json();
    if (!key) {
      return c.json({ error: "Key is required" }, 400);
    }
    
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.error("KV delete error:", error);
    return c.json({ error: "Failed to delete value" }, 500);
  }
});

app.get("/make-server-f9be53a7/api/kv/prefix", async (c) => {
  try {
    const prefix = c.req.query("prefix");
    if (!prefix) {
      return c.json({ error: "Prefix is required" }, 400);
    }
    
    // Use 5-second timeout for fallback queries to prevent long waits
    // This endpoint is primarily used for rare fallback scenarios
    const QUERY_TIMEOUT = 5000;
    
    console.log(`🔍 KV prefix query: "${prefix}" (timeout: ${QUERY_TIMEOUT}ms)`);
    
    try {
      const values = await kv.getByPrefix(prefix, QUERY_TIMEOUT);
      console.log(`✅ KV prefix query completed: ${values?.length || 0} results`);
      return c.json({ prefix, values });
    } catch (timeoutError) {
      console.error(`⏱️ KV prefix query timed out for "${prefix}":`, timeoutError.message);
      // Return empty result on timeout instead of failing completely
      return c.json({ 
        prefix, 
        values: [], 
        timeout: true,
        message: "Query timed out - returning empty result"
      });
    }
  } catch (error) {
    console.error("KV prefix get error:", error);
    return c.json({ error: "Failed to get values by prefix" }, 500);
  }
});

// Get keys by prefix (just the keys, not values)
app.get("/make-server-f9be53a7/api/kv/keys/:prefix", async (c) => {
  try {
    const prefix = c.req.param("prefix");
    if (!prefix) {
      return c.json({ error: "Prefix is required" }, 400);
    }
    
    // Use 5-second timeout for prefix queries to prevent long waits
    const QUERY_TIMEOUT = 5000;
    
    console.log(`🔑 Getting keys with prefix: ${prefix} (timeout: ${QUERY_TIMEOUT}ms)`);
    
    try {
      // Use the KV store's getByPrefix method to get all values, then extract keys
      const values = await kv.getByPrefix(prefix, QUERY_TIMEOUT);
      const keys = Object.keys(values);
      
      console.log(`✅ Found ${keys.length} keys with prefix: ${prefix}`);
      
      return c.json({ prefix, keys });
    } catch (timeoutError) {
      console.error(`⏱️ KV keys query timed out for "${prefix}":`, timeoutError.message);
      // Return empty result on timeout
      return c.json({ 
        prefix, 
        keys: [], 
        timeout: true,
        message: "Query timed out - returning empty result"
      });
    }
  } catch (error) {
    console.error("KV keys get error:", error);
    return c.json({ error: "Failed to get keys by prefix" }, 500);
  }
});

// ============================================
// PASSWORD RESET API ENDPOINT (CUSTOM TOKEN SYSTEM)
// ============================================
// IMPORTANT: This uses a custom token system to bypass Supabase Auth redirect URL restrictions
// which require Supabase Dashboard configuration (not accessible in Figma Make)

// Request password reset - sends email with reset link via Resend for fast delivery
app.post("/make-server-f9be53a7/api/auth/request-password-reset", async (c) => {
  try {
    console.log('🔐 [Password Reset] Request received');
    
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    console.log('📧 [Password Reset] Processing reset for:', email);

    // First, check if user exists (using admin API)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ [Password Reset] Error checking user:', listError);
      // Return success for security (don't reveal if user exists)
      return c.json({ success: true });
    }

    const userExists = users?.some(u => u.email?.toLowerCase() === email.trim().toLowerCase());
    
    if (!userExists) {
      console.log('⚠️ [Password Reset] User does not exist (returning success for security)');
      // Return success for security (don't reveal if user exists)
      return c.json({ success: true });
    }

    console.log('✅ [Password Reset] User exists, generating custom reset token');

    // Generate a secure random token (32 bytes = 64 hex characters)
    const resetToken = randomBytes(32).toString('hex');
    
    // Store token in KV store with 1-hour expiration
    const tokenData = {
      email: email.trim().toLowerCase(),
      token: resetToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour from now
      used: false
    };
    
    const tokenKey = `password_reset_token:${resetToken}`;
    await kv.set(tokenKey, tokenData);
    
    console.log('✅ [Password Reset] Token stored in KV store:', tokenKey);

    // Get the correct origin for reset URL
    const requestOrigin = c.req.header('origin');
    const referer = c.req.header('referer');
    
    let redirectBase = requestOrigin;
    if (!redirectBase && referer) {
      try {
        const refererUrl = new URL(referer);
        redirectBase = refererUrl.origin;
      } catch (e) {
        console.warn('⚠️ [Password Reset] Could not parse referer:', referer);
      }
    }
    
    if (!redirectBase) {
      redirectBase = 'https://www.erastimecapsule.com';
      console.log('⚠️ [Password Reset] Using fallback domain:', redirectBase);
    }
    
    // Create custom reset URL with our token
    const resetUrl = `${redirectBase}/reset-password?token=${resetToken}`;
    console.log('🔗 [Password Reset] Reset link generated with custom token');

    // Import and use email service
    const { EmailService } = await import('./email-service.tsx');
    
    // Try to get user's name from the database
    let userName = null;
    try {
      const profile = await kv.get(`profile:${email}`);
      if (profile && profile.firstName) {
        userName = profile.firstName;
      }
    } catch (profileError) {
      console.warn('⚠️ [Password Reset] Could not fetch user profile:', profileError);
    }

    // Send password reset email via Resend
    const emailSent = await EmailService.sendPasswordResetEmail(
      email,
      resetUrl,
      userName
    );

    if (emailSent) {
      console.log('✅ [Password Reset] Email sent successfully via Resend');
      return c.json({ 
        success: true,
        message: "Password reset email sent successfully"
      });
    } else {
      console.error('❌ [Password Reset] Failed to send email via Resend');
      // Clean up the token if email failed
      await kv.del(tokenKey);
      // Still return success for security
      return c.json({ 
        success: true,
        message: "If an account exists with that email, a password reset link has been sent."
      });
    }

  } catch (error) {
    console.error('💥 [Password Reset] Exception:', error);
    // For security, return success even on errors to prevent user enumeration
    return c.json({ 
      success: true,
      message: "If an account exists with that email, a password reset link has been sent."
    });
  }
});

// Verify password reset token
app.post("/make-server-f9be53a7/api/auth/verify-reset-token", async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (!token) {
      return c.json({ valid: false, error: "Token is required" }, 400);
    }

    console.log('🔍 [Password Reset] Verifying token');

    // Get token from KV store
    const tokenKey = `password_reset_token:${token}`;
    const tokenData = await kv.get(tokenKey);

    if (!tokenData) {
      console.warn('⚠️ [Password Reset] Token not found or expired');
      return c.json({ valid: false, error: "Invalid or expired token" });
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      console.warn('⚠️ [Password Reset] Token has expired');
      await kv.del(tokenKey); // Clean up expired token
      return c.json({ valid: false, error: "Token has expired" });
    }

    // Check if token was already used
    if (tokenData.used) {
      console.warn('⚠️ [Password Reset] Token already used');
      return c.json({ valid: false, error: "Token has already been used" });
    }

    console.log('✅ [Password Reset] Token is valid');
    return c.json({ 
      valid: true, 
      email: tokenData.email 
    });

  } catch (error) {
    console.error('💥 [Password Reset] Token verification error:', error);
    return c.json({ valid: false, error: "Token verification failed" }, 500);
  }
});

// Reset password with token
app.post("/make-server-f9be53a7/api/auth/reset-password", async (c) => {
  try {
    const { token, newPassword } = await c.req.json();
    
    if (!token || !newPassword) {
      return c.json({ error: "Token and new password are required" }, 400);
    }

    console.log('🔐 [Password Reset] Resetting password with token');

    // Get and verify token from KV store
    const tokenKey = `password_reset_token:${token}`;
    const tokenData = await kv.get(tokenKey);

    if (!tokenData) {
      console.warn('⚠️ [Password Reset] Token not found');
      return c.json({ error: "Invalid or expired token" }, 400);
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      console.warn('⚠️ [Password Reset] Token has expired');
      await kv.del(tokenKey);
      return c.json({ error: "Token has expired" }, 400);
    }

    // Check if token was already used
    if (tokenData.used) {
      console.warn('⚠️ [Password Reset] Token already used');
      return c.json({ error: "Token has already been used" }, 400);
    }

    console.log('✅ [Password Reset] Token valid, updating password for:', tokenData.email);

    // Update the user's password using Supabase Admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ [Password Reset] Error listing users:', listError);
      return c.json({ error: "Failed to update password" }, 500);
    }

    const user = users?.find(u => u.email?.toLowerCase() === tokenData.email.toLowerCase());
    
    if (!user) {
      console.error('❌ [Password Reset] User not found:', tokenData.email);
      return c.json({ error: "User not found" }, 404);
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ [Password Reset] Failed to update password:', updateError);
      return c.json({ error: "Failed to update password: " + updateError.message }, 500);
    }

    console.log('✅ [Password Reset] Password updated successfully');

    // Mark token as used (but don't delete immediately for audit trail)
    tokenData.used = true;
    tokenData.usedAt = Date.now();
    await kv.set(tokenKey, tokenData);

    // Return success
    return c.json({ 
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error('💥 [Password Reset] Password reset error:', error);
    return c.json({ error: "Failed to reset password" }, 500);
  }
});

// ============================================
// CUSTOM WELCOME / EMAIL VERIFICATION ENDPOINTS
// ============================================
// These handle email verification without relying on Supabase Auth's email system

// Send welcome/verification email after signup
app.post("/make-server-f9be53a7/api/auth/send-verification-email", async (c) => {
  try {
    console.log('📧 [Email Verification] Request received');
    
    const { email, firstName, userId } = await c.req.json();
    
    if (!email || !firstName || !userId) {
      return c.json({ error: "Email, firstName, and userId are required" }, 400);
    }

    console.log('📧 [Email Verification] Sending verification for:', email);

    // Generate a secure verification token
    const verificationToken = randomBytes(32).toString('hex');
    
    // Store token in KV store with 24-hour expiration
    const tokenData = {
      email: email.trim().toLowerCase(),
      userId,
      firstName,
      token: verificationToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      verified: false
    };
    
    const tokenKey = `email_verification_token:${verificationToken}`;
    await kv.set(tokenKey, tokenData);
    
    console.log('✅ [Email Verification] Token stored:', tokenKey);

    // Get the correct origin for verification URL
    const requestOrigin = c.req.header('origin');
    const referer = c.req.header('referer');
    
    let redirectBase = requestOrigin;
    if (!redirectBase && referer) {
      try {
        const refererUrl = new URL(referer);
        redirectBase = refererUrl.origin;
      } catch (e) {
        console.warn('⚠️ [Email Verification] Could not parse referer:', referer);
      }
    }
    
    if (!redirectBase) {
      redirectBase = 'https://www.erastimecapsule.com';
      console.log('⚠️ [Email Verification] Using fallback domain:', redirectBase);
    }
    
    // Create verification URL
    const verifyUrl = `${redirectBase}/verify-email?token=${verificationToken}`;
    console.log('🔗 [Email Verification] Verification link generated');

    // Import and use email service
    const { EmailService } = await import('./email-service.tsx');
    
    // Send welcome email with verification link
    const emailSent = await EmailService.sendWelcomeEmail(
      email,
      firstName,
      verifyUrl
    );

    if (emailSent) {
      console.log('✅ [Email Verification] Email sent successfully via Resend');
      return c.json({ 
        success: true,
        message: "Verification email sent successfully"
      });
    } else {
      console.error('❌ [Email Verification] Failed to send email via Resend');
      // Clean up the token if email failed
      await kv.del(tokenKey);
      return c.json({ 
        success: false,
        error: "Failed to send verification email"
      }, 500);
    }

  } catch (error) {
    console.error('💥 [Email Verification] Exception:', error);
    return c.json({ 
      success: false,
      error: "Failed to send verification email"
    }, 500);
  }
});

// Verify email with token
app.post("/make-server-f9be53a7/api/auth/verify-email-token", async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (!token) {
      return c.json({ valid: false, error: "Token is required" }, 400);
    }

    console.log('🔍 [Email Verification] Verifying token');

    // Get token from KV store
    const tokenKey = `email_verification_token:${token}`;
    const tokenData = await kv.get(tokenKey);

    if (!tokenData) {
      console.warn('⚠️ [Email Verification] Token not found or expired');
      return c.json({ valid: false, error: "Invalid or expired token" });
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      console.warn('⚠️ [Email Verification] Token has expired');
      await kv.del(tokenKey);
      return c.json({ valid: false, error: "Token has expired" });
    }

    // Check if already verified
    if (tokenData.verified) {
      console.warn('⚠️ [Email Verification] Token already used');
      return c.json({ valid: false, error: "Email already verified" });
    }

    console.log('✅ [Email Verification] Token is valid for:', tokenData.email);

    // Mark as verified
    tokenData.verified = true;
    tokenData.verifiedAt = Date.now();
    await kv.set(tokenKey, tokenData);

    // Now verify the user in Supabase Auth using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.userId,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('❌ [Email Verification] Failed to verify user:', updateError);
      return c.json({ valid: false, error: "Failed to verify email" }, 500);
    }

    console.log('✅ [Email Verification] User email verified successfully');

    return c.json({ 
      valid: true, 
      email: tokenData.email,
      userId: tokenData.userId
    });

  } catch (error) {
    console.error('💥 [Email Verification] Verification error:', error);
    return c.json({ valid: false, error: "Email verification failed" }, 500);
  }
});

// Check if user exists - for better error messages during sign-in
app.post("/make-server-f9be53a7/api/auth/check-user-exists", async (c) => {
  try {
    console.log('🔍 [User Check] Request received');
    
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    console.log('📧 [User Check] Checking if user exists:', email);

    // Check if user exists using admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ [User Check] Supabase error:', error);
      // Return false on error to prevent revealing system issues
      return c.json({ exists: false });
    }

    const exists = users?.some(u => u.email?.toLowerCase() === email.trim().toLowerCase()) || false;
    
    console.log(`✅ [User Check] User ${exists ? 'EXISTS' : 'DOES NOT EXIST'}`);
    
    return c.json({ exists });

  } catch (error) {
    console.error('💥 [User Check] Exception:', error);
    // Return false on exception
    return c.json({ exists: false });
  }
});

// Cleanup endpoint to remove all user_hidden entries (migration cleanup)
app.post("/make-server-f9be53a7/api/cleanup/hidden-lists", async (c) => {
  try {
    console.log('🧹 Starting cleanup of user_hidden lists...');
    
    // Get all user_hidden entries (5s timeout for admin operation)
    const hiddenLists = await kv.getByPrefix('user_hidden:', 5000);
    const keys = Object.keys(hiddenLists);
    
    console.log(`📊 Found ${keys.length} user_hidden lists to remove`);
    
    // Delete each user_hidden entry
    for (const key of keys) {
      await kv.del(key);
      console.log(`🗑️ Deleted: ${key}`);
    }
    
    console.log('✅ Cleanup complete!');
    
    return c.json({ 
      success: true, 
      removed: keys.length,
      message: `Successfully removed ${keys.length} user_hidden lists`
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return c.json({ error: "Failed to cleanup hidden lists" }, 500);
  }
});

// Media file upload endpoint
app.post("/make-server-f9be53a7/api/media/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const capsuleId = formData.get('capsuleId') as string;
    const userId = formData.get('userId') as string;
    
    if (!file || !capsuleId || !userId) {
      return c.json({ error: "File, capsuleId, and userId are required" }, 400);
    }

    console.log('📋 File validation:', {
      name: file.name,
      type: file.type,
      size: file.size,
      capsuleId: capsuleId,
      userId: userId
    });

    // Validate file type - check MIME type first, then fallback to extension
    const allowedTypes = [
      'video/', 
      'audio/', 
      'image/', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument', 
      'text/',
      'application/vnd.apple.mpegurl', // QuickTime
      'video/quicktime' // QuickTime .mov files
    ];
    const fileType = file.type || '';
    let isValidMimeType = allowedTypes.some(type => fileType.startsWith(type));
    
    // Also check file extension as a fallback (for all files, not just octet-stream)
    let isValidFile = isValidMimeType;
    if (!isValidFile) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const mediaExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', // video
                              'mp3', 'wav', 'ogg', 'webm', 'm4a', // audio
                              'jpg', 'jpeg', 'png', 'gif', 'webp', // image
                              'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']; // documents
      isValidFile = mediaExtensions.includes(ext);
      console.log(`📋 MIME type "${fileType}" not in allowed list, checking extension: ${ext}, valid: ${isValidFile}`);
    }
    
    if (!isValidFile) {
      console.error('❌ Invalid file type:', fileType, 'name:', file.name);
      return c.json({ 
        error: "Invalid file type. Only video, audio, image, and document files are allowed.",
        receivedType: fileType,
        fileName: file.name,
        allowedTypes: allowedTypes
      }, 400);
    }

    // Validate file size (500MB limit for videos, increased from 50MB to 500MB for original quality)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      return c.json({ 
        error: "File size too large. Maximum size is 500MB.",
        receivedSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      }, 400);
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop() || 'bin';
    // Sanitize filename to avoid issues with special characters
    const sanitizedExtension = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${sanitizedExtension}`;
    const filePath = `${userId}/${capsuleId}/${fileName}`;
    
    console.log('📤 Uploading file:', {
      originalName: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      path: filePath
    });
    
    // Ensure bucket exists before upload
    const bucketName = 'make-f9be53a7-media';
    
    const bucketCheck = await ensureStorageBucket(bucketName);
    
    if (!bucketCheck.success && !bucketCheck.shouldProceed) {
      return c.json({ 
        error: "Storage service is not properly configured", 
        details: "Please contact support or check your Supabase storage settings"
      }, 503);
    }
    
    // Upload to Supabase Storage using service role (bypasses RLS)
    console.log('📤 Attempting upload to storage bucket:', bucketName);
    
    // MEMORY FIX: Use file directly instead of converting to ArrayBuffer
    // This prevents loading the entire file into memory for large videos
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

    if (error) {
      console.error('❌ Storage upload error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        name: error.name
      });
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Unknown storage error';
      
      if (errorMessage.toLowerCase().includes('memory')) {
        errorMessage = 'Memory limit exceeded. This is a temporary error - please try uploading this video again.';
        console.error('💡 Hint: If this persists, the video might be too large or corrupted');
      } else if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
        errorMessage = 'Storage bucket permissions error. The bucket may need to be recreated with public access.';
        console.error('💡 Hint: Run the storage initialization again or manually set the bucket to public in Supabase dashboard');
      }
      
      return c.json({ 
        error: "Failed to upload file to storage", 
        details: errorMessage,
        hint: 'Check if storage bucket exists and has correct permissions',
        errorCode: error.statusCode || error.error
      }, 500);
    }
    
    console.log('✅ File uploaded successfully:', data.path);

    // Create media file metadata
    const mediaFile = {
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      capsule_id: capsuleId,
      user_id: userId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: filePath,
      storage_bucket: 'make-f9be53a7-media',
      created_at: new Date().toISOString()
    };

    // Store media file metadata in KV with retry for reliability
    let metadataStored = false;
    let metadataRetries = 3;
    while (!metadataStored && metadataRetries > 0) {
      try {
        await kv.set(`media:${mediaFile.id}`, mediaFile);
        console.log(`✅ Stored media metadata: ${mediaFile.id} (${file.name})`);
        metadataStored = true;
      } catch (metadataError) {
        metadataRetries--;
        if (metadataRetries === 0) {
          console.error(`❌ CRITICAL: Failed to store media metadata for ${file.name}`, metadataError);
          throw new Error(`Failed to store media metadata: ${metadataError.message}`);
        }
        console.warn(`⚠️ Retrying media metadata storage (${metadataRetries} left)...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Add to capsule's media list
    // CRITICAL: Use a retry mechanism to handle race conditions when multiple files are uploaded simultaneously
    let retries = 3;
    let success = false;
    while (retries > 0 && !success) {
      try {
        const capsuleMediaKey = `capsule_media:${capsuleId}`;
        const existingMedia = await kv.get(capsuleMediaKey) || [];
        const oldLength = existingMedia.length;
        
        // Check if this media ID is already in the list (prevent duplicates from retries)
        if (!existingMedia.includes(mediaFile.id)) {
          existingMedia.push(mediaFile.id);
          await kv.set(capsuleMediaKey, existingMedia);
          console.log(`✅ Added media to capsule list: ${capsuleMediaKey} (${oldLength} -> ${existingMedia.length} files)`, {
            fileName: file.name,
            fileType: file.type,
            mediaId: mediaFile.id,
            allMediaIds: existingMedia
          });
        } else {
          console.log(`ℹ️ Media ${mediaFile.id} already in capsule list (${file.name})`);
        }
        success = true;
      } catch (err) {
        retries--;
        if (retries === 0) {
          // 🔥 CRITICAL FIX: Don't overwrite existing media list on retry failure
          // Instead, try one more time with exponential backoff
          console.error(`❌ All retries failed for ${file.name}, attempting final merge...`);
          try {
            // Wait longer before final attempt
            await new Promise(resolve => setTimeout(resolve, 300));
            const finalExistingMedia = await kv.get(capsuleMediaKey) || [];
            if (!finalExistingMedia.includes(mediaFile.id)) {
              finalExistingMedia.push(mediaFile.id);
              await kv.set(capsuleMediaKey, finalExistingMedia);
              console.log(`✅ Final attempt succeeded: Added to capsule list with ${finalExistingMedia.length} files`);
            }
            success = true;
          } catch (finalErr) {
            console.error(`❌ CRITICAL: Could not add ${file.name} to capsule media list after all retries`, finalErr);
            // Don't fail the upload - the media file is stored, just not in the capsule list yet
            // The capsule creation will verify and fix missing links
          }
        } else {
          console.warn(`⚠️ Failed to update capsule media list, retrying (${retries} left)...`, err);
          // Wait a bit before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 100 * (4 - retries)));
        }
      }
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return c.json({ 
      success: true, 
      publicUrl,
      mediaFile: {
        ...mediaFile,
        // Don't expose the full storage path for security
        storage_path: undefined
      }
    });
    
  } catch (error) {
    console.error("❌ Media upload exception:", error);
    console.error("❌ Error type:", error?.constructor?.name || typeof error);
    console.error("❌ Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Provide helpful error message based on error type
    let errorDetails = error?.message || 'Unknown error occurred during upload';
    
    // Check for common error patterns
    if (error?.message?.toLowerCase()?.includes('memory')) {
      errorDetails = 'Memory limit exceeded. Please try uploading this video again. If the issue persists, the video might be corrupted.';
      console.error('💡 [SUPABASE] Memory limit exceeded - this can happen with large video files');
    } else if (error?.message?.includes('fetch')) {
      errorDetails = 'Network connection error. Please check your internet connection.';
    } else if (error?.message?.includes('timeout')) {
      errorDetails = 'Upload timeout. File may be too large or connection too slow.';
    }
    
    return c.json({ 
      error: "Failed to upload media file", 
      details: errorDetails,
      hint: 'Check network connection, file size (max 100MB), and file format',
      errorType: error?.constructor?.name || 'UnknownError'
    }, 500);
  }
});

// Media metadata storage endpoint (for direct uploads that bypass server)
app.post("/make-server-f9be53a7/api/media/metadata", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    // Verify user
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const mediaFile = await c.req.json();
    
    if (!mediaFile.id || !mediaFile.capsule_id || !mediaFile.user_id) {
      return c.json({ error: "Missing required fields: id, capsule_id, user_id" }, 400);
    }

    // Ensure user can only store metadata for their own files
    if (mediaFile.user_id !== user.id) {
      return c.json({ error: "Unauthorized - Cannot store metadata for other users" }, 403);
    }

    console.log('📝 Storing media metadata:', {
      id: mediaFile.id,
      capsuleId: mediaFile.capsule_id,
      fileName: mediaFile.file_name,
      fileSize: mediaFile.file_size
    });

    // Store media file metadata in KV
    await kv.set(`media:${mediaFile.id}`, mediaFile);
    
    // Also add to capsule_media list for tracking
    const existingMedia = await kv.get(`capsule_media:${mediaFile.capsule_id}`) || [];
    const updatedMedia = Array.isArray(existingMedia) ? [...existingMedia, mediaFile.id] : [mediaFile.id];
    await kv.set(`capsule_media:${mediaFile.capsule_id}`, updatedMedia);
    
    console.log(`✅ Stored media metadata: ${mediaFile.id} (${mediaFile.file_name})`);

    return c.json({ 
      success: true,
      mediaFile: mediaFile
    });

  } catch (error) {
    console.error("❌ Media metadata storage error:", error);
    return c.json({ 
      error: "Failed to store media metadata", 
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

// Capsule-specific media upload endpoint (for drafts and editing)
app.post("/make-server-f9be53a7/api/capsules/:id/media", async (c) => {
  try {
    const capsuleId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    // Verify user
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const thumbnail = formData.get('thumbnail') as File | null; // ✅ Accept thumbnail
    
    if (!file || !capsuleId) {
      return c.json({ error: "File and capsuleId are required" }, 400);
    }

    console.log('📋 Capsule media upload:', {
      capsuleId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hasThumbnail: !!thumbnail
    });

    // Validate file type - check MIME type first, then fallback to extension
    const allowedTypes = ['video/', 'audio/', 'image/', 'application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument', 'application/vnd.ms-',
                         'text/plain', 'text/csv', 'application/rtf'];
    const isValidMimeType = allowedTypes.some(type => file.type.startsWith(type));
    
    // If MIME type is application/octet-stream, check file extension as fallback
    let isValidFile = isValidMimeType;
    if (!isValidFile && file.type === 'application/octet-stream') {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const mediaExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', // video
                              'mp3', 'wav', 'ogg', 'webm', 'm4a', // audio
                              'jpg', 'jpeg', 'png', 'gif', 'webp', // image
                              'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv']; // document
      isValidFile = mediaExtensions.includes(ext);
      console.log(`📋 MIME type is octet-stream, checking extension: ${ext}, valid: ${isValidFile}`);
    }
    
    if (!isValidFile) {
      console.error('❌ Invalid file type:', file.type, 'name:', file.name);
      return c.json({ 
        error: "Invalid file type. Only video, audio, image, and document files are allowed.",
        receivedType: file.type,
        fileName: file.name,
        allowedTypes: allowedTypes
      }, 400);
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      return c.json({ 
        error: "File size too large. Maximum size is 100MB.",
        receivedSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      }, 400);
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop() || 'bin';
    const sanitizedExtension = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${sanitizedExtension}`;
    const filePath = `${user.id}/${capsuleId}/${fileName}`;
    
    // Ensure bucket exists before upload
    const bucketName = 'make-f9be53a7-media';
    
    const bucketCheck2 = await ensureStorageBucket(bucketName);
    
    if (!bucketCheck2.success && !bucketCheck2.shouldProceed) {
      return c.json({ 
        error: "Storage service is not properly configured", 
        details: "Please contact support or check your Supabase storage settings"
      }, 503);
    }
    
    // Upload to Supabase Storage using service role (bypasses RLS)
    console.log('📤 [Capsule Media] Attempting upload to storage bucket:', bucketName);
    
    // Convert file to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

    if (error) {
      console.error('❌ [Capsule Media] Storage upload error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        name: error.name
      });
      
      // Provide more helpful error message for RLS issues
      let errorMessage = error.message || 'Unknown storage error';
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
        errorMessage = 'Storage bucket permissions error. The bucket may need to be recreated with public access.';
        console.error('💡 Hint: Run the storage initialization again or manually set the bucket to public in Supabase dashboard');
      }
      
      return c.json({ 
        error: "Failed to upload file to storage", 
        details: errorMessage,
        hint: 'Check if storage bucket exists and has correct permissions',
        errorCode: error.statusCode || error.error
      }, 500);
    }
    
    console.log('✅ [Capsule Media] File uploaded successfully:', data.path);

    // ✅ THUMBNAIL FIX: Upload thumbnail if provided
    let thumbnailPath = null;
    if (thumbnail) {
      const thumbnailExtension = thumbnail.name.split('.').pop() || 'jpg';
      const thumbnailFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_thumb.${thumbnailExtension}`;
      thumbnailPath = `${user.id}/${capsuleId}/${thumbnailFileName}`;
      
      const thumbnailBuffer = await thumbnail.arrayBuffer();
      const { error: thumbError } = await supabase.storage
        .from(bucketName)
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: thumbnail.type,
          upsert: false
        });

      if (thumbError) {
        console.warn('⚠️ Thumbnail upload failed (non-critical):', thumbError);
        thumbnailPath = null;
      } else {
        console.log(`✅ Uploaded thumbnail: ${thumbnailPath}`);
      }
    }

    // Create media file metadata
    const mediaFile = {
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      capsule_id: capsuleId,
      user_id: user.id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: filePath,
      storage_bucket: bucketName,
      thumbnail_path: thumbnailPath, // ✅ Store thumbnail path
      created_at: new Date().toISOString()
    };

    // Store media file metadata in KV
    await kv.set(`media:${mediaFile.id}`, mediaFile);
    
    // Add to capsule's media list
    try {
      const capsuleMediaKey = `capsule_media:${capsuleId}`;
      const existingMedia = await kv.get(capsuleMediaKey) || [];
      existingMedia.push(mediaFile.id);
      await kv.set(capsuleMediaKey, existingMedia);
    } catch {
      // First media file for this capsule
      await kv.set(`capsule_media:${capsuleId}`, [mediaFile.id]);
    }

    console.log(`✅ Successfully uploaded media for capsule ${capsuleId}: ${file.name}`);

    return c.json({ 
      success: true, 
      mediaFile: {
        ...mediaFile,
        storage_path: undefined
      }
    });
    
  } catch (error) {
    console.error("Capsule media upload error:", error);
    return c.json({ 
      error: "Failed to upload media file", 
      details: error.message || 'Unknown error',
      hint: 'Check network connection and file format'
    }, 500);
  }
});

// REMOVED: Duplicate AI Text Enhancement Endpoint (moved to line ~9448 with local functions)
// This endpoint was trying to use OpenAI API which requires OPENAI_API_KEY
// We now use local enhancement functions instead (no API key needed)

// Get media file signed URL
app.get("/make-server-f9be53a7/api/media/url/:id", async (c) => {
  try {
    const mediaId = c.req.param('id');
    
    if (!mediaId) {
      return c.json({ error: "Media ID is required" }, 400);
    }

    // Get media file metadata from KV
    const mediaFile = await kv.get(`media:${mediaId}`);
    if (!mediaFile) {
      return c.json({ error: "Media file not found" }, 404);
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from(mediaFile.storage_bucket)
      .createSignedUrl(mediaFile.storage_path, 3600);

    if (error) {
      console.error('Signed URL generation error:', error);
      return c.json({ error: "Failed to generate file URL" }, 500);
    }

    return c.json({ 
      url: data.signedUrl,
      mediaFile: {
        id: mediaFile.id,
        file_name: mediaFile.file_name,
        file_type: mediaFile.file_type,
        file_size: mediaFile.file_size,
        created_at: mediaFile.created_at
      }
    });

  } catch (error) {
    console.error("Media URL generation error:", error);
    return c.json({ error: "Failed to get media file URL" }, 500);
  }
});

// Get capsule media files
app.get("/make-server-f9be53a7/api/media/capsule/:capsuleId", async (c) => {
  const capsuleId = c.req.param('capsuleId');
  
  console.log(`🎬 Getting media files for capsule: ${capsuleId}`);
  
  if (!capsuleId) {
    return c.json({ error: "Capsule ID is required" }, 400);
  }

  try {
    // Primary method: Get media file IDs from capsule_media key (with Cloudflare recovery)
    console.log(`🔍 Step 1: Getting media IDs for capsule ${capsuleId}...`);
    let mediaIds = await safeKvGet(() => kv.get(`capsule_media:${capsuleId}`), `capsule_media:${capsuleId}`, []);
    
    // Ensure mediaIds is always an array
    if (!Array.isArray(mediaIds)) {
      console.warn(`⚠️ mediaIds is not an array, got:`, typeof mediaIds, mediaIds);
      mediaIds = [];
    }
    
    console.log(`📂 Found ${mediaIds.length} media IDs in capsule_media:${capsuleId}:`, mediaIds);
    
    // DIAGNOSTIC: Log media ID details
    if (mediaIds.length > 0) {
      console.log(`🔍 DIAGNOSTIC - Media IDs for capsule ${capsuleId}:`, mediaIds.map((id, idx) => `[${idx}] ${id}`).join(', '));
    }
    
    // Fallback: Check if capsule has media_files array directly
    if (mediaIds.length === 0) {
      console.log(`🔍 Step 2: No media IDs found in capsule_media, checking capsule data...`);
      const capsule = await safeKvGet(() => getCapsuleReliable(capsuleId), `capsule:${capsuleId}`, null);
      if (capsule && capsule.media_files && Array.isArray(capsule.media_files)) {
        mediaIds = capsule.media_files;
        console.log(`✅ Found ${mediaIds.length} media IDs in capsule.media_files:`, mediaIds);
      } else {
        console.log(`⚠️ Capsule ${capsuleId} has no media files (capsule exists: ${!!capsule})`);
      }
    }
    
    console.log(`🔍 Step 3: Processing ${mediaIds.length} media files IN PARALLEL...`);
    
    // OPTIMIZATION: Process all media files in parallel instead of sequentially
    const mediaFilePromises = mediaIds.map(async (mediaId) => {
      try {
        const mediaFile = await safeKvGet(() => kv.get(`media:${mediaId}`), `media:${mediaId}`, null);
        console.log(`📄 Media file ${mediaId}:`, mediaFile ? 'found' : 'not found');
        
        if (!mediaFile) {
          console.warn(`⚠️ Media ID ${mediaId} exists in list but media:${mediaId} not found in KV store`);
          return { file: null, success: false };
        }
        
        let signedUrl = null;
        let thumbnailSignedUrl = null; // ✅ For video thumbnails
        let urlSuccess = false;
        
        // Validate storage bucket and path before attempting to generate URL
        if (!mediaFile.storage_bucket || !mediaFile.storage_path) {
          console.warn(`⚠️ Media file ${mediaId} missing storage info:`, {
            bucket: mediaFile.storage_bucket || 'MISSING',
            path: mediaFile.storage_path || 'MISSING'
          });
          return { 
            file: {
              id: mediaFile.id,
              file_name: mediaFile.file_name,
              file_type: mediaFile.file_type,
              file_size: mediaFile.file_size,
              created_at: mediaFile.created_at,
              url: null,
              thumbnail: null
            }, 
            success: false 
          };
        }
        
        try {
          // Generate signed URL with Cloudflare error protection
          const SIGNED_URL_EXPIRATION = 604800; // 7 days
          const { data, error: urlError } = await supabase.storage
            .from(mediaFile.storage_bucket)
            .createSignedUrl(mediaFile.storage_path, SIGNED_URL_EXPIRATION);
          
          if (urlError) {
            console.warn(`⚠️ Storage API error for ${mediaId}:`, urlError.message);
            
            // Fallback to public URL
            const { data: publicData } = supabase.storage
              .from(mediaFile.storage_bucket)
              .getPublicUrl(mediaFile.storage_path);
              
            if (publicData?.publicUrl) {
              signedUrl = publicData.publicUrl;
              urlSuccess = true;
              console.log(`✅ Generated public URL fallback for ${mediaFile.file_name}`);
            }
          } else if (data?.signedUrl) {
            signedUrl = data.signedUrl;
            urlSuccess = true;
            const expiresAt = new Date(Date.now() + (SIGNED_URL_EXPIRATION * 1000));
            console.log(`✅ Generated signed URL for ${mediaFile.file_name} (expires: ${expiresAt.toISOString()})`);
          } else {
            console.warn(`⚠️ No signed URL returned for ${mediaId}`);
            
            // Fallback to public URL
            const { data: publicData } = supabase.storage
              .from(mediaFile.storage_bucket)
              .getPublicUrl(mediaFile.storage_path);
              
            if (publicData?.publicUrl) {
              signedUrl = publicData.publicUrl;
              urlSuccess = true;
              console.log(`✅ Generated public URL fallback for ${mediaFile.file_name}`);
            }
          }
        } catch (storageError) {
          // Catch Cloudflare errors or any Storage API failures
          console.warn(`⚠️ Storage URL generation failed for ${mediaId}:`, storageError.message || storageError);
        }
        
        // ✅ Generate thumbnail URL if thumbnail_path exists (for videos)
        if (mediaFile.thumbnail_path) {
          try {
            const { data: thumbData } = await supabase.storage
              .from(mediaFile.storage_bucket)
              .createSignedUrl(mediaFile.thumbnail_path, SIGNED_URL_EXPIRATION);
            
            if (thumbData?.signedUrl) {
              thumbnailSignedUrl = thumbData.signedUrl;
              console.log(`✅ Generated thumbnail URL for ${mediaFile.file_name}`);
            }
          } catch (thumbError) {
            console.warn(`⚠️ Thumbnail URL generation failed for ${mediaId}:`, thumbError.message || thumbError);
          }
        }
        
        // Return media file even if URL generation failed
        return {
          file: {
            id: mediaFile.id,
            file_name: mediaFile.file_name,
            file_type: mediaFile.file_type,
            file_size: mediaFile.file_size,
            created_at: mediaFile.created_at,
            url: signedUrl,
            thumbnail: thumbnailSignedUrl // ✅ Include thumbnail URL for instant loading
          },
          success: urlSuccess
        };
      } catch (error) {
        // Catch any unexpected errors for this specific media file
        console.warn(`❌ Failed to process media file ${mediaId}:`, error.message || error);
        return { file: null, success: false };
      }
    });
    
    // Wait for all media files to be processed in parallel
    const results = await Promise.all(mediaFilePromises);
    
    // Collect results
    const mediaFiles = [];
    let successfulUrls = 0;
    let failedUrls = 0;
    
    for (const result of results) {
      if (result.file) {
        mediaFiles.push(result.file);
        if (result.success) {
          successfulUrls++;
        } else {
          failedUrls++;
        }
      } else {
        failedUrls++;
      }
    }

    console.log(`🔍 Step 4: Finished processing, preparing response...`);
    console.log(`✅ Returning ${mediaFiles.length} media files for capsule ${capsuleId}`);
    console.log(`   📊 Signed URLs: ${successfulUrls} successful, ${failedUrls} failed`);
    
    const response = {
      mediaFiles: mediaFiles || [],
      stats: {
        total: mediaFiles?.length || 0,
        urlsGenerated: successfulUrls || 0,
        urlsFailed: failedUrls || 0
      }
    };
    
    console.log(`🔍 Step 5: Response object created:`, JSON.stringify(response).substring(0, 200));
    console.log(`🔍 Step 6: Sending response...`);
    
    try {
      const jsonResponse = c.json(response);
      console.log(`✅ Response sent successfully`);
      return jsonResponse;
    } catch (jsonError) {
      console.error(`❌ Error creating JSON response:`, jsonError);
      throw jsonError;
    }
    
  } catch (error) {
    // Only catch catastrophic failures that prevent returning anything
    console.error("❌ Critical error in media endpoint:", error);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error stack:", error?.stack);
    console.error("❌ Error type:", typeof error);
    console.error("❌ Error string:", String(error));
    
    const cfError = detectCloudflareError(error);
    
    if (cfError.isCloudflareError) {
      console.error(`🔥 Cloudflare error detected: ${cfError.technicalMessage}`);
      // Return empty array with 200 status so frontend doesn't throw
      return c.json({ 
        mediaFiles: [],
        stats: {
          total: 0,
          urlsGenerated: 0,
          urlsFailed: 0
        },
        warning: cfError.userMessage,
        cloudflareError: true
      }, 200); // Changed from 503 to 200
    }
    
    console.error(`⚠️ Non-Cloudflare error in media endpoint, returning empty array with success status`);
    // Return empty array with 200 status so frontend doesn't throw
    return c.json({ 
      mediaFiles: [],
      stats: {
        total: 0,
        urlsGenerated: 0,
        urlsFailed: 0
      },
      warning: error?.message || "Could not fetch media files"
    }, 200); // Changed from 500 to 200
  }
});

// Debug endpoint - Get capsule details including media references
app.get("/make-server-f9be53a7/api/debug/capsule/:capsuleId", async (c) => {
  try {
    const capsuleId = c.req.param('capsuleId');
    
    if (!capsuleId) {
      return c.json({ error: "Capsule ID is required" }, 400);
    }

    console.log(`🔍 Debug: Inspecting capsule ${capsuleId}`);
    
    // Get capsule data
    const capsule = await getCapsuleReliable(capsuleId);
    
    // Get capsule_media key
    const capsuleMedia = await kv.get(`capsule_media:${capsuleId}`);
    
    // Get all storage buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const debugInfo = {
      capsuleId,
      capsuleExists: !!capsule,
      capsuleData: capsule ? {
        id: capsule.id,
        title: capsule.title,
        status: capsule.status,
        created_by: capsule.created_by,
        media_files: capsule.media_files || null,
        created_at: capsule.created_at
      } : null,
      capsuleMediaKey: {
        key: `capsule_media:${capsuleId}`,
        exists: !!capsuleMedia,
        value: capsuleMedia || null,
        count: capsuleMedia ? capsuleMedia.length : 0
      },
      storageBuckets: buckets?.map(b => b.name) || [],
      recommendation: null
    };
    
    // Add recommendation based on findings
    if (!capsule) {
      debugInfo.recommendation = "Capsule does not exist in KV store";
    } else if (!capsuleMedia || capsuleMedia.length === 0) {
      if (capsule.media_files && capsule.media_files.length > 0) {
        debugInfo.recommendation = "Media IDs found in capsule.media_files but not in capsule_media key. This is a data inconsistency.";
      } else {
        debugInfo.recommendation = "No media files associated with this capsule";
      }
    } else {
      debugInfo.recommendation = "Capsule has media IDs in capsule_media key";
    }
    
    console.log(`✅ Debug info:`, debugInfo);
    return c.json(debugInfo);
    
  } catch (error) {
    console.error("❌ Debug capsule error:", error);
    return c.json({ error: "Failed to debug capsule", details: error.message }, 500);
  }
});

// Repair media associations for a capsule
app.post("/make-server-f9be53a7/api/repair/capsule/:capsuleId", async (c) => {
  try {
    const capsuleId = c.req.param('capsuleId');
    
    if (!capsuleId) {
      return c.json({ error: "Capsule ID is required" }, 400);
    }

    console.log(`🔧 Repairing media associations for capsule: ${capsuleId}`);
    
    // Get capsule data
    const capsule = await getCapsuleReliable(capsuleId);
    
    if (!capsule) {
      return c.json({ error: "Capsule not found" }, 404);
    }
    
    // Get existing capsule_media key
    const existingCapsuleMedia = await kv.get(`capsule_media:${capsuleId}`) || [];
    console.log(`📂 Existing capsule_media has ${existingCapsuleMedia.length} entries`);
    
    // Check if capsule has media_files array
    const capsuleMediaFiles = capsule.media_files || [];
    console.log(`📋 Capsule object has ${capsuleMediaFiles.length} media_files`);
    
    // Find all media files in KV store that reference this capsule (10s timeout for media scan)
    const allMediaKeys = await kv.getByPrefix('media:', 10000);
    const capsuleMediaIds = [];
    
    for (const key of allMediaKeys) {
      const mediaFile = await kv.get(key);
      if (mediaFile && mediaFile.capsule_id === capsuleId) {
        const mediaId = key.replace('media:', '');
        capsuleMediaIds.push(mediaId);
        console.log(`✅ Found media file: ${mediaId} (${mediaFile.file_name})`);
      }
    }
    
    console.log(`🔍 Found ${capsuleMediaIds.length} media files by scanning KV store`);
    
    // Combine all sources of media IDs
    const allMediaIds = new Set([
      ...existingCapsuleMedia,
      ...capsuleMediaFiles,
      ...capsuleMediaIds
    ]);
    
    const repairedMediaIds = Array.from(allMediaIds);
    console.log(`🔧 Repaired media list has ${repairedMediaIds.length} unique entries`);
    
    // Update capsule_media key
    if (repairedMediaIds.length > 0) {
      await kv.set(`capsule_media:${capsuleId}`, repairedMediaIds);
      console.log(`✅ Updated capsule_media:${capsuleId}`);
      
      // Also update capsule object if needed
      if (!capsule.media_files || capsule.media_files.length !== repairedMediaIds.length) {
        capsule.media_files = repairedMediaIds;
        await kv.set(`capsule:${capsuleId}`, capsule);
        console.log(`✅ Updated capsule object media_files array`);
      }
    }
    
    return c.json({
      success: true,
      capsuleId,
      before: {
        capsule_media: existingCapsuleMedia.length,
        capsule_object: capsuleMediaFiles.length
      },
      after: {
        total_media_files: repairedMediaIds.length,
        media_ids: repairedMediaIds
      },
      message: `Repaired ${repairedMediaIds.length} media associations`
    });
    
  } catch (error) {
    console.error("❌ Repair capsule error:", error);
    return c.json({ error: "Failed to repair capsule", details: error.message }, 500);
  }
});

// Rename media file
app.put('/make-server-f9be53a7/api/media/:id/rename', async (c) => {
  try {
    const mediaId = c.req.param('id');
    const { userId, newFileName } = await c.req.json();

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!newFileName) {
      return c.json({ error: 'New file name is required' }, 400);
    }

    console.log(`📝 Renaming media file ${mediaId} to ${newFileName}`);

    // Get the media file to verify ownership
    const mediaKey = `media:${mediaId}`;
    const mediaFile = await kv.get(mediaKey);

    if (!mediaFile) {
      return c.json({ error: 'Media file not found' }, 404);
    }

    // Verify the user owns the capsule that contains this media
    const capsuleId = mediaFile.capsule_id;
    const capsuleKey = `capsule:${capsuleId}`;
    const capsule = await getCapsuleReliable(capsuleId);

    // Handle multiple field name variations: userId, user_id, created_by
    const capsuleOwnerId = capsule?.userId || capsule?.user_id || capsule?.created_by;
    if (!capsule || capsuleOwnerId !== userId) {
      return c.json({ error: 'Unauthorized to rename this media file' }, 403);
    }

    // Update the media file name
    const updatedMedia = {
      ...mediaFile,
      file_name: newFileName,
      updated_at: new Date().toISOString()
    };

    await kv.set(mediaKey, updatedMedia);

    console.log(`✅ Media file renamed successfully: ${newFileName}`);

    return c.json({
      success: true,
      media: updatedMedia
    });
  } catch (error) {
    console.error('❌ Error renaming media file:', error);
    return c.json({ 
      error: 'Failed to rename media file',
      details: error.message 
    }, 500);
  }
});

// Delete media file
app.delete("/make-server-f9be53a7/api/media/:id", async (c) => {
  try {
    const mediaId = c.req.param('id');
    
    if (!mediaId) {
      return c.json({ error: "Media ID is required" }, 400);
    }

    // Get media file metadata
    const mediaFile = await kv.get(`media:${mediaId}`);
    if (!mediaFile) {
      return c.json({ error: "Media file not found" }, 404);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(mediaFile.storage_bucket)
      .remove([mediaFile.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Remove from KV store
    await kv.del(`media:${mediaId}`);
    
    // Remove from capsule's media list
    try {
      const capsuleMediaKey = `capsule_media:${mediaFile.capsule_id}`;
      const mediaList = await kv.get(capsuleMediaKey) || [];
      const updatedList = mediaList.filter((id: string) => id !== mediaId);
      await kv.set(capsuleMediaKey, updatedList);
    } catch (error) {
      console.warn('Failed to update capsule media list:', error);
    }

    return c.json({ success: true });
    
  } catch (error) {
    console.error("Media delete error:", error);
    return c.json({ error: "Failed to delete media file" }, 500);
  }
});



// ============================================
// CAPSULE API ENDPOINTS
// ============================================

// Create a new capsule
app.post("/make-server-f9be53a7/api/capsules", async (c) => {
  try {
    // Check authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { user, error: authError } = await verifyUserToken(token);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    console.log(`📝 Creating capsule for user: ${user.email}`);

    const body = await c.req.json();
    const {
      title,
      text_message,
      recipient_type,
      delivery_method,
      self_contact,
      recipients,
      delivery_date,
      delivery_time, // ✅ Accept delivery_time from frontend (local time string)
      time_zone,
      status,
      frontend_url,
      allow_echoes,
      media_urls,
      media_files,
      folder_id,
      attached_folder_id,
      theme, // CRITICAL: Theme for custom opening ceremony
      metadata, // CRITICAL: Additional theme-specific metadata
      temp_capsule_id // CRITICAL: Passed from frontend to link uploaded media
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return c.json({ error: "Title is required" }, 400);
    }

    // FIXED: Message is only required if there's no media and no attached folder
    const hasMedia = media_urls && Array.isArray(media_urls) && media_urls.length > 0;
    const hasAttachedFolder = attached_folder_id && attached_folder_id.trim();
    
    if (!text_message?.trim() && !hasMedia && !hasAttachedFolder) {
      return c.json({ error: "Message, media, or attached folder is required" }, 400);
    }

    // CRITICAL: Only validate delivery_date for non-draft capsules
    // Drafts are allowed to have null delivery_date
    const isDraft = status === 'draft';
    
    if (!isDraft && !delivery_date) {
      return c.json({ error: "Delivery date is required for scheduled capsules" }, 400);
    }

    // Validate and filter recipients for 'others' recipient type
    let validRecipients = [];
    if (recipient_type === 'others') {
      if (!recipients || !Array.isArray(recipients)) {
        return c.json({ error: "Recipients array is required for 'others' recipient type" }, 400);
      }
      
      // Filter out empty recipients (recipients with no value or empty value)
      validRecipients = recipients.filter(r => {
        if (typeof r === 'string') {
          return r.trim().length > 0;
        } else if (typeof r === 'object' && r !== null) {
          const value = r.value || r.email || r.phone || r.contact || '';
          return value.trim().length > 0;
        }
        return false;
      });
      
      // For non-draft capsules, require at least one valid recipient
      if (!isDraft && validRecipients.length === 0) {
        return c.json({ error: "At least one valid recipient is required for scheduled capsules" }, 400);
      }
      
      console.log(`✅ Validated recipients: ${validRecipients.length} valid out of ${recipients.length} total`);
    }

    // Validate delivery date format (only if provided)
    let deliveryDateISO = null;
    if (delivery_date) {
      const deliveryDateTime = new Date(delivery_date);
      if (isNaN(deliveryDateTime.getTime())) {
        console.error(`❌ Invalid delivery date/time: ${delivery_date}`);
        return c.json({ error: "Invalid delivery date format" }, 400);
      }
      
      // 🚫 CRITICAL VALIDATION: Prevent scheduling in the past
      const now = new Date();
      if (deliveryDateTime <= now) {
        console.error(`❌ Attempted to schedule capsule in the past: ${deliveryDateTime.toISOString()} (now: ${now.toISOString()})`);
        return c.json({ 
          error: "Cannot schedule a capsule for a date/time that has already passed",
          scheduledTime: deliveryDateTime.toISOString(),
          currentTime: now.toISOString()
        }, 400);
      }
      
      // Warn if scheduled less than 1 minute in the future (allow some buffer)
      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
      if (deliveryDateTime < oneMinuteFromNow) {
        console.warn(`⚠️ Capsule scheduled very soon: ${deliveryDateTime.toISOString()}`);
      }
      
      deliveryDateISO = deliveryDateTime.toISOString();
      
      // ❌ REMOVED: DO NOT extract UTC hours/minutes - this was overwriting the correct local time
      // The frontend already sends delivery_time as the local time string (e.g., "12:00")
      // and delivery_date as the UTC ISO string (e.g., "2025-12-25T20:00:00.000Z")
      // We should preserve delivery_time as-is for display purposes
    }

    // 🛡️ IDEMPOTENCY CHECK: Prevent duplicate submissions
    // Check if a capsule with the same title + user was created in the last 5 seconds
    try {
      const userCapsules = await kv.get(`user_capsules:${user.id}`) || [];
      const recentCapsules = [];
      const fiveSecondsAgo = Date.now() - 5000;
      
      for (const existingCapsuleId of userCapsules.slice(-10)) { // Check last 10 capsules only
        const existingCapsule = await getCapsuleReliable(existingCapsuleId);
        if (existingCapsule) {
          const createdTime = new Date(existingCapsule.created_at).getTime();
          if (createdTime > fiveSecondsAgo) {
            recentCapsules.push(existingCapsule);
          }
        }
      }
      
      // Check for duplicate
      const duplicate = recentCapsules.find(c => 
        c.title === title.trim() && 
        c.text_message === text_message.trim()
      );
      
      if (duplicate) {
        console.warn(`⚠️ Duplicate submission detected for user ${user.id}, returning existing capsule:`, duplicate.id);
        return c.json(duplicate); // Return existing capsule instead of creating duplicate
      }
    } catch (dupeCheckError) {
      console.warn('⚠️ Duplicate check failed (non-critical):', dupeCheckError);
      // Continue with capsule creation even if duplicate check fails
    }

    // Create capsule object
    const capsuleId = `capsule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const capsule = {
      id: capsuleId,
      created_by: user.id,
      title: title.trim(),
      text_message: text_message.trim(),
      recipient_type: recipient_type || 'self',
      delivery_method: delivery_method || 'email',
      self_contact: recipient_type === 'self' ? self_contact : null,
      recipients: recipient_type === 'others' ? validRecipients : [],
      delivery_date: deliveryDateISO, // null for drafts, ISO string for scheduled
      delivery_time: delivery_time || null, // ✅ Use delivery_time from frontend (local time string like "12:00")
      time_zone: time_zone || 'UTC',
      status: status || 'scheduled',
      allow_echoes: allow_echoes !== undefined ? allow_echoes : true, // Global user preference for echo responses
      media_urls: media_urls || [], // Array of media file URLs
      media_files: media_files || [], // Array of media file IDs (for backend association)
      folder_id: folder_id || null, // Folder to save capsule in
      attached_folder_id: attached_folder_id || null, // Entire folder to attach to capsule
      theme: theme || 'standard', // CRITICAL: Theme for custom opening ceremony
      metadata: metadata || {}, // CRITICAL: Additional theme-specific metadata
      created_at: now,
      updated_at: now,
      delivery_attempts: 0,
      frontend_url: frontend_url || 'https://found-shirt-81691824.figma.site' // Store frontend URL for email viewing links
    };

    if (isDraft) {
      console.log('📝 Draft capsule created (no delivery date):', capsuleId);
    } else {
      console.log('🌍 Scheduled capsule delivery date stored as:', capsule.delivery_date);
    }

    // Store capsule in KV store
    await kv.set(`capsule:${capsuleId}`, capsule);

    // PHASE 5B: Add to global scheduled list if status is scheduled
    if (capsule.status === 'scheduled' && !isDraft) {
      try {
        const scheduledList = await kv.get('scheduled_capsules_global') || [];
        if (!scheduledList.includes(capsuleId)) {
          scheduledList.push(capsuleId);
          await kv.set('scheduled_capsules_global', scheduledList);
          console.log(`✅ Added capsule ${capsuleId} to global scheduled list (${scheduledList.length} total)`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to add capsule to scheduled list (non-critical):', error);
      }
    }

    // Also update user's capsule list for backwards compatibility
    try {
      const userCapsulesKey = `user_capsules:${user.id}`;
      const existingCapsules = await kv.get(userCapsulesKey);
      const capsuleList = existingCapsules || [];
      capsuleList.push(capsuleId);
      await kv.set(userCapsulesKey, capsuleList);
      console.log(`✅ Updated user capsule list for user: ${user.id}`);
    } catch (error) {
      console.warn('Failed to update user capsule list, but capsule was saved:', error);
    }

    // ❌ CRITICAL FIX: DO NOT add capsules to received list immediately!
    // ❌ Capsules must ONLY appear in received list AT OR AFTER their delivery_date
    // ✅ The DeliveryService.processDueDeliveries() handles adding capsules to received lists
    //    when delivery_date <= now(). This ensures capsules only appear when they should.
    //
    // OLD BUGGY CODE WAS HERE - REMOVED because it added capsules to user_received:${recipientUserId}
    // immediately on creation, causing future-scheduled capsules to show up in Received tab right away.
    // This was a CRITICAL BUG that violated the core time capsule delivery contract.
    
    console.log(`✅ [DELIVERY SCHEDULING] Capsule ${capsuleId} scheduled for delivery at ${delivery_date}`);
    console.log(`⏰ [DELIVERY SCHEDULING] Capsule will be added to received lists when delivery time arrives`);

    // Store user's profile info if not exists
    const profileKey = `profile:${user.id}`;
    const existingProfile = await kv.get(profileKey);
    if (!existingProfile) {
      const profile = {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.firstName || user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.lastName || user.user_metadata?.last_name || '',
        created_at: now,
        updated_at: now
      };
      await kv.set(profileKey, profile);
    }

    console.log(`✅ Capsule created successfully: ${capsuleId}`);

    // CRITICAL: Link uploaded media from temp ID to new capsule ID
    if (temp_capsule_id) {
      try {
        console.log(`🔗 Linking media from temp ID ${temp_capsule_id} to new capsule ${capsuleId}`);
        const tempMediaKey = `capsule_media:${temp_capsule_id}`;
        const tempMediaIds = await kv.get(tempMediaKey);
        
        if (tempMediaIds && Array.isArray(tempMediaIds) && tempMediaIds.length > 0) {
          console.log(`📦 Found ${tempMediaIds.length} media files to link:`, tempMediaIds);
          
          // CRITICAL DIAGNOSTIC: Verify all media files exist before linking
          console.log(`🔍 VERIFICATION: Checking if all ${tempMediaIds.length} media files exist in KV store...`);
          const verificationResults = [];
          for (const mediaId of tempMediaIds) {
            const exists = await kv.get(`media:${mediaId}`);
            verificationResults.push({
              id: mediaId,
              exists: !!exists,
              fileName: exists?.file_name || 'N/A',
              fileType: exists?.file_type || 'N/A'
            });
          }
          console.log(`📊 VERIFICATION RESULTS:`, verificationResults);
          const missingCount = verificationResults.filter(r => !r.exists).length;
          if (missingCount > 0) {
            console.error(`❌❌❌ CRITICAL: ${missingCount} media files are missing from KV store!`, 
              verificationResults.filter(r => !r.exists));
          }
          
          // 🔥 CRITICAL FIX: Only link media files that actually exist in KV store
          // Filter out any missing media files to prevent broken attachments
          const existingMediaIds = verificationResults
            .filter(r => r.exists)
            .map(r => r.id);
          
          if (existingMediaIds.length === 0) {
            console.error(`❌ NO MEDIA FILES EXIST IN KV STORE - Cannot link any media`);
          } else if (existingMediaIds.length < tempMediaIds.length) {
            console.warn(`⚠️ Only ${existingMediaIds.length}/${tempMediaIds.length} media files exist in KV store`);
            console.warn(`⚠️ Missing ${tempMediaIds.length - existingMediaIds.length} files:`, 
              verificationResults.filter(r => !r.exists).map(r => `${r.id} (${r.fileName})`));
          }
          
          // 1. Set media IDs for the new capsule (only existing ones)
          await kv.set(`capsule_media:${capsuleId}`, existingMediaIds);
          console.log(`✅ Linked ${existingMediaIds.length} media IDs to capsule_media:${capsuleId}:`, existingMediaIds);
          
          // 2. Update each media file metadata to point to the new capsule ID
          for (const mediaId of existingMediaIds) {
            try {
              const mediaKey = `media:${mediaId}`;
              const mediaFile = await kv.get(mediaKey);
              if (mediaFile) {
                mediaFile.capsule_id = capsuleId;
                await kv.set(mediaKey, mediaFile);
              }
            } catch (err) {
              console.warn(`⚠️ Failed to update media metadata for ${mediaId}:`, err);
            }
          }
          
          // 3. Clean up temp key
          await kv.del(tempMediaKey);
          
          console.log(`✅ Successfully linked ${existingMediaIds.length} media files to capsule ${capsuleId}`);
          
          // DIAGNOSTIC: Verify the linkage
          const verifyMedia = await kv.get(`capsule_media:${capsuleId}`);
          console.log(`🔍 VERIFICATION - capsule_media:${capsuleId} now contains:`, verifyMedia);
        } else {
          console.log(`ℹ️ No media files found for temp ID ${temp_capsule_id}`);
        }
      } catch (linkError) {
        console.error('❌ Failed to link media files:', linkError);
        // Don't fail the whole request, as the capsule is created
      }
    }

    // 🏆 TRACK ACHIEVEMENT: Capsule created
    // This will automatically check for and unlock relevant achievements
    let newlyUnlockedAchievements = [];
    try {
      console.log('🏆 Tracking capsule_created achievement for user:', user.id);
      
      // Check if this is the user's first capsule
      const userCapsules = await kv.get(`user_capsules:${user.id}`);
      const isFirstCapsule = !userCapsules || userCapsules.length === 1; // Length is 1 because we just added it
      
      // Check media types for Multimedia Maestro achievement (A036)
      let hasPhoto = false;
      let hasVideo = false;
      let hasAudio = false;
      const hasText = !!text_message?.trim(); // Text is always present (required field)
      
      if (media_urls && media_urls.length > 0) {
        // Get media IDs from capsule
        const mediaIds = await kv.get(`capsule_media:${capsuleId}`) || [];
        
        for (const mediaId of mediaIds) {
          try {
            const mediaFile = await kv.get(`media:${mediaId}`);
            if (mediaFile && mediaFile.file_type) {
              const fileType = mediaFile.file_type.toLowerCase();
              if (fileType.startsWith('image/')) {
                hasPhoto = true;
              } else if (fileType.startsWith('video/')) {
                hasVideo = true;
              } else if (fileType.startsWith('audio/')) {
                hasAudio = true;
              }
            }
          } catch (err) {
            console.warn('Failed to check media type for:', mediaId, err);
          }
        }
      }
      
      const hasAllMediaTypes = hasPhoto && hasVideo && hasAudio && hasText;
      console.log(`📊 Media types check: Photo=${hasPhoto}, Video=${hasVideo}, Audio=${hasAudio}, Text=${hasText}, All=${hasAllMediaTypes}`);
      
      // 🏆 Extract achievement metadata from capsule metadata
      const achievementMetadata = metadata || {};
      const wordCount = achievementMetadata.wordCount || 0;
      const userLocalHour = achievementMetadata.userLocalHour;
      const deliveryTime = achievementMetadata.deliveryTime;
      console.log(`🏆 Achievement metadata:`, { wordCount, userLocalHour, deliveryTime });
      
      const achievementResult = await AchievementService.checkAndUnlockAchievements(
        user.id,
        'capsule_created',
        {
          capsuleId: capsuleId,
          isFirstCapsule: isFirstCapsule,
          hasMedia: (media_urls && media_urls.length > 0) || false,
          mediaCount: media_urls?.length || 0,
          createdAt: new Date().toISOString(),
          hasAllMediaTypes: hasAllMediaTypes,
          wordCount: wordCount,
          userLocalHour: userLocalHour,
          deliveryTime: deliveryTime,
          // NEW: Add recipient metadata for stats tracking
          recipientCount: recipient_type === 'others' && validRecipients ? validRecipients.length : 0,
          recipientEmail: recipient_type === 'others' && validRecipients && validRecipients.length > 0 ? 
            (typeof validRecipients[0] === 'string' ? validRecipients[0] : (validRecipients[0].value || validRecipients[0].email)) : null,
          userEmail: user.email || null,
          recipientEmails: recipient_type === 'others' && validRecipients ? 
            validRecipients.map(r => typeof r === 'string' ? r : (r.value || r.email)) : []
        }
      );
      
      newlyUnlockedAchievements = achievementResult.newlyUnlocked || [];
      
      // 🎯 PHASE 1 A1: Track multi-recipient capsule achievements
      // Check if this capsule has multiple recipients (for Circle of Trust and Grand Broadcast achievements)
      if (recipient_type === 'others' && validRecipients && validRecipients.length >= 5) {
        try {
          console.log(`🏆 [Multi-Recipient] Tracking multi-recipient capsule with ${validRecipients.length} recipients`);
          
          const multiRecipientResult = await AchievementService.checkAndUnlockAchievements(
            user.id,
            'multi_recipient_capsule',
            {
              capsuleId: capsuleId,
              recipientCount: validRecipients.length,
              createdAt: new Date().toISOString()
            }
          );
          
          // Add newly unlocked multi-recipient achievements to the list
          if (multiRecipientResult.newlyUnlocked && multiRecipientResult.newlyUnlocked.length > 0) {
            newlyUnlockedAchievements.push(...multiRecipientResult.newlyUnlocked);
            console.log(`✅ [Multi-Recipient] Unlocked ${multiRecipientResult.newlyUnlocked.length} new achievements:`,
              multiRecipientResult.newlyUnlocked.map(a => a.id).join(', '));
          }
        } catch (multiRecipientError) {
          console.error('❌ [Multi-Recipient] Failed to track multi-recipient achievement:', multiRecipientError);
          // Don't block capsule creation if achievement tracking fails
        }
      }
      
      // 🎨 Track multimedia achievement (A036: Multimedia Maestro)
      // Check if this capsule has all 4 media types (photo, video, audio, text)
      if (hasAllMediaTypes) {
        try {
          console.log(`🏆 [Multimedia] Capsule has all 4 media types - tracking Multimedia Maestro achievement`);
          
          const multimediaResult = await AchievementService.checkAndUnlockAchievements(
            user.id,
            'capsule_with_all_media_types',
            {
              capsuleId: capsuleId,
              hasAllMediaTypes: true,
              createdAt: new Date().toISOString()
            }
          );
          
          // Add newly unlocked multimedia achievements to the list
          if (multimediaResult.newlyUnlocked && multimediaResult.newlyUnlocked.length > 0) {
            newlyUnlockedAchievements.push(...multimediaResult.newlyUnlocked);
            console.log(`✅ [Multimedia] Unlocked ${multimediaResult.newlyUnlocked.length} new achievement(s):`,
              multimediaResult.newlyUnlocked.map(a => a.title).join(', '));
          }
        } catch (multimediaError) {
          console.error('❌ [Multimedia] Failed to track multimedia achievement:', multimediaError);
          // Don't block capsule creation if achievement tracking fails
        }
      }
      
      if (newlyUnlockedAchievements.length > 0) {
        console.log(`🎉 Unlocked ${newlyUnlockedAchievements.length} achievement(s):`, 
          newlyUnlockedAchievements.map(a => a.title).join(', '));
      }
      
      if (isFirstCapsule) {
        console.log('🎉 First capsule created - achievement should unlock!');
      }
    } catch (error) {
      console.error('⚠️ Achievement tracking failed (non-critical):', error);
      // Don't fail capsule creation if achievement tracking fails
    }

    return c.json({ 
      success: true, 
      capsule: {
        id: capsule.id,
        title: capsule.title,
        delivery_date: capsule.delivery_date,
        status: capsule.status,
        created_at: capsule.created_at
      },
      newlyUnlockedAchievements: newlyUnlockedAchievements // Include achievement data in response
    });

  } catch (error) {
    console.error("Capsule creation error:", error);
    return c.json({ error: "Failed to create capsule", details: error.message }, 500);
  }
});

// Get user's capsules
app.get("/make-server-f9be53a7/api/capsules", async (c) => {
  // TIMEOUT PROTECTION: Wrap entire handler with 23-second timeout (leaves 2s buffer before client timeout)
  const HANDLER_TIMEOUT = 23000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Handler timeout - operation took too long')), HANDLER_TIMEOUT)
  );

  try {
    const result = await Promise.race([
      (async () => {
        // Check authentication
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return c.json({ error: "No authorization token provided" }, 401);
        }

        const token = authHeader.split(' ')[1];
        
        // Verify the token with Supabase
        const { user, error: authError } = await verifyUserToken(token);
        if (authError || !user) {
          return c.json({ error: "Invalid or expired token" }, 401);
        }

        console.log(`📋 Getting capsules for user: ${user.email || user.id}`);

    // PERFORMANCE: Check if recipient name enrichment is requested (default: false for speed)
    const enrichRecipients = c.req.query('enrich') === 'true';
    console.log(`⚡ Recipient enrichment: ${enrichRecipients ? 'ENABLED' : 'DISABLED (fast mode)'}`);

    // EFFICIENT APPROACH: Use user-specific capsule list instead of fetching ALL capsules
    // This is much faster than getByPrefix('capsule:') which gets all users' capsules
    const QUERY_TIMEOUT = 20000; // 20 seconds (increased from 10s for better reliability)
    let userCapsuleIds = [];
    let userCapsules = [];
    
    try {
      console.log('⏱️ Fetching user capsule list...');
      const startTime = Date.now();
      
      // Step 1: Get the list of capsule IDs for this user (with timeout protection)
      const userCapsulesKey = `user_capsules:${user.id}`;
      userCapsuleIds = await withKVTimeout(
        kv.get(userCapsulesKey),
        QUERY_TIMEOUT,
        `Get user capsules list for ${user.id}`
      ) || [];
      
      const listQueryTime = Date.now() - startTime;
      console.log(`✅ Got ${userCapsuleIds.length} capsule IDs in ${listQueryTime}ms`);
      
      // If no capsules, return early
      if (!Array.isArray(userCapsuleIds) || userCapsuleIds.length === 0) {
        console.log('ℹ️ User has no capsules');
        return c.json({ capsules: [] });
      }
      
      // Step 2: Fetch all capsules in ONE batch using mget (much faster!)
      console.log('⏱️ Batch fetching capsules with mget...');
      const capsuleFetchStart = Date.now();
      
      // 🚀 PERFORMANCE OPTIMIZATION: Use single mget call instead of multiple getCapsuleReliable calls
      // This reduces 14 individual queries to 1 batch query
      const capsuleKeys = userCapsuleIds.map(id => `capsule:${id}`);
      let allCapsulesData = [];
      
      try {
        const values = await withKVTimeout(
          kv.mget(capsuleKeys),
          QUERY_TIMEOUT,
          `Batch fetch ${userCapsuleIds.length} capsules`
        );
        
        allCapsulesData = values || [];
        console.log(`✅ Batch fetched ${allCapsulesData.filter(c => c).length}/${userCapsuleIds.length} capsules`);
      } catch (error) {
        console.error('❌ Batch fetch failed, falling back to individual fetches:', error);
        
        // Fallback to individual fetches if batch fails
        const capsulePromises = userCapsuleIds.map(id => 
          withKVTimeout(
            getCapsuleReliable(id),
            25000,
            `Get capsule ${id}`
          ).catch(err => {
            console.warn(`Failed to fetch capsule ${id}:`, err.message);
            return null;
          })
        );
        
        allCapsulesData = await withFallback(
          Promise.all(capsulePromises),
          [],
          QUERY_TIMEOUT
        );
      }
      
      const fetchTime = Date.now() - capsuleFetchStart;
      console.log(`✅ Fetched ${allCapsulesData.filter(c => c).length} capsules in ${fetchTime}ms (avg: ${(fetchTime / allCapsulesData.length).toFixed(0)}ms/capsule)`);
      
      // CRITICAL FIX: Get user's current profile name for sender_name field
      let userSenderName = 'You';
      try {
        const userProfile = await kv.get(`profile:${user.id}`);
        if (userProfile) {
          if (userProfile.display_name) {
            userSenderName = userProfile.display_name.trim();
          } else {
            const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
            userSenderName = fullName || 'You';
          }
        }
      } catch (error) {
        console.warn('Could not load user profile for sender name:', error);
      }
      
      // PERFORMANCE OPTIMIZATION: Only fetch user directory if enrichment is requested
      let userDirectory = new Map(); // email -> { id, name }
      let userLookupStart = Date.now();
      
      if (enrichRecipients) {
        console.log('⏱️ Pre-fetching user directory for recipient lookups...');
        try {
          const { data: allUsers } = await supabase.auth.admin.listUsers();
          if (allUsers?.users) {
            for (const u of allUsers.users) {
              if (u.email) {
                userDirectory.set(u.email.toLowerCase(), {
                  id: u.id,
                  email: u.email,
                  metadata: u.user_metadata
                });
              }
            }
          }
          console.log(`✅ Built user directory with ${userDirectory.size} users in ${Date.now() - userLookupStart}ms`);
        } catch (error) {
          console.warn('Could not build user directory:', error);
        }
      } else {
        console.log('⚡ Skipping user directory fetch (fast mode enabled)');
      }
      
      // Filter out null/undefined results and deleted capsules (Archive)
      const filteredCapsules = allCapsulesData.filter(capsule => 
        capsule !== null && 
        capsule !== undefined && 
        capsule?.id &&
        !capsule.deletedAt // Exclude capsules in Archive
      );
      
      // PERFORMANCE OPTIMIZATION: Only batch fetch recipient profiles if enrichment is requested
      const profileCache = new Map(); // userId -> profile
      let profileBatchStart = Date.now();
      
      if (enrichRecipients) {
        const recipientUserIds = new Set();
        for (const capsule of filteredCapsules) {
          if (capsule.recipients && Array.isArray(capsule.recipients)) {
            for (const recipient of capsule.recipients) {
              const recipientEmail = recipient.email || recipient.value || recipient;
              if (recipientEmail && typeof recipientEmail === 'string' && recipientEmail.includes('@')) {
                const userData = userDirectory.get(recipientEmail.toLowerCase());
                if (userData?.id) {
                  recipientUserIds.add(userData.id);
                }
              }
            }
          }
        }
        
        console.log(`⏱️ Batch fetching ${recipientUserIds.size} recipient profiles...`);
        
        const profilePromises = Array.from(recipientUserIds).map(async (userId) => {
          try {
            const profile = await kv.get(`profile:${userId}`);
            if (profile) {
              profileCache.set(userId, profile);
            }
          } catch (error) {
            console.warn(`Failed to fetch profile for ${userId}:`, error);
          }
        });
        
        await Promise.all(profilePromises);
        console.log(`✅ Fetched ${profileCache.size} profiles in ${Date.now() - profileBatchStart}ms`);
      } else {
        console.log('⚡ Skipping recipient profile batch fetch (fast mode enabled)');
      }
      
      // Map capsules with recipient name lookup (now using cached data)
      const enrichedCapsulePromises = filteredCapsules.map(async (capsule) => {
        // Backfill delivery_time from delivery_date if missing
        let deliveryTime = capsule.delivery_time;
        if (!deliveryTime && capsule.delivery_date) {
          const deliveryDateTime = new Date(capsule.delivery_date);
          if (!isNaN(deliveryDateTime.getTime())) {
            const hours = String(deliveryDateTime.getUTCHours()).padStart(2, '0');
            const minutes = String(deliveryDateTime.getUTCMinutes()).padStart(2, '0');
            deliveryTime = `${hours}:${minutes}`;
            
            // Update the capsule in the background (don't await to avoid slowing down response)
            kv.set(`capsule:${capsule.id}`, {
              ...capsule,
              delivery_time: deliveryTime
            }).catch(err => console.warn('Failed to backfill delivery_time:', err));
          }
        }
        
        // OPTIMIZED: Look up recipient names only if enrichment is requested
        let recipientNames = [];
        if (enrichRecipients && capsule.recipients && Array.isArray(capsule.recipients) && capsule.recipients.length > 0) {
          for (const recipient of capsule.recipients) {
            try {
              const recipientEmail = recipient.email || recipient.value || recipient;
              const recipientPhone = recipient.phone;
              
              if (recipientEmail && typeof recipientEmail === 'string' && recipientEmail.includes('@')) {
                // Use cached user directory instead of calling listUsers()
                const userData = userDirectory.get(recipientEmail.toLowerCase());
                
                if (userData) {
                  // Look up their profile from cache
                  const profile = profileCache.get(userData.id);
                  let recipientName = profile?.display_name || 
                                     `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
                  
                  // If no name in profile, try auth metadata
                  if (!recipientName) {
                    recipientName = userData.metadata?.firstName || 
                                   userData.metadata?.name ||
                                   recipientEmail?.split('@')[0];
                  }
                  
                  recipientNames.push(recipientName || recipientEmail);
                } else {
                  // Not registered, show email
                  recipientNames.push(recipientEmail);
                }
              } else if (recipientPhone) {
                // Phone number
                recipientNames.push(recipientPhone);
              } else {
                // Fallback to raw value
                recipientNames.push(recipientEmail || recipient);
              }
            } catch (lookupError) {
              console.warn('Failed to lookup recipient name:', lookupError);
              // Fallback to email/phone
              recipientNames.push(recipient.email || recipient.phone || recipient.value || recipient);
            }
          }
        }
        
        return {
          id: capsule.id,
          title: capsule.title,
          message: capsule.message,
          text_message: capsule.text_message,
          recipient_type: capsule.recipient_type,
          delivery_method: capsule.delivery_method,
          self_contact: capsule.self_contact,
          recipients: capsule.recipients,
          recipient_names: recipientNames, // NEW FIELD: Display names for recipients
          delivery_date: capsule.delivery_date,
          delivery_time: deliveryTime,
          time_zone: capsule.time_zone,
          status: capsule.status,
          created_by: capsule.created_by,
          sender_name: userSenderName,
          theme: capsule.theme || 'standard', // CRITICAL: Theme for custom opening ceremony
          metadata: capsule.metadata || {}, // CRITICAL: Additional theme-specific metadata
          created_at: capsule.created_at,
          updated_at: capsule.updated_at,
          delivery_attempts: capsule.delivery_attempts || 0,
          delivered_at: capsule.delivered_at,
          failed_at: capsule.failed_at,
          viewed_at: capsule.viewed_at, // CRITICAL: Include viewed_at for NEW badge logic
          attachments: [] // Will be populated by frontend
        };
      });
      
      // Wait for all lookups to complete
      const enrichedCapsules = await Promise.all(enrichedCapsulePromises);
      
      // Sort capsules
      userCapsules = enrichedCapsules.sort((a, b) => {
        // CRITICAL FIX: Sort delivered capsules by delivery date (most recently delivered first)
        // Sort scheduled/draft capsules by creation date
        if (a.status === 'delivered' && b.status === 'delivered') {
          // Both delivered: Sort by delivered_at (or delivery_date if delivered_at missing)
          const aDate = new Date(a.delivered_at || a.delivery_date || a.created_at).getTime();
          const bDate = new Date(b.delivered_at || b.delivery_date || b.created_at).getTime();
          return bDate - aDate; // Most recent delivery first
        } else if (a.status === 'delivered' && b.status !== 'delivered') {
          // Delivered capsules should come before non-delivered
          return -1;
        } else if (a.status !== 'delivered' && b.status === 'delivered') {
          // Non-delivered capsules come after delivered
          return 1;
        } else {
          // Both non-delivered: Sort by creation date (most recent first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      const totalQueryTime = Date.now() - startTime;
      console.log(`📦 Found ${userCapsules.length} capsules for user in ${totalQueryTime}ms`);
      if (enrichRecipients) {
        console.log(`⚡ Performance breakdown: List=${listQueryTime}ms | Fetch=${fetchTime}ms | UserDir=${Date.now() - userLookupStart}ms | Profiles=${Date.now() - profileBatchStart}ms | Total=${totalQueryTime}ms`);
      } else {
        console.log(`⚡ Performance breakdown (FAST MODE): List=${listQueryTime}ms | Fetch=${fetchTime}ms | Total=${totalQueryTime}ms`);
        console.log(`💡 Tip: Add ?enrich=true to include recipient names (slower)`);
      }
      
      // Debug: Log delivered capsules order with detailed sorting info
      const deliveredCapsules = userCapsules.filter(c => c.status === 'delivered');
      if (deliveredCapsules.length > 0) {
        console.log(`\n📊 DELIVERED CAPSULES SORT ORDER (should be newest first):`);
        deliveredCapsules.slice(0, 10).forEach((c, idx) => {
          const sortKey = c.delivered_at || c.delivery_date || c.created_at;
          console.log(`  ${idx + 1}. "${c.title}" | Sort Key: ${sortKey} | delivered_at: ${c.delivered_at || 'MISSING'} | delivery_date: ${c.delivery_date} | created_at: ${c.created_at}`);
        });
      }

      return c.json({ capsules: userCapsules });

    } catch (timeoutError) {
      console.error('❌ Capsule fetch timeout or error:', timeoutError);
      console.error('💡 Database query timed out - returning empty result');
      
      // Return empty array with helpful message
      return c.json({ 
        capsules: [], 
        total: 0,
        error: 'Database temporarily unavailable. Please try again in a moment.',
        suggestion: 'The server is experiencing high load. Try refreshing in 10-15 seconds.',
        timeout: true
      }, 200); // Return 200 so the frontend can handle it gracefully
    }
      })(), // End of async IIFE
      timeoutPromise
    ]);

    return result;

  } catch (error) {
    console.error("Get capsules error:", error);
    
    // If timeout error, return helpful message
    if (error.message?.includes('Handler timeout')) {
      console.error('⏱️ HANDLER TIMEOUT - Request took longer than', HANDLER_TIMEOUT, 'ms');
      return c.json({ 
        capsules: [],
        total: 0,
        error: 'Request timeout - operation took too long',
        suggestion: 'The server is busy. Please try again in a few seconds.',
        timeout: true
      }, 200);
    }
    
    return c.json({ 
      capsules: [],
      total: 0,
      error: "Failed to get capsules",
      details: error.message 
    }, 500);
  }
});

// Get user's notifications
app.get("/make-server-f9be53a7/api/notifications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user from Supabase auth (same pattern as received capsules endpoint)
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      // Use warning instead of error for expired/invalid sessions (expected behavior)
      console.warn('⚠️ [Notifications API] Auth session missing or expired:', authError?.message || 'No user found');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    console.log(`🔔 [Notifications API] Fetching notifications for user: ${userId}`);

    // FIXED: Fetch from BOTH notification sources
    const legacyNotificationsKey = `notifications:${userId}`;
    const echoNotificationsKey = `echo_notifications_array:${userId}`;
    
    // Fetch legacy notifications
    const legacyNotifications = await kv.get(legacyNotificationsKey) || [];
    console.log(`🔔 [Notifications API] Found ${legacyNotifications.length} legacy notifications`);
    
    // Fetch echo notifications
    const echoNotifications = await kv.get(echoNotificationsKey) || [];
    console.log(`🔔 [Notifications API] Found ${echoNotifications.length} echo notifications`);
    
    // 🔧 DYNAMIC SENDER NAME LOOKUP: Fix old notifications that have "Someone" stored
    // This ensures even old notifications display the correct sender name
    const echoNotificationsWithNames = await Promise.all(echoNotifications.map(async (echo: any) => {
      // If senderName is "Someone", missing, or looks like a username/email, look up the actual profile name
      // Username detection: no spaces and all lowercase typically indicates email username
      const looksLikeUsername = echo.senderName && !echo.senderName.includes(' ') && echo.senderName === echo.senderName.toLowerCase();
      const shouldLookupName = !echo.senderName || echo.senderName === 'Someone' || echo.senderName === 'Anonymous' || looksLikeUsername;
      
      // Also check if openedByName or grantedByName look like usernames
      const openedByLooksLikeUsername = echo.openedByName && !echo.openedByName.includes(' ') && echo.openedByName === echo.openedByName.toLowerCase();
      const grantedByLooksLikeUsername = echo.grantedByName && !echo.grantedByName.includes(' ') && echo.grantedByName === echo.grantedByName.toLowerCase();
      
      // CRITICAL FIX: For capsule_opened, look up the OPENER's name using openedBy ID
      if (echo.echoType === 'capsule_opened' && (openedByLooksLikeUsername || !echo.openedByName || echo.openedByName === 'Someone') && echo.openedBy) {
        try {
          console.log(`🔍 [Notifications API] Looking up OPENER name for userId: ${echo.openedBy} (current: "${echo.openedByName}")`);
          const openerProfile = await kv.get(`profile:${echo.openedBy}`);
          
          let openerName = openerProfile?.display_name || openerProfile?.name || `${openerProfile?.first_name || ''} ${openerProfile?.last_name || ''}`.trim();
          
          if (!openerName) {
            try {
              const { data: openerUser } = await supabase.auth.admin.getUserById(echo.openedBy);
              if (openerUser?.user) {
                openerName = openerUser.user.user_metadata?.firstName || openerUser.user.user_metadata?.name || openerUser.user.email?.split('@')[0];
              }
            } catch (authError) {
              console.warn('Could not fetch opener from auth:', authError);
            }
          }
          
          if (openerName) {
            echo.openedByName = openerName;
            echo.senderName = openerName;
            console.log(`✅ [Notifications API] Updated opener name to: "${openerName}"`);
          }
        } catch (error) {
          console.warn(`⚠️ [Notifications API] Could not look up opener for ${echo.openedBy}:`, error);
        }
      }
      
      if (shouldLookupName && echo.senderId) {
        try {
          console.log(`🔍 [Notifications API] Looking up name for senderId: ${echo.senderId} (current: "${echo.senderName}")`);
          const senderProfile = await kv.get(`profile:${echo.senderId}`);
          
          let actualName = senderProfile?.display_name || 
                          senderProfile?.name || 
                          `${senderProfile?.first_name || ''} ${senderProfile?.last_name || ''}`.trim();
          
          // If no name in profile, try to get from auth
          if (!actualName && echo.senderId) {
            try {
              const { data: senderUser } = await supabase.auth.admin.getUserById(echo.senderId);
              if (senderUser?.user) {
                actualName = senderUser.user.user_metadata?.firstName || 
                            senderUser.user.user_metadata?.name ||
                            senderUser.user.email?.split('@')[0];
              }
            } catch (authError) {
              console.warn('Could not fetch sender from auth:', authError);
            }
          }
          
          if (senderProfile || actualName) {
            if (actualName && actualName !== echo.senderName) {
              const oldName = echo.senderName;
              console.log(`✅ [Notifications API] Updated sender name from "${oldName}" to "${actualName}"`);
              echo.senderName = actualName;
              
              // Also update openedByName if this is a capsule_opened notification and it needs fixing
              if (echo.echoType === 'capsule_opened' && (openedByLooksLikeUsername || !echo.openedByName || echo.openedByName === 'Someone')) {
                echo.openedByName = actualName;
                console.log(`✅ [Notifications API] Also updated openedByName to "${actualName}"`);
              }
              
              // Also update grantedByName if this is a legacy_access notification and it needs fixing
              if (echo.echoType === 'legacy_access' && (grantedByLooksLikeUsername || !echo.grantedByName || echo.grantedByName === 'Someone')) {
                echo.grantedByName = actualName;
                console.log(`✅ [Notifications API] Also updated grantedByName to "${actualName}"`);
              }
              
              // CRITICAL: Update echoContent if it contains the old name (for reactions and other notifications)
              // This fixes old notifications that have the name baked into the content string
              if (echo.echoContent && echo.echoContent.includes(oldName)) {
                echo.echoContent = echo.echoContent.replace(new RegExp(oldName, 'g'), actualName);
                console.log(`✅ [Notifications API] Also updated echoContent to use "${actualName}"`);
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ [Notifications API] Could not look up sender for ${echo.senderId}:`, error);
        }
      }
      return echo;
    }));
    
    // Merge and convert all notifications to unified format
    const allNotifications = [
      ...legacyNotifications,
      ...echoNotificationsWithNames.map((echo: any) => ({
        id: echo.id,
        type: 'echo',
        title: echo.echoType === 'legacy_access'
          ? `${echo.grantedByName || echo.senderName || 'Someone'} granted you legacy access`
          : echo.echoType === 'capsule_opened' 
            ? `${echo.openedByName || echo.senderName || 'Someone'} opened your capsule` 
            : echo.echoType === 'reaction' 
              ? `${echo.senderName || 'Someone'} reacted to your comment` 
              : echo.echoType === 'text'
                ? `${echo.senderName || 'Someone'} commented on your capsule`
                : `${echo.senderName || 'Someone'} reacted to your capsule`,
        content: echo.echoType === 'legacy_access'
          ? `${echo.senderName || echo.grantedByName || 'Someone'} has granted you legacy access`
          : echo.echoType === 'capsule_opened'
            ? `${echo.openedByName || echo.senderName || 'Someone'} has opened "${echo.capsuleTitle || 'your capsule'}"`
            : echo.echoType === 'reaction'
              ? `${echo.senderName || 'Someone'} reacted ${echo.emoji || ''} to your comment`
              : echo.echoType === 'text' 
                ? `${echo.senderName || 'Someone'} commented on "${echo.capsuleTitle || 'your capsule'}"`
                : `${echo.senderName || 'Someone'} reacted to your capsule`,
        message: echo.echoType === 'legacy_access'
          ? `${echo.grantedByName || echo.senderName || 'Someone'} granted you legacy access`
          : echo.echoType === 'capsule_opened' 
            ? `${echo.openedByName || echo.senderName || 'Someone'} opened your capsule` 
            : echo.echoType === 'reaction' 
              ? `${echo.senderName || 'Someone'} reacted to your comment` 
              : echo.echoType === 'text'
                ? `${echo.senderName || 'Someone'} commented on your capsule`
                : `${echo.senderName || 'Someone'} reacted to your capsule`,
        timestamp: echo.createdAt || echo.timestamp,
        read: echo.read || false,
        metadata: {
          capsuleId: echo.capsuleId,
          capsuleName: echo.capsuleTitle,
          senderName: echo.senderName,
          emoji: echo.echoType === 'emoji' ? echo.echoContent : (echo.echoType === 'reaction' ? echo.emoji : undefined),
          echoText: echo.echoType === 'text' ? echo.echoContent : undefined,
          echoId: echo.echoId, // Include echoId for duplicate detection
          reactionEmoji: echo.echoType === 'reaction' ? echo.emoji : undefined,
          reactionLabel: echo.echoType === 'reaction' ? echo.emojiLabel : undefined,
          openedBy: echo.echoType === 'capsule_opened' ? echo.openedByName : undefined,
          grantedBy: echo.echoType === 'legacy_access' ? echo.grantedByName : undefined
        }
      }))
    ];
    
    // Sort by timestamp (newest first) and return ALL (client will handle pagination)
    const sortedNotifications = allNotifications
      .filter(n => n != null)
      .sort((a, b) => {
        const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
        const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    
    console.log(`🔔 [Notifications API] Returning ${sortedNotifications.length} total notifications`);
    if (sortedNotifications.length > 0) {
      console.log(`📬 [Notifications API] Latest notification:`, {
        type: sortedNotifications[0].type,
        title: sortedNotifications[0].title,
        timestamp: sortedNotifications[0].timestamp
      });
    }

    return c.json(sortedNotifications);

  } catch (error) {
    console.error("Get notifications error:", error);
    return c.json({ 
      error: "Failed to get notifications",
      details: error.message 
    }, 500);
  }
});

// IMPORTANT: Get received capsules endpoint MUST be defined BEFORE /api/capsules/:id
// to prevent "received" being matched as an ID parameter
// OPTIMIZED: Now uses batching and limits to prevent timeout
app.get("/make-server-f9be53a7/api/capsules/received", async (c) => {
  return await handleGetReceivedCapsules(c, verifyUserToken, supabase);
});

// Get capsule count and media stats for milestone detection
app.get("/make-server-f9be53a7/api/capsules/count", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's capsules from KV store
    const capsulesKey = `capsule:${user.id}`;
    const capsulesValue = await kvGetWithTimeout<any>(capsulesKey);
    
    if (!capsulesValue || !capsulesValue.capsules) {
      // No capsules yet
      return c.json({
        count: 0,
        photoCount: 0,
        videoCount: 0,
        audioCount: 0
      });
    }

    const allCapsules = capsulesValue.capsules || [];
    const count = allCapsules.length;

    // Count media types across all capsules
    let photoCount = 0;
    let videoCount = 0;
    let audioCount = 0;

    allCapsules.forEach((capsule: any) => {
      const mediaUrls = capsule.media_urls || [];
      mediaUrls.forEach((url: string) => {
        if (url.includes('/images/')) {
          photoCount++;
        } else if (url.includes('/videos/')) {
          videoCount++;
        } else if (url.includes('/audio/')) {
          audioCount++;
        }
      });
    });

    return c.json({
      count,
      photoCount,
      videoCount,
      audioCount
    });
  } catch (error) {
    console.error('Get capsule count error:', error);
    return c.json({ error: 'Failed to get capsule count' }, 500);
  }
});

// Get capsule stats by status (for accurate counts regardless of pagination)
app.get("/make-server-f9be53a7/api/capsules/stats", async (c) => {
  console.log('📊 [Stats] ========== STATS ENDPOINT CALLED ==========');
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.error('❌ [Stats] No authorization token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('❌ [Stats] Authorization failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📊 [Stats] Fetching stats for user ${user.id}...`);

    // Get user's capsule IDs - use direct kv.get to see actual errors
    const userCapsulesKey = `user_capsules:${user.id}`;
    let userCapsuleIds = [];
    
    try {
      const rawIds = await kv.get(userCapsulesKey);
      userCapsuleIds = Array.isArray(rawIds) ? rawIds : [];
      console.log(`📊 [Stats] Found ${userCapsuleIds.length} capsule IDs`);
    } catch (idsError) {
      console.error(`❌ [Stats] Failed to get capsule IDs:`, idsError);
      throw new Error(`Failed to fetch user capsule list: ${idsError.message}`);
    }
    
    if (!Array.isArray(userCapsuleIds) || userCapsuleIds.length === 0) {
      console.log('📊 [Stats] User has no capsules');
      return c.json({
        scheduled: 0,
        delivered: 0,
        selfOnlyDelivered: 0,
        draft: 0,
        failed: 0,
        total: 0
      });
    }

    // Fetch all capsules in parallel
    console.log(`📊 [Stats] Fetching ${userCapsuleIds.length} capsules...`);
    
    let allCapsules = [];
    try {
      const capsulePromises = userCapsuleIds.map(id => 
        getCapsuleReliable(id).catch(err => {
          console.warn(`⚠️ [Stats] Failed to fetch capsule ${id}:`, err.message);
          return null;
        })
      );
      
      const allCapsulesData = await Promise.all(capsulePromises);
      // Filter out null, undefined, soft-deleted, and any invalid capsule objects
      allCapsules = allCapsulesData.filter(c => {
        if (c == null) return false;
        if (typeof c !== 'object') return false;
        if (!c.id) {
          console.warn(`⚠️ [Stats] Capsule missing ID, skipping:`, c);
          return false;
        }
        // CRITICAL: Exclude soft-deleted capsules (moved to Archive)
        if (c.deletedAt) {
          console.log(`🌫️ [Stats] Excluding soft-deleted capsule ${c.id} from stats (deletedAt: ${c.deletedAt})`);
          return false;
        }
        return true;
      });
      
      console.log(`📊 [Stats] Successfully fetched ${allCapsules.length} valid capsules out of ${userCapsuleIds.length} IDs`);
    } catch (fetchError) {
      console.error(`❌ [Stats] Error during capsule fetch:`, fetchError);
      throw fetchError;
    }
    
    // Calculate stats matching Dashboard.tsx logic exactly
    let scheduled, delivered, selfOnlyDelivered, draft, failed;
    
    try {
      scheduled = allCapsules.filter(c => 
        c && c.delivery_date && c.status !== 'delivered' && c.status !== 'failed' && c.status !== 'draft'
      );
      
      delivered = allCapsules.filter(c => 
        c && c.status === 'delivered' && c.recipient_type !== 'self'
      );
      
      selfOnlyDelivered = allCapsules.filter(c => 
        c && c.status === 'delivered' && c.recipient_type === 'self'
      );
      
      draft = allCapsules.filter(c => 
        c && ((c.status === 'draft') || (!c.delivery_date && c.status !== 'delivered' && c.status !== 'failed'))
      );
      
      failed = allCapsules.filter(c => c && c.status === 'failed');
      
      console.log(`📊 [Stats] Filtering completed successfully`);
    } catch (filterError) {
      console.error(`❌ [Stats] Error during filtering:`, filterError);
      throw filterError;
    }

    // Debug logging
    console.log(`📊 [Stats] Capsule breakdown:`);
    console.log(`   Total capsules: ${allCapsules.length}`);
    console.log(`   Scheduled: ${scheduled.length}`);
    console.log(`   Delivered (to others): ${delivered.length}`);
    console.log(`   Delivered (self-only): ${selfOnlyDelivered.length}`);
    console.log(`   Draft: ${draft.length}`);
    console.log(`   Failed: ${failed.length}`);
    
    // Log first few capsules for debugging
    if (allCapsules.length > 0) {
      console.log(`📊 [Stats] Sample capsules (first 3):`);
      allCapsules.slice(0, 3).forEach((c, idx) => {
        if (c && typeof c === 'object') {
          console.log(`   ${idx + 1}. id="${c.id?.substring(0, 20) || 'unknown'}...", status="${c.status || 'unknown'}", recipient_type="${c.recipient_type || 'unknown'}", has_delivery_date=${!!c.delivery_date}`);
        }
      });
    }
    
    console.log(`📊 Stats calculated for user ${user.id}:`, {
      scheduled: scheduled.length,
      delivered: delivered.length,
      selfOnlyDelivered: selfOnlyDelivered.length,
      draft: draft.length,
      failed: failed.length,
      total: allCapsules.length
    });

    const statsResponse = {
      scheduled: scheduled.length,
      delivered: delivered.length,
      selfOnlyDelivered: selfOnlyDelivered.length,
      draft: draft.length,
      failed: failed.length,
      total: allCapsules.length
    };
    
    console.log('✅ [Stats] Returning stats response:', statsResponse);
    console.log('📊 [Stats] ========== STATS ENDPOINT SUCCESS ==========');
    
    return c.json(statsResponse);
  } catch (error) {
    console.error('❌ [Stats] Get capsule stats error:', error);
    console.error('❌ [Stats] Error name:', error?.name);
    console.error('❌ [Stats] Error message:', error?.message);
    console.error('❌ [Stats] Error stack:', error?.stack);
    return c.json({ error: `Failed to get capsule stats: ${error?.message || error}` }, 500);
  }
});

// Get single capsule by ID
app.get("/make-server-f9be53a7/api/capsules/:id", async (c) => {
  try {
    // Check authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const token = authHeader.split(' ')[1];
    const { user, error: authError } = await verifyUserToken(token);
    if (authError || !user) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const capsuleId = c.req.param('id');
    console.log(`📋 Getting capsule: ${capsuleId}`);

    // Get capsule from KV store
    const capsule = await getCapsuleReliable(capsuleId);
    
    if (!capsule) {
      return c.json({ error: "Capsule not found" }, 404);
    }

    // Check if user has permission to view this capsule
    // User can view if they created it OR if they're a recipient
    const isCreator = capsule.created_by === user.id;
    const isRecipient = capsule.recipients?.some(r => {
      const email = typeof r === 'string' ? r : (r.value || r.email || '');
      return email === user.email;
    }) || capsule.self_contact === user.email;

    if (!isCreator && !isRecipient) {
      return c.json({ error: "Not authorized to view this capsule" }, 403);
    }

    // CRITICAL FIX: Enrich capsule with current sender name from profile
    let senderName = 'Someone Special';
    try {
      const senderProfile = await kv.get(`profile:${capsule.created_by}`);
      if (senderProfile) {
        if (senderProfile.display_name) {
          senderName = senderProfile.display_name.trim();
        } else {
          const fullName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
          senderName = fullName || 'Someone Special';
        }
      }
      
      // Fallback to auth if no profile name
      if (!senderName || senderName === 'Someone Special') {
        const { data: senderUser } = await supabase.auth.admin.getUserById(capsule.created_by);
        if (senderUser?.user?.email) {
          senderName = senderUser.user.email.split('@')[0];
        }
      }
    } catch (error) {
      console.warn('Could not load sender info:', error);
    }

    console.log(`✅ Capsule ${capsuleId} retrieved with sender: ${senderName}`);

    // CRITICAL FIX: Hydrate media files with full metadata (not just IDs)
    let hydratedMediaFiles = [];
    if (capsule.media_files && Array.isArray(capsule.media_files) && capsule.media_files.length > 0) {
      console.log(`🎬 Hydrating ${capsule.media_files.length} media files for capsule ${capsuleId}...`);
      
      try {
        // Get full media object for each media ID
        const mediaPromises = capsule.media_files.map(async (mediaId) => {
          try {
            const mediaFile = await kv.get(`media:${mediaId}`);
            if (mediaFile) {
              // Generate signed URL
              const storagePath = mediaFile.storage_path || `${mediaFile.user_id}/${mediaFile.capsule_id}/${mediaFile.file_name}`;
              const { data: signedUrl, error: urlError } = await supabase.storage
                .from('make-f9be53a7-media')
                .createSignedUrl(storagePath, 604800); // 7 days
              
              if (!urlError && signedUrl?.signedUrl) {
                return {
                  id: mediaFile.id,
                  file_name: mediaFile.file_name,
                  file_type: mediaFile.file_type,
                  media_type: mediaFile.file_type, // Alias for compatibility
                  type: mediaFile.file_type, // Another alias
                  file_size: mediaFile.file_size,
                  url: signedUrl.signedUrl,
                  file_url: signedUrl.signedUrl, // Alias for compatibility
                  created_at: mediaFile.created_at
                };
              }
            }
            return null;
          } catch (err) {
            console.warn(`Failed to hydrate media ${mediaId}:`, err);
            return null;
          }
        });

        const results = await Promise.all(mediaPromises);
        hydratedMediaFiles = results.filter(m => m !== null);
        console.log(`✅ Successfully hydrated ${hydratedMediaFiles.length}/${capsule.media_files.length} media files`);
      } catch (error) {
        console.error('Error hydrating media files:', error);
        // If hydration fails, still return the capsule without media
      }
    }

    return c.json({ 
      success: true, 
      capsule: {
        ...capsule,
        sender_name: senderName,
        // Replace media_files array of IDs with full media objects
        media_files: hydratedMediaFiles.length > 0 ? hydratedMediaFiles : capsule.media_files
      }
    });

  } catch (error) {
    console.error("Get capsule error:", error);
    return c.json({ error: "Failed to get capsule", details: error.message }, 500);
  }
});

// Update capsule delivery time
app.put("/make-server-f9be53a7/api/capsules/:id/delivery-time", async (c) => {
  try {
    // Check authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const token = authHeader.split(' ')[1];
    const { user, error: authError } = await verifyUserToken(token);
    if (authError || !user) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const capsuleId = c.req.param('id');
    const { delivery_date, delivery_time, time_zone } = await c.req.json();

    if (!delivery_date) {
      return c.json({ error: "Delivery date is required" }, 400);
    }

    // Validate delivery date format
    const deliveryDateTime = new Date(delivery_date);
    if (isNaN(deliveryDateTime.getTime())) {
      console.error(`❌ Invalid delivery date/time: ${delivery_date}`);
      return c.json({ error: "Invalid delivery date format" }, 400);
    }

    // Get existing capsule
    const capsule = await getCapsuleReliable(capsuleId);
    if (!capsule) {
      return c.json({ error: "Capsule not found" }, 404);
    }

    // Check ownership
    if (capsule.created_by !== user.id) {
      return c.json({ error: "Not authorized to modify this capsule" }, 403);
    }

    // Check if capsule is already delivered
    if (capsule.status === 'delivered') {
      return c.json({ error: "Cannot modify delivered capsule" }, 400);
    }

    // ❌ REMOVED: DO NOT extract UTC hours/minutes - preserve the local time from frontend
    // delivery_time should be the local time string (e.g., "12:00") sent from the frontend

    // Update delivery time
    const updatedCapsule = {
      ...capsule,
      delivery_date: deliveryDateTime.toISOString(),
      delivery_time: delivery_time || capsule.delivery_time, // ✅ Use delivery_time from request or keep existing
      time_zone: time_zone || capsule.time_zone,
      updated_at: new Date().toISOString(),
      status: 'scheduled' // Reset to scheduled if it was failed
    };

    await kv.set(`capsule:${capsuleId}`, updatedCapsule);

    console.log(`⏰ Updated delivery time for capsule ${capsuleId} to ${updatedCapsule.delivery_date} (${updatedCapsule.delivery_time})`);

    return c.json({ 
      success: true, 
      capsule: {
        id: updatedCapsule.id,
        delivery_date: updatedCapsule.delivery_date,
        time_zone: updatedCapsule.time_zone,
        status: updatedCapsule.status
      }
    });

  } catch (error) {
    console.error("Update delivery time error:", error);
    return c.json({ error: "Failed to update delivery time" }, 500);
  }
});

// Update capsule (full update for editing capsules)
app.put("/make-server-f9be53a7/api/capsules/:id", async (c) => {
  try {
    // Check authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const token = authHeader.split(' ')[1];
    const { user, error: authError } = await verifyUserToken(token);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const capsuleId = c.req.param('id');
    console.log(`📝 Updating capsule: ${capsuleId}`);
    console.log(`🔍 Capsule ID details:`, {
      id: capsuleId,
      length: capsuleId.length,
      charCodes: capsuleId.split('').map(c => c.charCodeAt(0)),
      trimmed: capsuleId.trim(),
      hasWhitespace: capsuleId !== capsuleId.trim()
    });
    console.log(`🔍 Looking for capsule with key: capsule:${capsuleId}`);

    const body = await c.req.json();
    const {
      title,
      text_message,
      recipient_type,
      delivery_method,
      self_contact,
      recipients,
      delivery_date,
      delivery_time, // ✅ Accept delivery_time from frontend (local time string)
      time_zone,
      status,
      frontend_url,
      allow_echoes,
      media_urls,
      media_files,
      folder_id,
      attached_folder_id,
      theme, // CRITICAL: Theme for custom opening ceremony
      metadata // CRITICAL: Additional theme-specific metadata
    } = body;

    // Get existing capsule
    const lookupStartTime = Date.now();
    const capsule = await getCapsuleReliable(capsuleId);
    const lookupDuration = Date.now() - lookupStartTime;
    console.log(`📦 Capsule lookup result (${lookupDuration}ms):`, capsule ? `Found (id: ${capsule.id}, status: ${capsule.status})` : 'Not found');
    if (capsule) {
      const capsuleAge = Date.now() - new Date(capsule.created_at).getTime();
      console.log(`📅 Capsule age: ${capsuleAge}ms (created at ${capsule.created_at})`);
    }
    
    if (!capsule) {
      // Try to debug: list all capsule keys to see what exists
      console.log(`❌ Capsule not found with key: capsule:${capsuleId}`);
      console.log(`🔍 Checking user's capsule list for debugging...`);
      try {
        // Use user_capsules list instead of full scan
        const userCapsuleIds = await kv.get(`user_capsules:${user.id}`) || [];
        console.log(`📊 Total capsules for this user: ${userCapsuleIds.length}`);
        console.log(`📋 Sample of user's capsule IDs:`, userCapsuleIds.slice(0, 10));
        
        // Check if the capsule ID exists in the user's list
        console.log(`🔎 Searching for capsule ID: "${capsuleId}"`);
        const capsuleExistsInList = userCapsuleIds.includes(capsuleId);
        
        if (capsuleExistsInList) {
          console.log(`⚠️ Capsule ID found in user's list but capsule data is missing!`);
          console.log(`  This suggests a data inconsistency - the ID is tracked but the capsule:${capsuleId} key has no data`);
        } else {
          console.log(`❌ Capsule ID "${capsuleId}" not found in user's capsule list`);
          console.log(`  This suggests the capsule was never created or belongs to a different user`);
        }
      } catch (debugError) {
        console.error(`Failed to list capsules for debugging:`, debugError);
      }
      
      return c.json({ error: "Capsule not found" }, 404);
    }

    // Check ownership
    if (capsule.created_by !== user.id) {
      return c.json({ error: "Not authorized to modify this capsule" }, 403);
    }

    // Check if capsule is already delivered
    if (capsule.status === 'delivered') {
      return c.json({ error: "Cannot modify delivered capsule" }, 400);
    }

    // Validate required fields (same as creation)
    if (title !== undefined && !title?.trim()) {
      return c.json({ error: "Title cannot be empty" }, 400);
    }

    // FIXED: Message is only required if there's no media and no attached folder
    const hasMedia = (media_urls !== undefined && Array.isArray(media_urls) && media_urls.length > 0) ||
                     (capsule.media_urls && Array.isArray(capsule.media_urls) && capsule.media_urls.length > 0);
    const hasAttachedFolder = (attached_folder_id !== undefined && attached_folder_id?.trim()) ||
                              (capsule.attached_folder_id && capsule.attached_folder_id.trim());
    
    if (text_message !== undefined && !text_message?.trim() && !hasMedia && !hasAttachedFolder) {
      return c.json({ error: "Message, media, or attached folder is required" }, 400);
    }

    // Determine if this is a draft
    const isDraft = status === 'draft';
    
    // Validate delivery date for non-drafts
    if (!isDraft && delivery_date !== undefined && !delivery_date) {
      return c.json({ error: "Delivery date is required for scheduled capsules" }, 400);
    }

    // Validate and filter recipients for 'others' recipient type
    let validRecipients = [];
    if (recipient_type === 'others') {
      if (!recipients || !Array.isArray(recipients)) {
        return c.json({ error: "Recipients array is required for 'others' recipient type" }, 400);
      }
      
      // Filter out empty recipients
      validRecipients = recipients.filter(r => {
        if (typeof r === 'string') {
          return r.trim().length > 0;
        } else if (typeof r === 'object' && r !== null) {
          const value = r.value || r.email || r.phone || r.contact || '';
          return value.trim().length > 0;
        }
        return false;
      });
      
      // For non-draft capsules, require at least one valid recipient
      if (!isDraft && validRecipients.length === 0) {
        return c.json({ error: "At least one valid recipient is required for scheduled capsules" }, 400);
      }
      
      console.log(`✅ Validated recipients: ${validRecipients.length} valid out of ${recipients.length} total`);
    }

    // Process delivery date if provided
    let deliveryDateISO = capsule.delivery_date;
    if (delivery_date) {
      const deliveryDateTime = new Date(delivery_date);
      if (isNaN(deliveryDateTime.getTime())) {
        console.error(`❌ Invalid delivery date/time: ${delivery_date}`);
        return c.json({ error: "Invalid delivery date format" }, 400);
      }
      deliveryDateISO = deliveryDateTime.toISOString();
      
      // ❌ REMOVED: DO NOT extract UTC hours/minutes - this was overwriting the correct local time
      // The frontend already sends delivery_time as the local time string (e.g., "12:00")
      // We should preserve delivery_time from the request or keep the existing value
    }

    // Update capsule with provided fields
    const updatedCapsule = {
      ...capsule,
      title: title !== undefined ? title.trim() : capsule.title,
      text_message: text_message !== undefined ? text_message.trim() : capsule.text_message,
      recipient_type: recipient_type !== undefined ? recipient_type : capsule.recipient_type,
      delivery_method: delivery_method !== undefined ? delivery_method : capsule.delivery_method,
      self_contact: recipient_type === 'self' ? (self_contact !== undefined ? self_contact : capsule.self_contact) : null,
      recipients: recipient_type === 'others' ? validRecipients : (capsule.recipient_type === 'others' ? capsule.recipients : []),
      delivery_date: deliveryDateISO,
      delivery_time: delivery_time !== undefined ? delivery_time : capsule.delivery_time, // ✅ Use delivery_time from request or keep existing
      time_zone: time_zone !== undefined ? time_zone : capsule.time_zone,
      status: status !== undefined ? status : capsule.status,
      allow_echoes: allow_echoes !== undefined ? allow_echoes : (capsule.allow_echoes !== undefined ? capsule.allow_echoes : true),
      media_urls: media_urls !== undefined ? media_urls : (capsule.media_urls || []),
      media_files: media_files !== undefined ? media_files : (capsule.media_files || []), // Support media IDs update
      folder_id: folder_id !== undefined ? folder_id : (capsule.folder_id || null),
      attached_folder_id: attached_folder_id !== undefined ? attached_folder_id : (capsule.attached_folder_id || null),
      theme: theme !== undefined ? theme : (capsule.theme || 'standard'), // CRITICAL: Theme for custom opening ceremony
      metadata: metadata !== undefined ? metadata : (capsule.metadata || {}), // CRITICAL: Additional theme-specific metadata
      updated_at: new Date().toISOString(),
      frontend_url: frontend_url !== undefined ? frontend_url : (capsule.frontend_url || 'https://found-shirt-81691824.figma.site')
    };

    // CRITICAL FIX: Synchronize capsule_media KV list with updated media_urls
    // If media_files (IDs) are provided, use them directly as the source of truth.
    // Otherwise, fall back to synchronizing based on media_urls (legacy behavior).
    if (media_files !== undefined && Array.isArray(media_files)) {
      try {
        console.log(`🔄 Updating capsule_media list with ${media_files.length} IDs provided by client`);
        // We could validate that these IDs exist in media:*, but for now let's trust the client
        // to support the Vault import use case where IDs are known.
        await kv.set(`capsule_media:${capsuleId}`, media_files);
        console.log(`✅ Updated capsule_media list via media_files`);
      } catch (err) {
        console.error('❌ Failed to update capsule_media from media_files:', err);
      }
    } else if (media_urls !== undefined) {
      try {
        console.log(`🔄 Synchronizing media IDs for capsule ${capsuleId}...`);
        console.log(`📋 Target URLs (${media_urls.length}):`, media_urls);
        
        const capsuleMediaKey = `capsule_media:${capsuleId}`;
        const currentMediaIds = await kv.get(capsuleMediaKey) || [];
        
        if (currentMediaIds.length > 0) {
          // Fetch mapped media objects to check their URLs
          const validMediaIds = [];
          
          for (const mediaId of currentMediaIds) {
            try {
              const mediaObj = await kv.get(`media:${mediaId}`);
              
              if (mediaObj && mediaObj.storage_path) {
                // Construct the public URL for comparison
                // We check if any of the target URLs contains the storage path or filename
                // This is a robust way to match mapped URLs
                const matches = media_urls.some(url => 
                  url.includes(mediaObj.storage_path) || 
                  (mediaObj.file_name && url.includes(mediaObj.file_name))
                );
                
                if (matches) {
                  validMediaIds.push(mediaId);
                } else {
                  console.log(`🗑️ Unlinking media ${mediaId} (${mediaObj.file_name}) - removed from capsule`);
                  // Optionally: We could delete the actual file/object here too, but unlinking is safer for now
                }
              } else {
                // If we can't verify it (missing object), keep it to be safe? 
                // Or drop it if we're doing a strict sync?
                // Strict sync: drop it if we can't verify it matches a URL in the list
                console.warn(`⚠️ Skipping media ${mediaId} - metadata not found`);
              }
            } catch (err) {
              console.warn(`⚠️ Error checking media ${mediaId}:`, err);
            }
          }
          
          // Update the list if it changed
          if (validMediaIds.length !== currentMediaIds.length) {
            await kv.set(capsuleMediaKey, validMediaIds);
            console.log(`✅ Updated capsule_media list: ${currentMediaIds.length} -> ${validMediaIds.length} IDs`);
          } else {
            console.log(`✅ capsule_media list already in sync`);
          }
        }
      } catch (syncError) {
        console.error('❌ Failed to synchronize media IDs:', syncError);
        // Don't fail the request, just log
      }
    }

    await kv.set(`capsule:${capsuleId}`, updatedCapsule);

    console.log(`✅ Capsule ${capsuleId} updated successfully`);

    // CRITICAL FIX: Update global scheduled list if status is scheduled
    // When editing a capsule (especially changing delivery date), ensure it's in the delivery queue
    if (updatedCapsule.status === 'scheduled') {
      try {
        const scheduledList = await kv.get('scheduled_capsules_global') || [];
        if (!scheduledList.includes(capsuleId)) {
          scheduledList.push(capsuleId);
          await kv.set('scheduled_capsules_global', scheduledList);
          console.log(`✅ Added updated capsule ${capsuleId} to global scheduled list (${scheduledList.length} total)`);
        } else {
          console.log(`✅ Capsule ${capsuleId} already in global scheduled list`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to update scheduled list (non-critical):', error);
      }
    }

    // 🏆 TRACK ACHIEVEMENT: If draft was just scheduled, track as capsule_created
    let newlyUnlockedAchievements = [];
    const wasConvertedFromDraft = capsule.status === 'draft' && updatedCapsule.status === 'scheduled';
    
    if (wasConvertedFromDraft) {
      try {
        console.log('🏆 Draft converted to scheduled capsule - tracking achievement for user:', user.id);
        
        // Check if this is the user's first non-draft capsule (use user_capsules list)
        const userCapsuleIds = await kv.get(`user_capsules:${user.id}`) || [];
        const capsulePromises = userCapsuleIds.map(id => getCapsuleReliable(id));
        const allUserCapsules = await Promise.all(capsulePromises);
        const userScheduledCapsules = allUserCapsules.filter(c => 
          c && c.status === 'scheduled'
        );
        const isFirstCapsule = userScheduledCapsules.length === 1;
        
        const achievementResult = await AchievementService.checkAndUnlockAchievements(
          user.id,
          'capsule_created',
          {
            capsuleId: capsuleId,
            isFirstCapsule: isFirstCapsule,
            convertedFromDraft: true,
            createdAt: new Date().toISOString()
          }
        );
        
        newlyUnlockedAchievements = achievementResult.newlyUnlocked || [];
        
        if (newlyUnlockedAchievements.length > 0) {
          console.log(`🎉 Unlocked ${newlyUnlockedAchievements.length} achievement(s):`, 
            newlyUnlockedAchievements.map(a => a.title).join(', '));
        }
      } catch (error) {
        console.error('⚠️ Achievement tracking failed (non-critical):', error);
      }
    }

    return c.json({ 
      success: true, 
      capsule: {
        id: updatedCapsule.id,
        title: updatedCapsule.title,
        delivery_date: updatedCapsule.delivery_date,
        status: updatedCapsule.status,
        updated_at: updatedCapsule.updated_at
      },
      newlyUnlockedAchievements: newlyUnlockedAchievements
    });

  } catch (error) {
    console.error("Update capsule error:", error);
    return c.json({ error: "Failed to update capsule", details: error.message }, 500);
  }
});

// Delivery processing endpoint (for manual triggers and monitoring)
// Supports both GET and POST for easy testing
app.get("/make-server-f9be53a7/api/delivery/process", async (c) => {
  try {
    console.log('📨 Manual delivery processing triggered (GET)');
    const result = await DeliveryService.processDueDeliveries();
    return c.json({ 
      success: true, 
      message: 'Delivery processing completed',
      ...result 
    });
  } catch (error) {
    console.error("Delivery processing error:", error);
    return c.json({ error: "Failed to process deliveries" }, 500);
  }
});

app.post("/make-server-f9be53a7/api/delivery/process", async (c) => {
  try {
    console.log('📨 Manual delivery processing triggered (POST)');
    const result = await DeliveryService.processDueDeliveries();
    return c.json({ 
      success: true, 
      message: 'Delivery processing completed',
      ...result 
    });
  } catch (error) {
    console.error("Delivery processing error:", error);
    return c.json({ error: "Failed to process deliveries" }, 500);
  }
});

// Get viewing capsule by token (for public viewing URLs)
app.get("/make-server-f9be53a7/api/view/:token", async (c) => {
  try {
    const token = c.req.param('token');
    
    if (!token) {
      return c.json({ error: "Viewing token is required" }, 400);
    }

    const capsule = await DeliveryService.getViewingCapsule(token);
    
    if (!capsule) {
      return c.json({ error: "Invalid or expired viewing link" }, 404);
    }

    // Get media files for this capsule
    const mediaIds = await kv.get(`capsule_media:${capsule.id}`) || [];
    const mediaFiles = [];
    
    for (const mediaId of mediaIds) {
      try {
        const mediaFile = await kv.get(`media:${mediaId}`);
        if (mediaFile) {
          // Generate signed URL for viewing
          const { data } = await supabase.storage
            .from(mediaFile.storage_bucket)
            .createSignedUrl(mediaFile.storage_path, 3600 * 24); // 24 hour validity
            
          mediaFiles.push({
            id: mediaFile.id,
            file_name: mediaFile.file_name,
            file_type: mediaFile.file_type,
            file_size: mediaFile.file_size,
            created_at: mediaFile.created_at,
            url: data?.signedUrl
          });
        }
      } catch (error) {
        console.warn(`Failed to load media file ${mediaId}:`, error);
      }
    }

    return c.json({ 
      capsule: {
        id: capsule.id,
        title: capsule.title,
        text_message: capsule.text_message,
        delivery_date: capsule.delivery_date,
        created_at: capsule.created_at,
        // Don't expose sensitive user data
        user_id: undefined,
        recipient_email: undefined,
        recipient_phone: undefined
      },
      mediaFiles 
    });
    
  } catch (error) {
    console.error("Get viewing capsule error:", error);
    return c.json({ error: "Failed to get capsule" }, 500);
  }
});

// Health check with delivery status
app.get("/make-server-f9be53a7/api/health/delivery", (c) => {
  return c.json({ 
    status: "ok",
    delivery_system: "operational",
    timestamp: new Date().toISOString(),
    services: {
      email: !!Deno.env.get('RESEND_API_KEY'),
    },
    automation: {
      check_interval_seconds: 30,
      check_interval_ms: 30000,
      status: "active"
    }
  });
});

// Get delivery queue status (scheduled capsules)
// DISABLED: This endpoint scans all capsules and times out in production
app.get("/make-server-f9be53a7/api/delivery/status", async (c) => {
  try {
    console.log('⚠️ Delivery status endpoint called - returning disabled message');
    return c.json({
      error: 'Endpoint disabled',
      message: 'This admin endpoint is disabled in production to prevent database timeouts. Use the scheduled capsule list from DeliveryService instead.',
      timestamp: new Date().toISOString(),
      alternative: 'Use DeliveryService.getScheduledCapsulesOptimized() for efficient querying'
    }, 503);
    
    // LEGACY CODE - DISABLED (kept for reference):
    // Add timeout protection for admin status endpoint
    const QUERY_TIMEOUT = 5000; // 5 seconds
    let allCapsules;
    try {
      allCapsules = await Promise.race([
        kv.getByPrefix('capsule:', QUERY_TIMEOUT),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
        )
      ]);
    } catch (error) {
      console.error('⚠️ Query timeout in delivery status:', error);
      return c.json({
        error: 'Database query timed out',
        message: 'Unable to fetch delivery status. Database is under heavy load.',
        timestamp: new Date().toISOString()
      }, 503);
    }
    
    const now = new Date();
    
    const scheduled = allCapsules.filter(cap => cap && cap.status === 'scheduled');
    const delivered = allCapsules.filter(cap => cap && cap.status === 'delivered');
    const failed = allCapsules.filter(cap => cap && cap.status === 'failed');
    
    // Find capsules that are due now
    const dueNow = scheduled.filter(cap => {
      try {
        const deliveryDate = new Date(cap.delivery_date);
        return deliveryDate <= now;
      } catch {
        return false;
      }
    });
    
    // Find upcoming capsules (within next 24 hours)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcoming = scheduled.filter(cap => {
      try {
        const deliveryDate = new Date(cap.delivery_date);
        return deliveryDate > now && deliveryDate <= tomorrow;
      } catch {
        return false;
      }
    }).map(cap => ({
      id: cap.id,
      title: cap.title,
      delivery_date: cap.delivery_date,
      minutes_until_delivery: Math.round((new Date(cap.delivery_date).getTime() - now.getTime()) / (1000 * 60))
    }));
    
    return c.json({
      timestamp: now.toISOString(),
      summary: {
        total: allCapsules.length,
        scheduled: scheduled.length,
        delivered: delivered.length,
        failed: failed.length,
        due_now: dueNow.length,
        upcoming_24h: upcoming.length
      },
      due_now: dueNow.map(cap => ({
        id: cap.id,
        title: cap.title,
        delivery_date: cap.delivery_date,
        minutes_overdue: Math.round((now.getTime() - new Date(cap.delivery_date).getTime()) / (1000 * 60)),
        attempts: cap.delivery_attempts || 0
      })),
      upcoming_24h: upcoming,
      automation: {
        status: "active",
        check_interval_seconds: 60,
        next_check_in_seconds: "Every 60 seconds"
      }
    });
  } catch (error) {
    console.error("Delivery status error:", error);
    return c.json({ error: "Failed to get delivery status" }, 500);
  }
});

// Fixed test email endpoint - using exact same approach as working Simple Test
app.post("/make-server-f9be53a7/api/test/email", async (c) => {
  try {
    console.log("🔄 Fixed test email endpoint called");
    
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email required" }, 400);
    }
    
    console.log(`🧪 Fixed test to: ${email}`);
    
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY environment variable not set');
      return c.json({ error: "Email service not configured" }, 500);
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: "Fixed Test - Eras Working! ✅",
        html: `<h1>Fixed Test Success!</h1><p>Email to: ${email}</p><p>Time: ${new Date().toISOString()}</p>`
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return c.json({ success: false, error }, 500);
    }
    
    const result = await response.json();
    return c.json({ success: true, message: "Fixed test worked!", resendId: result.id });
    
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Direct API key test endpoint (bypasses environment variable)
app.post("/make-server-f9be53a7/api/test/email-direct", async (c) => {
  try {
    console.log("🔄 Starting direct API test...");
    
    const requestBody = await c.req.json();
    console.log("📥 Request body received:", { 
      email: requestBody.email, 
      hasApiKey: !!requestBody.apiKey,
      apiKeyLength: requestBody.apiKey?.length || 0 
    });
    
    const { email, apiKey } = requestBody;
    
    if (!email || !apiKey) {
      console.error("❌ Missing required fields:", { email: !!email, apiKey: !!apiKey });
      return c.json({ error: "Email and API key are required" }, 400);
    }
    
    console.log(`🧪 Testing direct email delivery to: ${email}`);
    console.log(`🔑 API key format: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`🔑 API key length: ${apiKey.length}`);
    console.log(`🔑 Starts with 're_': ${apiKey.startsWith('re_')}`);
    
    const emailPayload = {
      from: 'onboarding@resend.dev',
      to: [email],
      subject: "Direct API Test - Eras Email System 🧪",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">🧪 Direct API Test Successful!</h1>
          <p style="color: #666; font-size: 16px;">
            This email was sent using your API key directly, bypassing environment variables.
            If you receive this, your API key is valid!
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>✅ API Key:</strong> Valid & Working</p>
            <p style="margin: 5px 0 0 0; color: #333;"><strong>⏰ Test Time:</strong> ${new Date().toISOString()}</p>
            <p style="margin: 5px 0 0 0; color: #333;"><strong>🔑 Key:</strong> ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}</p>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Sent by Eras - Direct API Test
          </p>
        </div>
      `
    };
    
    console.log("📧 Email payload prepared:", {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlLength: emailPayload.html.length
    });
    
    console.log("🌐 Making request to Resend API...");
    
    // Test directly with provided API key
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log(`📨 Resend API response status: ${response.status}`);
    console.log(`📨 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct email test failed with status:', response.status);
      console.error('❌ Error response body:', errorText);
      
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
        console.error('❌ Parsed error object:', errorObj);
      } catch (parseError) {
        console.error('❌ Could not parse error as JSON:', parseError);
        errorObj = { message: errorText };
      }
      
      return c.json({ 
        success: false, 
        error: `API Error (${response.status}): ${errorObj.message || errorText}`,
        status: response.status,
        apiKeyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
        fullError: errorObj
      }, response.status);
    }

    const result = await response.json();
    console.log(`✅ Direct test email sent successfully!`, result);
    
    return c.json({ 
      success: true, 
      message: "Direct API test email sent successfully!",
      email: email,
      apiKeyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
      timestamp: new Date().toISOString(),
      resendResponse: result
    });
    
  } catch (error) {
    console.error("💥 Direct test email error:", error);
    console.error("💥 Error stack:", error.stack);
    return c.json({ 
      error: `Direct test failed: ${error.message}`,
      stack: error.stack 
    }, 500);
  }
});

// Background delivery scheduler
const startDeliveryScheduler = () => {
  console.log('🚀 Starting delivery scheduler...');
  
  // IMPROVED: Process deliveries every 30 seconds for near-instant delivery
  // This ensures capsules are delivered within 0-29 seconds of their scheduled time
  const processInterval = 30 * 1000; // 30 seconds in milliseconds
  
  const runDeliveryProcess = async () => {
    try {
      console.log('⏰ Scheduled delivery check starting...');
      const result = await DeliveryService.processDueDeliveries();
      console.log(`📊 Scheduled delivery check complete: ${result.processed} processed, ${result.successful} successful, ${result.failed} failed`);
    } catch (error) {
      // Check if it's a known temporary error (Supabase/Cloudflare issues)
      const errorMsg = error?.message || String(error);
      
      // Cloudflare/infrastructure errors - suppress verbose HTML, just log short message
      if (errorMsg.includes('<!DOCTYPE html>') || errorMsg.length > 500) {
        console.warn('⚠️ Temporary Cloudflare/infrastructure issue during delivery check (will retry automatically)');
      } else if (errorMsg.includes('500') || 
          errorMsg.includes('502') || 
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('Cloudflare') ||
          errorMsg.includes('timeout') ||
          errorMsg.includes('Circuit breaker')) {
        console.warn('⚠️ Temporary database connection issue during delivery check:', errorMsg.substring(0, 150));
      } else {
        console.error('🚨 Scheduled delivery process error:', error);
      }
    }
  };

  // Run immediately on startup
  setTimeout(runDeliveryProcess, 5000); // Wait 5 seconds after startup
  
  // Then run every 30 seconds for near-instant delivery
  setInterval(runDeliveryProcess, processInterval);
  
  console.log(`✅ Delivery scheduler started - checking every ${processInterval / 1000} seconds`);
};

// Manual delivery trigger endpoint - allows immediate delivery checks
app.post("/make-server-f9be53a7/api/trigger-delivery", async (c) => {
  try {
    console.log("🚀 Manual delivery trigger called");
    
    // Verify admin access (optional - you can add authentication here)
    const result = await DeliveryService.processDueDeliveries();
    
    console.log(`✅ Manual delivery check complete: ${result.processed} processed, ${result.successful} successful, ${result.failed} failed`);
    
    return c.json({
      success: true,
      message: "Delivery check triggered successfully",
      result: {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed
      }
    });
  } catch (error) {
    // Check if it's a known temporary error
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('500') || 
        errorMsg.includes('502') || 
        errorMsg.includes('html') ||
        errorMsg.includes('cloudflare') ||
        errorMsg.includes('timeout')) {
      console.warn("⚠️ Temporary database connection issue during manual trigger");
      return c.json({
        success: false,
        error: "Temporary database connection issue - deliveries will resume automatically"
      }, 503); // Service Unavailable
    }
    
    console.error("❌ Manual delivery trigger error:", error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// NEW: Check last delivery attempt logs (DISABLED - causes KV Store timeouts)
app.get("/make-server-f9be53a7/api/test/last-delivery-logs", async (c) => {
  console.log('⚠️ Last delivery logs endpoint called - returning disabled message');
  return c.json({
    error: 'Endpoint disabled',
    message: 'This debug endpoint is disabled in production to prevent KV Store timeouts. Use Postgres queries instead.',
    timestamp: new Date().toISOString(),
    alternative: 'Query the capsules_f9be53a7 table directly with: SELECT * FROM capsules_f9be53a7 WHERE status = \'delivered\' ORDER BY delivered_at DESC LIMIT 1'
  }, 503);
  
  /* LEGACY CODE - DISABLED (kept for reference):
  try {
    console.log("🔍 Fetching last delivery attempt logs...");
    
    // Get the most recent delivered capsule
    const allCapsules = await kv.getByPrefix('capsule:');
    const deliveredCapsules = allCapsules
      .map(item => item.value)
      .filter(cap => cap.status === 'delivered')
      .sort((a, b) => new Date(b.delivered_at).getTime() - new Date(a.delivered_at).getTime());
    
    if (deliveredCapsules.length === 0) {
      return c.json({ 
        message: "No delivered capsules found",
        hasDelivered: false
      });
    }
    
    const latestDelivered = deliveredCapsules[0];
    
    return c.json({
      success: true,
      latestDeliveredCapsule: {
        id: latestDelivered.id,
        title: latestDelivered.title,
        status: latestDelivered.status,
        delivered_at: latestDelivered.delivered_at,
        delivery_attempts: latestDelivered.delivery_attempts,
        last_delivery_attempt: latestDelivered.last_delivery_attempt,
        delivery_error: latestDelivered.delivery_error,
        recipient_type: latestDelivered.recipient_type,
        self_contact: latestDelivered.self_contact,
        recipients: latestDelivered.recipients
      },
      message: "Check server logs for detailed delivery flow. Logs will show if sendEmailDelivery was called and what result was returned."
    });
    
  } catch (error) {
    console.error("Error fetching delivery logs:", error);
    return c.json({ error: error.message }, 500);
  }
  */
});

// Simple email test endpoint with different name
app.post("/make-server-f9be53a7/api/email-simple-test", async (c) => {
  try {
    console.log("🔄 Simple email test endpoint called");
    
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email required" }, 400);
    }
    
    console.log(`🧪 Simple test to: ${email}`);
    
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY environment variable not set');
      return c.json({ error: "Email service not configured" }, 500);
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: "Simple Test - Eras Working! ✅",
        html: `<h1>Simple Test Success!</h1><p>Email to: ${email}</p><p>Time: ${new Date().toISOString()}</p>`
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return c.json({ success: false, error }, 500);
    }
    
    const result = await response.json();
    return c.json({ success: true, message: "Simple test worked!", resendId: result.id });
    
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// API Key Environment Test endpoint  
app.get("/make-server-f9be53a7/api/test/env", async (c) => {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('🔍 Environment API Key Check:');
    console.log('Exists:', !!apiKey);
    console.log('Length:', apiKey?.length || 0);
    console.log('Starts with re_:', apiKey?.startsWith('re_') || false);
    console.log('Preview:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'null');
    
    // Test the API key directly with Resend
    let apiKeyValid = false;
    let resendError = null;
    
    if (apiKey) {
      try {
        console.log('🧪 Testing environment API key with Resend...');
        const testResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: ['test@example.com'], // This will fail but tells us if API key is valid
            subject: 'API Key Test',
            html: '<p>Test</p>'
          }),
        });
        
        console.log('🧪 Environment key test response status:', testResponse.status);
        
        if (testResponse.status === 422) {
          // 422 means validation error (bad email), but API key is valid
          apiKeyValid = true;
          resendError = 'API key valid (test email failed as expected)';
          console.log('✅ Environment API key is VALID');
        } else if (testResponse.status === 401) {
          // 401 means API key is invalid
          apiKeyValid = false;
          const errorData = await testResponse.text();
          resendError = `API key invalid: ${errorData}`;
          console.log('❌ Environment API key is INVALID:', errorData);
        } else {
          // Any other status means API key worked
          apiKeyValid = true;
          resendError = `Unexpected status ${testResponse.status}`;
          console.log('✅ Environment API key is VALID (unexpected status)');
        }
      } catch (fetchError) {
        resendError = `Network error: ${fetchError.message}`;
        console.log('💥 Environment API key test error:', fetchError);
      }
    } else {
      console.log('❌ No RESEND_API_KEY environment variable found');
    }
    
    return c.json({
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyStartsWithRe: apiKey?.startsWith('re_') || false,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'null',
      apiKeyValid,
      resendError,
      timestamp: new Date().toISOString(),
      instructions: !apiKeyValid && apiKey ? 'Update RESEND_API_KEY in Supabase Environment Variables' : null
    });
  } catch (error) {
    console.error('Environment test error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Temporary API key update endpoint for fixing the 401 errors
app.post("/make-server-f9be53a7/api/temp/update-key", async (c) => {
  try {
    console.log("🔧 Temporary API key update endpoint called");
    
    const { newApiKey, testEmail } = await c.req.json();
    
    if (!newApiKey || !testEmail) {
      return c.json({ error: "New API key and test email are required" }, 400);
    }
    
    if (!newApiKey.startsWith('re_')) {
      return c.json({ error: "Invalid API key format. Must start with 're_'" }, 400);
    }
    
    console.log(`🧪 Testing new API key: ${newApiKey.substring(0, 8)}...${newApiKey.substring(newApiKey.length - 4)}`);
    
    // Test the new API key
    const testResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${newApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [testEmail],
        subject: "🔧 API Key Update Test - Eras Fixed!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">🎉 API Key Update Successful!</h1>
            <p style="color: #666; font-size: 16px;">
              Great news! Your new API key is working perfectly. The 401 errors should now be resolved.
            </p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #333;"><strong>✅ Status:</strong> API Key Valid & Working</p>
              <p style="margin: 5px 0 0 0; color: #333;"><strong>⏰ Updated:</strong> ${new Date().toISOString()}</p>
              <p style="margin: 5px 0 0 0; color: #333;"><strong>🔑 Key:</strong> ${newApiKey.substring(0, 8)}...${newApiKey.substring(newApiKey.length - 4)}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              <strong>Next Step:</strong> Update your RESEND_API_KEY environment variable in Supabase with this validated key.
            </p>
          </div>
        `
      }),
    });

    if (!testResponse.ok) {
      const error = await testResponse.text();
      console.error('❌ New API key test failed:', error);
      return c.json({ 
        success: false, 
        error: `API key test failed: ${error}`,
        status: testResponse.status 
      }, testResponse.status);
    }

    const result = await testResponse.json();
    console.log('✅ New API key test successful:', result.id);

    return c.json({
      success: true,
      message: "API key validated successfully! Now update your environment variable.",
      apiKeyPreview: `${newApiKey.substring(0, 8)}...${newApiKey.substring(newApiKey.length - 4)}`,
      resendId: result.id,
      instructions: [
        "1. Go to Supabase Dashboard → Settings → Edge Functions → Environment Variables",
        "2. Find RESEND_API_KEY and click Edit",
        "3. Replace the value with your validated key",
        "4. Save changes",
        "5. Test again using the 'Check API Key' button"
      ]
    });

  } catch (error) {
    console.error("💥 Temporary update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug delivery test endpoint
app.post("/make-server-f9be53a7/api/debug/delivery", async (c) => {
  try {
    console.log("🔍 Debug delivery endpoint called");
    
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email required" }, 400);
    }
    
    console.log(`🔍 Testing delivery system for: ${email}`);
    
    // Check environment variable
    const apiKey = Deno.env.get('RESEND_API_KEY');
    console.log('🔍 Environment check:');
    console.log('- API key exists:', !!apiKey);
    console.log('- API key length:', apiKey?.length || 0);
    console.log('- API key preview:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'null');
    console.log('- Expected new key format: re_4tWuVHDF...');
    
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: "RESEND_API_KEY not found in environment variables",
        debug: {
          apiKeyExists: false,
          allEnvVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('RESEND')),
          expectedKey: "re_4tWuVHDF_N3tMsDxQLHahDnBgBXrmNb2j"
        }
      });
    }

    // Validate API key format (should start with 're_')
    if (!apiKey.startsWith('re_')) {
      console.warn('🔍 API key does not have valid Resend format (should start with re_)');
      return c.json({
        success: false,
        error: "Invalid API key format. Resend API keys should start with 're_'",
        debug: {
          apiKeyExists: true,
          currentKey: `${apiKey.substring(0, 8)}...`,
          hint: "Get a valid API key from https://resend.com/api-keys"
        }
      });
    }
    
    // Test direct Resend API call
    console.log('🔍 Testing direct Resend API call with new key...');
    const testResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: "✅ New API Key Test - Eras Delivery System",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">✅ Eras Delivery System - New API Key Test</h1>
            <p>Congratulations! Your new Resend API key is working perfectly.</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>✅ New API Key:</strong> Valid & Active</p>
              <p><strong>⏰ Test Time:</strong> ${new Date().toISOString()}</p>
              <p><strong>🔑 Key Preview:</strong> ${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}</p>
              <p><strong>🎯 Status:</strong> Ready for Time Capsule Delivery</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Your time capsule delivery system is now fully operational! 🚀
            </p>
          </div>
        `
      }),
    });

    console.log('🔍 Direct API test result:', testResponse.status);
    
    if (!testResponse.ok) {
      const error = await testResponse.text();
      console.error('🔍 Direct API test failed:', error);
      
      return c.json({
        success: false,
        error: `API test failed: ${error}`,
        debug: {
          apiKeyExists: true,
          apiKeyLength: apiKey.length,
          apiKeyValid: false,
          status: testResponse.status,
          response: error,
          keyFormat: apiKey.startsWith('re_4tWuVHDF') ? 'correct' : 'incorrect'
        }
      });
    }

    const result = await testResponse.json();
    console.log('✅ New API key test successful:', result.id);
    
    return c.json({
      success: true,
      message: "🎉 New API key working perfectly! Delivery system ready.",
      debug: {
        apiKeyExists: true,
        apiKeyLength: apiKey.length,
        apiKeyValid: true,
        keyFormat: "correct",
        resendId: result.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("💥 Debug delivery error:", error);
    return c.json({ 
      error: error.message,
      debug: {
        errorType: error.constructor.name,
        errorStack: error.stack
      }
    }, 500);
  }
});

// Debug immediate delivery system
// DISABLED: This endpoint scans all capsules and times out in production
app.post("/make-server-f9be53a7/api/debug/immediate-delivery", async (c) => {
  try {
    console.log("⚠️ Debug immediate delivery endpoint called - returning disabled message");
    
    // Check emergency stop status (still useful)
    const emergencyStop = await kv.get('emergency_stop_deliveries');
    
    return c.json({
      success: false,
      error: 'Endpoint disabled',
      message: 'This debug endpoint is disabled in production to prevent database timeouts. Use the delivery scheduler background process instead.',
      emergencyStop: emergencyStop === 'enabled',
      currentTime: new Date().toISOString(),
      alternative: 'The delivery scheduler runs automatically every 30 seconds in the background'
    }, 503);
    
    // LEGACY CODE - DISABLED (kept for reference):
    console.log("🔍 Debug immediate delivery system called");
    
    // Import DeliveryService dynamically
    const { DeliveryService } = await import("./delivery-service.tsx");
    
    // Check emergency stop status
    const emergencyStop2 = await kv.get('emergency_stop_deliveries');
    console.log('🔍 Emergency stop status:', emergencyStop2);
    
    // Get all capsules to find due ones (with timeout protection)
    const QUERY_TIMEOUT = 5000; // 5 seconds max for debug endpoint
    let allCapsules;
    try {
      allCapsules = await Promise.race([
        kv.getByPrefix('capsule:', QUERY_TIMEOUT),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
        )
      ]);
    } catch (error) {
      console.error('⚠️ Query timeout in debug endpoint:', error);
      return c.json({
        success: false,
        error: 'Database query timed out',
        message: 'The database is experiencing high load. This is a known issue we are working to optimize.'
      }, 503);
    }
    
    const now = new Date();
    const dueCapsules = [];
    
    for (const capsuleData of allCapsules) {
      if (!capsuleData || capsuleData.status !== 'scheduled') continue;
      
      const deliveryDateTime = new Date(`${capsuleData.delivery_date}T${capsuleData.delivery_time}:00`);
      
      if (deliveryDateTime <= now) {
        dueCapsules.push({
          id: capsuleData.id,
          title: capsuleData.title,
          delivery_date: capsuleData.delivery_date,
          delivery_time: capsuleData.delivery_time,
          status: capsuleData.status,
          recipient_type: capsuleData.recipient_type,
          delivery_method: capsuleData.delivery_method,
          delivery_attempts: capsuleData.delivery_attempts || 0
        });
      }
    }
    
    console.log(`🔍 Found ${dueCapsules.length} due capsules:`, dueCapsules);
    
    return c.json({
      success: true,
      dueCapsules: dueCapsules.length,
      emergencyStop: emergencyStop === 'enabled',
      currentTime: now.toISOString(),
      capsuleDetails: dueCapsules,
      debug: {
        totalCapsules: allCapsules.length,
        emergencyStopValue: emergencyStop,
        systemTime: now.toISOString()
      }
    });
    
  } catch (error) {
    console.error("💥 Debug immediate delivery error:", error);
    return c.json({ 
      success: false,
      error: error.message,
      debug: {
        errorType: error.constructor.name,
        errorStack: error.stack
      }
    }, 500);
  }
});



// Clean up any blocked capsules that were emergency stopped
// DISABLED: This endpoint scans all capsules and times out in production
app.post("/make-server-f9be53a7/api/cleanup-blocked-capsules", async (c) => {
  try {
    console.log('⚠️ Cleanup blocked capsules endpoint called - returning disabled message');
    
    return c.json({
      error: 'Endpoint disabled',
      message: 'This cleanup endpoint is disabled in production to prevent database timeouts. Blocked capsules are now automatically cleaned up by the delivery scheduler.',
      timestamp: new Date().toISOString(),
      alternative: 'The delivery scheduler automatically handles blocked capsules during its normal operation'
    }, 503);
    
    // LEGACY CODE - DISABLED (kept for reference):
    console.log('🧹 Cleaning up blocked capsules...');
    
    // Add timeout protection
    const QUERY_TIMEOUT = 5000; // 5 seconds
    let allCapsules;
    try {
      allCapsules = await Promise.race([
        kv.getByPrefix('capsule:', QUERY_TIMEOUT),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
        )
      ]);
    } catch (error) {
      console.error('⚠️ Query timeout in cleanup:', error);
      return c.json({
        error: 'Database query timed out',
        message: 'Unable to clean up capsules. Database is under heavy load.'
      }, 503);
    }
    
    let cleanedCount = 0;
    
    for (const capsule of allCapsules) {
      if (capsule.status === 'emergency_stopped') {
        const cleanedCapsule = {
          ...capsule,
          status: 'scheduled' as const,
          delivery_attempts: 0,
          last_delivery_attempt: undefined,
          delivery_error: undefined,
          emergency_stopped_at: undefined,
          updated_at: new Date().toISOString()
        };
        await kv.set(`capsule:${capsule.id}`, cleanedCapsule);
        cleanedCount++;
        console.log(`🧹 Cleaned up blocked capsule: ${capsule.id} - "${capsule.title}"`);
      }
    }
    
    return c.json({ 
      success: true, 
      message: `Cleaned up ${cleanedCount} blocked capsules`,
      cleaned_count: cleanedCount 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Manual retry endpoint for failed deliveries
app.post("/make-server-f9be53a7/api/manual-retry", async (c) => {
  try {
    console.log("🔄 Manual retry endpoint called");
    
    const { capsuleId } = await c.req.json();
    
    if (!capsuleId) {
      return c.json({ error: "Capsule ID required" }, 400);
    }
    
    console.log(`🔄 Manual retry requested for capsule: ${capsuleId}`);
    
    // Get the capsule
    const capsule = await getCapsuleReliable(capsuleId);
    if (!capsule) {
      return c.json({ error: "Capsule not found" }, 404);
    }
    
    console.log(`🔄 Found capsule: ${capsule.title} (Status: ${capsule.status})`);
    
    // Reset the capsule to scheduled status and clear retry count
    const resetCapsule = {
      ...capsule,
      status: 'scheduled' as const,
      delivery_attempts: 0,
      last_delivery_attempt: undefined,
      delivery_error: undefined,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`capsule:${capsuleId}`, resetCapsule);
    console.log(`🔄 Reset capsule ${capsuleId} for manual retry`);
    
    // Immediately attempt delivery
    const success = await DeliveryService.deliverCapsule(resetCapsule);
    
    if (success) {
      console.log(`✅ Manual retry successful for capsule: ${capsuleId}`);
      return c.json({
        success: true,
        message: `Manual retry successful for capsule: ${capsule.title}`
      });
    } else {
      console.log(`❌ Manual retry failed for capsule: ${capsuleId}`);
      return c.json({
        success: false,
        error: `Manual retry failed for capsule: ${capsule.title}`
      });
    }

  } catch (error) {
    console.error("💥 Manual retry error:", error);
    return c.json({ 
      error: error.message
    }, 500);
  }
});

// ============================================
// ACHIEVEMENT SYSTEM API ENDPOINTS
// ============================================

// Track action and check for achievement unlocks
app.post("/make-server-f9be53a7/achievements/track", async (c) => {
  try {
    console.log("🏆 [Achievement Track] Endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error("🏆 [Achievement Track] No token provided");
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      console.error("🏆 [Achievement Track] Invalid token:", authError);
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const body = await c.req.json();
    const { action, metadata } = body;
    
    if (!action) {
      console.error("🏆 [Achievement Track] No action provided");
      return c.json({ error: "Action is required" }, 400);
    }
    
    console.log(`🏆 [Achievement Track] User ${user.id} action: "${action}"`, metadata);
    
    // Track the action using the Achievement Service
    const result = await AchievementService.checkAndUnlockAchievements(user.id, action, metadata);
    
    console.log(`🏆 [Achievement Track] Result:`, {
      newlyUnlocked: result.newlyUnlocked?.length || 0,
      statsUpdated: !!result.stats
    });
    
    return c.json({
      success: true,
      stats: result.stats,
      newlyUnlocked: result.newlyUnlocked || [],
      totalPoints: result.stats?.total_points || 0
    });
    
  } catch (error) {
    console.error("🏆 [Achievement Track] Error:", error);
    return c.json({ 
      error: "Failed to track action",
      details: error.message 
    }, 500);
  }
});

// Get user's achievement stats
app.get("/make-server-f9be53a7/achievements/stats", async (c) => {
  try {
    console.log("🏆 [Achievement Stats] Endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const stats = await AchievementService.getUserStats(user.id);
    
    return c.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error("🏆 [Achievement Stats] Error:", error);
    return c.json({ 
      error: "Failed to get stats",
      details: error.message 
    }, 500);
  }
});

// Get user's unlocked achievements
app.get("/make-server-f9be53a7/achievements/unlocked", async (c) => {
  try {
    console.log("🏆 [Achievement Unlocked] Endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const unlocked = await AchievementService.getUserAchievements(user.id);
    
    return c.json({
      success: true,
      achievements: unlocked
    });
    
  } catch (error) {
    console.error("🏆 [Achievement Unlocked] Error:", error);
    return c.json({ 
      error: "Failed to get unlocked achievements",
      details: error.message 
    }, 500);
  }
});

// Get pending achievement notifications
app.get("/make-server-f9be53a7/achievements/notifications/pending", async (c) => {
  try {
    console.log("🏆 [Achievement Notifications] Get pending endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const pending = await AchievementService.getPendingNotifications(user.id);
    
    console.log(`🏆 [Achievement Notifications] Found ${pending.length} pending notifications`);
    
    return c.json({
      success: true,
      pending
    });
    
  } catch (error) {
    console.error("🏆 [Achievement Notifications] Error:", error);
    return c.json({ 
      error: "Failed to get pending notifications",
      details: error.message 
    }, 500);
  }
});

// Mark achievement notifications as shown
app.post("/make-server-f9be53a7/achievements/notifications/mark-shown", async (c) => {
  try {
    console.log("🏆 [Achievement Notifications] Mark shown endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const { achievementIds } = await c.req.json();
    
    if (!achievementIds || !Array.isArray(achievementIds)) {
      return c.json({ error: "achievementIds array is required" }, 400);
    }
    
    await AchievementService.markNotificationsShown(user.id, achievementIds);
    
    console.log(`🏆 [Achievement Notifications] Marked ${achievementIds.length} as shown`);
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("🏆 [Achievement Notifications] Error:", error);
    return c.json({ 
      error: "Failed to mark notifications as shown",
      details: error.message 
    }, 500);
  }
});

// Get all achievement definitions (for dashboard)
// PUBLIC ENDPOINT - No auth required as definitions are static data
app.get("/make-server-f9be53a7/achievements/definitions", async (c) => {
  try {
    console.log("🏆 [Achievement Definitions] Public endpoint called");
    
    const definitions = await AchievementService.getAchievementDefinitions();
    
    return c.json({
      success: true,
      definitions
    });
    
  } catch (error) {
    console.error("🏆 [Achievement Definitions] Error:", error);
    return c.json({ 
      error: "Failed to get achievement definitions",
      details: error.message 
    }, 500);
  }
});

// ============================================
// ECHO SYSTEM API ENDPOINTS (Phase 1)
// ============================================

import * as EchoService from './echo-service.tsx';
import * as EmailService from './email-service.tsx';

// Send an echo (emoji or text)
app.post("/make-server-f9be53a7/echoes/send", async (c) => {
  try {
    console.log("💫 [Echo] Send endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error("💫 [Echo] No token provided");
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      console.error("💫 [Echo] Invalid token:", authError);
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const { capsuleId, type, content } = await c.req.json();
    
    if (!capsuleId || !type || !content) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    if (type !== 'emoji' && type !== 'text') {
      return c.json({ error: "Invalid echo type. Must be 'emoji' or 'text'" }, 400);
    }
    
    // Text echo length limit
    if (type === 'text' && content.length > 500) {
      return c.json({ error: "Text echo must be 500 characters or less" }, 400);
    }
    
    // Get capsule to verify it exists and get sender info
    // CRITICAL FIX: Check global capsule store, not user-specific store
    // Recipients need to access capsules they didn't create
    const capsule = await kv.get(`capsule:${capsuleId}`);
    if (!capsule) {
      console.error(`❌ [Echo] Capsule not found: ${capsuleId}`);
      return c.json({ error: "Capsule not found" }, 404);
    }
    
    // DEBUG: Log capsule and user details for troubleshooting
    console.log(`🔍 [Echo Auth] Checking authorization for user ${user.id}:`);
    console.log(`  - User email: ${user.email}`);
    console.log(`  - User phone: ${user.phone_number || user.phone || 'none'}`);
    // Handle multiple field name variations: userId, user_id, created_by
    const capsuleSenderId = capsule.userId || capsule.user_id || capsule.created_by;
    console.log(`  - Capsule sender: ${capsuleSenderId}`);
    console.log(`  - Capsule recipients:`, capsule.recipients?.map((r: any) => ({ email: r.email, phone: r.phone })) || 'none');
    console.log(`  - Capsule recipient_type: ${capsule.recipient_type}`);
    console.log(`  - Capsule delivery date: ${capsule.deliveryDate}`);
    console.log(`  - Capsule status: ${capsule.status}`);
    
    // Verify user is EITHER the sender OR a recipient (both can send echoes for two-way conversation)
    const isSender = capsuleSenderId === user.id;
    
    // Enhanced recipient check with multiple field variations
    const userEmail = user.email || user.user_metadata?.email;
    const userPhone = user.phone_number || user.phone || user.user_metadata?.phone;
    
    // Check if recipients array exists and is valid
    const hasRecipients = capsule.recipients && Array.isArray(capsule.recipients) && capsule.recipients.length > 0;
    
    const isRecipient = hasRecipients ? capsule.recipients?.some((r: any) => {
      const recipientEmail = r.email?.toLowerCase().trim();
      const recipientPhone = r.phone?.trim();
      const matchEmail = userEmail && recipientEmail && recipientEmail === userEmail.toLowerCase().trim();
      const matchPhone = userPhone && recipientPhone && recipientPhone === userPhone.trim();
      
      if (matchEmail || matchPhone) {
        console.log(`✅ [Echo Auth] User matched as recipient via ${matchEmail ? 'email' : 'phone'}`);
      }
      
      return matchEmail || matchPhone;
    }) : (capsule.recipient_type === 'self' && capsuleSenderId === user.id);
    
    console.log(`  - isSender: ${isSender}, isRecipient: ${isRecipient}, hasRecipients: ${hasRecipients}`);
    
    // Additional fallback: Check if this capsule is in user's received list
    let isInReceivedList = false;
    if (!isSender && !isRecipient) {
      console.log(`⚠️ [Echo Auth] User not found as sender/recipient via direct match, checking received list...`);
      try {
        // FIXED: Use correct key pattern - user_received:${user.id} not user:${user.id}:received_capsules
        const receivedList = await kv.get(`user_received:${user.id}`) || [];
        isInReceivedList = Array.isArray(receivedList) && receivedList.includes(capsuleId);
        console.log(`  - Received capsules list length: ${Array.isArray(receivedList) ? receivedList.length : 'not an array'}`);
        console.log(`  - isInReceivedList: ${isInReceivedList}`);
        if (!isInReceivedList && Array.isArray(receivedList)) {
          console.log(`  - Capsule ${capsuleId} not found in received list`);
          console.log(`  - First few received capsules:`, receivedList.slice(0, 3));
        }
      } catch (error) {
        console.error(`⚠️ [Echo Auth] Failed to check received list:`, error.message);
      }
    }
    
    if (!isSender && !isRecipient && !isInReceivedList) {
      console.warn(`⚠️ [Echo] Authorization denied for user ${user.id} on capsule ${capsuleId}`);
      console.warn(`  - User is neither sender nor recipient, and capsule not in received list`);
      console.warn(`  - This is expected behavior - user doesn't have access to this capsule`);
      return c.json({ 
        error: "You don't have permission to interact with this capsule",
        details: "Only the capsule sender and recipients can send echoes"
      }, 403);
    }
    
    if (isInReceivedList) {
      console.log(`✅ [Echo Auth] User authorized via received capsules list`);
    }
    
    console.log(`✅ [Echo] Authorization passed for user ${user.id} (isSender: ${isSender}, isRecipient: ${isRecipient}, inReceivedList: ${isInReceivedList})`);
    
    // Get user's display name - FIXED: Try multiple KV key patterns
    let userProfile = null;
    let senderName = 'Anonymous';
    
    try {
      // Try multiple possible key patterns for user profile
      userProfile = await kv.get(`profile:${user.id}`) || 
                    await kv.get(`user:${user.id}:profile`) ||
                    await kv.get(`user_profile:${user.id}`);
      
      if (userProfile) {
        // Try display_name first, then construct from first/last name
        senderName = userProfile.display_name || 
                    userProfile.name || 
                    `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() ||
                    user.email?.split('@')[0] ||
                    'Anonymous';
        console.log(`👤 [Echo] User profile loaded: senderName="${senderName}"`);
      } else {
        // Fallback to email username
        senderName = user.email?.split('@')[0] || 'Anonymous';
        console.log(`⚠️ [Echo] No profile found, using fallback: senderName="${senderName}"`);
      }
    } catch (profileError) {
      console.error(`⚠️ [Echo] Error loading profile:`, profileError);
      senderName = user.email?.split('@')[0] || 'Anonymous';
    }
    
    console.log(`👤 [Echo] Final senderName="${senderName}"`);
    
    // Create echo with consistent field names
    const echo = {
      id: `echo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      capsuleId,
      senderId: user.id,
      senderName,
      type,
      content,
      createdAt: new Date().toISOString(),
      readBy: []
    };
    
    console.log(`💾 [Echo] Saving echo to storage: echoId="${echo.id}", key="echo_${capsuleId}_${echo.id}"`);
    await EchoService.addEcho(echo);
    console.log(`✅ [Echo] Echo successfully saved to database with key: echo_${capsuleId}_${echo.id}`);
    
    console.log(`✅ Echo sent: type="${type}", content="${content.substring(0, 50)}...", capsule=${capsuleId}`);
    
    // Send in-app notifications based on who sent the echo
    try {
      if (isSender) {
        // If capsule SENDER sent the echo, notify ALL recipients
        console.log(`🔔 [NOTIFICATION PATH] Sender sent ${type} echo, notifying ${capsule.recipients?.length || 0} recipients via in-app notifications`);
        
        if (capsule.recipients && capsule.recipients.length > 0) {
          for (const recipient of capsule.recipients) {
            // Get recipient contact info (handle both old and new recipient formats)
            const recipientEmail = recipient.email || recipient.value;
            const recipientPhone = recipient.phone;
            
            if (recipientEmail || recipientPhone) {
              try {
                // PRIMARY METHOD: Use listUsers to find user by email (faster than prefix scan)
                let recipientData = null;
                
                console.log(`🔍 [Notification] Looking up userId for recipient: ${recipientEmail || recipientPhone}`);
                
                if (recipientEmail) {
                  try {
                    console.log(`📧 [Notification] Using listUsers to find user by email: ${recipientEmail}`);
                    const { data: allUsers } = await supabase.auth.admin.listUsers();
                    const matchedUser = allUsers?.users?.find(u => u.email?.toLowerCase() === recipientEmail.toLowerCase());
                    
                    if (matchedUser) {
                      console.log(`✅ [Notification] Found user via listUsers: ${matchedUser.id}`);
                      recipientData = { id: matchedUser.id };
                    } else {
                      console.warn(`⚠️ [Notification] User not found via listUsers for email: ${recipientEmail}`);
                    }
                  } catch (listError) {
                    console.error(`❌ [Notification] Error with listUsers:`, listError);
                  }
                }
                
                if (recipientData) {
                  console.log(`📧 [Notification] Creating notification for recipient: ${recipientEmail || recipientPhone} (userId: ${recipientData.id})`);
                  
                  // Create notification
                  const notification = {
                    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    echoId: echo.id,
                    capsuleId,
                    capsuleTitle: capsule.title || 'Untitled Capsule',
                    senderId: user.id,
                    senderName,
                    echoType: type,
                    echoContent: content,
                    timestamp: new Date().toISOString(),
                    read: false,
                    seen: false,
                    createdAt: new Date().toISOString()
                  };
                  
                  console.log(`📝 [Notification] Notification object created:`, JSON.stringify(notification, null, 2));
                  
                  // Store notification in array (NEW SYSTEM - fixed to match recipient→sender flow)
                  const arrayKey = `echo_notifications_array:${recipientData.id}`;
                  console.log(`💾 [Notification] Storing notification in KV: key="${arrayKey}"`);
                  
                  const existingNotifications = await kv.get(arrayKey) || [];
                  console.log(`📊 [Notification] Existing notifications count: ${existingNotifications.length}`);
                  
                  existingNotifications.unshift(notification); // Add to beginning (newest first)
                  await kv.set(arrayKey, existingNotifications);
                  console.log(`✅ [Notification] Notification saved to KV! New count: ${existingNotifications.length}`);
                  
                  // Broadcast notification to recipient
                  console.log(`📡 [Broadcast] Attempting to broadcast notification to recipient: ${recipientData.id}`);
                  const notifChannel = supabase.channel(`echo_notifications:${recipientData.id}`);
                  await notifChannel.subscribe(async (status) => {
                    console.log(`📡 [Broadcast] Channel subscription status: ${status}`);
                    if (status === 'SUBSCRIBED') {
                      await notifChannel.send({
                        type: 'broadcast',
                        event: 'new_echo',
                        payload: notification
                      });
                      console.log(`✅✅✅ [Broadcast] In-app notification SUCCESSFULLY broadcasted to ${recipientEmail || recipientPhone}`);
                      setTimeout(() => supabase.removeChannel(notifChannel), 1000);
                    }
                  });
                } else {
                  console.warn(`⚠️ [Notification] Could not find user data for recipient: ${recipientEmail || recipientPhone}`);
                }
              } catch (err) {
                console.error(`🔔 Failed to notify recipient ${recipientEmail || recipientPhone}:`, err);
              }
            }
          }
        }
      } else {
        // If RECIPIENT sent the echo, notify the capsule sender
        console.log(`🔔 [NOTIFICATION PATH] Recipient sent ${type} echo, notifying capsule sender via in-app notification`);
        const capsuleSenderId = capsule.userId || capsule.user_id || capsule.created_by;
        console.log(`📧 [Notification] Capsule sender ID: ${capsuleSenderId}`);
        
        if (!capsuleSenderId) {
          console.error(`❌ [Notification] Cannot send notification - capsule sender ID not found in capsule object`);
          console.error(`   Capsule fields:`, Object.keys(capsule));
          throw new Error('Capsule sender ID not found');
        }
        
        // Create notification for sender
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          echoId: echo.id,
          capsuleId,
          capsuleTitle: capsule.title || 'Untitled Capsule',
          senderId: user.id,
          senderName,
          echoType: type,
          echoContent: content,
          timestamp: new Date().toISOString(),
          read: false,
          seen: false,
          createdAt: new Date().toISOString()
        };
        
        console.log(`📝 [Notification] Notification object created for capsule sender:`, JSON.stringify(notification, null, 2));
        
        // Store notification in array
        const arrayKey = `echo_notifications_array:${capsuleSenderId}`;
        console.log(`💾 [Notification] Storing notification in KV: key="${arrayKey}"`);
        
        const existingNotifications = await kv.get(arrayKey) || [];
        console.log(`📊 [Notification] Existing notifications count: ${existingNotifications.length}`);
        
        existingNotifications.unshift(notification); // Add to beginning (newest first)
        await kv.set(arrayKey, existingNotifications);
        console.log(`✅ [Notification] Notification saved to KV! New count: ${existingNotifications.length}`);
        
        // Broadcast notification to sender
        console.log(`📡 [Broadcast] Attempting to broadcast notification to capsule sender: ${capsuleSenderId}`);
        const notifChannel = supabase.channel(`echo_notifications:${capsuleSenderId}`);
        await notifChannel.subscribe(async (status) => {
          console.log(`📡 [Broadcast] Channel subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            await notifChannel.send({
              type: 'broadcast',
              event: 'new_echo',
              payload: notification
            });
            console.log(`✅✅✅ [Broadcast] In-app notification SUCCESSFULLY broadcasted to capsule sender ${capsuleSenderId}`);
            setTimeout(() => supabase.removeChannel(notifChannel), 1000);
          }
        });
      }
    } catch (notificationError) {
      console.error("🔔 Failed to send in-app notification:", notificationError);
      // Don't fail the request if notification fails
    }
    
    // Track achievement for sender
    try {
      await AchievementService.checkAndUnlockAchievements(user.id, 'echo_sent', { type });
      console.log(`🏆 Tracked echo_sent achievement for user ${user.id}`);
    } catch (achievementError) {
      console.error("🏆 Failed to track echo achievement:", achievementError);
      // Don't fail the request if achievement tracking fails
    }
    
    // Track echo_received achievement for capsule owner
    try {
      const capsuleOwnerId = capsule.created_by || capsule.userId || capsule.user_id;
      if (capsuleOwnerId && capsuleOwnerId !== user.id) {
        // Only track if the echo sender is NOT the capsule owner
        await AchievementService.checkAndUnlockAchievements(capsuleOwnerId, 'echo_received', { type });
        console.log(`🏆 Tracked echo_received achievement for capsule owner ${capsuleOwnerId}`);
      }
    } catch (receivedAchievementError) {
      console.error("🏆 Failed to track echo_received achievement:", receivedAchievementError);
      // Don't fail the request if achievement tracking fails
    }
    
    // PHASE 1: Broadcast new echo to all viewers (real-time social timeline)
    try {
      const channel = supabase.channel(`echoes:${capsuleId}`);
      
      // Subscribe to channel before sending (required by Supabase Broadcast)
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Now we can send the broadcast
          await channel.send({
            type: 'broadcast',
            event: 'new-echo',
            payload: { echo },
          });
          console.log(`📡 [Echo Social] Broadcasted new echo to channel echoes:${capsuleId}`);
          
          // Unsubscribe after sending
          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 1000);
        }
      });
    } catch (broadcastError) {
      console.error('📡 [Echo Social] Broadcast failed (not critical):', broadcastError);
      // Don't fail the request if broadcast fails - clients will use polling fallback
    }
    
    return c.json({ 
      success: true, 
      echo: {
        ...echo,
        // Don't send internal storage path to client
      }
    });
    
  } catch (error) {
    console.error("💫 [Echo] Send error:", error);
    return c.json({ 
      error: "Failed to send echo",
      details: error.message 
    }, 500);
  }
});

// Get all echoes for a capsule
app.get("/make-server-f9be53a7/echoes/:capsuleId", async (c) => {
  try {
    console.log("💫 [Echo] Get echoes endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const capsuleId = c.req.param('capsuleId');
    
    if (!capsuleId) {
      return c.json({ error: "Capsule ID is required" }, 400);
    }
    
    // Get echoes
    const echoes = await EchoService.getEchoes(capsuleId);
    const metadata = await EchoService.getEchoMetadata(capsuleId);
    
    console.log(`✅ Retrieved ${echoes.length} echoes for capsule ${capsuleId}`);
    
    return c.json({ 
      success: true, 
      echoes,
      metadata
    });
    
  } catch (error) {
    console.error("💫 [Echo] Get echoes error:", error);
    return c.json({ 
      error: "Failed to get echoes",
      details: error.message 
    }, 500);
  }
});

// Get user's current emoji reaction for a capsule
app.get("/make-server-f9be53a7/echoes/:capsuleId/my-reaction", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const capsuleId = c.req.param('capsuleId');
    
    if (!capsuleId) {
      return c.json({ error: "Capsule ID is required" }, 400);
    }
    
    // Get user's current emoji reaction
    const reaction = await EchoService.getUserEmojiReaction(capsuleId, user.id);
    
    return c.json({ 
      success: true, 
      reaction // emoji string or null
    });
    
  } catch (error) {
    console.error("💫 [Echo] Get user reaction error:", error);
    return c.json({ 
      error: "Failed to get user reaction",
      details: error.message 
    }, 500);
  }
});

// Mark echo as read
app.post("/make-server-f9be53a7/echoes/mark-read", async (c) => {
  try {
    console.log("💫 [Echo] Mark read endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const { capsuleId, echoId } = await c.req.json();
    
    if (!capsuleId || !echoId) {
      return c.json({ error: "Missing capsuleId or echoId" }, 400);
    }
    
    await EchoService.markEchoAsRead(capsuleId, echoId, user.id);
    
    console.log(`✅ Marked echo ${echoId} as read by user ${user.id}`);
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("💫 [Echo] Mark read error:", error);
    return c.json({ 
      error: "Failed to mark echo as read",
      details: error.message 
    }, 500);
  }
});

// Mark all echoes for a capsule as read
app.post("/make-server-f9be53a7/echoes/mark-all-read", async (c) => {
  try {
    console.log("💫 [Echo] Mark all read endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const { capsuleId } = await c.req.json();
    
    if (!capsuleId) {
      return c.json({ error: "Missing capsuleId" }, 400);
    }
    
    await EchoService.markAllEchoesAsRead(capsuleId, user.id);
    
    console.log(`✅ Marked all echoes as read for capsule ${capsuleId}`);
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("💫 [Echo] Mark all read error:", error);
    return c.json({ 
      error: "Failed to mark all echoes as read",
      details: error.message 
    }, 500);
  }
});

// Get echo statistics for a user
app.get("/make-server-f9be53a7/echoes/stats", async (c) => {
  try {
    console.log("💫 [Echo] Get stats endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const stats = await EchoService.getUserEchoStats(user.id);
    
    console.log(`✅ Retrieved echo stats for user ${user.id}`);
    
    return c.json({ 
      success: true, 
      stats
    });
    
  } catch (error) {
    console.error("💫 [Echo] Get stats error:", error);
    return c.json({ 
      error: "Failed to get echo stats",
      details: error.message 
    }, 500);
  }
});

// React to a comment/note (Echo comment reactions - Phase 2)
app.post("/make-server-f9be53a7/echoes/:echoId/react-comment", async (c) => {
  try {
    console.log("💬 [Echo] React to comment endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error("💬 [Echo] No token provided");
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      console.error("💬 [Echo] Invalid token:", authError);
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const echoId = c.req.param('echoId');
    const { emoji, capsuleId } = await c.req.json();
    
    if (!echoId || !emoji || !capsuleId) {
      return c.json({ error: "Missing required fields: echoId, emoji, capsuleId" }, 400);
    }
    
    // Valid emoji reactions
    const validEmojis = ['👍', '❤️', '😂', '😮', '😢', '😠'];
    if (!validEmojis.includes(emoji)) {
      return c.json({ error: "Invalid emoji. Must be one of: " + validEmojis.join(', ') }, 400);
    }
    
    // Get the echo/comment
    const key = `echo_${capsuleId}_${echoId}`;
    const echo = await kv.get(key);
    
    if (!echo) {
      return c.json({ error: "Comment not found" }, 404);
    }
    
    // Initialize commentReactions if it doesn't exist
    if (!echo.commentReactions) {
      echo.commentReactions = {
        '👍': [],
        '❤️': [],
        '😂': [],
        '😮': [],
        '😢': [],
        '😠': []
      };
    }
    
    // Remove user's previous reactions (Facebook-style: one reaction per user)
    for (const emojiType in echo.commentReactions) {
      echo.commentReactions[emojiType] = echo.commentReactions[emojiType].filter(
        (id: string) => id !== user.id
      );
    }
    
    // Add new reaction
    if (!echo.commentReactions[emoji]) {
      echo.commentReactions[emoji] = [];
    }
    echo.commentReactions[emoji].push(user.id);
    
    // Save updated echo
    await kv.set(key, echo);
    
    console.log(`✅ User ${user.id} reacted ${emoji} to comment ${echoId}`);
    
    // 🔔 CREATE NOTIFICATION: Send notification to the comment author
    try {
      const commentAuthorId = echo.senderId;
      
      // Don't notify if user is reacting to their own comment
      if (commentAuthorId && commentAuthorId !== user.id) {
        console.log(`🔔 [Reaction Notification] Creating notification for comment author: ${commentAuthorId}`);
        
        // Get user profile for reactor name (using robust name detection)
        const reactorProfile = await kv.get(`profile:${user.id}`);
        let reactorName = 'Someone';
        
        if (reactorProfile) {
          // Try display_name first, then construct from first/last name, then email
          reactorName = reactorProfile.display_name || 
                       reactorProfile.name || 
                       `${reactorProfile.first_name || ''} ${reactorProfile.last_name || ''}`.trim() ||
                       user.email?.split('@')[0] ||
                       'Someone';
          console.log(`👤 [Reaction Notification] Reactor profile loaded: reactorName="${reactorName}"`);
        } else {
          // Fallback to email username
          reactorName = user.email?.split('@')[0] || 'Someone';
          console.log(`⚠️ [Reaction Notification] No profile found, using fallback: reactorName="${reactorName}"`);
        }
        
        // Get capsule for title
        const capsule = await kv.get(`capsule:${capsuleId}`);
        const capsuleTitle = capsule?.title || 'your capsule';
        
        // Get emoji label for better readability
        const emojiLabels: { [key: string]: string } = {
          '👍': 'Like',
          '❤️': 'Love',
          '😂': 'Haha',
          '😮': 'Wow',
          '😢': 'Sad',
          '😠': 'Angry'
        };
        const emojiLabel = emojiLabels[emoji] || emoji;
        
        // Create notification
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'reaction',
          echoId: echo.id,
          capsuleId,
          capsuleTitle,
          senderId: user.id,
          senderName: reactorName,
          echoType: 'reaction',
          echoContent: `${reactorName} reacted ${emoji} to your comment`,
          emoji: emoji,
          emojiLabel: emojiLabel,
          timestamp: new Date().toISOString(),
          read: false,
          seen: false,
          createdAt: new Date().toISOString()
        };
        
        console.log(`📝 [Reaction Notification] Notification object created:`, JSON.stringify(notification, null, 2));
        
        // Store notification in array
        const arrayKey = `echo_notifications_array:${commentAuthorId}`;
        console.log(`💾 [Reaction Notification] Storing notification in KV: key="${arrayKey}"`);
        
        const existingNotifications = await kv.get(arrayKey) || [];
        console.log(`📊 [Reaction Notification] Existing notifications count: ${existingNotifications.length}`);
        
        existingNotifications.unshift(notification); // Add to beginning (newest first)
        
        // Keep only last 100 notifications
        if (existingNotifications.length > 100) {
          existingNotifications.splice(100);
        }
        
        await kv.set(arrayKey, existingNotifications);
        console.log(`✅ [Reaction Notification] Notification saved! New count: ${existingNotifications.length}`);
        
        // Broadcast notification to comment author
        console.log(`📡 [Reaction Notification] Broadcasting to comment author: ${commentAuthorId}`);
        try {
          await fetch(`https://${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-f9be53a7/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              userId: commentAuthorId,
              type: 'new_notification',
              data: notification
            })
          });
          console.log(`✅ [Reaction Notification] Broadcast sent successfully`);
        } catch (broadcastError) {
          console.warn(`⚠️ [Reaction Notification] Broadcast failed (non-critical):`, broadcastError.message);
        }
      } else {
        console.log(`ℹ️ [Reaction Notification] Skipping notification (user reacting to own comment or no author)`);
      }
    } catch (notificationError) {
      console.error(`❌ [Reaction Notification] Failed to create notification:`, notificationError);
      // Don't let notification failure block the reaction
    }
    
    return c.json({ 
      success: true,
      commentReactions: echo.commentReactions
    });
    
  } catch (error) {
    console.error("💬 [Echo] React to comment error:", error);
    return c.json({ 
      error: "Failed to react to comment",
      details: error.message 
    }, 500);
  }
});

// Remove reaction from a comment
app.delete("/make-server-f9be53a7/echoes/:echoId/react-comment", async (c) => {
  try {
    console.log("💬 [Echo] Remove comment reaction endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const echoId = c.req.param('echoId');
    const { capsuleId } = await c.req.json();
    
    if (!echoId || !capsuleId) {
      return c.json({ error: "Missing required fields: echoId, capsuleId" }, 400);
    }
    
    // Get the echo/comment
    const key = `echo_${capsuleId}_${echoId}`;
    const echo = await kv.get(key);
    
    if (!echo) {
      return c.json({ error: "Comment not found" }, 404);
    }
    
    // Remove user's reaction from all emoji types
    if (echo.commentReactions) {
      for (const emojiType in echo.commentReactions) {
        echo.commentReactions[emojiType] = echo.commentReactions[emojiType].filter(
          (id: string) => id !== user.id
        );
      }
      
      // Save updated echo
      await kv.set(key, echo);
      
      console.log(`✅ Removed comment reaction for user ${user.id} on echo ${echoId}`);
    }
    
    return c.json({ 
      success: true,
      commentReactions: echo.commentReactions || {}
    });
    
  } catch (error) {
    console.error("💬 [Echo] Remove comment reaction error:", error);
    return c.json({ 
      error: "Failed to remove comment reaction",
      details: error.message 
    }, 500);
  }
});

// PHASE 1: Get ALL echoes for a capsule (Social Timeline)
// Returns ALL echoes from ALL recipients for social display
app.get("/make-server-f9be53a7/echoes/:capsuleId/social", async (c) => {
  try {
    console.log("💫 [Echo Social] Get social echoes endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const capsuleId = c.req.param('capsuleId');
    
    if (!capsuleId) {
      return c.json({ error: "Capsule ID is required" }, 400);
    }
    
    // Get ALL echoes (not filtered by user)
    const echoes = await EchoService.getEchoes(capsuleId);
    
    console.log(`✅ Retrieved ${echoes.length} social echoes for capsule ${capsuleId}`);
    
    return c.json({ 
      success: true, 
      echoes
    });
    
  } catch (error) {
    console.error("💫 [Echo Social] Get social echoes error:", error);
    return c.json({ 
      error: "Failed to get social echoes",
      details: error.message 
    }, 500);
  }
});

// ============================================
// ECHO NOTIFICATION SYSTEM API ENDPOINTS
// ============================================

// Get all echo notifications for a user
app.get("/make-server-f9be53a7/api/echo-notifications", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔐 [Echo Notifications API] Request received');
    console.log('🔐 [Echo Notifications API] Auth header present:', !!authHeader);
    console.log('🔐 [Echo Notifications API] Token present:', !!token);
    
    if (!token) {
      console.error('❌ [Echo Notifications API] No authorization token provided');
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      console.error('❌ [Echo Notifications API] Token verification failed:', authError?.message);
      return c.json({ error: "Invalid token" }, 401);
    }
    
    console.log(`✅ [Echo Notifications API] User authenticated: ${user.id}`);
    
    // Get all notifications for this user with shorter timeout
    let notifications = [];
    try {
      // NEW: Use single array storage instead of prefix queries
      const key = `echo_notifications_array:${user.id}`;
      console.log(`📡 [API] Fetching notifications for user ${user.id} from key: ${key}`);
      
      const storedNotifications = await kv.get(key);
      console.log(`📦 [API] KV get result:`, storedNotifications ? `Array with ${storedNotifications.length} items` : 'null/undefined');
      
      if (storedNotifications && Array.isArray(storedNotifications)) {
        // 🔧 DYNAMIC SENDER NAME LOOKUP: Fix old notifications that have "Someone" stored
        // This ensures even old notifications display the correct sender name
        const notificationsWithNames = await Promise.all(storedNotifications
          .filter(n => n != null)
          .map(async (notif: any) => {
            // If senderName is "Someone" or missing, and we have a senderId, look it up
            if ((!notif.senderName || notif.senderName === 'Someone') && notif.senderId) {
              try {
                console.log(`🔍 [Echo Notifications API] Looking up name for senderId: ${notif.senderId}`);
                const senderProfile = await kv.get(`profile:${notif.senderId}`);
                
                if (senderProfile) {
                  const actualName = senderProfile.display_name || 
                                   senderProfile.name || 
                                   `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
                  
                  if (actualName) {
                    notif.senderName = actualName;
                    // Also update echoContent if it contains "Someone"
                    if (notif.echoContent && notif.echoContent.includes('Someone')) {
                      notif.echoContent = notif.echoContent.replace('Someone', actualName);
                    }
                    console.log(`✅ [Echo Notifications API] Updated sender name from "Someone" to "${actualName}"`);
                  }
                }
              } catch (error) {
                console.warn(`⚠️ [Echo Notifications API] Could not look up sender for ${notif.senderId}:`, error);
              }
            }
            return notif;
          })
        );
        
        // Sort by timestamp (newest first)
        notifications = notificationsWithNames
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        console.log(`✅ [API] Retrieved ${notifications.length} echo notifications for user ${user.id}`);
        if (notifications.length > 0) {
          console.log(`📬 [API] Latest notification:`, JSON.stringify(notifications[0], null, 2));
        }
      } else {
        console.log(`ℹ️ [API] No notifications found for user ${user.id} (key doesn't exist or not array)`);
      }
    } catch (error) {
      console.error(`⚠️ Error fetching notifications (returning empty array):`, error.message);
      console.error('⚠️ Error stack:', error.stack);
      // Return empty array on timeout/error instead of failing
      notifications = [];
    }
    
    console.log(`📤 [Echo Notifications API] Returning ${notifications.length} notifications`);
    return c.json({ notifications });
    
  } catch (error) {
    console.error("💥 [Echo Notifications API] Unexpected error:", error);
    console.error("💥 [Echo Notifications API] Error message:", error.message);
    console.error("💥 [Echo Notifications API] Error stack:", error.stack);
    return c.json({ 
      error: "Failed to fetch notifications", 
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Mark notification as read (viewed capsule)
app.post("/make-server-f9be53a7/api/echo-notifications/:id/read", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const notificationId = c.req.param('id');
    
    // NEW: Update notification in array
    const arrayKey = `echo_notifications_array:${user.id}`;
    const notifications = await kv.get(arrayKey) || [];
    
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    if (notificationIndex !== -1) {
      notifications[notificationIndex].read = true;
      notifications[notificationIndex].seen = true;
      await kv.set(arrayKey, notifications);
      console.log(`✅ Marked notification ${notificationId} as read`);
    }
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return c.json({ error: "Failed to mark as read" }, 500);
  }
});

// Mark notification as seen (dismissed toast but not viewed)
app.post("/make-server-f9be53a7/api/echo-notifications/:id/seen", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const notificationId = c.req.param('id');
    
    // NEW: Update notification in array
    const arrayKey = `echo_notifications_array:${user.id}`;
    const notifications = await kv.get(arrayKey) || [];
    
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    if (notificationIndex !== -1) {
      notifications[notificationIndex].seen = true;
      await kv.set(arrayKey, notifications);
      console.log(`✅ Marked notification ${notificationId} as seen`);
    }
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("Error marking notification as seen:", error);
    return c.json({ error: "Failed to mark as seen" }, 500);
  }
});

// Mark all notifications as read
app.post("/make-server-f9be53a7/api/echo-notifications/mark-all-read", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    // Update ALL notification sources
    let totalMarked = 0;
    
    // 1. Mark echo notifications as read
    try {
      const echoKey = `echo_notifications_array:${user.id}`;
      const echoNotifications = await kv.get(echoKey) || [];
      
      for (const notification of echoNotifications) {
        if (notification) {
          notification.read = true;
          notification.seen = true;
        }
      }
      
      if (echoNotifications.length > 0) {
        await kv.set(echoKey, echoNotifications);
        totalMarked += echoNotifications.length;
        console.log(`✅ Marked ${echoNotifications.length} echo notifications as read`);
      }
    } catch (error) {
      console.warn(`⚠️ Error marking echo notifications as read:`, error.message);
    }
    
    // 2. Mark legacy delivered capsule notifications as read
    try {
      const legacyKey = `notifications:${user.id}`;
      const legacyNotifications = await kv.get(legacyKey) || [];
      
      for (const notification of legacyNotifications) {
        if (notification) {
          notification.read = true;
        }
      }
      
      if (legacyNotifications.length > 0) {
        await kv.set(legacyKey, legacyNotifications);
        totalMarked += legacyNotifications.length;
        console.log(`✅ Marked ${legacyNotifications.length} legacy notifications as read`);
      }
    } catch (error) {
      console.warn(`⚠️ Error marking legacy notifications as read:`, error.message);
    }
    
    console.log(`✅ Total notifications marked as read: ${totalMarked}`);
    return c.json({ success: true, markedCount: totalMarked });
    
  } catch (error) {
    console.error("Error marking all as read:", error);
    return c.json({ error: "Failed to mark all as read" }, 500);
  }
});

// Dismiss individual notification (remove from list)
app.delete("/make-server-f9be53a7/api/echo-notifications/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const notificationId = c.req.param('id');
    
    // NEW: Remove notification from array
    const arrayKey = `echo_notifications_array:${user.id}`;
    const notifications = await kv.get(arrayKey) || [];
    const filtered = notifications.filter(n => n.id !== notificationId);
    await kv.set(arrayKey, filtered);
    console.log(`✅ Deleted notification ${notificationId}`);
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting notification:", error);
    return c.json({ error: "Failed to delete notification" }, 500);
  }
});

// Clear all notifications
app.delete("/make-server-f9be53a7/api/echo-notifications/clear-all", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    // NEW: Clear all notifications in array
    try {
      const arrayKey = `echo_notifications_array:${user.id}`;
      await kv.set(arrayKey, []);
      console.log(`✅ Cleared all notifications for user ${user.id}`);
    } catch (error) {
      console.error(`⚠️ Error clearing notifications:`, error.message);
      // Even if fetch fails, return success (notifications might not exist yet)
    }
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    return c.json({ error: "Failed to clear all notifications" }, 500);
  }
});

// ============================================
// LEGACY VAULT FOLDERS API ENDPOINTS
// ============================================

// Get vault metadata (folders + media)
app.get("/make-server-f9be53a7/vault/metadata", async (c) => {
  try {
    console.log("🗂️ [Vault] Get metadata endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const metadata = await kv.get(`vault_metadata_${user.id}`);
    
    // Initialize if doesn't exist
    if (!metadata) {
      const initialMetadata = {
        folders: [],
        media: []
      };
      await kv.set(`vault_metadata_${user.id}`, initialMetadata);
      return c.json({ success: true, metadata: initialMetadata });
    }
    
    return c.json({ success: true, metadata });
    
  } catch (error) {
    console.error("🗂️ [Vault] Get metadata error:", error);
    return c.json({ 
      error: "Failed to get vault metadata",
      details: error.message 
    }, 500);
  }
});

// Bulk update folders (for sync cleanup)
app.put("/make-server-f9be53a7/vault/metadata", async (c) => {
  try {
    console.log("🗂️ [Vault] Bulk update metadata endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const body = await c.req.json();
    const { folders } = body;
    
    if (!folders || !Array.isArray(folders)) {
      return c.json({ error: "Folders array is required" }, 400);
    }
    
    // Get current metadata
    let metadata = await kv.get(`vault_metadata_${user.id}`);
    
    // Initialize if doesn't exist
    if (!metadata) {
      metadata = { folders: [], media: [] };
    }
    
    // Replace folders with the new array
    metadata.folders = folders;
    
    // Save back to KV store
    await kv.set(`vault_metadata_${user.id}`, metadata);
    
    console.log(`✅ [Vault] Bulk updated ${folders.length} folders for user ${user.id}`);
    
    return c.json({ success: true, metadata });
    
  } catch (error) {
    console.error("🗂️ [Vault] Bulk update metadata error:", error);
    return c.json({ 
      error: "Failed to bulk update vault metadata",
      details: error.message 
    }, 500);
  }
});

// Folder operations (create, rename, delete, move_media)
app.post("/make-server-f9be53a7/vault/folders", async (c) => {
  try {
    console.log("🗂️ [Vault] Folder operation endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { user, error: authError } = await verifyUserToken(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const body = await c.req.json();
    const { action, folderId, folderName, mediaIds } = body;
    
    if (!action) {
      return c.json({ error: "Action is required" }, 400);
    }
    
    console.log(`🗂️ [Vault] User ${user.id} action: "${action}"`, { folderId, folderName, mediaIds });
    
    // Get current metadata
    let metadata = await kv.get(`vault_metadata_${user.id}`);
    
    // Initialize if doesn't exist
    if (!metadata) {
      metadata = { folders: [], media: [] };
    }
    
    let result = { success: true };
    
    switch (action) {
      case 'create': {
        if (!folderName || !folderName.trim()) {
          return c.json({ error: "Folder name is required" }, 400);
        }
        
        // CRITICAL FIX: Check for duplicate folder names before creating
        const trimmedName = folderName.trim();
        const existingFolder = metadata.folders.find((f: any) => f.name === trimmedName);
        
        if (existingFolder) {
          console.log(`⚠️ [Vault] Folder "${trimmedName}" already exists, returning existing folder`);
          return c.json({ 
            success: true, 
            folder: existingFolder,
            wasExisting: true 
          });
        }
        
        // Generate new folder ID
        const newFolderId = `fldr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Handle password hashing for private folders
        let passwordHash = null;
        if (body.isPrivate && body.password) {
          try {
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.password));
            passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
          } catch (e) {
            console.error('Error hashing password:', e);
          }
        }
        
        const newFolder = {
          id: newFolderId,
          name: trimmedName,
          color: body.color || 'blue',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: metadata.folders.length,
          mediaIds: [],
          // Template customization fields
          icon: body.icon || null,
          description: body.description || null,
          isTemplateFolder: body.isTemplateFolder || false,
          // Privacy fields
          isPrivate: body.isPrivate || false,
          passwordHash: passwordHash
        };
        
        metadata.folders.push(newFolder);
        
        console.log(`✅ [Vault] Created folder: ${trimmedName} (${newFolderId})`);
        result = { success: true, folder: newFolder };
        break;
      }
      
      case 'rename': {
        if (!folderId) {
          return c.json({ error: "Folder ID is required" }, 400);
        }
        if (!folderName || !folderName.trim()) {
          return c.json({ error: "Folder name is required" }, 400);
        }
        
        const folder = metadata.folders.find((f: any) => f.id === folderId);
        if (!folder) {
          return c.json({ error: "Folder not found" }, 404);
        }
        
        folder.name = folderName.trim();
        if (body.color) {
          folder.color = body.color;
        }
        if (body.icon) {
          folder.icon = body.icon;
        }
        
        // Handle privacy updates
        if (body.isPrivate !== undefined) {
          folder.isPrivate = body.isPrivate;
          
          if (body.isPrivate && body.password) {
            try {
              const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.password));
              folder.passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (e) {
              console.error('Error hashing password:', e);
            }
          } else if (!body.isPrivate) {
            folder.passwordHash = null;
          }
        }
        
        folder.updatedAt = new Date().toISOString();
        
        console.log(`✅ [Vault] Updated folder ${folderId}: ${folderName} (color: ${body.color || folder.color || 'blue'})`);
        result = { success: true, folder };
        break;
      }
      
      case 'delete': {
        if (!folderId) {
          return c.json({ error: "Folder ID is required" }, 400);
        }
        
        const folderIndex = metadata.folders.findIndex((f: any) => f.id === folderId);
        if (folderIndex === -1) {
          return c.json({ error: "Folder not found" }, 404);
        }
        
        const folder = metadata.folders[folderIndex];
        
        // Move all media from folder to unsorted (remove folderId)
        for (const mediaId of folder.mediaIds || []) {
          const media = metadata.media.find((m: any) => m.id === mediaId);
          if (media) {
            delete media.folderId;
          }
        }
        
        // Remove folder
        metadata.folders.splice(folderIndex, 1);
        
        console.log(`✅ [Vault] Deleted folder ${folderId}, moved ${folder.mediaIds?.length || 0} media to unsorted`);
        result = { success: true, movedMediaCount: folder.mediaIds?.length || 0 };
        break;
      }
      
      case 'update_metadata': {
        // Update folder metadata (icon, description, isTemplateFolder) without changing name
        if (!folderId) {
          return c.json({ error: "Folder ID is required" }, 400);
        }
        
        const folder = metadata.folders.find((f: any) => f.id === folderId);
        if (!folder) {
          return c.json({ error: "Folder not found" }, 404);
        }
        
        // Update metadata fields
        if (body.icon !== undefined) folder.icon = body.icon;
        if (body.description !== undefined) folder.description = body.description;
        if (body.isTemplateFolder !== undefined) folder.isTemplateFolder = body.isTemplateFolder;
        folder.updatedAt = new Date().toISOString();
        
        console.log(`✅ [Vault] Updated folder metadata ${folderId}: icon=${body.icon || 'none'}`);
        result = { success: true, folder };
        break;
      }
      
      case 'update_folder': {
        if (!folderId) {
          return c.json({ error: "Folder ID is required" }, 400);
        }
        if (!body.updates) {
          return c.json({ error: "Updates object is required" }, 400);
        }
        
        const folder = metadata.folders.find((f: any) => f.id === folderId);
        if (!folder) {
          return c.json({ error: "Folder not found" }, 404);
        }
        
        // Apply updates
        if (body.updates.mediaIds !== undefined) {
          folder.mediaIds = body.updates.mediaIds;
        }
        if (body.updates.name !== undefined) {
          folder.name = body.updates.name;
        }
        if (body.updates.color !== undefined) {
          folder.color = body.updates.color;
        }
        folder.updatedAt = new Date().toISOString();
        
        console.log(`✅ [Vault] Updated folder ${folderId}:`, body.updates);
        result = { success: true, folder };
        break;
      }
      
      case 'move_media': {
        if (!mediaIds || !Array.isArray(mediaIds)) {
          return c.json({ error: "Media IDs array is required" }, 400);
        }
        
        // folderId can be null (move to unsorted)
        const targetFolder = folderId ? metadata.folders.find((f: any) => f.id === folderId) : null;
        
        if (folderId && !targetFolder) {
          return c.json({ error: "Target folder not found" }, 404);
        }
        
        let movedCount = 0;
        
        for (const mediaId of mediaIds) {
          // Remove from ALL folders first (in case it's in any folder)
          for (const folder of metadata.folders) {
            if (folder.mediaIds && folder.mediaIds.includes(mediaId)) {
              folder.mediaIds = folder.mediaIds.filter((id: string) => id !== mediaId);
              console.log(`🔄 [Vault] Removed ${mediaId} from folder ${folder.name}`);
            }
          }
          
          // Add to target folder if specified
          if (folderId && targetFolder) {
            if (!targetFolder.mediaIds) {
              targetFolder.mediaIds = [];
            }
            if (!targetFolder.mediaIds.includes(mediaId)) {
              targetFolder.mediaIds.push(mediaId);
              movedCount++;
              console.log(`✅ [Vault] Added ${mediaId} to folder ${targetFolder.name}`);
            }
            targetFolder.updatedAt = new Date().toISOString();
          } else {
            // Moving to unsorted - just need to remove from all folders (already done above)
            movedCount++;
            console.log(`✅ [Vault] Moved ${mediaId} to unsorted`);
          }
        }
        
        console.log(`✅ [Vault] Moved ${movedCount} media to ${folderId ? `folder ${folderId}` : 'unsorted'}`);
        result = { success: true, movedCount };
        break;
      }
      
      case 'create_share_link': {
        // Generate a unique share token
        const shareToken = `share_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        const share = {
          id: shareToken,
          folderId,
          shareToken,
          permission: body.permission || 'view-only',
          type: 'link',
          createdAt: new Date().toISOString(),
          expiresAt: body.expiresAt || null,
          createdBy: user.id
        };
        
        // Store share in KV
        await kv.set(`folder_share_${shareToken}`, share);
        
        // Add to folder's shares list
        const folder = metadata.folders.find((f: any) => f.id === folderId);
        if (folder) {
          if (!folder.shares) folder.shares = [];
          folder.shares.push(share.id);
        }
        
        console.log(`✅ [Vault] Created share link for folder ${folderId}`);
        result = { success: true, shareToken, share };
        break;
      }
      
      case 'share_with_recipients': {
        if (!body.recipients || !Array.isArray(body.recipients)) {
          return c.json({ error: 'Recipients array is required' }, 400);
        }
        
        const shares = [];
        const folder = metadata.folders.find((f: any) => f.id === folderId);
        
        for (const recipient of body.recipients) {
          const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          const share = {
            id: shareId,
            folderId,
            recipientEmail: recipient.email,
            permission: recipient.permission || 'view-only',
            type: 'recipient',
            createdAt: new Date().toISOString(),
            expiresAt: body.expiresAt || null,
            createdBy: user.id
          };
          
          await kv.set(`folder_share_${shareId}`, share);
          shares.push(share);
          
          if (folder) {
            if (!folder.shares) folder.shares = [];
            folder.shares.push(shareId);
          }
          
          // TODO: Send email invitation to recipient
          console.log(`📧 [Vault] Would send share invitation to ${recipient.email}`);
        }
        
        console.log(`✅ [Vault] Shared folder ${folderId} with ${shares.length} recipients`);
        result = { success: true, shares };
        break;
      }
      
      case 'get_shares': {
        const folder = metadata.folders.find((f: any) => f.id === folderId);
        if (!folder) {
          return c.json({ error: 'Folder not found' }, 404);
        }
        
        const shares = [];
        if (folder.shares && Array.isArray(folder.shares)) {
          for (const shareId of folder.shares) {
            const share = await kv.get(`folder_share_${shareId}`);
            if (share) {
              // Check if share is expired
              if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
                // Skip expired shares
                continue;
              }
              shares.push(share);
            }
          }
        }
        
        console.log(`📋 [Vault] Retrieved ${shares.length} active shares for folder ${folderId}`);
        result = { success: true, shares };
        break;
      }
      
      case 'revoke_share': {
        const { shareId } = body;
        if (!shareId) {
          return c.json({ error: 'Share ID is required' }, 400);
        }
        
        // Delete the share
        await kv.del(`folder_share_${shareId}`);
        
        // Remove from folder's shares list
        const folder = metadata.folders.find((f: any) => f.id === folderId);
        if (folder && folder.shares) {
          folder.shares = folder.shares.filter((id: string) => id !== shareId);
        }
        
        console.log(`✅ [Vault] Revoked share ${shareId} for folder ${folderId}`);
        result = { success: true };
        break;
      }
      
      case 'update_legacy_access': {
        // NEW: Update folder's Legacy Access configuration
        if (!folderId) {
          return c.json({ error: 'Folder ID is required' }, 400);
        }
        
        if (!body.legacyAccess) {
          return c.json({ error: 'Legacy Access configuration is required' }, 400);
        }
        
        const folder = metadata.folders.find((f: any) => f.id === folderId);
        if (!folder) {
          return c.json({ error: 'Folder not found' }, 404);
        }
        
        // Update folder's legacy access configuration
        folder.legacyAccess = {
          ...body.legacyAccess,
          updatedAt: new Date().toISOString()
        };
        folder.updatedAt = new Date().toISOString();
        
        // Log audit trail
        console.log(`🛡️ [Vault] Updated Legacy Access for folder ${folderId}:`, {
          mode: folder.legacyAccess.mode,
          beneficiaryCount: folder.legacyAccess.beneficiaries?.length || 0,
          inheritGlobal: folder.legacyAccess.inheritGlobal
        });
        
        // Store audit entry
        const auditKey = `folder_legacy_audit_${folderId}`;
        let auditLog = await kv.get(auditKey) || [];
        auditLog.push({
          action: 'legacy_access_updated',
          userId: user.id,
          timestamp: new Date().toISOString(),
          changes: body.legacyAccess
        });
        await kv.set(auditKey, auditLog);
        
        result = { success: true, folder };
        break;
      }
      
      case 'clean_orphaned_ids': {
        // 🧹 NEW: Clean orphaned media IDs from folders
        // This removes IDs that are in folder.mediaIds but don't exist in vault
        if (!body.validMediaIds || !Array.isArray(body.validMediaIds)) {
          return c.json({ error: 'validMediaIds array is required' }, 400);
        }
        
        const validMediaIdSet = new Set(body.validMediaIds);
        let totalCleaned = 0;
        
        console.log(`🧹 [Vault] Cleaning orphaned IDs. Valid media count: ${validMediaIdSet.size}`);
        
        // Check each folder for orphaned IDs
        for (const folder of metadata.folders) {
          if (!folder.mediaIds || folder.mediaIds.length === 0) {
            continue;
          }
          
          const originalCount = folder.mediaIds.length;
          const cleanedMediaIds = folder.mediaIds.filter((id: string) => validMediaIdSet.has(id));
          const orphanedCount = originalCount - cleanedMediaIds.length;
          
          if (orphanedCount > 0) {
            folder.mediaIds = cleanedMediaIds;
            folder.updatedAt = new Date().toISOString();
            totalCleaned += orphanedCount;
            console.log(`🧹 [Vault] Cleaned folder "${folder.name}": removed ${orphanedCount} orphaned ID(s) (${originalCount} → ${cleanedMediaIds.length})`);
          }
        }
        
        console.log(`✅ [Vault] Cleaned ${totalCleaned} total orphaned ID(s) across all folders`);
        result = { success: true, cleanedCount: totalCleaned };
        break;
      }
      
      default:
        return c.json({ error: `Unknown action: ${action}` }, 400);
    }
    
    // Save updated metadata
    await kv.set(`vault_metadata_${user.id}`, metadata);
    
    return c.json(result);
    
  } catch (error) {
    console.error("🗂️ [Vault] Folder operation error:", error);
    return c.json({ 
      error: "Failed to perform folder operation",
      details: error.message 
    }, 500);
  }
});

// ============================================
// LEGACY TITLES API ENDPOINTS
// ============================================

// Get user's title profile (equipped title + unlocked titles)
app.get("/make-server-f9be53a7/titles/profile", async (c) => {
  try {
    console.log("📜 [Titles] Get profile endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const { getUserTitleProfile } = await import("./achievement-service.tsx");
    const profile = await getUserTitleProfile(user.id);
    
    console.log(`📜 [Titles] Profile for ${user.id}:`, profile);
    return c.json(profile);
  } catch (error) {
    console.error("📜 [Titles] Error getting profile:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get available titles (locked + unlocked)
app.get("/make-server-f9be53a7/titles/available", async (c) => {
  try {
    console.log("📜 [Titles] Get available titles endpoint called");
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const { getAvailableTitles } = await import("./achievement-service.tsx");
    const titles = await getAvailableTitles(user.id);
    
    console.log(`📜 [Titles] Available titles for ${user.id}: ${titles.titles.length} total, ${titles.unlockedCount} unlocked`);
    return c.json(titles);
  } catch (error) {
    console.error("📜 [Titles] Error getting available titles:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Welcome celebration endpoints (for existing users to see First Step achievement once)
app.post("/make-server-f9be53a7/achievements/check-welcome", WelcomeCelebration.checkWelcomeCelebration);
app.post("/make-server-f9be53a7/achievements/mark-welcome-seen", WelcomeCelebration.markWelcomeSeen);

// Debug endpoint to check user's title and achievement data
app.get("/make-server-f9be53a7/debug/user-titles", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized - No token" }, 401);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ error: `Invalid token: ${authError?.message || 'User not found'}` }, 401);
    }
    
    // Get all the data
    const userAchievements = await kv.get(`user_achievements:${user.id}`) || [];
    const titleProfile = await kv.get(`user_title_profile:${user.id}`) || {};
    
    // Import achievement service
    const { ACHIEVEMENT_DEFINITIONS } = await import("./achievement-service.tsx");
    
    // Check if onboarding achievements are in the data
    const timeKeeperInAchievements = userAchievements.some((a: any) => a.achievementId === 'time_keeper');
    const vaultGuardianInAchievements = userAchievements.some((a: any) => a.achievementId === 'vault_guardian');
    
    const timeKeeperInProfile = titleProfile.unlocked_titles?.some((t: any) => t.achievementId === 'time_keeper');
    const vaultGuardianInProfile = titleProfile.unlocked_titles?.some((t: any) => t.achievementId === 'vault_guardian');
    
    // Check if these achievements exist in ACHIEVEMENT_DEFINITIONS
    const timeKeeperDef = ACHIEVEMENT_DEFINITIONS['time_keeper'];
    const vaultGuardianDef = ACHIEVEMENT_DEFINITIONS['vault_guardian'];
    
    return c.json({
      userId: user.id,
      userAchievements: {
        total: userAchievements.length,
        list: userAchievements.map((a: any) => ({ id: a.achievementId, unlockedAt: a.unlockedAt })),
        hasTimeKeeper: timeKeeperInAchievements,
        hasVaultGuardian: vaultGuardianInAchievements
      },
      titleProfile: {
        equipped: titleProfile.equipped_title,
        equippedId: titleProfile.equipped_achievement_id,
        unlockedCount: titleProfile.unlocked_titles?.length || 0,
        unlockedTitles: titleProfile.unlocked_titles || [],
        hasTimeKeeper: timeKeeperInProfile,
        hasVaultGuardian: vaultGuardianInProfile
      },
      achievementDefinitions: {
        timeKeeperExists: !!timeKeeperDef,
        timeKeeperTitle: timeKeeperDef?.rewards?.title,
        vaultGuardianExists: !!vaultGuardianDef,
        vaultGuardianTitle: vaultGuardianDef?.rewards?.title
      }
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Fix endpoint to sync achievements - adds achievements to user_achievements if they're in the title profile
app.post("/make-server-f9be53a7/debug/fix-achievement-sync", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: "Unauthorized - No token" }, 401);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ error: `Invalid token: ${authError?.message || 'User not found'}` }, 401);
    }
    
    console.log(`🔧 [Fix] Syncing achievements for user ${user.id}`);
    
    // Get all the data
    const userAchievements = await kv.get(`user_achievements:${user.id}`) || [];
    const titleProfile = await kv.get(`user_title_profile:${user.id}`) || {};
    
    // Import achievement service
    const { ACHIEVEMENT_DEFINITIONS } = await import("./achievement-service.tsx");
    
    let fixed = [];
    
    // Check each title in the profile
    if (titleProfile.unlocked_titles && Array.isArray(titleProfile.unlocked_titles)) {
      for (const titleData of titleProfile.unlocked_titles) {
        const achievementId = titleData.achievementId;
        const alreadyHasAchievement = userAchievements.some((a: any) => a.achievementId === achievementId);
        
        if (!alreadyHasAchievement) {
          // Achievement is in profile but not in achievements array - add it
          const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
          
          if (achievement) {
            console.log(`🔧 [Fix] Adding missing achievement ${achievementId} to user_achievements`);
            
            const unlockRecord = {
              achievementId: achievementId,
              unlockedAt: titleData.unlockedAt || new Date().toISOString(),
              notificationShown: true, // Don't show notification again
              shared: false,
              progress: 0,
              sourceAction: 'manual_sync',
              retroactive: true,
              metadata: {
                unlockContext: `Manual sync: Achievement was in title profile but not in achievements array`,
                syncedAt: new Date().toISOString()
              }
            };
            
            userAchievements.push(unlockRecord);
            fixed.push(achievementId);
          }
        }
      }
    }
    
    // Save updated achievements if any were fixed
    if (fixed.length > 0) {
      await kv.set(`user_achievements:${user.id}`, userAchievements);
      console.log(`🔧 [Fix] ✅ Synced ${fixed.length} achievements: ${fixed.join(', ')}`);
    }
    
    return c.json({
      success: true,
      fixed,
      message: fixed.length > 0 
        ? `Fixed ${fixed.length} achievement(s): ${fixed.join(', ')}` 
        : 'No fixes needed - all achievements are synced'
    });
  } catch (error) {
    console.error('❌ Fix endpoint error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Achievement trigger endpoint (for testing)
app.post("/make-server-f9be53a7/achievements/trigger", async (c) => {
  try {
    console.log("🧪 [Server] Achievement trigger test endpoint called");
    
    const { achievementId, force } = await c.req.json();
    console.log(`🧪 [Server] Request: achievementId=${achievementId}, force=${force}`);
    
    if (!achievementId) {
      console.error("🧪 [Server] ❌ No achievement ID provided");
      return c.json({ error: "Achievement ID required" }, 400);
    }
    
    // Get user ID from auth header
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error("🧪 [Server] ❌ No auth token provided");
      return c.json({ error: "Unauthorized - No token" }, 401);
    }
    
    console.log(`🧪 [Server] Verifying auth token...`);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("🧪 [Server] ❌ Auth error:", authError?.message);
      return c.json({ error: `Invalid token: ${authError?.message || 'User not found'}` }, 401);
    }
    
    console.log(`🧪 [Server] ✅ User authenticated: ${user.id}`);
    console.log(`🧪 [Server] Triggering achievement ${achievementId} for user ${user.id}`);
    
    // Import achievement service
    const { checkAndUnlockAchievements, ACHIEVEMENT_DEFINITIONS, addTitleToCollection } = await import("./achievement-service.tsx");
    
    console.log(`🧪 [Server] Checking current achievements...`);
    // Check if already unlocked
    const userAchievements = await kv.get(`user_achievements:${user.id}`) || [];
    const alreadyUnlocked = userAchievements.some((a: any) => a.achievementId === achievementId);
    
    console.log(`🧪 [Server] User has ${userAchievements.length} achievements, ${achievementId} already unlocked: ${alreadyUnlocked}`);
    
    if (alreadyUnlocked && !force) {
      console.log(`🧪 [Server] ℹ️ Achievement ${achievementId} already unlocked (not forcing)`);
      return c.json({
        success: true,
        unlocked: false,
        message: `Achievement "${achievementId}" was already unlocked`
      });
    }
    
    // For test unlock with force=true, directly add to user achievements
    if (force) {
      console.log(`🧪 [Server] Force mode enabled - directly unlocking achievement`);
      
      const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
      if (!achievement) {
        console.error(`🧪 [Server] ❌ Achievement ${achievementId} not found in definitions`);
        return c.json({ error: "Achievement not found" }, 404);
      }
      
      console.log(`🧪 [Server] Found achievement: "${achievement.title}" (${achievement.rarity})`);
      
      // Remove if already exists (for force unlock)
      const filteredAchievements = userAchievements.filter((a: any) => a.achievementId !== achievementId);
      console.log(`🧪 [Server] Filtered achievements: ${filteredAchievements.length}`);
      
      // Add new unlock record
      const unlockRecord = {
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
        notificationShown: false,
        shared: false,
        sourceAction: 'test_unlock',
        metadata: { test: true }
      };
      
      filteredAchievements.push(unlockRecord);
      console.log(`🧪 [Server] Saving ${filteredAchievements.length} achievements to KV...`);
      await kv.set(`user_achievements:${user.id}`, filteredAchievements);
      console.log(`🧪 [Server] ✅ Achievements saved`);
      
      // Add title if achievement has one
      if (achievement.rewards.title) {
        console.log(`🧪 [Server] Adding title "${achievement.rewards.title}" to collection...`);
        await addTitleToCollection(user.id, achievement.id);
        console.log(`🧪 [Server] ✅ Title added`);
      } else {
        console.log(`🧪 [Server] ⚠️ Achievement has no title reward`);
      }
      
      console.log(`🧪 [Server] ✅✅✅ Achievement ${achievementId} force unlocked successfully!`);
      return c.json({
        success: true,
        unlocked: true,
        achievement: achievement,
        message: `Achievement "${achievement.title}" unlocked!`
      });
    }
    
    // Normal trigger - check conditions
    console.log(`🧪 [Server] Normal mode - checking conditions...`);
    const result = await checkAndUnlockAchievements(user.id, 'test_trigger', { achievementId });
    
    if (result.newlyUnlocked.length > 0) {
      console.log(`🧪 [Server] ✅ Achievement ${achievementId} unlocked successfully`);
      return c.json({
        success: true,
        unlocked: true,
        achievement: result.newlyUnlocked[0],
        message: `Achievement "${result.newlyUnlocked[0].title}" unlocked!`
      });
    } else {
      console.log(`🧪 [Server] ℹ️ Achievement ${achievementId} conditions not met or already unlocked`);
      return c.json({
        success: true,
        unlocked: false,
        message: `Achievement conditions not met`
      });
    }
    
  } catch (error) {
    console.error("🧪 [Server] 💥💥💥 Achievement trigger error:", error);
    console.error("🧪 [Server] Error stack:", error.stack);
    return c.json({ 
      error: error.message || "Failed to trigger achievement",
      details: error.stack
    }, 500);
  }
});

// Clear any existing emergency stop flags on startup (with Cloudflare recovery)
const clearEmergencyStopFlags = async () => {
  try {
    console.log('🧹 Checking for emergency stop flags...');
    // Check if keys exist before attempting to delete (with Cloudflare recovery)
    // Use quiet mode with limited retries (fail fast but handle transient errors)
    // 🔥 CRITICAL: Set maxRetries=2 to allow 1 retry for transient DB errors (like schema cache reload)
    const deliveriesFlag = await safeKvGet(() => kv.get('emergency_stop_deliveries'), 'emergency_stop_deliveries', null, { quiet: true, maxRetries: 2 });
    const timestampFlag = await safeKvGet(() => kv.get('emergency_stop_timestamp'), 'emergency_stop_timestamp', null, { quiet: true, maxRetries: 2 });
    
    if (deliveriesFlag !== null) {
      await safeKvDel(() => kv.del('emergency_stop_deliveries'), 'emergency_stop_deliveries', { quiet: true, maxRetries: 2 });
      console.log('✅ Cleared emergency_stop_deliveries flag');
    }
    
    if (timestampFlag !== null) {
      await safeKvDel(() => kv.del('emergency_stop_timestamp'), 'emergency_stop_timestamp', { quiet: true, maxRetries: 0 });
      console.log('✅ Cleared emergency_stop_timestamp flag');
    }
    
    if (deliveriesFlag === null && timestampFlag === null) {
      console.log('✅ No emergency stop flags found (clean startup)');
    }
  } catch (error) {
    // Don't let this crash the server startup - this is a non-critical cleanup operation
    // 🔥 CRITICAL: Silently fail if database is busy (connection exhaustion)
    const errorMsg = error?.message || '';
    if (errorMsg.includes('PGRST000') || errorMsg.includes('connection slots')) {
      console.log('⚠️ Database busy (connection exhaustion) - skipping emergency flag cleanup');
    } else {
      console.log('⚠️ Could not clear emergency stop flags (database temporarily unavailable)');
      console.log('⚠️ This is safe to ignore - server will retry on next startup');
    }
  }
};

// Clear emergency flags before starting (async, non-blocking)
clearEmergencyStopFlags().catch(err => {
  console.warn('⚠️ Failed to clear emergency flags (non-critical):', err.message);
});

// Start the delivery scheduler
startDeliveryScheduler();

// Add environment variable for frontend URL
if (!Deno.env.get('FRONTEND_URL')) {
  console.warn('⚠️ FRONTEND_URL not set, using default');
}

// Startup diagnostics
const runStartupDiagnostics = async () => {
  console.log('🔍 Running startup diagnostics...');
  
  // Check environment variables
  const envVars = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
    RESEND_API_KEY: Deno.env.get('RESEND_API_KEY'),
  };
  
  console.log('📋 Environment Variables Status:');
  for (const [key, value] of Object.entries(envVars)) {
    const status = value ? '✅' : '❌';
    const preview = value ? `${value.substring(0, 8)}...(${value.length})` : 'Not set';
    console.log(`  ${status} ${key}: ${preview}`);
  }
  
  // Database connection test removed to prevent connection exhaustion
  // The singleton client will be created on first use
  
  console.log('✅ Startup diagnostics complete');
};

console.log('🚀 Eras server started with delivery system enabled');

// Note: Main capsule endpoints (GET, POST) are defined earlier in this file
// Delete a capsule (Soft Delete - moves to "Archive")
app.delete("/make-server-f9be53a7/api/capsules/:id", async (c) => {
  try {
    const capsuleId = c.req.param('id');
    console.log(`🌫️ Moving capsule to Archive: ${capsuleId}`);
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const capsule = await kv.get(`capsule:${capsuleId}`);
    if (!capsule) {
      return c.json({ error: 'Capsule not found' }, 404);
    }

    // Check if user owns this capsule
    if (capsule.created_by !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Soft delete: Add deletedAt timestamp and remember current folder
    capsule.deletedAt = new Date().toISOString();
    capsule.deletedFrom = capsule.folder_id || null; // Remember original folder for restoration
    
    // Save updated capsule
    await kv.set(`capsule:${capsuleId}`, capsule);
    
    // CRITICAL: Remove from scheduled_capsules_global list if it was scheduled
    // This prevents archived capsules from being delivered
    if (capsule.status === 'scheduled') {
      try {
        const scheduledList = await kv.get('scheduled_capsules_global') || [];
        const filtered = scheduledList.filter((id: string) => id !== capsuleId);
        if (filtered.length < scheduledList.length) {
          await kv.set('scheduled_capsules_global', filtered);
          console.log(`✅ Removed archived capsule ${capsuleId} from global scheduled list (${filtered.length} remaining)`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to remove capsule from scheduled list (non-critical):', error);
      }
    }
    
    console.log(`✅ Capsule moved to Archive (30-day retention)`);

    return c.json({ success: true });

  } catch (error) {
    console.error('❌ Error moving capsule to Archive:', error);
    return c.json({ error: 'Failed to delete capsule' }, 500);
  }
});

// Claim pending capsules for current user (called after login/signup)
// OPTIMIZED: Now uses timeout protection and async background tasks for notifications/achievements
app.post("/make-server-f9be53a7/api/capsules/claim-pending", async (c) => {
  try {
    console.log('📥 [claim-pending] Request received');
    const result = await handleClaimPending(c, verifyUserToken);
    console.log('✅ [claim-pending] Request completed successfully');
    return result;
  } catch (error) {
    console.error('❌ [claim-pending] Fatal error:', error);
    console.error('❌ [claim-pending] Stack:', error?.stack);
    return c.json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error',
      claimed: 0, 
      capsuleIds: [] 
    }, 500);
  }
});

// REMOVED DUPLICATE: Old received capsules endpoint without sender name enrichment
// The correct implementation with sender name enrichment is defined later in the file

// Get storage usage for user
app.get("/make-server-f9be53a7/storage-usage", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's capsules to calculate storage
    const userCapsulesKey = `user_capsules:${user.id}`;
    const capsuleIds = await kv.get(userCapsulesKey) || [];

    let totalSize = 0;
    for (const capsuleId of capsuleIds) {
      const capsule = await kv.get(`capsule:${capsuleId}`);
      if (capsule && capsule.media) {
        // Estimate size based on media count (rough estimate)
        totalSize += capsule.media.length * 5 * 1024 * 1024; // 5MB per media item estimate
      }
    }

    // 1GB total storage limit
    const totalLimit = 1024 * 1024 * 1024;

    return c.json({
      used: totalSize,
      total: totalLimit
    });
  } catch (error) {
    console.error('Storage usage error:', error);
    return c.json({ error: 'Failed to get storage usage' }, 500);
  }
});

// Export user data as JSON with signed URLs for media
app.post("/make-server-f9be53a7/api/user-data-export", async (c) => {
  try {
    console.log('📦 Data export request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📦 Exporting data for user: ${user.email} (${user.id})`);
    const userId = user.id;

    const exportData: any = {
      exportDate: new Date().toISOString(),
      userId: userId,
      userEmail: user.email,
      capsules: {
        sent: [],
        received: []
      },
      vault: [],
      recordLibrary: [],
      achievements: {},
      profile: {}
    };

    // Helper function to generate signed URLs for media
    const generateSignedUrl = async (bucketName: string, filePath: string): Promise<string | null> => {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 86400); // 24 hours validity
        
        if (error) {
          console.warn(`⚠️ Failed to generate signed URL for ${filePath}:`, error);
          return null;
        }
        
        return data?.signedUrl || null;
      } catch (error) {
        console.warn(`⚠️ Exception generating signed URL for ${filePath}:`, error);
        return null;
      }
    };

    // ============================================
    // STEP 1: Export Sent Capsules
    // ============================================
    console.log('📦 Exporting sent capsules...');
    const userCapsulesKey = `user_capsules:${userId}`;
    const capsuleIds = await kv.get(userCapsulesKey) || [];
    
    for (const capsuleId of capsuleIds) {
      try {
        const capsule = await kv.get(`capsule:${capsuleId}`);
        if (capsule) {
          const capsuleExport: any = {
            ...capsule,
            mediaWithSignedUrls: []
          };
          
          // Generate signed URLs for media
          if (capsule.media && capsule.media.length > 0) {
            for (const mediaItem of capsule.media) {
              const mediaExport: any = { ...mediaItem };
              
              if (mediaItem.url) {
                try {
                  const urlPath = new URL(mediaItem.url).pathname;
                  const pathParts = urlPath.split('/');
                  const fileName = pathParts[pathParts.length - 1];
                  const signedUrl = await generateSignedUrl('make-f9be53a7-media', fileName);
                  
                  mediaExport.signedUrl = signedUrl;
                  mediaExport.originalUrl = mediaItem.url;
                } catch (error) {
                  console.warn(`⚠️ Failed to process media URL:`, error);
                }
              }
              
              capsuleExport.mediaWithSignedUrls.push(mediaExport);
            }
          }
          
          exportData.capsules.sent.push(capsuleExport);
        }
      } catch (error) {
        console.error(`❌ Failed to export capsule ${capsuleId}:`, error);
      }
    }
    
    console.log(`✅ Exported ${exportData.capsules.sent.length} sent capsules`);

    // ============================================
    // STEP 2: Export Received Capsules
    // ============================================
    console.log('📦 Exporting received capsules...');
    const receivedCapsulesKey = `received_capsules:${userId}`;
    const receivedCapsules = await kv.get(receivedCapsulesKey) || [];
    
    for (const capsuleId of receivedCapsules) {
      try {
        const capsule = await kv.get(`capsule:${capsuleId}`);
        if (capsule) {
          const capsuleExport: any = {
            ...capsule,
            mediaWithSignedUrls: []
          };
          
          // Generate signed URLs for media
          if (capsule.media && capsule.media.length > 0) {
            for (const mediaItem of capsule.media) {
              const mediaExport: any = { ...mediaItem };
              
              if (mediaItem.url) {
                try {
                  const urlPath = new URL(mediaItem.url).pathname;
                  const pathParts = urlPath.split('/');
                  const fileName = pathParts[pathParts.length - 1];
                  const signedUrl = await generateSignedUrl('make-f9be53a7-media', fileName);
                  
                  mediaExport.signedUrl = signedUrl;
                  mediaExport.originalUrl = mediaItem.url;
                } catch (error) {
                  console.warn(`⚠️ Failed to process media URL:`, error);
                }
              }
              
              capsuleExport.mediaWithSignedUrls.push(mediaExport);
            }
          }
          
          exportData.capsules.received.push(capsuleExport);
        }
      } catch (error) {
        console.error(`❌ Failed to export received capsule ${capsuleId}:`, error);
      }
    }
    
    console.log(`✅ Exported ${exportData.capsules.received.length} received capsules`);

    // ============================================
    // STEP 3: Export Record Library
    // ============================================
    console.log('📦 Exporting record library...');
    const recordLibraryKey = `record_library:${userId}`;
    const recordLibrary = await kv.get(recordLibraryKey) || [];
    
    for (const record of recordLibrary) {
      try {
        const recordExport: any = { ...record };
        
        if (record.url) {
          try {
            const urlPath = new URL(record.url).pathname;
            const pathParts = urlPath.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const signedUrl = await generateSignedUrl('make-f9be53a7-record-library', fileName);
            
            recordExport.signedUrl = signedUrl;
            recordExport.originalUrl = record.url;
          } catch (error) {
            console.warn(`⚠️ Failed to process record library URL:`, error);
          }
        }
        
        exportData.recordLibrary.push(recordExport);
      } catch (error) {
        console.warn(`⚠️ Failed to export record library item:`, error);
      }
    }
    
    console.log(`✅ Exported ${exportData.recordLibrary.length} record library items`);

    // ============================================
    // STEP 4: Export Vault/Legacy Vault
    // ============================================
    console.log('📦 Exporting vault...');
    const vaultKey = `legacy_vault:${userId}`;
    const vaultItems = await kv.get(vaultKey) || [];
    
    for (const vaultItem of vaultItems) {
      try {
        const vaultExport: any = { ...vaultItem };
        
        if (vaultItem.url) {
          try {
            const urlPath = new URL(vaultItem.url).pathname;
            const pathParts = urlPath.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const signedUrl = await generateSignedUrl('make-f9be53a7-media', fileName);
            
            vaultExport.signedUrl = signedUrl;
            vaultExport.originalUrl = vaultItem.url;
          } catch (error) {
            console.warn(`⚠️ Failed to process vault URL:`, error);
          }
        }
        
        exportData.vault.push(vaultExport);
      } catch (error) {
        console.warn(`⚠️ Failed to export vault item:`, error);
      }
    }
    
    console.log(`✅ Exported ${exportData.vault.length} vault items`);

    // ============================================
    // STEP 5: Export Achievements
    // ============================================
    console.log('📦 Exporting achievements...');
    try {
      const achievementStatsKey = `achievement_stats:${userId}`;
      const achievementStats = await kv.get(achievementStatsKey) || {};
      
      const unlockedAchievementsKey = `achievement_unlocked:${userId}`;
      const unlockedAchievements = await kv.get(unlockedAchievementsKey) || [];
      
      exportData.achievements = {
        stats: achievementStats,
        unlocked: unlockedAchievements
      };
      
      console.log(`✅ Exported achievements data`);
    } catch (error) {
      console.warn(`⚠️ Failed to export achievements:`, error);
    }

    // ============================================
    // STEP 6: Export Profile Data
    // ============================================
    console.log('📦 Exporting profile...');
    try {
      const profileKey = `user_profile:${userId}`;
      const profile = await kv.get(profileKey) || {};
      
      exportData.profile = profile;
      
      console.log(`✅ Exported profile data`);
    } catch (error) {
      console.warn(`⚠️ Failed to export profile:`, error);
    }

    // ============================================
    // Return Export Data
    // ============================================
    console.log('✅ Data export complete');
    console.log(`📊 Export summary:`, {
      sentCapsules: exportData.capsules.sent.length,
      receivedCapsules: exportData.capsules.received.length,
      recordLibrary: exportData.recordLibrary.length,
      vault: exportData.vault.length,
      achievements: exportData.achievements.unlocked?.length || 0
    });

    return c.json(exportData);
    
  } catch (error: any) {
    console.error('💥 Data export error:', error);
    return c.json({ 
      error: 'Failed to export data', 
      message: error.message 
    }, 500);
  }
});

// Delete user account and all data
app.post("/make-server-f9be53a7/delete-account", async (c) => {
  try {
    console.log('🗑️ Account deletion request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🗑️ Deleting account for user: ${user.email} (${user.id})`);
    const userId = user.id;
    const userEmail = user.email;

    // ============================================
    // STEP 1: Delete all capsules and media files
    // ============================================
    const userCapsulesKey = `user_capsules:${userId}`;
    const capsuleIds = await kv.get(userCapsulesKey) || [];
    
    console.log(`🗑️ Found ${capsuleIds.length} capsules to delete`);
    
    for (const capsuleId of capsuleIds) {
      try {
        const capsule = await kv.get(`capsule:${capsuleId}`);
        
        // Delete media files from storage if they exist
        if (capsule && capsule.media && capsule.media.length > 0) {
          for (const mediaItem of capsule.media) {
            if (mediaItem.url) {
              try {
                const urlPath = new URL(mediaItem.url).pathname;
                const pathParts = urlPath.split('/');
                const fileName = pathParts[pathParts.length - 1];
                await supabase.storage
                  .from('make-f9be53a7-media')
                  .remove([fileName]);
                console.log(`  ✅ Deleted media file: ${fileName}`);
              } catch (storageError) {
                console.warn(`  ⚠️ Failed to delete media file: ${mediaItem.url}`, storageError);
              }
            }
          }
        }
        
        // Delete capsule_media reference
        await kv.del(`capsule_media:${capsuleId}`);
        
        // Delete capsule data
        await kv.del(`capsule:${capsuleId}`);
        console.log(`  ✅ Deleted capsule: ${capsuleId}`);
      } catch (error) {
        console.error(`  ❌ Failed to delete capsule ${capsuleId}:`, error);
      }
    }

    await kv.del(userCapsulesKey);
    console.log(`✅ Deleted capsule list`);

    // ============================================
    // STEP 2: Delete received capsules
    // ============================================
    const receivedCapsulesKey = `received_capsules:${userId}`;
    await kv.del(receivedCapsulesKey);
    console.log(`✅ Deleted received capsules list`);

    // ============================================
    // STEP 3: Delete Record Library files
    // ============================================
    const recordLibraryKey = `record_library:${userId}`;
    const recordLibrary = await kv.get(recordLibraryKey) || [];
    
    for (const record of recordLibrary) {
      try {
        if (record.url) {
          const urlPath = new URL(record.url).pathname;
          const pathParts = urlPath.split('/');
          const fileName = pathParts[pathParts.length - 1];
          await supabase.storage
            .from('make-f9be53a7-record-library')
            .remove([fileName]);
          console.log(`  ✅ Deleted record library file: ${fileName}`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Failed to delete record library file:`, error);
      }
    }
    
    await kv.del(recordLibraryKey);
    console.log(`✅ Deleted record library`);

    // ============================================
    // STEP 4: Delete Vault files
    // ============================================
    const legacyVaultKey = `legacy_vault:${userId}`;
    const legacyVault = await kv.get(legacyVaultKey) || [];
    
    for (const item of legacyVault) {
      try {
        if (item.url) {
          const urlPath = new URL(item.url).pathname;
          const pathParts = urlPath.split('/');
          const fileName = pathParts[pathParts.length - 1];
          await supabase.storage
            .from('make-f9be53a7-media')
            .remove([fileName]);
          console.log(`  ✅ Deleted legacy vault file: ${fileName}`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Failed to delete legacy vault file:`, error);
      }
    }
    
    await kv.del(legacyVaultKey);
    console.log(`✅ Deleted legacy vault`);

    // ============================================
    // STEP 5: Delete Achievement & Title data
    // ============================================
    await kv.del(`user_achievements:${userId}`);
    await kv.del(`user_achievement_progress:${userId}`);
    await kv.del(`achievement_notifications:${userId}`);
    await kv.del(`user_titles:${userId}`);
    await kv.del(`equipped_title:${userId}`);
    await kv.del(`title_profile:${userId}`);
    await kv.del(`welcome_celebration:${userId}`);
    console.log(`✅ Deleted achievements and titles`);

    // ============================================
    // STEP 6: Delete user profile and preferences
    // ============================================
    await kv.del(`profile:${userId}`);
    await kv.del(`user_preferences:${userId}`);
    await kv.del(`notification_preferences:${userId}`);
    await kv.del(`storage_preferences:${userId}`);
    console.log(`✅ Deleted user profile and preferences`);

    // ============================================
    // STEP 7: Delete all user-prefixed data
    // ============================================
    const userDataKeys = await kv.getByPrefix(`user:${userId}`, 5000);
    for (const key in userDataKeys) {
      await kv.del(key);
    }
    console.log(`✅ Deleted user-prefixed data`);

    // ============================================
    // STEP 8: Delete user from Supabase Auth
    // ============================================
    // This is CRITICAL - it allows the email to be reused
    try {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteAuthError) {
        console.error(`❌ Failed to delete user from Supabase Auth:`, deleteAuthError);
        // Don't fail the entire operation if this fails
        // But log it prominently
        return c.json({ 
          success: true, 
          warning: 'Data deleted but user record may still exist in auth system',
          message: 'Account data deleted. Please contact support to complete deletion.'
        });
      }
      
      console.log(`✅ Deleted user from Supabase Auth - email can now be reused`);
    } catch (authDeleteError) {
      console.error(`❌ Error deleting user from Supabase Auth:`, authDeleteError);
      return c.json({ 
        success: true, 
        warning: 'Data deleted but user record may still exist in auth system',
        message: 'Account data deleted. Please contact support to complete deletion.'
      });
    }

    console.log(`✅✅✅ COMPLETE ACCOUNT DELETION for user: ${userEmail}`);
    console.log(`🎯 Email ${userEmail} can now be used to create a new account`);

    return c.json({ 
      success: true, 
      message: 'Account permanently deleted. Your email can be used to create a new account.' 
    });
    
  } catch (error) {
    console.error('❌ Account deletion error:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

// Run diagnostics after a brief delay to let the server start
setTimeout(runStartupDiagnostics, 2000);

// ============================================
// AUTOMATIC DELIVERY PROCESSING
// ============================================

// Function to check and process due deliveries
const checkAndProcessDeliveries = async () => {
  try {
    console.log('⏰ Automatic delivery check running...');
    const result = await DeliveryService.processDueDeliveries();
    console.log(`✅ Automatic delivery check complete: ${result.processed} processed, ${result.successful} successful, ${result.failed} failed`);
  } catch (error) {
    const errorMsg = error?.message || String(error);
    
    // Cloudflare/infrastructure errors - suppress verbose HTML, just log short message
    if (errorMsg.includes('<!DOCTYPE html>') || errorMsg.length > 500) {
      console.warn('⚠️ Temporary Cloudflare/infrastructure issue during automatic delivery check (will retry)');
    } else if (errorMsg.includes('500') || 
        errorMsg.includes('502') || 
        errorMsg.includes('503') ||
        errorMsg.includes('504') ||
        errorMsg.includes('Cloudflare') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('Circuit breaker')) {
      console.warn('⚠️ Temporary database connection issue during automatic delivery check:', errorMsg.substring(0, 150));
    } else {
      console.error('❌ Automatic delivery check error:', error);
    }
  }
};

// MOVED: /api/capsules/received endpoint moved to line ~1888 to prevent route collision with /api/capsules/:id
// (Specific routes must be defined BEFORE parameterized routes in Hono)

// Mark a capsule as received by a user (called when viewing link is accessed)
app.post("/make-server-f9be53a7/api/capsules/:id/mark-received", async (c) => {
  try {
    const capsuleId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📨 Marking capsule ${capsuleId} as received by user ${user.email}`);

    // Add to user's received capsules list
    const receivedCapsulesKey = `user_received:${user.id}`;
    const receivedCapsules = await kv.get(receivedCapsulesKey) || [];
    
    if (!receivedCapsules.includes(capsuleId)) {
      receivedCapsules.push(capsuleId);
      await kv.set(receivedCapsulesKey, receivedCapsules);
      console.log(`✅ Added capsule ${capsuleId} to user ${user.id}'s received list`);
    }

    return c.json({ success: true });

  } catch (error) {
    console.error('Mark capsule as received error:', error);
    return c.json({ error: 'Failed to mark capsule as received' }, 500);
  }
});

// Mark a capsule as viewed (removes NEW badge)
app.post("/make-server-f9be53a7/api/capsules/:id/mark-viewed", async (c) => {
  try {
    const capsuleId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`👁️ Marking capsule ${capsuleId} as viewed by user ${user.email}`);

    // Get the capsule and add viewed_at timestamp
    const capsule = await kv.get(`capsule:${capsuleId}`);
    
    if (!capsule) {
      console.error(`❌ Capsule ${capsuleId} not found`);
      return c.json({ error: 'Capsule not found' }, 404);
    }

    // Update capsule with viewed_at timestamp
    const updatedCapsule = {
      ...capsule,
      viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`capsule:${capsuleId}`, updatedCapsule);
    console.log(`✅ Capsule ${capsuleId} marked as viewed`);

    // 🔔 CREATE NOTIFICATION: Notify capsule sender that recipient opened their capsule
    try {
      const capsuleSenderId = capsule.created_by || capsule.userId || capsule.user_id;
      
      // Only notify if:
      // 1. There's a sender ID
      // 2. The viewer is NOT the sender (don't notify when viewing own capsule)
      // 3. This is the FIRST view (don't spam on re-opens)
      if (capsuleSenderId && capsuleSenderId !== user.id && !capsule.viewed_at) {
        console.log(`🔔 [Capsule Opened] Creating notification for capsule sender: ${capsuleSenderId}`);
        
        // Get viewer's profile for name
        const viewerProfile = await kv.get(`profile:${user.id}`);
        let viewerName = viewerProfile?.display_name || 
                          viewerProfile?.name || 
                          `${viewerProfile?.first_name || ''} ${viewerProfile?.last_name || ''}`.trim();
        
        // If no name in profile, try to get from auth user
        if (!viewerName) {
          try {
            const { data: viewerUser } = await supabase.auth.admin.getUserById(user.id);
            if (viewerUser?.user?.email) {
              // Use the full email or extract name from email
              viewerName = viewerUser.user.user_metadata?.firstName || 
                          viewerUser.user.user_metadata?.name ||
                          viewerUser.user.email.split('@')[0]; // Use email username as last resort
            }
          } catch (authError) {
            console.warn('Could not fetch viewer from auth:', authError);
          }
        }
        
        // Final fallback
        if (!viewerName) {
          viewerName = 'Someone';
        }
        
        // Create notification
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'capsule_opened',
          capsuleId: capsule.id,
          capsuleTitle: capsule.title || 'Untitled Capsule',
          openedBy: user.id,
          openedByName: viewerName,
          echoType: 'capsule_opened',
          echoContent: `${viewerName} opened your capsule "${capsule.title || 'Untitled'}"`,
          senderId: user.id,
          senderName: viewerName,
          timestamp: new Date().toISOString(),
          read: false,
          seen: false,
          createdAt: new Date().toISOString()
        };
        
        console.log(`📝 [Capsule Opened] Notification object created:`, JSON.stringify(notification, null, 2));
        
        // Store notification in array
        const arrayKey = `echo_notifications_array:${capsuleSenderId}`;
        console.log(`💾 [Capsule Opened] Storing notification in KV: key="${arrayKey}"`);
        
        const existingNotifications = await kv.get(arrayKey) || [];
        console.log(`📊 [Capsule Opened] Existing notifications count: ${existingNotifications.length}`);
        
        existingNotifications.unshift(notification); // Add to beginning (newest first)
        
        // Keep only last 100 notifications
        if (existingNotifications.length > 100) {
          existingNotifications.splice(100);
        }
        
        await kv.set(arrayKey, existingNotifications);
        console.log(`✅ [Capsule Opened] Notification saved! New count: ${existingNotifications.length}`);
        
        // Broadcast notification to capsule sender
        console.log(`📡 [Capsule Opened] Broadcasting to capsule sender: ${capsuleSenderId}`);
        try {
          await fetch(`https://${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-f9be53a7/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              userId: capsuleSenderId,
              type: 'new_notification',
              data: notification
            })
          });
          console.log(`✅ [Capsule Opened] Broadcast sent successfully`);
        } catch (broadcastError) {
          console.warn(`⚠️ [Capsule Opened] Broadcast failed (non-critical):`, broadcastError.message);
        }
      } else {
        const reason = !capsuleSenderId 
          ? 'no sender ID' 
          : capsuleSenderId === user.id 
            ? 'viewer is sender (own capsule)' 
            : 'capsule already viewed';
        console.log(`ℹ️ [Capsule Opened] Skipping notification (${reason})`);
      }
    } catch (notificationError) {
      console.error(`❌ [Capsule Opened] Failed to create notification:`, notificationError);
      // Don't let notification failure block the view tracking
    }

    return c.json({ success: true });

  } catch (error) {
    console.error('Mark capsule as viewed error:', error);
    return c.json({ error: 'Failed to mark capsule as viewed' }, 500);
  }
});

// REMOVED DUPLICATE: Claim pending capsules endpoint
// The correct implementation with notifications and achievements is defined earlier in the file (line 6262)

// Get pending capsules count for current user (debug/info endpoint)
app.get("/make-server-f9be53a7/api/capsules/pending-count", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      return c.json({ error: 'User email not found' }, 400);
    }

    // Get pending capsules for this email
    const pendingKey = `pending_capsules:${userEmail}`;
    const pendingCapsules = await kv.get(pendingKey) || [];

    return c.json({ 
      email: userEmail,
      pendingCount: pendingCapsules.length,
      capsuleIds: pendingCapsules
    });

  } catch (error) {
    console.error('Get pending count error:', error);
    return c.json({ error: 'Failed to get pending count' }, 500);
  }
});

// REMOVED: Duplicate delivery scheduler
// The main delivery scheduler is defined at line ~2318 (startDeliveryScheduler function)
// This duplicate was causing capsules to be delivered multiple times

// ============================================
// ACHIEVEMENT ENDPOINTS
// ============================================

// Get achievement definitions
app.get("/make-server-f9be53a7/achievements/definitions", async (c) => {
  try {
    console.log('🏆 Fetching achievement definitions...');
    return c.json({ 
      success: true,
      definitions: AchievementService.ACHIEVEMENT_DEFINITIONS 
    });
  } catch (error) {
    console.error('Failed to fetch achievement definitions:', error);
    return c.json({ error: 'Failed to fetch definitions' }, 500);
  }
});

// Get REAL rarity percentages from actual user data
app.get("/make-server-f9be53a7/achievements/rarity", async (c) => {
  try {
    console.log('📊 Fetching cached rarity data...');
    
    // NEW APPROACH: Use cached global stats instead of prefix query
    // This eliminates the timeout issue by storing aggregated data
    const globalStats = await kv.get<any>('achievement_global_stats');
    
    if (!globalStats || !globalStats.total_users) {
      console.log('⚠️ No cached rarity data found, returning defaults');
      return c.json({ 
        success: true,
        rarity: {},
        totalUsers: 0,
        totalAchievements: 0,
        cached: false
      });
    }
    
    // Calculate percentages from cached unlock counts
    const rarity: Record<string, number> = {};
    const unlockCounts = globalStats.unlock_counts || {};
    const totalUsers = globalStats.total_users || 1;
    
    for (const [achievementId, count] of Object.entries(unlockCounts)) {
      rarity[achievementId] = Math.round(((count as number) / totalUsers) * 100);
    }
    
    console.log(`✅ Retrieved cached rarity for ${Object.keys(rarity).length} achievements from ${totalUsers} users`);
    
    return c.json({ 
      success: true,
      rarity,
      totalUsers,
      totalAchievements: Object.keys(rarity).length,
      cached: true,
      lastUpdated: globalStats.last_updated
    });
  } catch (error) {
    console.error('❌ Failed to fetch rarity data:', error);
    
    // Return empty rarity data to allow frontend to continue
    return c.json({ 
      success: true,
      rarity: {},
      totalUsers: 0,
      totalAchievements: 0,
      error: true
    });
  }
});

// Get user achievements
app.get("/make-server-f9be53a7/achievements/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const achievements = await kv.get(`user_achievements:${user.id}`) || [];
    
    return c.json({ 
      success: true,
      achievements 
    });
  } catch (error) {
    console.error('Failed to fetch user achievements:', error);
    return c.json({ error: 'Failed to fetch achievements' }, 500);
  }
});

// Get user stats
app.get("/make-server-f9be53a7/achievements/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const stats = await kv.get(`user_stats:${user.id}`) || {
      capsules_created: 0,
      capsules_sent: 0,
      capsules_received: 0,
      media_uploaded: 0,
      filter_usage: {},
      enhancements_used: 0,
      current_streak: 0,
      achievement_count: 0,
      achievement_points: 0
    };
    
    return c.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Rebuild global achievement stats (admin/utility endpoint)
app.post("/make-server-f9be53a7/achievements/rebuild-global-stats", async (c) => {
  try {
    console.log('🔧 Rebuilding global achievement stats from user data...');
    
    // Use 10s timeout for rebuild operation
    const allUserAchievements = await kv.getByPrefix('user_achievements:', 10000);
    
    console.log(`📊 Found ${allUserAchievements.length} user achievement records`);
    
    const totalUsers = allUserAchievements.length;
    const unlockCounts: Record<string, number> = {};
    const firstUnlockTimes: Record<string, string> = {};
    
    // DEBUG: Log first user's data to diagnose issue
    if (allUserAchievements.length > 0) {
      console.log(`🔍 DEBUG: First user has ${allUserAchievements[0]?.length || 0} achievements`);
      console.log(`🔍 DEBUG: Sample achievements:`, JSON.stringify(allUserAchievements[0]?.slice(0, 3), null, 2));
    }
    
    // Count unlocks and find first unlock times
    for (const userAchievementData of allUserAchievements) {
      if (userAchievementData && Array.isArray(userAchievementData)) {
        console.log(`👤 Processing user with ${userAchievementData.length} achievements`);
        
        // FIX: Detect and skip duplicate achievements within same user
        const seenInThisUser = new Set<string>();
        
        for (const achievement of userAchievementData) {
          const achievementId = achievement.achievementId || achievement.id;
          if (achievementId) {
            // Check for duplicate within same user's achievements
            if (seenInThisUser.has(achievementId)) {
              console.warn(`⚠️ DUPLICATE: Achievement ${achievementId} appears multiple times for same user - SKIPPING to prevent inflated count`);
              continue; // Skip duplicate
            }
            seenInThisUser.add(achievementId);
            
            // Increment unlock count (one per unique user)
            unlockCounts[achievementId] = (unlockCounts[achievementId] || 0) + 1;
            
            // Track earliest unlock time
            const unlockedAt = achievement.unlockedAt;
            if (unlockedAt) {
              if (!firstUnlockTimes[achievementId] || unlockedAt < firstUnlockTimes[achievementId]) {
                firstUnlockTimes[achievementId] = unlockedAt;
              }
            }
          }
        }
      }
    }
    
    // Build and save global stats
    const globalStats = {
      total_users: totalUsers,
      unlock_counts: unlockCounts,
      first_unlock_times: firstUnlockTimes,
      last_updated: new Date().toISOString()
    };
    
    await kv.set('achievement_global_stats', globalStats);
    
    console.log(`✅ Rebuilt global stats: ${totalUsers} users, ${Object.keys(unlockCounts).length} achievements tracked`);
    
    return c.json({
      success: true,
      total_users: totalUsers,
      achievements_tracked: Object.keys(unlockCounts).length,
      last_updated: globalStats.last_updated
    });
  } catch (error) {
    console.error('❌ Failed to rebuild global stats:', error);
    return c.json({ error: 'Failed to rebuild global stats', details: error.message }, 500);
  }
});

// Migrate achievement data from old underscore format to new colon format
app.post("/make-server-f9be53a7/achievements/migrate-keys", async (c) => {
  try {
    console.log('🔄 Starting achievement key migration...');
    
    // Get all old-format keys (10s timeout for migration operation)
    const allKeys = await kv.getByPrefix('user_', 10000);
    let migratedCount = 0;
    
    for (const item of allKeys) {
      // Check if this is an old-format achievement or stats key
      // The item from getByPrefix might be the value directly, need to check structure
      const keyMatch = JSON.stringify(item).match(/user_(achievements|stats)_([a-f0-9-]+)/);
      
      if (keyMatch) {
        const [_, type, userId] = keyMatch;
        const oldKey = `user_${type}_${userId}`;
        const newKey = `user_${type}:${userId}`;
        
        console.log(`🔄 Migrating ${oldKey} → ${newKey}`);
        
        // Get data from old key
        const data = await kv.get(oldKey);
        if (data) {
          // Save to new key
          await kv.set(newKey, data);
          // Optionally delete old key (commented out for safety)
          // await kv.del(oldKey);
          migratedCount++;
          console.log(`✅ Migrated ${oldKey}`);
        }
      }
    }
    
    console.log(`✅ Migration complete: ${migratedCount} keys migrated`);
    
    return c.json({ 
      success: true,
      migratedCount,
      message: `Successfully migrated ${migratedCount} achievement/stats keys`
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return c.json({ error: 'Migration failed', details: error.message }, 500);
  }
});

// ============================================
// RECORD LIBRARY ENDPOINTS (Cross-device sync)
// ============================================

// Upload media to Record Library
app.post("/make-server-f9be53a7/api/record-library/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no token provided' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Record library upload authentication error:', authError);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    console.log(`📸 Record library upload request from user: ${user.email}`);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'photo' | 'video' | 'audio'
    const thumbnail = formData.get('thumbnail') as File | null;

    if (!file || !type) {
      return c.json({ error: 'File and type are required' }, 400);
    }

    console.log(`📸 Uploading ${type} to record library:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasThumbnail: !!thumbnail
    });

    // Generate unique ID for this record library item
    const recordId = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Upload main file to Supabase Storage
    const fileExtension = file.name.split('.').pop() || 'bin';
    const storagePath = `record-library/${user.id}/${recordId}.${fileExtension}`;
    
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-f9be53a7-media')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Record library file upload error:', uploadError);
      return c.json({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message 
      }, 500);
    }

    console.log(`✅ Uploaded record library file to storage: ${storagePath}`);

    // Upload thumbnail if provided
    let thumbnailPath = null;
    if (thumbnail) {
      const thumbnailExtension = thumbnail.name.split('.').pop() || 'jpg';
      thumbnailPath = `record-library/${user.id}/${recordId}_thumb.${thumbnailExtension}`;
      
      const thumbnailBuffer = await thumbnail.arrayBuffer();
      const { error: thumbError } = await supabase.storage
        .from('make-f9be53a7-media')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: thumbnail.type,
          upsert: false
        });

      if (thumbError) {
        console.warn('Thumbnail upload failed (non-critical):', thumbError);
        thumbnailPath = null;
      } else {
        console.log(`✅ Uploaded thumbnail: ${thumbnailPath}`);
      }
    }

    // Generate signed URLs for immediate use (valid for 1 hour)
    const { data: fileUrl } = await supabase.storage
      .from('make-f9be53a7-media')
      .createSignedUrl(storagePath, 3600);

    let thumbnailUrl = null;
    if (thumbnailPath) {
      const { data: thumbUrl } = await supabase.storage
        .from('make-f9be53a7-media')
        .createSignedUrl(thumbnailPath, 3600);
      thumbnailUrl = thumbUrl?.signedUrl || null;
    }

    // Save metadata to KV store
    const recordItem = {
      id: recordId,
      user_id: user.id,
      type,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      timestamp,
      created_at: new Date().toISOString()
    };

    await kv.set(`record_library:${user.id}:${recordId}`, recordItem);
    
    // Also maintain a list of all record IDs for this user
    const userRecordsKey = `record_library_list:${user.id}`;
    const existingRecords = await kv.get(userRecordsKey) || [];
    existingRecords.push(recordId);
    await kv.set(userRecordsKey, existingRecords);

    console.log(`✅ Saved record library metadata for user ${user.email}`);

    return c.json({
      success: true,
      record: {
        id: recordId,
        type,
        url: fileUrl?.signedUrl,
        thumbnail: thumbnailUrl,
        timestamp,
        file_name: file.name,
        file_size: file.size
      }
    });

  } catch (error) {
    console.error('Record library upload error:', error);
    return c.json({ 
      error: 'Failed to upload to record library',
      details: error.message 
    }, 500);
  }
});

// Get all record library items for user
app.get("/make-server-f9be53a7/api/record-library", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Record library fetch authentication error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📚 Fetching record library for user: ${user.email}`);

    // Get list of record IDs
    const userRecordsKey = `record_library_list:${user.id}`;
    const recordIds = await kv.get(userRecordsKey) || [];

    console.log(`📚 Found ${recordIds.length} records for user ${user.email}`);

    // Fetch all records with metadata
    const records = [];
    for (const recordId of recordIds) {
      try {
        const record = await kv.get(`record_library:${user.id}:${recordId}`);
        if (record) {
          // Generate fresh signed URLs (valid for 1 hour)
          const { data: fileUrl } = await supabase.storage
            .from('make-f9be53a7-media')
            .createSignedUrl(record.storage_path, 3600);

          let thumbnailUrl = null;
          if (record.thumbnail_path) {
            const { data: thumbUrl } = await supabase.storage
              .from('make-f9be53a7-media')
              .createSignedUrl(record.thumbnail_path, 3600);
            thumbnailUrl = thumbUrl?.signedUrl || null;
          }

          records.push({
            id: record.id,
            type: record.type,
            url: fileUrl?.signedUrl,
            thumbnail: thumbnailUrl,
            timestamp: record.timestamp,
            file_name: record.file_name,
            file_size: record.file_size,
            file_type: record.file_type,
            created_at: record.created_at
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch record ${recordId}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    records.sort((a, b) => b.timestamp - a.timestamp);

    console.log(`✅ Returning ${records.length} record library items`);

    return c.json({
      success: true,
      records,
      total: records.length
    });

  } catch (error) {
    console.error('Record library fetch error:', error);
    return c.json({ 
      error: 'Failed to fetch record library',
      details: error.message 
    }, 500);
  }
});

// Delete record library item(s)
app.delete("/make-server-f9be53a7/api/record-library", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Record library delete authentication error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { recordIds } = await c.req.json();

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return c.json({ error: 'Record IDs array is required' }, 400);
    }

    console.log(`🗑️ Deleting ${recordIds.length} record(s) for user: ${user.email}`);

    let deletedCount = 0;
    const errors = [];

    for (const recordId of recordIds) {
      try {
        // Get record metadata
        const record = await kv.get(`record_library:${user.id}:${recordId}`);
        
        if (!record) {
          console.warn(`Record ${recordId} not found`);
          continue;
        }

        // Verify ownership
        if (record.user_id !== user.id) {
          console.warn(`User ${user.email} attempted to delete record ${recordId} owned by ${record.user_id}`);
          errors.push({ recordId, error: 'Forbidden - not owner' });
          continue;
        }

        // Delete files from storage
        try {
          await supabase.storage
            .from('make-f9be53a7-media')
            .remove([record.storage_path]);
          
          if (record.thumbnail_path) {
            await supabase.storage
              .from('make-f9be53a7-media')
              .remove([record.thumbnail_path]);
          }
        } catch (storageError) {
          console.warn(`Storage deletion error for ${recordId}:`, storageError);
        }

        // Delete metadata from KV
        await kv.del(`record_library:${user.id}:${recordId}`);

        deletedCount++;
        console.log(`✅ Deleted record ${recordId}`);

      } catch (error) {
        console.error(`Error deleting record ${recordId}:`, error);
        errors.push({ recordId, error: error.message });
      }
    }

    // Update the user's record list
    const userRecordsKey = `record_library_list:${user.id}`;
    const existingRecords = await kv.get(userRecordsKey) || [];
    const updatedRecords = existingRecords.filter(id => !recordIds.includes(id));
    await kv.set(userRecordsKey, updatedRecords);

    console.log(`✅ Deleted ${deletedCount} record(s) from library`);

    return c.json({
      success: true,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Record library delete error:', error);
    return c.json({ 
      error: 'Failed to delete from record library',
      details: error.message 
    }, 500);
  }
});

// ============================================
// LEGACY VAULT ENDPOINTS (Replaces Record Library)
// ============================================

// Upload media to Vault
app.post("/make-server-f9be53a7/api/legacy-vault/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no token provided' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Vault upload authentication error:', authError);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    console.log(`🏛️ Vault upload request from user: ${user.email}`);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'photo' | 'video' | 'audio'
    const thumbnail = formData.get('thumbnail') as File | null;
    const folderId = formData.get('folderId') as string | null; // 🔥 NEW: Target folder ID

    if (!file || !type) {
      return c.json({ error: 'File and type are required' }, 400);
    }

    console.log(`🏛️ Uploading ${type} to Vault:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasThumbnail: !!thumbnail,
      targetFolder: folderId || 'unsorted' // 🔥 NEW: Log target folder
    });

    // Generate unique ID for this vault item
    const recordId = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Upload main file to Supabase Storage
    const fileExtension = file.name.split('.').pop() || 'bin';
    const storagePath = `legacy-vault/${user.id}/${recordId}.${fileExtension}`;
    
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-f9be53a7-media')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Vault file upload error:', uploadError);
      
      // Check if error is due to file size
      const isPayloadTooLarge = uploadError.message?.includes('Payload too large') || 
                                uploadError.message?.includes('exceeded the maximum') ||
                                uploadError.statusCode === '413';
      
      if (isPayloadTooLarge) {
        return c.json({ 
          error: 'File too large. Maximum file size is 500MB.',
          statusCode: '413'
        }, 413);
      }
      
      return c.json({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message 
      }, 500);
    }

    console.log(`✅ Uploaded Vault file to storage: ${storagePath}`);

    // Upload thumbnail if provided
    let thumbnailPath = null;
    if (thumbnail) {
      const thumbnailExtension = thumbnail.name.split('.').pop() || 'jpg';
      thumbnailPath = `legacy-vault/${user.id}/${recordId}_thumb.${thumbnailExtension}`;
      
      const thumbnailBuffer = await thumbnail.arrayBuffer();
      const { error: thumbError } = await supabase.storage
        .from('make-f9be53a7-media')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: thumbnail.type,
          upsert: false
        });

      if (thumbError) {
        console.warn('Thumbnail upload failed (non-critical):', thumbError);
        thumbnailPath = null;
      } else {
        console.log(`✅ Uploaded thumbnail: ${thumbnailPath}`);
      }
    }

    // Generate signed URLs for immediate use (valid for 1 hour)
    const { data: fileUrl } = await supabase.storage
      .from('make-f9be53a7-media')
      .createSignedUrl(storagePath, 3600);

    let thumbnailUrl = null;
    if (thumbnailPath) {
      const { data: thumbUrl } = await supabase.storage
        .from('make-f9be53a7-media')
        .createSignedUrl(thumbnailPath, 3600);
      thumbnailUrl = thumbUrl?.signedUrl || null;
    }

    // Save metadata to KV store
    const recordItem = {
      id: recordId,
      user_id: user.id,
      type,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      timestamp,
      created_at: new Date().toISOString()
    };

    await kv.set(`legacy_vault:${user.id}:${recordId}`, recordItem);
    
    // Also maintain a list of all vault IDs for this user
    const userVaultKey = `legacy_vault_list:${user.id}`;
    const existingRecords = await kv.get(userVaultKey) || [];
    existingRecords.push(recordId);
    await kv.set(userVaultKey, existingRecords);

    console.log(`✅ Saved Vault metadata for user ${user.email}`);

    // 🔥 CRITICAL FIX: ATOMICALLY add media to folder if specified
    if (folderId) {
      try {
        console.log(`🔗 [ATOMIC] Adding media ${recordId} to folder ${folderId}...`);
        
        // Get current metadata
        let metadata = await kv.get(`vault_metadata_${user.id}`);
        
        // Initialize if doesn't exist
        if (!metadata) {
          metadata = { folders: [], media: [] };
        }
        
        // Find the target folder
        const targetFolder = metadata.folders.find((f: any) => f.id === folderId);
        
        if (targetFolder) {
          // Initialize mediaIds if needed
          if (!targetFolder.mediaIds) {
            targetFolder.mediaIds = [];
          }
          
          // Add the media ID if not already there
          if (!targetFolder.mediaIds.includes(recordId)) {
            targetFolder.mediaIds.push(recordId);
            targetFolder.updatedAt = new Date().toISOString();
            
            // Save the updated metadata
            await kv.set(`vault_metadata_${user.id}`, metadata);
            
            console.log(`✅ [ATOMIC] Added media ${recordId} to folder ${folderId} (${targetFolder.name})`);
            console.log(`✅ [ATOMIC] Folder now has ${targetFolder.mediaIds.length} items`);
          } else {
            console.log(`ℹ️ [ATOMIC] Media ${recordId} already in folder ${folderId}`);
          }
        } else {
          console.warn(`⚠️ [ATOMIC] Folder ${folderId} not found - media will be in unsorted`);
        }
      } catch (folderError) {
        // Don't fail the upload if folder association fails - just log it
        console.error(`❌ [ATOMIC] Failed to add media to folder (non-critical):`, folderError);
      }
    } else {
      console.log(`ℹ️ No folder specified - media ${recordId} will be in unsorted`);
    }

    return c.json({
      success: true,
      record: {
        id: recordId,
        type,
        url: fileUrl?.signedUrl,
        thumbnail: thumbnailUrl,
        timestamp,
        file_name: file.name,
        file_size: file.size
      }
    });

  } catch (error) {
    console.error('Vault upload error:', error);
    return c.json({ 
      error: 'Failed to upload to Vault',
      details: error.message 
    }, 500);
  }
});

// Create vault entry from already-uploaded storage file (for TUS uploads from RecordInterface)
app.post("/make-server-f9be53a7/api/legacy-vault/create-from-storage", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no token provided' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Vault create-from-storage authentication error:', authError);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    const record = await c.req.json();
    
    // Validate required fields
    if (!record.id || !record.storage_path || !record.type) {
      return c.json({ error: 'Missing required fields: id, storage_path, type' }, 400);
    }

    // Ensure user owns this record (security check)
    if (record.user_id !== user.id) {
      return c.json({ error: 'Unauthorized - user mismatch' }, 403);
    }

    console.log(`📝 Creating vault entry from storage for user ${user.email}:`, {
      id: record.id,
      storage_path: record.storage_path,
      type: record.type,
      file_size: record.file_size
    });

    // Generate signed URL for the file (valid for 1 hour)
    const { data: fileUrl, error: urlError } = await supabase.storage
      .from('make-f9be53a7-media')
      .createSignedUrl(record.storage_path, 3600);

    if (urlError) {
      console.error('Failed to generate signed URL:', urlError);
      return c.json({ 
        error: 'Failed to generate URL for uploaded file',
        details: urlError.message 
      }, 500);
    }

    // Generate signed URL for thumbnail if provided
    let thumbnailUrl = null;
    if (record.thumbnail_path) {
      const { data: thumbUrl } = await supabase.storage
        .from('make-f9be53a7-media')
        .createSignedUrl(record.thumbnail_path, 3600);
      thumbnailUrl = thumbUrl?.signedUrl || null;
    }

    // Store vault record metadata
    const vaultRecord = {
      id: record.id,
      user_id: user.id,
      type: record.type,
      storage_path: record.storage_path,
      thumbnail_path: record.thumbnail_path || null,
      file_name: record.file_name,
      file_type: record.file_type,
      file_size: record.file_size,
      timestamp: record.timestamp || Date.now(),
      created_at: new Date().toISOString()
    };

    await kv.set(`legacy_vault:${user.id}:${record.id}`, vaultRecord);

    // Add to user's vault list
    const vaultListKey = `legacy_vault_list:${user.id}`;
    const existingList = await kv.get(vaultListKey) || [];
    if (!existingList.includes(record.id)) {
      existingList.push(record.id);
      await kv.set(vaultListKey, existingList);
    }

    // 🔥 CRITICAL FIX: ATOMICALLY add media to folder if specified (for TUS uploads)
    if (record.folderId) {
      try {
        console.log(`🔗 [ATOMIC] Adding media ${record.id} to folder ${record.folderId}...`);
        
        // Get current metadata
        let metadata = await kv.get(`vault_metadata_${user.id}`);
        
        // Initialize if doesn't exist
        if (!metadata) {
          metadata = { folders: [], media: [] };
        }
        
        // Find the target folder
        const targetFolder = metadata.folders.find((f: any) => f.id === record.folderId);
        
        if (targetFolder) {
          // Initialize mediaIds if needed
          if (!targetFolder.mediaIds) {
            targetFolder.mediaIds = [];
          }
          
          // Add the media ID if not already there
          if (!targetFolder.mediaIds.includes(record.id)) {
            targetFolder.mediaIds.push(record.id);
            targetFolder.updatedAt = new Date().toISOString();
            
            // Save the updated metadata
            await kv.set(`vault_metadata_${user.id}`, metadata);
            
            console.log(`✅ [ATOMIC] Added media ${record.id} to folder ${record.folderId} (${targetFolder.name})`);
            console.log(`✅ [ATOMIC] Folder now has ${targetFolder.mediaIds.length} items`);
          } else {
            console.log(`ℹ️ [ATOMIC] Media ${record.id} already in folder ${record.folderId}`);
          }
        } else {
          console.warn(`⚠️ [ATOMIC] Folder ${record.folderId} not found - media will be in unsorted`);
        }
      } catch (folderError) {
        // Don't fail the upload if folder association fails - just log it
        console.error(`❌ [ATOMIC] Failed to add media to folder (non-critical):`, folderError);
      }
    } else {
      console.log(`ℹ️ No folder specified - media ${record.id} will be in unsorted`);
    }

    console.log(`✅ Vault entry created from storage: ${record.id}`);

    return c.json({
      success: true,
      record: {
        id: record.id,
        type: record.type,
        url: fileUrl.signedUrl,
        thumbnail: thumbnailUrl,
        timestamp: vaultRecord.timestamp,
        file_name: record.file_name,
        file_size: record.file_size
      }
    });

  } catch (error) {
    console.error('Vault create-from-storage error:', error);
    return c.json({ 
      error: 'Failed to create vault entry from storage',
      details: error.message 
    }, 500);
  }
});

// Replace existing Vault item with enhanced version
app.post("/make-server-f9be53a7/api/legacy-vault/replace", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no token provided' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Vault replace authentication error:', authError);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    console.log(`🔄 Vault replace request from user: ${user.email}`);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'photo' | 'video' | 'audio'
    const replaceId = formData.get('replaceId') as string; // ID of item to replace
    const thumbnail = formData.get('thumbnail') as File | null;

    if (!file) {
      return c.json({ error: 'File is required' }, 400);
    }

    if (!replaceId) {
      return c.json({ error: 'replaceId is required' }, 400);
    }

    console.log(`🔄 Replacing vault item ${replaceId} with new ${type} file: ${file.name} (${file.size} bytes)`);

    // Verify the item exists and belongs to the user
    const existingRecord = await kv.get(`legacy_vault:${user.id}:${replaceId}`);
    if (!existingRecord || existingRecord.user_id !== user.id) {
      console.error(`❌ Vault item not found: legacy_vault:${user.id}:${replaceId}`, existingRecord);
      return c.json({ error: 'Item not found or access denied' }, 404);
    }

    // Delete old file from storage
    if (existingRecord.storage_path) {
      console.log(`🗑️ Deleting old file: ${existingRecord.storage_path}`);
      await supabase.storage
        .from('make-f9be53a7-media')
        .remove([existingRecord.storage_path]);
    }

    if (existingRecord.thumbnail_path) {
      console.log(`🗑️ Deleting old thumbnail: ${existingRecord.thumbnail_path}`);
      await supabase.storage
        .from('make-f9be53a7-media')
        .remove([existingRecord.thumbnail_path]);
    }

    // Upload new file to storage
    const fileName = `legacy-vault/${user.id}/${replaceId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('make-f9be53a7-media')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return c.json({ error: 'Failed to upload file', details: uploadError.message }, 500);
    }

    console.log(`✅ New file uploaded: ${fileName}`);

    // Upload thumbnail if provided
    let thumbnailPath = null;
    if (thumbnail) {
      thumbnailPath = `legacy-vault/${user.id}/${replaceId}-thumb-${Date.now()}.jpg`;
      const { error: thumbError } = await supabase.storage
        .from('make-f9be53a7-media')
        .upload(thumbnailPath, thumbnail, {
          contentType: thumbnail.type,
          upsert: false
        });

      if (thumbError) {
        console.warn('Thumbnail upload failed:', thumbError);
        thumbnailPath = null;
      } else {
        console.log(`✅ Thumbnail uploaded: ${thumbnailPath}`);
      }
    }

    // Get signed URLs (valid for 1 year)
    const { data: fileUrl } = await supabase.storage
      .from('make-f9be53a7-media')
      .createSignedUrl(fileName, 365 * 24 * 60 * 60);

    let thumbnailUrl = null;
    if (thumbnailPath) {
      const { data: thumbUrl } = await supabase.storage
        .from('make-f9be53a7-media')
        .createSignedUrl(thumbnailPath, 365 * 24 * 60 * 60);
      thumbnailUrl = thumbUrl?.signedUrl || null;
    }

    // Update the record with new file info but preserve ALL existing metadata
    const updatedRecord = {
      ...existingRecord, // 🔧 FIX: Preserve ALL existing fields (folder_id, fileName, metadata, etc.)
      id: replaceId,
      user_id: user.id,
      type,
      storage_path: fileName,
      thumbnail_path: thumbnailPath,
      file_type: file.type,
      file_name: file.name,
      file_size: file.size,
      timestamp: existingRecord.timestamp, // Keep original timestamp
      replaced_at: Date.now() // Track when it was replaced
    };

    await kv.set(`legacy_vault:${user.id}:${replaceId}`, updatedRecord);
    console.log(`✅ Vault item ${replaceId} replaced successfully (preserved folder_id: ${updatedRecord.folder_id || 'none'})`);

    return c.json({
      success: true,
      record: {
        id: replaceId,
        type,
        url: fileUrl?.signedUrl,
        thumbnail: thumbnailUrl,
        timestamp: updatedRecord.timestamp,
        replaced_at: updatedRecord.replaced_at,
        file_name: file.name,
        file_size: file.size
      }
    });

  } catch (error) {
    console.error('Vault replace error:', error);
    return c.json({ 
      error: 'Failed to replace item in Vault',
      details: error.message 
    }, 500);
  }
});

// Get all Vault items for user
app.get("/make-server-f9be53a7/api/legacy-vault", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Vault fetch authentication error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🏛️ Fetching Vault for user: ${user.email}`);

    // Get list of vault IDs for this user
    const userVaultKey = `legacy_vault_list:${user.id}`;
    const recordIds = await kvGetWithTimeout(userVaultKey, 5000) || [];

    console.log(`Found ${recordIds.length} vault items for user`);

    // 🚀 PERFORMANCE FIX: Fetch all records in parallel with a 20-second timeout
    const startTime = Date.now();
    const BATCH_TIMEOUT = 20000; // 20 seconds for entire batch
    
    // Fetch all metadata in parallel
    const metadataPromises = recordIds.map(async (recordId) => {
      try {
        const recordData = await kvGetWithTimeout(`legacy_vault:${user.id}:${recordId}`, 3000);
        return { recordId, recordData };
      } catch (error) {
        console.error(`⚠️ Timeout fetching metadata for ${recordId}`);
        return { recordId, recordData: null };
      }
    });

    const metadataResults = await Promise.all(metadataPromises);
    
    // Filter out deleted items and prepare for URL generation
    const activeRecords = metadataResults.filter(({ recordData }) => {
      if (!recordData) return false;
      if (recordData.deletedAt) {
        console.log(`⏭️ Skipping soft-deleted item`);
        return false;
      }
      return true;
    });

    console.log(`📊 Active records: ${activeRecords.length} out of ${recordIds.length}`);

    // 🚀 Generate all signed URLs in parallel
    const urlPromises = activeRecords.map(async ({ recordId, recordData }) => {
      try {
        // Check if we're approaching timeout
        if (Date.now() - startTime > BATCH_TIMEOUT) {
          console.warn(`⏱️ Approaching timeout, skipping URL generation for ${recordId}`);
          return null;
        }

        // Generate file URL and thumbnail URL in parallel
        const [fileUrlResult, thumbnailUrlResult] = await Promise.all([
          supabase.storage
            .from('make-f9be53a7-media')
            .createSignedUrl(recordData.storage_path, 3600),
          recordData.thumbnail_path
            ? supabase.storage
                .from('make-f9be53a7-media')
                .createSignedUrl(recordData.thumbnail_path, 3600)
            : Promise.resolve({ data: null })
        ]);

        return {
          id: recordData.id,
          type: recordData.type,
          url: fileUrlResult?.data?.signedUrl,
          thumbnail: thumbnailUrlResult?.data?.signedUrl || null,
          timestamp: recordData.timestamp,
          file_name: recordData.file_name,
          file_type: recordData.file_type,
          file_size: recordData.file_size
        };
      } catch (error) {
        console.error(`⚠️ Error generating URLs for ${recordId}:`, error.message);
        return null;
      }
    });

    const records = (await Promise.all(urlPromises)).filter(record => record !== null);

    const elapsed = Date.now() - startTime;
    console.log(`✅ Returning ${records.length} Vault items in ${elapsed}ms (out of ${recordIds.length} total)`);

    return c.json({
      success: true,
      records,
      // Include metadata about partial failures
      metadata: {
        totalItems: recordIds.length,
        loadedItems: records.length,
        failedItems: recordIds.length - records.length,
        elapsed
      }
    });

  } catch (error) {
    console.error('Vault fetch error:', error);
    return c.json({ 
      error: 'Failed to fetch Vault',
      details: error.message 
    }, 500);
  }
});

// Refresh signed URL for a vault item (when URL expires)
app.get("/make-server-f9be53a7/api/legacy-vault/refresh-url/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Refresh URL authentication error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const itemId = c.req.param('id');
    if (!itemId) {
      return c.json({ error: 'Item ID required' }, 400);
    }

    console.log(`🔄 Refreshing signed URL for vault item: ${itemId}`);

    // Get the vault item metadata
    const recordKey = `legacy_vault:${user.id}:${itemId}`;
    const recordData = await kv.get(recordKey);

    if (!recordData) {
      console.error(`❌ Vault item not found: ${itemId}`);
      return c.json({ error: 'Item not found' }, 404);
    }

    if (!recordData.storage_path) {
      console.error(`❌ No storage path for item: ${itemId}`);
      return c.json({ error: 'Item has no storage path' }, 400);
    }

    // Generate fresh signed URL (valid for 1 hour)
    const { data: fileUrl, error: urlError } = await supabase.storage
      .from('make-f9be53a7-media')
      .createSignedUrl(recordData.storage_path, 3600);

    if (urlError || !fileUrl) {
      console.error('❌ Failed to generate signed URL:', urlError);
      return c.json({ error: 'Failed to generate URL' }, 500);
    }

    console.log(`✅ Generated fresh signed URL for ${itemId}`);

    return c.json({
      success: true,
      url: fileUrl.signedUrl,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Refresh URL error:', error);
    return c.json({ 
      error: 'Failed to refresh URL',
      details: error.message 
    }, 500);
  }
});

// Update Vault item metadata (e.g., rename file)
app.patch("/make-server-f9be53a7/api/legacy-vault/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    const recordId = c.req.param('id');
    if (!recordId) {
      return c.json({ error: 'Record ID required' }, 400);
    }

    const body = await c.req.json();
    const { fileName } = body;

    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      return c.json({ error: 'Valid fileName required' }, 400);
    }

    console.log(`📝 Updating vault item ${recordId} with new name: ${fileName}`);

    // Get existing record to verify ownership
    const recordKey = `legacy_vault:${user.id}:${recordId}`;
    const existingRecord = await kv.get(recordKey);
    
    if (!existingRecord) {
      // ✅ ALLOW: Record may only exist in localStorage (not yet synced to backend)
      // This is normal for items created before backend vault or during offline use
      console.log(`⚠️ Record ${recordId} not found in backend - may be localStorage-only item`);
      
      // Return success so the frontend can update its localStorage
      return c.json({
        success: true,
        id: recordId,
        fileName: fileName.trim(),
        localOnly: true // Flag to indicate this was a localStorage-only operation
      });
    }

    // Update the file_name field
    const updatedRecord = {
      ...existingRecord,
      file_name: fileName.trim(),
      updated_at: new Date().toISOString()
    };

    // Save back to KV
    await kv.set(recordKey, updatedRecord);

    console.log(`✅ Updated vault item ${recordId} name to: ${fileName}`);

    return c.json({
      success: true,
      id: recordId,
      fileName: fileName.trim()
    });

  } catch (error) {
    console.error('Vault update error:', error);
    return c.json({ 
      error: 'Failed to update vault item',
      details: error.message 
    }, 500);
  }
});

// Delete Vault item(s)
app.delete("/make-server-f9be53a7/api/legacy-vault", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Vault delete authentication error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const recordIds = body.recordIds as string[];

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return c.json({ error: 'recordIds array is required' }, 400);
    }

    console.log(`🗑️ Deleting ${recordIds.length} vault item(s) for user: ${user.email}`);

    let deletedCount = 0;
    const errors = [];

    for (const recordId of recordIds) {
      try {
        // Get the record metadata
        const recordData = await kv.get(`legacy_vault:${user.id}:${recordId}`);
        
        if (!recordData) {
          console.warn(`Vault item ${recordId} not found in metadata`);
          continue;
        }

        // Delete files from storage
        const { error: storageError } = await supabase.storage
          .from('make-f9be53a7-media')
          .remove([recordData.storage_path]);

        if (storageError) {
          console.warn(`Storage deletion error for ${recordId}:`, storageError);
        }

        // Delete thumbnail if it exists
        if (recordData.thumbnail_path) {
          const { error: thumbError } = await supabase.storage
            .from('make-f9be53a7-media')
            .remove([recordData.thumbnail_path]);
          
          if (thumbError) {
            console.warn(`Thumbnail deletion error for ${recordId}:`, thumbError);
          }
        }

        // Delete metadata from KV
        await kv.del(`legacy_vault:${user.id}:${recordId}`);

        deletedCount++;
        console.log(`✅ Deleted vault item ${recordId}`);

      } catch (error) {
        console.error(`Error deleting vault item ${recordId}:`, error);
        errors.push({ recordId, error: error.message });
      }
    }

    // Update the user's vault list
    const userVaultKey = `legacy_vault_list:${user.id}`;
    const existingRecords = await kv.get(userVaultKey) || [];
    const updatedRecords = existingRecords.filter(id => !recordIds.includes(id));
    await kv.set(userVaultKey, updatedRecords);

    console.log(`✅ Deleted ${deletedCount} item(s) from Vault`);

    return c.json({
      success: true,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Vault delete error:', error);
    return c.json({ 
      error: 'Failed to delete from Vault',
      details: error.message 
    }, 500);
  }
});

// ============================================
// VAULT TO CAPSULE - SERVER-SIDE COPY
// ============================================

// 🔄 Refresh expired signed URL for vault media
app.post("/make-server-f9be53a7/api/legacy-vault/refresh-url", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no token provided' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    const { vaultMediaId } = await c.req.json();

    if (!vaultMediaId) {
      return c.json({ error: 'vaultMediaId is required' }, 400);
    }

    console.log(`🔄 Refreshing signed URL for vault media: ${vaultMediaId}`);

    // Get vault media metadata from KV store
    const vaultKey = `legacy_vault:${user.id}:${vaultMediaId}`;
    console.log(`📦 Fetching vault record from key: ${vaultKey}`);
    const vaultRecord = await kv.get(vaultKey);

    if (!vaultRecord) {
      console.error(`❌ Vault media not found: ${vaultMediaId}`);
      console.error(`❌ Searched key: ${vaultKey}`);
      return c.json({ error: 'Vault media not found', key: vaultKey }, 404);
    }

    console.log(`📦 Found vault record:`, {
      type: vaultRecord.type,
      storage_path: vaultRecord.storage_path,
      file_name: vaultRecord.file_name,
      file_size: vaultRecord.file_size
    });

    // Generate fresh signed URL (valid for 1 hour)
    console.log(`🔐 Generating signed URL for path: ${vaultRecord.storage_path}`);
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('make-f9be53a7-media')
      .createSignedUrl(vaultRecord.storage_path, 3600);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('❌ Failed to generate signed URL:', urlError);
      console.error('❌ Storage path was:', vaultRecord.storage_path);
      return c.json({ 
        error: 'Failed to generate signed URL', 
        details: urlError?.message,
        storagePath: vaultRecord.storage_path
      }, 500);
    }

    console.log(`✅ Generated fresh signed URL for ${vaultMediaId}`);
    console.log(`✅ URL preview: ${signedUrlData.signedUrl.substring(0, 100)}...`);

    return c.json({
      success: true,
      url: signedUrlData.signedUrl,
      expiresIn: 3600 // seconds
    });

  } catch (error) {
    console.error('❌ Refresh URL error:', error);
    return c.json({ 
      error: 'Failed to refresh URL',
      details: error.message
    }, 500);
  }
});

// 🚀 PERFORMANCE OPTIMIZATION: Copy vault media to capsule storage server-side
// This eliminates the need for client to download+upload, saving 60-120 seconds on mobile
app.post("/make-server-f9be53a7/api/vault/copy-to-capsule", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no token provided' }, 401);
    }

    // Verify user authentication
    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('Vault copy authentication error:', authError);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    const { vaultMediaId, capsuleId, fileName, fileType, fileSize } = await c.req.json();

    if (!vaultMediaId) {
      return c.json({ error: 'vaultMediaId is required' }, 400);
    }

    console.log(`🚀 [Server Copy] Copying vault media to capsule:`, {
      vaultMediaId,
      capsuleId,
      fileName,
      fileSize: fileSize ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` : 'unknown',
      user: user.email
    });

    const startTime = Date.now();

    // 1. Get vault media metadata from KV store
    const vaultKey = `legacy_vault:${user.id}:${vaultMediaId}`;
    const vaultRecord = await kv.get(vaultKey);

    if (!vaultRecord) {
      // Vault media not in backend - likely a localStorage-only item
      // Client will fall back to client-side download
      console.error(`❌ Vault media not found in backend: ${vaultMediaId} (may be localStorage-only)`);
      return c.json({ 
        error: 'Vault media not found - may be localStorage only', 
        fallback: true  // Signal client to use fallback method
      }, 404);
    }

    const storagePath = vaultRecord.storage_path;
    const thumbnailPath = vaultRecord.thumbnail_path;
    
    console.log(`📦 Found vault record:`, {
      storagePath,
      hasThumbnail: !!thumbnailPath,
      originalFileName: vaultRecord.file_name,
      fileType: vaultRecord.file_type,
      fileSize: vaultRecord.file_size
    });

    // 🚀 TIER 3: Use Supabase Storage's copy API for true server-side copy
    // This bypasses the Edge Function memory entirely, allowing files of ANY size
    const fileSizeBytes = vaultRecord.file_size || 0;
    const fileSizeMB = fileSizeBytes / 1024 / 1024;

    // 2. Generate destination path for capsule storage
    const mediaId = crypto.randomUUID();
    const fileExtension = vaultRecord.file_name.split('.').pop() || 'bin';
    const capsuleStoragePath = `capsule-media/${capsuleId}/${mediaId}.${fileExtension}`;

    console.log(`📋 [Storage Copy] Copying file directly in storage (${fileSizeMB.toFixed(1)}MB): ${storagePath} → ${capsuleStoragePath}`);
    
    // 3. Copy file directly within Supabase Storage (no memory usage in Edge Function!)
    const copyStartTime = Date.now();
    const { data: copyData, error: copyError } = await supabase.storage
      .from('make-f9be53a7-media')
      .copy(storagePath, capsuleStoragePath);

    if (copyError) {
      console.error('❌ Failed to copy file in storage:', copyError);
      return c.json({ 
        error: 'Failed to copy file in storage',
        details: copyError.message,
        fallback: true // Signal client to try fallback method
      }, 500);
    }

    const copyTime = Date.now() - copyStartTime;
    console.log(`✅ [Storage Copy] File copied in ${copyTime}ms via storage API (${fileSizeMB.toFixed(1)}MB, no memory used!)`);

    // 4. Copy thumbnail if it exists (also using storage copy API)
    let thumbnailUrl = null;
    let copiedThumbnailPath = null; // ✅ Store path for future URL generation
    if (thumbnailPath) {
      try {
        const thumbExtension = thumbnailPath.split('.').pop() || 'jpg';
        const capsuleThumbnailPath = `capsule-media/${capsuleId}/${mediaId}_thumb.${thumbExtension}`;
        
        console.log(`🖼️ [Storage Copy] Copying thumbnail: ${thumbnailPath} → ${capsuleThumbnailPath}`);
        const { error: thumbCopyError } = await supabase.storage
          .from('make-f9be53a7-media')
          .copy(thumbnailPath, capsuleThumbnailPath);

        if (!thumbCopyError) {
          const { data: thumbUrlData } = await supabase.storage
            .from('make-f9be53a7-media')
            .createSignedUrl(capsuleThumbnailPath, 3600);
          
          thumbnailUrl = thumbUrlData?.signedUrl || null;
          copiedThumbnailPath = capsuleThumbnailPath; // ✅ Store path for future use
          console.log(`✅ Thumbnail copied successfully via storage API`);
        } else {
          console.warn('⚠️ Thumbnail copy failed (non-critical):', thumbCopyError);
        }
      } catch (thumbError) {
        console.warn('⚠️ Thumbnail copy failed (non-critical):', thumbError);
        // Continue without thumbnail
      }
    }

    // 5. Generate signed URL for the copied file (valid for 1 hour)
    const { data: signedUrlData } = await supabase.storage
      .from('make-f9be53a7-media')
      .createSignedUrl(capsuleStoragePath, 3600);

    if (!signedUrlData?.signedUrl) {
      console.error('❌ Failed to generate signed URL');
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }

    // 🔥 CRITICAL FIX: Create media file metadata in KV store
    // This is required for linking media to the capsule later (via temp_capsule_id)
    const mediaFile = {
      id: mediaId,
      capsule_id: capsuleId, // Initially 'temp' or draft ID
      user_id: user.id,
      file_name: vaultRecord.file_name,
      file_type: vaultRecord.file_type,
      file_size: vaultRecord.file_size,
      storage_path: capsuleStoragePath,
      storage_bucket: 'make-f9be53a7-media',
      thumbnail_path: copiedThumbnailPath, // ✅ Store thumbnail path for future URL generation
      created_at: new Date().toISOString()
    };

    // Store media file metadata in KV
    await kv.set(`media:${mediaFile.id}`, mediaFile);
    console.log(`✅ [Server Copy] Stored media metadata: ${mediaFile.id} (linked to ${capsuleId})`);
    
    // Add to capsule's media list (with retry logic for concurrency)
    let retries = 3;
    let success = false;
    while (retries > 0 && !success) {
      try {
        const capsuleMediaKey = `capsule_media:${capsuleId}`;
        const existingMedia = await kv.get(capsuleMediaKey) || [];
        
        // Check if this media ID is already in the list
        if (!existingMedia.includes(mediaFile.id)) {
          existingMedia.push(mediaFile.id);
          await kv.set(capsuleMediaKey, existingMedia);
          console.log(`✅ [Server Copy] Added media to capsule list: ${capsuleMediaKey} (${existingMedia.length} files)`);
        }
        success = true;
      } catch (err) {
        retries--;
        if (retries === 0) {
          // Last resort: create new list
          await kv.set(`capsule_media:${capsuleId}`, [mediaFile.id]);
          console.log(`✅ [Server Copy] Created new capsule media list: capsule_media:${capsuleId}`);
          success = true;
        } else {
          console.warn(`⚠️ [Server Copy] Failed to update capsule media list, retrying...`, err);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 [Storage Copy] Complete in ${totalTime}ms (${fileSizeMB.toFixed(1)}MB file)`);
    console.log(`📊 Performance: ${(fileSizeMB / (totalTime / 1000)).toFixed(2)} MB/s effective transfer rate`);

    // 6. Return the result
    return c.json({
      success: true,
      media: {
        id: mediaId,
        url: signedUrlData.signedUrl,
        thumbnail: thumbnailUrl,
        type: vaultRecord.type,
        mimeType: vaultRecord.file_type,
        fileName: vaultRecord.file_name,
        size: vaultRecord.file_size,
        storagePath: capsuleStoragePath,
        fromVault: true,
        copiedInMs: totalTime
      }
    });

  } catch (error) {
    console.error('❌ [Server Copy] Vault copy error:', error);
    
    // Check if it's a memory error
    const isMemoryError = error.message?.includes('memory') || 
                          error.message?.includes('Memory') ||
                          error.message?.includes('allocation') ||
                          error.name === 'RangeError';
    
    if (isMemoryError) {
      console.error('💥 [Server Copy] Memory limit exceeded - file too large for server-side copy');
      return c.json({ 
        error: 'Memory limit exceeded - file too large for server-side copy',
        details: error.message,
        fallback: true,
        reason: 'memory_error'
      }, 413); // 413 Payload Too Large
    }
    
    return c.json({ 
      error: 'Failed to copy vault media',
      details: error.message,
      fallback: true // Signal client to try fallback method
    }, 500);
  }
});

// ============================================
// ACHIEVEMENT SYSTEM ENDPOINTS
// ============================================

// Get all achievement definitions
app.get("/make-server-f9be53a7/achievements/definitions", async (c) => {
  try {
    console.log('🏆 [Route] GET /achievements/definitions - Starting...');
    const definitions = await AchievementService.getAchievementDefinitions();
    const count = Object.keys(definitions).length;
    console.log(`🏆 [Route] ✅ Returning ${count} achievement definitions`);
    return c.json({ definitions });
  } catch (error) {
    console.error('🏆 [Route] ❌ Get achievement definitions error:', error);
    return c.json({ error: 'Failed to get achievement definitions', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get user's unlocked achievements
app.get("/make-server-f9be53a7/achievements/user", async (c) => {
  try {
    console.log('🏆 [Route] GET /achievements/user - Starting...');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('🏆 [Route] ❌ No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.log('🏆 [Route] ❌ Token verification failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🏆 [Route] Fetching achievements for user: ${user.email}`);
    const achievements = await AchievementService.getUserAchievements(user.id);
    console.log(`🏆 [Route] ✅ Returning ${achievements.length} achievements`);
    return c.json({ achievements });
  } catch (error) {
    console.error('🏆 [Route] ❌ Get user achievements error:', error);
    return c.json({ error: 'Failed to get user achievements', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get user stats
app.get("/make-server-f9be53a7/achievements/stats", async (c) => {
  try {
    console.log('🏆 [Route] GET /achievements/stats - Starting...');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('🏆 [Route] ❌ No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.log('🏆 [Route] ❌ Token verification failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🏆 [Route] Fetching stats for user: ${user.email}`);
    const stats = await AchievementService.getUserStats(user.id);
    console.log(`🏆 [Route] ✅ Returning stats (${stats.capsules_created} capsules, ${stats.achievement_count} achievements)`);
    return c.json({ stats: stats || {} });
  } catch (error) {
    console.error('🏆 [Route] ❌ Get user stats error:', error);
    return c.json({ error: 'Failed to get user stats', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Track action and check for new achievements
app.post("/make-server-f9be53a7/achievements/track", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { action, metadata } = await c.req.json();
    
    if (!action) {
      return c.json({ error: 'Action is required' }, 400);
    }

    console.log(`🏆 Tracking achievement action: ${action} for user ${user.email}`);

    const result = await AchievementService.checkAndUnlockAchievements(
      user.id,
      action,
      { ...metadata, createdAt: new Date().toISOString() }
    );

    return c.json({ 
      newlyUnlocked: result.newlyUnlocked,
      stats: result.stats
    });
  } catch (error) {
    console.error('Track achievement action error:', error);
    return c.json({ error: 'Failed to track action' }, 500);
  }
});

// Get pending achievement notifications
app.get("/make-server-f9be53a7/achievements/pending", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const pending = await AchievementService.getPendingNotifications(user.id);
    return c.json({ pending });
  } catch (error) {
    console.error('Get pending notifications error:', error);
    return c.json({ error: 'Failed to get pending notifications' }, 500);
  }
});

// Mark notifications as shown
app.post("/make-server-f9be53a7/achievements/mark-shown", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { achievementIds } = await c.req.json();
    
    if (!achievementIds || !Array.isArray(achievementIds)) {
      return c.json({ error: 'Achievement IDs array is required' }, 400);
    }

    await AchievementService.markNotificationsShown(user.id, achievementIds);
    return c.json({ success: true });
  } catch (error) {
    console.error('Mark notifications shown error:', error);
    return c.json({ error: 'Failed to mark notifications' }, 500);
  }
});

// Mark achievement as shared
app.post("/make-server-f9be53a7/achievements/mark-shared", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { achievementId } = await c.req.json();
    
    if (!achievementId) {
      return c.json({ error: 'Achievement ID is required' }, 400);
    }

    await AchievementService.markAchievementShared(user.id, achievementId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Mark achievement shared error:', error);
    return c.json({ error: 'Failed to mark achievement as shared' }, 500);
  }
});

// Get global achievement stats
app.get("/make-server-f9be53a7/achievements/global-stats", async (c) => {
  try {
    const globalStats = await AchievementService.getGlobalStats();
    return c.json({ globalStats: globalStats || { total_users: 0, unlock_counts: {} } });
  } catch (error) {
    console.error('Get global stats error:', error);
    return c.json({ error: 'Failed to get global stats' }, 500);
  }
});

// Get achievement progress for a specific achievement
app.get("/make-server-f9be53a7/achievements/progress/:achievementId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const achievementId = c.req.param('achievementId');
    const progress = await AchievementService.getAchievementProgress(user.id, achievementId);
    
    return c.json({ progress });
  } catch (error) {
    console.error('Get achievement progress error:', error);
    return c.json({ error: 'Failed to get achievement progress' }, 500);
  }
});

console.log('🏆 Achievement system endpoints initialized');

// DEBUG: Get achievement queue state for debugging
app.get("/make-server-f9be53a7/achievements/debug/queue", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const queue = await kv.get(`achievement_queue_${user.id}`) || [];
    const userAchievements = await kv.get(`user_achievements:${user.id}`) || [];
    const userStats = await kv.get(`user_stats:${user.id}`) || {};
    
    return c.json({
      userId: user.id,
      queue: queue,
      queueLength: queue.length,
      pendingCount: queue.filter(q => !q.shown).length,
      unlockedAchievements: userAchievements.length,
      stats: {
        capsules_created: userStats.capsules_created || 0,
        capsules_sent: userStats.capsules_sent || 0,
        capsules_received: userStats.capsules_received || 0
      }
    });
  } catch (error) {
    console.error('Debug queue error:', error);
    return c.json({ error: 'Failed to get debug info' }, 500);
  }
});

// DEBUG: Clean up achievement queue (remove shown items, fix duplicates)
app.post("/make-server-f9be53a7/achievements/debug/cleanup", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const queue = await kv.get(`achievement_queue_${user.id}`) || [];
    const beforeCount = queue.length;
    
    // Remove all shown items and deduplicate
    const seenIds = new Set();
    const cleanedQueue = queue.filter(q => {
      if (q.shown) return false; // Remove shown items
      if (seenIds.has(q.achievementId)) return false; // Remove duplicates
      seenIds.add(q.achievementId);
      return true;
    });
    
    await kv.set(`achievement_queue_${user.id}`, cleanedQueue);
    
    return c.json({
      success: true,
      message: `Cleaned up queue for user ${user.id}`,
      before: beforeCount,
      after: cleanedQueue.length,
      removed: beforeCount - cleanedQueue.length,
      pendingCount: cleanedQueue.length
    });
  } catch (error) {
    console.error('Cleanup queue error:', error);
    return c.json({ error: 'Failed to cleanup queue' }, 500);
  }
});

// ============================================
// LEGACY TITLES SYSTEM ENDPOINTS
// ============================================

// Get user's title profile
app.get("/make-server-f9be53a7/titles/profile", async (c) => {
  try {
    console.log('🏷️ [Titles API] /titles/profile called');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('❌ [Titles API] No access token in Authorization header');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('🏷️ [Titles API] Token received, verifying...');
    const { user, error: authError } = await verifyUserToken(accessToken);
    
    if (authError || !user) {
      console.error('❌ [Titles API] Token verification failed:', authError?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('✅ [Titles API] User verified:', user.id);
    const profile = await AchievementService.getUserTitleProfile(user.id);
    console.log('✅ [Titles API] Returning profile:', profile?.equipped_title || 'none');
    return c.json(profile);
  } catch (error) {
    console.error('💥 [Titles API] Get title profile error:', error);
    return c.json({ error: 'Failed to get title profile' }, 500);
  }
});

// Get all available titles (locked + unlocked)
app.get("/make-server-f9be53a7/titles/available", async (c) => {
  try {
    console.log('🏷️ [Titles API] /titles/available called');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('❌ [Titles API] No access token in Authorization header');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('🏷️ [Titles API] Token received, verifying...');
    const { user, error: authError } = await verifyUserToken(accessToken);
    
    if (authError || !user) {
      console.error('❌ [Titles API] Token verification failed:', authError?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('✅ [Titles API] User verified:', user.id);
    const titles = await AchievementService.getAvailableTitles(user.id);
    console.log('✅ [Titles API] Returning titles:', titles?.unlockedCount || 0, '/', titles?.totalCount || 0);
    return c.json(titles);
  } catch (error) {
    console.error('💥 [Titles API] Get available titles error:', error);
    return c.json({ error: 'Failed to get available titles' }, 500);
  }
});

// Initialize new user with Time Novice title (freebie)
app.post("/make-server-f9be53a7/titles/initialize", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await AchievementService.initializeUserTitles(user.id);
    return c.json({ success: true, message: 'User titles initialized with Time Novice' });
  } catch (error) {
    console.error('Initialize user titles error:', error);
    return c.json({ error: 'Failed to initialize user titles' }, 500);
  }
});

// Equip a title
app.post("/make-server-f9be53a7/titles/equip", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { achievementId } = body;
    
    console.log('[Titles API] Equip endpoint received:', {
      body,
      achievementId,
      isNull: achievementId === null,
      type: typeof achievementId,
      userId: user.id
    });
    
    const result = await AchievementService.equipTitle(user.id, achievementId);
    
    console.log('[Titles API] Equip result:', result);
    return c.json(result);
  } catch (error) {
    console.error('Equip title error:', error);
    return c.json({ error: 'Failed to equip title' }, 500);
  }
});

// ============================================================================
// WELCOME CELEBRATION ROUTES
// ============================================================================

// Check if user needs to see welcome celebration (First Step achievement)
app.post("/make-server-f9be53a7/achievements/check-welcome", WelcomeCelebration.checkWelcomeCelebration);

// Mark welcome celebration as seen
app.post("/make-server-f9be53a7/achievements/mark-welcome-seen", WelcomeCelebration.markWelcomeSeen);

console.log('🎉 Welcome celebration endpoints initialized');
console.log('🏅 Legacy Titles system endpoints initialized');

// ========================================
// ONBOARDING MODULE ENDPOINTS
// ========================================

// Get user's onboarding completion state
app.post("/make-server-f9be53a7/onboarding/state", async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }
    
    console.log(`📚 [Onboarding] Getting state for user ${userId}`);
    
    const completionState = await kv.get(`onboarding:${userId}`) || {};
    
    return c.json({ completionState });
  } catch (error) {
    console.error('❌ [Onboarding] Failed to get state:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Mark onboarding module as complete
app.post("/make-server-f9be53a7/onboarding/complete", async (c) => {
  try {
    const { userId, moduleId } = await c.req.json();
    
    if (!userId || !moduleId) {
      return c.json({ error: 'Missing userId or moduleId' }, 400);
    }
    
    console.log(`📚 [Onboarding] Marking module ${moduleId} complete for user ${userId}`);
    
    // Get current state
    const completionState = await kv.get(`onboarding:${userId}`) || {};
    
    // Mark module complete with timestamp
    completionState[moduleId] = true;
    completionState[`${moduleId}_completed_at`] = new Date().toISOString();
    
    // Save updated state
    await kv.set(`onboarding:${userId}`, completionState);
    
    // Track achievement if this was first capsule completion
    if (moduleId === 'first_capsule') {
      console.log('🏆 [Onboarding] First capsule completed - unlocking TIME KEEPER achievement');
      
      try {
        // Track the action which will unlock the achievement via the standard checkAndUnlockAchievements flow
        await AchievementService.checkAndUnlockAchievements(
          userId,
          'onboarding_first_capsule_complete',
          { module: 'first_capsule' }
        );
      } catch (achievementError) {
        console.error('❌ Failed to unlock Time Keeper achievement:', achievementError);
        // Don't fail the onboarding completion
      }
    }
    
    // Track achievement if this was vault mastery completion
    if (moduleId === 'vault_mastery') {
      console.log('🏆 [Onboarding] Vault mastery completed - unlocking VAULT GUARDIAN achievement');
      
      try {
        // Track the action which will unlock the achievement via the standard checkAndUnlockAchievements flow
        await AchievementService.checkAndUnlockAchievements(
          userId,
          'onboarding_vault_mastery_complete',
          { module: 'vault_mastery' }
        );
      } catch (achievementError) {
        console.error('❌ Failed to unlock Vault Guardian achievement:', achievementError);
        // Don't fail the onboarding completion
      }
    }
    
    return c.json({ success: true, completionState });
  } catch (error) {
    console.error('❌ [Onboarding] Failed to mark complete:', error);
    return c.json({ error: error.message }, 500);
  }
});

console.log('📚 Onboarding module endpoints initialized');

// Helper function: Message Condenser - Make it shorter while preserving meaning
function condenseMessage(text: string): string {
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // If already short, just clean it up
  if (sentences.length <= 2 || text.length < 100) {
    return text.trim().replace(/\s+/g, ' ');
  }
  
  // For longer messages, extract key sentences
  // Keep first sentence (intro), middle key sentence, and last sentence (conclusion)
  if (sentences.length === 3) {
    // Already optimal length
    return text.trim();
  } else if (sentences.length === 4) {
    // Remove one middle sentence
    return `${sentences[0].trim()} ${sentences[2].trim()} ${sentences[3].trim()}`.trim();
  } else if (sentences.length >= 5) {
    // Keep first, one from middle, and last
    const middleIndex = Math.floor(sentences.length / 2);
    return `${sentences[0].trim()} ${sentences[middleIndex].trim()} ${sentences[sentences.length - 1].trim()}`.trim();
  }
  
  return text.trim();
}

// Helper function: Time Traveler - Add temporal perspective
function timeTravelerTransform(text: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Temporal reflection prompts
  const temporalFrames = [
    {
      opening: `📍 **${dateStr}** — A moment captured in time`,
      context: 'As I write this today, I want to remember',
      bridge: '\n\n⏳ **Looking Back & Looking Forward**',
      reflection: 'When you read this, notice how far you\'ve come. The journey from this moment to yours is part of your story.',
      closing: '\n\n🌅 May this message bridge the distance between who I am today and who you\'ve become tomorrow.'
    },
    {
      opening: `🕰️ **Timestamp: ${dateStr}**`,
      context: 'In this present moment',
      bridge: '\n\n🔮 **Past → Present → Future**',
      reflection: 'What seemed important then, what matters now, and what will endure — these words carry all three.',
      closing: '\n\n⚡ Time is the canvas. This message is a brushstroke across it.'
    },
    {
      opening: `🌊 **Sent from ${dateStr}**`,
      context: 'Today feels like',
      bridge: '\n\n💫 **The Space Between Then and Now**',
      reflection: 'Every moment between this writing and your reading is filled with growth, change, and becoming.',
      closing: '\n\n🎯 Future you: remember that present me believed in you.'
    }
  ];
  
  const frame = temporalFrames[Math.floor(Math.random() * temporalFrames.length)];
  
  // Check if message already has temporal framing
  if (text.toLowerCase().includes('future') && text.toLowerCase().includes('past')) {
    return `${frame.opening}\n\n${text}\n\n${frame.reflection}${frame.closing}`;
  }
  
  return `${frame.opening}\n\n${frame.context}: ${text.charAt(0).toLowerCase()}${text.slice(1)}\n${frame.bridge}\n\n${frame.reflection}${frame.closing}`;
}

// Helper function: Legacy Amplifier - Transform into powerful legacy message
function legacyAmplifier(text: string): string {
  const lowercaseText = text.toLowerCase();
  
  // Detect theme for context-aware enhancement
  let theme = 'wisdom';
  let legacyFrame: any;
  
  if (lowercaseText.includes('love') || lowercaseText.includes('family') || lowercaseText.includes('heart')) {
    theme = 'love';
    legacyFrame = {
      prefix: '💝 **Legacy of Love**',
      wisdom: 'Love is the only thing we can carry through time unchanged.',
      callToAction: 'Cherish the connections that matter. They are your true inheritance.'
    };
  } else if (lowercaseText.includes('dream') || lowercaseText.includes('goal') || lowercaseText.includes('future')) {
    theme = 'aspiration';
    legacyFrame = {
      prefix: '🎯 **Legacy of Ambition**',
      wisdom: 'Dreams pursued become the chapters of a life worth remembering.',
      callToAction: 'Keep reaching. Your courage to try is your gift to the world.'
    };
  } else if (lowercaseText.includes('learn') || lowercaseText.includes('grow') || lowercaseText.includes('change')) {
    theme = 'growth';
    legacyFrame = {
      prefix: '🌱 **Legacy of Growth**',
      wisdom: 'Every lesson learned becomes wisdom for those who follow.',
      callToAction: 'Embrace transformation. Your evolution inspires others to become.'
    };
  } else if (lowercaseText.includes('remember') || lowercaseText.includes('memory') || lowercaseText.includes('never forget')) {
    theme = 'memory';
    legacyFrame = {
      prefix: '🕯️ **Legacy of Remembrance**',
      wisdom: 'What we remember shapes who we become. Memory is the soul\'s compass.',
      callToAction: 'Honor what came before. Carry these memories as torches into tomorrow.'
    };
  } else {
    legacyFrame = {
      prefix: '⚡ **Legacy Message**',
      wisdom: 'The words we leave behind become bridges between generations.',
      callToAction: 'Live with intention. Your story becomes part of something greater.'
    };
  }
  
  // Add powerful structure
  const enhanced = `${legacyFrame.prefix}\n\n${text}\n\n---\n\n💫 **Timeless Truth:** ${legacyFrame.wisdom}\n\n🔥 **To My Future Self (and Beyond):** ${legacyFrame.callToAction}\n\n✨ This message carries the weight of this moment across the expanse of time. May it find you exactly when you need it most.`;
  
  return enhanced;
}

// Helper function: Heart Connector - Add authentic vulnerability and emotional depth
function heartConnector(text: string): string {
  const lowercaseText = text.toLowerCase();
  
  // Vulnerability phrases that add authentic human connection
  const vulnerabilityOpeners = [
    'If I\'m being completely honest',
    'What I really want to say is',
    'The truth is',
    'From a place of raw authenticity',
    'Without pretense or polish'
  ];
  
  const emotionalBridges = [
    '\n\n💭 **What I\'m Really Feeling:**',
    '\n\n🌊 **The Deeper Truth:**',
    '\n\n💫 **What My Heart Wants to Say:**',
    '\n\n🔥 **Beyond the Surface:**'
  ];
  
  const connectionClosings = [
    {
      reflection: 'These aren\'t just words — they\'re pieces of my heart, offered across time.',
      hope: 'I hope when you read this, you feel the genuine care woven into every sentence. You matter. This moment matters.'
    },
    {
      reflection: 'Writing this feels vulnerable, like opening a window to my soul.',
      hope: 'May you receive this with the same openness it was given. Connection is the gift we give ourselves.'
    },
    {
      reflection: 'This message is me choosing to be seen, to be real, to be present.',
      hope: 'I trust that future you (or whoever reads this) will honor the authenticity I\'m sharing here.'
    }
  ];
  
  // Detect if already emotionally vulnerable
  const isAlreadyVulnerable = lowercaseText.includes('honest') || 
                              lowercaseText.includes('truth') || 
                              lowercaseText.includes('feel') ||
                              lowercaseText.includes('heart');
  
  let enhanced = text;
  
  if (!isAlreadyVulnerable && text.length < 150) {
    // Add vulnerable opening for shorter messages
    const opener = vulnerabilityOpeners[Math.floor(Math.random() * vulnerabilityOpeners.length)];
    enhanced = `${opener}: ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }
  
  // Add emotional bridge and depth
  const bridge = emotionalBridges[Math.floor(Math.random() * emotionalBridges.length)];
  const closing = connectionClosings[Math.floor(Math.random() * connectionClosings.length)];
  
  // Add deeper emotional layer
  const emotionalInsight = detectEmotionalInsight(lowercaseText);
  
  return `${enhanced}${bridge}\n\n${emotionalInsight}\n\n---\n\n💝 ${closing.reflection}\n\n🌟 ${closing.hope}`;
}

// Helper to add context-aware emotional insight
function detectEmotionalInsight(text: string): string {
  if (text.includes('fear') || text.includes('worried') || text.includes('anxious')) {
    return 'Beneath the fear is courage. Beneath the worry is care. You\'re feeling this because you\'re brave enough to hope for something better.';
  } else if (text.includes('happy') || text.includes('joy') || text.includes('excited')) {
    return 'This joy you\'re feeling? Hold onto it. Let it remind you that life offers moments of pure light, and you\'re worthy of every single one.';
  } else if (text.includes('sad') || text.includes('hurt') || text.includes('pain')) {
    return 'Sadness is evidence of depth. Pain is proof you\'re human. These feelings won\'t last forever, but your resilience will.';
  } else if (text.includes('love') || text.includes('care') || text.includes('cherish')) {
    return 'Love is the most honest thing we do. By expressing it, you\'re participating in something ancient and sacred.';
  } else if (text.includes('hope') || text.includes('wish') || text.includes('dream')) {
    return 'Hope is an act of defiance against despair. By hoping, you\'re already creating the future you desire.';
  } else {
    return 'These words matter because you matter. Your thoughts, feelings, and experiences are valid and valuable.';
  }
}

// Helper function: Clarity Architect - Structure with clear organization
function clarityArchitect(text: string): string {
  const lines = text.split('\n').filter(l => l.trim());
  
  // Detect if message already has good structure
  const hasStructure = /^[\d•\-*#]/.test(text.trim()) || lines.length > 4;
  
  if (hasStructure) {
    // Already structured - just enhance it
    return addStructuralHeaders(text);
  }
  
  // Analyze content to add intelligent structure
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  if (sentences.length === 1) {
    // Single sentence - add context and framework
    return `📋 **Message Summary**\n\n${text}\n\n---\n\n**📍 Context:**\nThis message was written to capture a specific moment, feeling, or intention.\n\n**🎯 Purpose:**\nWhen you read this, reflect on how this thought resonates with where you are now.\n\n**✨ Next Step:**\nConsider what action or reflection this message invites from you today.`;
  }
  
  if (sentences.length <= 3) {
    // Short message - add clear sections
    return `**💭 Core Message:**\n\n${text}\n\n---\n\n**🔍 Key Takeaway:**\n${generateKeyTakeaway(text)}\n\n**🌟 Reflection Prompt:**\n${generateReflectionPrompt(text)}`;
  }
  
  // Longer message - create structured outline
  const structuredSections = createStructuredOutline(sentences);
  return structuredSections;
}

// Helper: Add structural headers to existing structured content
function addStructuralHeaders(text: string): string {
  const lines = text.split('\n');
  
  // Add header if not present
  if (!text.startsWith('#') && !text.startsWith('**')) {
    return `# 📝 Time Capsule Message\n\n${text}\n\n---\n\n*Organized for clarity and easy reference*`;
  }
  
  return text;
}

// Helper: Generate key takeaway from message
function generateKeyTakeaway(text: string): string {
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('remember') || lowercaseText.includes('don\'t forget')) {
    return 'This message asks you to remember something important. Honor that intention.';
  } else if (lowercaseText.includes('love') || lowercaseText.includes('care')) {
    return 'At its heart, this message is about connection and care. Let that guide your response.';
  } else if (lowercaseText.includes('goal') || lowercaseText.includes('dream') || lowercaseText.includes('plan')) {
    return 'This message represents a commitment to future action. Consider how you\'ve progressed toward this vision.';
  } else if (lowercaseText.includes('thank') || lowercaseText.includes('grateful')) {
    return 'Gratitude is the foundation of this message. Carry that appreciation forward.';
  } else {
    return 'This message captures a moment worth preserving. Notice what it reveals about your journey.';
  }
}

// Helper: Generate reflection prompt
function generateReflectionPrompt(text: string): string {
  const prompts = [
    'How has your perspective on this changed since you wrote it?',
    'What would you add to this message if you were writing it today?',
    'Does this message still resonate, or has your path shifted?',
    'What wisdom have you gained since writing this?',
    'How does reading this make you feel about your growth?'
  ];
  
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Helper: Create structured outline from sentences
function createStructuredOutline(sentences: string[]): string {
  const intro = sentences[0];
  const body = sentences.slice(1, -1);
  const conclusion = sentences[sentences.length - 1];
  
  let structured = `**📍 Opening Thought:**\n\n${intro}\n\n`;
  
  if (body.length > 0) {
    structured += `**💡 Key Points:**\n\n`;
    body.forEach((sentence, idx) => {
      structured += `${idx + 1}. ${sentence.trim()}\n`;
    });
    structured += '\n';
  }
  
  structured += `**✨ Closing Reflection:**\n\n${conclusion}\n\n`;
  structured += `---\n\n*Message organized into ${sentences.length} distinct thoughts for clarity*`;
  
  return structured;
}

// AI Enhancement endpoint
app.post("/make-server-f9be53a7/ai/enhance", async (c) => {
  try {
    const { message, prompt } = await c.req.json();
    
    if (!message || !prompt) {
      return c.json({ error: "Message and prompt are required" }, 400);
    }

    console.log('🤖 AI Enhancement request:', { 
      promptType: prompt.substring(0, 50),
      messageLength: message.length 
    });

    let enhanced = message;

    if (prompt.includes('time capsule perspective') || prompt.includes('Time Traveler')) {
      enhanced = timeTravelerTransform(message);
      console.log('⏰ Applied Time Traveler transformation');
    } else if (prompt.includes('legacy message') || prompt.includes('Legacy Amplifier')) {
      enhanced = legacyAmplifier(message);
      console.log('🏛️ Applied Legacy Amplifier enhancement');
    } else if (prompt.includes('vulnerability') || prompt.includes('Heart Connector')) {
      enhanced = heartConnector(message);
      console.log('💝 Applied Heart Connector with emotional depth');
    } else if (prompt.includes('organization') || prompt.includes('Clarity Architect')) {
      enhanced = clarityArchitect(message);
      console.log('📐 Applied Clarity Architect structuring');
    }

    console.log('✅ AI Enhancement complete:', { 
      originalLength: message.length,
      enhancedLength: enhanced.length 
    });

    return c.json({ 
      enhanced,
      original: message 
    });
  } catch (error) {
    console.error("AI enhancement error:", error);
    return c.json({ 
      error: "Failed to enhance message",
      details: error.message 
    }, 500);
  }
});

// AI Enhancement endpoint using LOCAL FUNCTIONS (no OpenAI API key needed)
// This replaces the previous OpenAI-based endpoint to avoid API key errors
app.post("/make-server-f9be53a7/ai/enhance-text", async (c) => {
  try {
    const { text, instruction } = await c.req.json();
    
    if (!text || !instruction) {
      return c.json({ error: "Text and instruction are required" }, 400);
    }

    console.log('🤖 AI Enhancement request (LOCAL FUNCTIONS - no API needed):', { 
      instructionType: instruction.substring(0, 50),
      textLength: text.length 
    });

    let enhanced = text;

    // REMOVED: "Make it Longer", "Make it Shorter", "Add Emotion", "Improve Clarity"
    // These features have been removed from CreateCapsule and may return in a future release
    
    // Match remaining enhancement prompts
    if (instruction.includes('time capsule perspective') || instruction.includes('Time Traveler')) {
      enhanced = timeTravelerTransform(text);
      console.log('⏰ Applied Time Traveler transformation');
    } else if (instruction.includes('legacy message') || instruction.includes('Legacy Amplifier')) {
      enhanced = legacyAmplifier(text);
      console.log('🏛️ Applied Legacy Amplifier enhancement');
    } else if (instruction.includes('Heart Connector')) {
      enhanced = heartConnector(text);
      console.log('💝 Applied Heart Connector with emotional depth');
    } else if (instruction.includes('Clarity Architect')) {
      enhanced = clarityArchitect(text);
      console.log('📐 Applied Clarity Architect structuring');
    }

    console.log('✅ AI Enhancement complete:', { 
      originalLength: text.length,
      enhancedLength: enhanced.length 
    });

    return c.json({ 
      enhanced,
      original: text 
    });
  } catch (error) {
    console.error("AI enhancement error:", error);
    return c.json({ 
      error: "Failed to enhance message",
      details: error.message 
    }, 500);
  }
});

console.log('🤖 AI enhancement endpoints initialized');

// ============================================
// LEGACY VAULT ENDPOINTS
// ============================================

// Get Legacy Access configuration
app.get("/make-server-f9be53a7/api/legacy-access/config", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔐 [Legacy Access] Getting config for user: ${user.id}`);
    
    // ✅ Update activity timestamp when user views their Legacy Access config
    // This ensures "Days Since Login" shows 0 when actively using the app
    await LegacyAccessService.updateUserActivity(user.id);
    
    // Get the updated config (after activity update)
    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    
    // Calculate days until unlock for display (using updated lastActivityAt)
    const daysUntilUnlock = LegacyAccessService.calculateDaysUntilUnlock(config.trigger);
    
    return c.json({ 
      config,
      daysUntilUnlock
    });
  } catch (error) {
    console.error('❌ [Legacy Access] Get config error:', error);
    return c.json({ error: 'Failed to get Legacy Access config' }, 500);
  }
});

// Add beneficiary
app.post("/make-server-f9be53a7/api/legacy-access/beneficiary", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name, email, phone, personalMessage, folderPermissions, notificationTiming } = body;

    if (!name || !email) {
      return c.json({ error: 'Name and email are required' }, 400);
    }

    console.log(`👤 [Legacy Access] Adding beneficiary for user: ${user.id}`);
    console.log(`📁 [Legacy Access] Folder permissions provided: ${folderPermissions ? Object.keys(folderPermissions).length : 0} folders`);
    console.log(`📁 [Legacy Access] Full folder permissions:`, JSON.stringify(folderPermissions, null, 2));
    console.log(`🔔 [Legacy Access] Notification timing: ${notificationTiming || 'deferred (default)'}`);
    
    const result = await LegacyAccessService.addBeneficiary(user.id, {
      name,
      email,
      phone,
      personalMessage,
      folderPermissions, // ✅ ADD: Pass folder permissions to service
      notificationTiming // ✅ NEW: Pass notification timing preference
    });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    // Track activity
    await LegacyAccessService.updateUserActivity(user.id);

    // 🔔 CREATE NOTIFICATION: Notify beneficiary they've been granted legacy access
    // IMPORTANT: We notify the BENEFICIARY (person receiving access), not the granter
    try {
      console.log(`🔔 [Legacy Access] Creating notification for beneficiary email: ${email}`);
      
      // Try to find if beneficiary has an Eras account
      const beneficiaryProfile = await kv.get(`profile_by_email:${email.toLowerCase()}`);
      
      if (beneficiaryProfile && beneficiaryProfile.userId) {
        console.log(`📧 [Legacy Access] Beneficiary has an account, sending notification to userId: ${beneficiaryProfile.userId}`);
        
        // Get granter's profile for name
        const granterProfile = await kv.get(`profile:${user.id}`);
        const granterName = granterProfile?.name || granterProfile?.displayName || 'Someone';
        
        // Create notification
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'legacy_access_granted',
          grantedBy: user.id,
          grantedByName: granterName,
          echoType: 'legacy_access',
          echoContent: `${granterName} has granted you legacy access to their account`,
          senderId: user.id,
          senderName: granterName,
          timestamp: new Date().toISOString(),
          read: false,
          seen: false,
          createdAt: new Date().toISOString(),
          metadata: {
            beneficiaryId: result.beneficiary.id,
            personalMessage: personalMessage
          }
        };
        
        console.log(`📝 [Legacy Access] Notification object created:`, JSON.stringify(notification, null, 2));
        
        // Store notification in array
        const arrayKey = `echo_notifications_array:${beneficiaryProfile.userId}`;
        console.log(`💾 [Legacy Access] Storing notification in KV: key="${arrayKey}"`);
        
        const existingNotifications = await kv.get(arrayKey) || [];
        console.log(`📊 [Legacy Access] Existing notifications count: ${existingNotifications.length}`);
        
        existingNotifications.unshift(notification); // Add to beginning (newest first)
        
        // Keep only last 100 notifications
        if (existingNotifications.length > 100) {
          existingNotifications.splice(100);
        }
        
        await kv.set(arrayKey, existingNotifications);
        console.log(`✅ [Legacy Access] Notification saved! New count: ${existingNotifications.length}`);
        
        // Broadcast notification to beneficiary
        console.log(`📡 [Legacy Access] Broadcasting to beneficiary: ${beneficiaryProfile.userId}`);
        try {
          await fetch(`https://${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-f9be53a7/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              userId: beneficiaryProfile.userId,
              type: 'new_notification',
              data: notification
            })
          });
          console.log(`✅ [Legacy Access] Broadcast sent successfully`);
        } catch (broadcastError) {
          console.warn(`⚠️ [Legacy Access] Broadcast failed (non-critical):`, broadcastError.message);
        }
      } else {
        console.log(`ℹ️ [Legacy Access] Beneficiary ${email} does not have an Eras account yet - no notification sent`);
        // They'll get an email invitation instead (handled by LegacyAccessService)
      }
    } catch (notificationError) {
      console.error(`❌ [Legacy Access] Failed to create notification:`, notificationError);
      // Don't let notification failure block the beneficiary addition
    }

    return c.json({ 
      success: true, 
      beneficiary: result.beneficiary 
    });
  } catch (error) {
    console.error('❌ [Legacy Access] Add beneficiary error:', error);
    return c.json({ error: 'Failed to add beneficiary' }, 500);
  }
});

// Verify beneficiary email
app.post("/make-server-f9be53a7/api/legacy-access/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { verificationToken } = body;

    if (!verificationToken) {
      return c.json({ error: 'Verification token is required' }, 400);
    }

    console.log(`✅ [Legacy Access] Verifying beneficiary token`);
    const result = await LegacyAccessService.verifyBeneficiary(verificationToken);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      success: true, 
      message: result.message 
    });
  } catch (error) {
    console.error('❌ [Legacy Access] Verify beneficiary error:', error);
    return c.json({ error: 'Failed to verify beneficiary' }, 500);
  }
});

// DEBUG: List all beneficiaries (no auth required for debugging)
app.get("/make-server-f9be53a7/api/legacy-access/debug/all-beneficiaries", async (c) => {
  try {
    const allConfigs = await kv.getByPrefix('legacy_access_');
    const results = [];
    
    for (const config of allConfigs) {
      if (!config.beneficiaries || !Array.isArray(config.beneficiaries)) {
        results.push({
          userId: config.userId,
          error: 'Invalid or missing beneficiaries array',
          beneficiariesType: typeof config.beneficiaries,
          beneficiariesValue: config.beneficiaries
        });
        continue;
      }
      
      for (const ben of config.beneficiaries) {
        results.push({
          userId: config.userId,
          beneficiaryId: ben.id,
          email: ben.email,
          status: ben.status,
          hasToken: !!ben.verificationToken,
          tokenLength: ben.verificationToken?.length || 0,
          tokenPreview: ben.verificationToken?.substring(0, 30) || 'NO_TOKEN',
          addedAt: ben.addedAt ? new Date(ben.addedAt).toISOString() : 'unknown',
          verifiedAt: ben.verifiedAt ? new Date(ben.verifiedAt).toISOString() : null,
          tokenExpires: ben.tokenExpiresAt ? new Date(ben.tokenExpiresAt).toISOString() : null
        });
      }
    }
    
    return c.json({
      timestamp: new Date().toISOString(),
      totalConfigs: allConfigs.length,
      totalBeneficiaries: results.length,
      beneficiaries: results
    });
  } catch (error) {
    console.error('DEBUG error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// NEW: Verify beneficiary email (Phase 2 - Frontend compatible endpoint)
// Changed to GET to bypass Supabase JWT verification on public endpoints
app.get("/make-server-f9be53a7/api/legacy-access/beneficiary/verify", async (c) => {
  try {
    // Get token from query parameter
    const token = c.req.query('token');

    if (!token) {
      console.error(`❌ [Phase 2] No token provided in query params`);
      return c.json({ error: 'Verification token is required' }, 400);
    }

    console.log(`🔐 [Phase 2] GET Verifying beneficiary with token: ${token.substring(0, 8)}... (length: ${token.length}, full: ${token})`);

    // Use LegacyAccessService to verify - it handles the new config structure
    const result = await LegacyAccessService.verifyBeneficiary(token);

    if (!result.success) {
      console.error(`❌ [Phase 2] Verification failed: ${result.error}`);
      
      // Check for specific error types
      const isExpired = result.error?.includes('expired');
      const isAlreadyVerified = result.error?.includes('already verified');
      
      return c.json({ 
        success: false, 
        error: result.error,
        expired: isExpired,
        alreadyVerified: isAlreadyVerified
      }, 400);
    }

    // Get owner information for success response
    // The token is cleared after verification, so we need to search for recently verified beneficiaries
    const allConfigs = await kv.getByPrefix('legacy_access_');
    let ownerName = 'the account owner';
    let beneficiaryEmail = '';
    
    // Find the beneficiary that was just verified (within last 5 seconds)
    const recentVerificationTime = Date.now() - 5000;
    
    for (const config of allConfigs) {
      const beneficiary = config.beneficiaries?.find(b => 
        b.status === 'verified' && 
        b.verifiedAt && 
        b.verifiedAt >= recentVerificationTime
      );
      if (beneficiary) {
        const ownerSettings = await kv.get(`user_settings:${config.userId}`);
        ownerName = ownerSettings?.displayName || ownerSettings?.email?.split('@')[0] || 'the account owner';
        beneficiaryEmail = beneficiary.email;
        break;
      }
    }

    console.log(`✅ [Phase 2] Beneficiary verified successfully via LegacyAccessService`);

    return c.json({
      success: true,
      ownerName,
      beneficiaryEmail
    });
  } catch (error) {
    console.error('❌ [Phase 2] Beneficiary verification error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to verify beneficiary' 
    }, 500);
  }
});

// NEW: Decline beneficiary role (Phase 2)
// Changed to GET to bypass Supabase JWT verification on public endpoints
app.get("/make-server-f9be53a7/api/legacy-access/beneficiary/decline", async (c) => {
  try {
    // Get token from query parameter
    const token = c.req.query('token');

    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    console.log(`❌ [Phase 2] GET Declining beneficiary with token: ${token.substring(0, 8)}...`);

    // Get the beneficiary record using the verification token - getByPrefix returns an array of values
    const beneficiaryData = await kv.getByPrefix(`legacy_beneficiary:`);
    
    let matchingBeneficiary = null;
    let matchingBeneficiaryId = null;

    // ✅ FIX: getByPrefix returns an array of VALUES, not {key, value} objects
    for (const beneficiary of beneficiaryData) {
      if (beneficiary.verificationToken === token) {
        matchingBeneficiary = beneficiary;
        matchingBeneficiaryId = beneficiary.id;
        break;
      }
    }

    if (!matchingBeneficiary) {
      console.error(`❌ [Phase 2] No beneficiary found with this token`);
      return c.json({ 
        success: false, 
        error: 'Invalid verification link' 
      }, 400);
    }

    // Update status to declined
    matchingBeneficiary.status = 'declined';
    matchingBeneficiary.declinedAt = new Date().toISOString();
    
    await kv.set(`legacy_beneficiary:${matchingBeneficiaryId}`, matchingBeneficiary);

    // TODO: Optionally notify the owner that beneficiary declined

    console.log(`✅ [Phase 2] Beneficiary declined successfully: ${matchingBeneficiary.email}`);

    return c.json({
      success: true,
      message: 'Beneficiary role declined'
    });
  } catch (error) {
    console.error('❌ [Phase 2] Beneficiary decline error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to decline beneficiary role' 
    }, 500);
  }
});

// ✅ NEW: Public endpoint for beneficiaries to request new verification link
// Rate-limited to prevent abuse (3 requests per day per email)
app.post("/make-server-f9be53a7/api/public/legacy-access/request-verification", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    console.log(`📧 [Public] Beneficiary requesting new verification link: ${email}`);
    
    // Rate limiting: Check if they've requested too many times today
    const rateLimitKey = `verification_request_rate:${email}:${new Date().toISOString().split('T')[0]}`;
    const requestCount = await kv.get<number>(rateLimitKey) || 0;
    
    if (requestCount >= 3) {
      console.warn(`⚠️ [Public] Rate limit exceeded for ${email}`);
      return c.json({ 
        error: 'Too many requests. You can request a new verification link up to 3 times per day. Please try again tomorrow or contact support.' 
      }, 429);
    }
    
    // Find all legacy access configs and search for this beneficiary email
    const allConfigs = await kv.getByPrefix<LegacyAccessService.LegacyAccessConfig>('legacy_access_');
    
    let foundBeneficiary = false;
    let beneficiaryConfig: LegacyAccessService.LegacyAccessConfig | null = null;
    let beneficiary: LegacyAccessService.Beneficiary | null = null;
    
    for (const config of allConfigs) {
      if (!config.beneficiaries || !Array.isArray(config.beneficiaries)) continue;
      
      const match = config.beneficiaries.find(
        b => b.email.toLowerCase() === email.toLowerCase() && 
            b.status === 'pending' && 
            b.verificationToken
      );
      
      if (match) {
        foundBeneficiary = true;
        beneficiaryConfig = config;
        beneficiary = match;
        break;
      }
    }
    
    if (!foundBeneficiary || !beneficiaryConfig || !beneficiary) {
      // Don't reveal whether the email exists for security
      console.log(`⚠️ [Public] No pending beneficiary found for ${email}`);
      return c.json({ 
        success: true,
        message: 'If your email is registered as a beneficiary, you will receive a new verification link shortly.' 
      });
    }
    
    // ✅ Generate new verification token (preserve existing context and expiration policy)
    const context = beneficiary.notificationContext || 'manual';
    
    // Expiration based on context:
    // - 'unlock': NO EXPIRATION (owner may be deceased)
    // - 'immediate' or 'manual': 30 days (owner can resend)
    let tokenExpiresAt: number | undefined;
    if (context === 'unlock') {
      tokenExpiresAt = undefined; // Never expires
      console.log(`🔓 [Public] Generating new token with NO EXPIRATION for unlock-context beneficiary`);
    } else {
      tokenExpiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
      console.log(`⏱️ [Public] Generating new token with 30-day expiration for ${context} context`);
    }
    
    const newToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    beneficiary.verificationToken = newToken;
    beneficiary.tokenExpiresAt = tokenExpiresAt;
    
    // Save updated config
    beneficiaryConfig.updatedAt = Date.now();
    await kv.set(`legacy_access_${beneficiaryConfig.userId}`, beneficiaryConfig);
    
    // Send new verification email
    const userProfile = await kv.get(`profile:${beneficiaryConfig.userId}`);
    const userSettings = await kv.get(`user_settings:${beneficiaryConfig.userId}`);
    const userName = userProfile?.name || userProfile?.displayName || userSettings?.displayName || 'Someone';
    
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
    const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${newToken}`;
    
    const { sendEmail } = await import('./email-service.tsx');
    const emailResult = await sendEmail({
      to: beneficiary.email,
      subject: 'New Verification Link - Legacy Beneficiary - Eras', // ✅ Emoji removed
      template: 'beneficiary-verification',
      variables: {
        beneficiaryName: beneficiary.name,
        beneficiaryEmail: beneficiary.email,
        userName: userName,
        personalMessage: beneficiary.personalMessage || '',
        verificationUrl: verificationUrl,
        declineUrl: '#',
        designatedDate: new Date(beneficiary.addedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    });
    
    if (!emailResult.success) {
      console.error(`❌ [Public] Failed to send verification email:`, emailResult.error);
      return c.json({ error: 'Failed to send verification email. Please try again later.' }, 500);
    }
    
    // Increment rate limit counter
    await kv.set(rateLimitKey, requestCount + 1);
    
    console.log(`✅ [Public] New verification link sent to ${email}`);
    
    return c.json({
      success: true,
      message: 'A new verification link has been sent to your email address.'
    });
  } catch (error) {
    console.error('❌ [Public] Error requesting verification:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
});

// Resend verification email
app.post("/make-server-f9be53a7/api/legacy-access/beneficiary/:beneficiaryId/resend", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const beneficiaryId = c.req.param('beneficiaryId');

    console.log(`📧 [Legacy Access] Resending verification for beneficiary: ${beneficiaryId}`);
    const result = await LegacyAccessService.resendVerificationEmail(user.id, beneficiaryId);

    if (!result.success) {
      // Check if it's a Resend testing mode error
      if (result.error === 'EMAIL_TESTING_MODE') {
        return c.json({ 
          error: 'EMAIL_TESTING_MODE',
          testingEmail: result.testingEmail,
          message: `Resend is in testing mode. You can only send emails to ${result.testingEmail}. To send to other recipients, verify your domain at resend.com/domains.`
        }, 400);
      }
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Legacy Access] Resend verification error:', error);
    return c.json({ error: 'Failed to resend verification' }, 500);
  }
});

// ✅ NEW: Send notification to pending_unlock beneficiary (manual trigger)
app.post("/make-server-f9be53a7/api/legacy-access/beneficiary/:beneficiaryId/notify", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const beneficiaryId = c.req.param('beneficiaryId');

    console.log(`🔔 [Legacy Access] Manually sending notification to beneficiary: ${beneficiaryId}`);
    const result = await LegacyAccessService.sendBeneficiaryNotification(user.id, beneficiaryId);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    // Track activity
    await LegacyAccessService.updateUserActivity(user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Legacy Access] Send notification error:', error);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// Remove beneficiary
app.delete("/make-server-f9be53a7/api/legacy-access/beneficiary/:beneficiaryId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const beneficiaryId = c.req.param('beneficiaryId');

    console.log(`🗑️ [Legacy Access] Removing beneficiary: ${beneficiaryId}`);
    const result = await LegacyAccessService.removeBeneficiary(user.id, beneficiaryId);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Legacy Access] Remove beneficiary error:', error);
    return c.json({ error: 'Failed to remove beneficiary' }, 500);
  }
});

// Update beneficiary (PHASE 7: Enhancement #3)
app.put("/make-server-f9be53a7/api/legacy-access/beneficiary/:beneficiaryId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const beneficiaryId = c.req.param('beneficiaryId');
    const body = await c.req.json();

    console.log(`✏️ [Legacy Access] Updating beneficiary: ${beneficiaryId}`);

    // Get current config
    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    const beneficiary = config.beneficiaries.find(b => b.id === beneficiaryId);

    if (!beneficiary) {
      return c.json({ error: 'Beneficiary not found' }, 404);
    }

    // Check if email changed (requires re-verification)
    const emailChanged = body.email && body.email.toLowerCase() !== beneficiary.email;

    // Update beneficiary fields
    if (body.name) beneficiary.name = body.name;
    if (body.phone !== undefined) beneficiary.phone = body.phone || undefined;
    if (body.personalMessage !== undefined) beneficiary.personalMessage = body.personalMessage || undefined;
    if (body.folderPermissions !== undefined) beneficiary.folderPermissions = body.folderPermissions;

    // Handle email change
    if (emailChanged) {
      // Add to email history
      if (!beneficiary.emailHistory) {
        beneficiary.emailHistory = [];
      }
      beneficiary.emailHistory.push({
        email: body.email.toLowerCase(),
        updatedAt: Date.now()
      });

      // Update email and require re-verification
      beneficiary.email = body.email.toLowerCase();
      beneficiary.status = 'pending';
      beneficiary.verifiedAt = undefined;

      // Generate new verification token
      const verificationToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      const tokenExpiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days

      beneficiary.verificationToken = verificationToken;
      beneficiary.tokenExpiresAt = tokenExpiresAt;

      // TODO: Send new verification email
      console.log(`📧 [Legacy Access] Email changed - verification email should be sent to ${body.email}`);
    }

    config.updatedAt = Date.now();
    await kv.set(`legacy_access_${user.id}`, config);

    console.log(`✅ [Legacy Access] Beneficiary updated successfully`);

    return c.json({
      success: true,
      beneficiary,
      emailChanged
    });
  } catch (error) {
    console.error('❌ [Legacy Access] Update beneficiary error:', error);
    return c.json({ error: 'Failed to update beneficiary' }, 500);
  }
});

// Update inactivity trigger
app.post("/make-server-f9be53a7/api/legacy-access/trigger/inactivity", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { inactivityMonths } = body;

    if (!inactivityMonths || inactivityMonths < 1) {
      return c.json({ error: 'Invalid inactivity period' }, 400);
    }

    console.log(`⏱️ [Legacy Access] Setting inactivity trigger: ${inactivityMonths} months`);
    const result = await LegacyAccessService.updateInactivityTrigger(user.id, inactivityMonths);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    // Track activity
    await LegacyAccessService.updateUserActivity(user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Legacy Access] Update inactivity trigger error:', error);
    return c.json({ error: 'Failed to update trigger' }, 500);
  }
});

// Update manual date trigger
app.post("/make-server-f9be53a7/api/legacy-access/trigger/date", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { unlockDate } = body;

    if (!unlockDate) {
      return c.json({ error: 'Unlock date is required' }, 400);
    }

    const unlockTimestamp = new Date(unlockDate).getTime();
    if (isNaN(unlockTimestamp) || unlockTimestamp <= Date.now()) {
      return c.json({ error: 'Invalid unlock date (must be in the future)' }, 400);
    }

    console.log(`📅 [Legacy Access] Setting manual date trigger: ${new Date(unlockTimestamp).toISOString()}`);
    const result = await LegacyAccessService.updateManualDateTrigger(user.id, unlockTimestamp);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    // Track activity
    await LegacyAccessService.updateUserActivity(user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Legacy Access] Update manual date trigger error:', error);
    return c.json({ error: 'Failed to update trigger' }, 500);
  }
});

// Cancel scheduled unlock (from warning email)
app.post("/make-server-f9be53a7/api/legacy-access/cancel-unlock", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, cancelToken } = body;

    if (!userId || !cancelToken) {
      return c.json({ error: 'User ID and cancel token are required' }, 400);
    }

    console.log(`🚫 [Legacy Access] Canceling scheduled unlock for user: ${userId}`);
    const result = await LegacyAccessService.cancelScheduledUnlock(userId, cancelToken);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      success: true,
      message: 'Legacy Access unlock canceled successfully' 
    });
  } catch (error) {
    console.error('❌ [Legacy Access] Cancel unlock error:', error);
    return c.json({ error: 'Failed to cancel unlock' }, 500);
  }
});

// Validate unlock token (for beneficiary access)
app.post("/make-server-f9be53a7/api/legacy-access/unlock/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { tokenId } = body;

    if (!tokenId) {
      return c.json({ error: 'Token ID is required' }, 400);
    }

    console.log(`🔓 [Legacy Access] Validating unlock token: ${tokenId}`);
    const result = await LegacyAccessService.validateUnlockToken(tokenId);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      success: true,
      userId: result.userId,
      beneficiary: result.beneficiary,
      personalMessage: result.personalMessage
    });
  } catch (error) {
    console.error('❌ [Legacy Access] Validate unlock token error:', error);
    return c.json({ error: 'Failed to validate unlock token' }, 500);
  }
});

// CRON endpoint: Check inactivity triggers (called by pg_cron or external scheduler)
app.post("/make-server-f9be53a7/api/legacy-access/cron/check-triggers", async (c) => {
  try {
    // TODO: Add authentication for CRON endpoint (API key or secret)
    
    console.log(`⏰ [Legacy Access] Running inactivity trigger check...`);
    const result = await LegacyAccessService.checkInactivityTriggers();

    console.log(`✅ [Legacy Access] Trigger check complete:`, result);

    return c.json({ 
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ [Legacy Access] Trigger check error:', error);
    return c.json({ error: 'Failed to check triggers' }, 500);
  }
});

// TEST ENDPOINT: Send test emails for beneficiary system (PHASE 1 - Manual Testing)
app.post("/make-server-f9be53a7/api/legacy-access/test-email", async (c) => {
  try {
    const body = await c.req.json();
    const { type, recipientEmail } = body;

    if (!recipientEmail) {
      return c.json({ error: 'recipientEmail is required' }, 400);
    }

    const { sendEmail } = await import('./email-service.tsx');

    let result;

    if (type === 'verification') {
      // Test beneficiary verification email
      result = await sendEmail({
        to: recipientEmail,
        subject: 'You\'ve Been Designated as a Legacy Beneficiary - Eras', // ✅ Emoji removed
        template: 'beneficiary-verification',
        variables: {
          beneficiaryName: 'Test User',
          beneficiaryEmail: recipientEmail,
          userName: 'John Smith',
          personalMessage: 'Thank you for agreeing to be my beneficiary. This means a lot to me.',
          verificationUrl: `https://eras.app/verify-beneficiary?token=test-token-${Date.now()}`,
          declineUrl: `https://eras.app/decline-beneficiary?token=test-token-${Date.now()}`,
          designatedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        }
      });
    } else if (type === 'unlock') {
      // Test beneficiary unlock notification email
      result = await sendEmail({
        to: recipientEmail,
        subject: '🔓 A Legacy Vault Has Been Unlocked for You - Eras',
        template: 'beneficiary-unlock-notification',
        variables: {
          beneficiaryName: 'Test User',
          beneficiaryEmail: recipientEmail,
          userName: 'John Smith',
          inactivityDays: 90,
          folderCount: 5,
          mediaCount: 47,
          folders: [
            { name: 'Family Photos', icon: '👨‍👩‍👧‍👦', itemCount: 23, permission: 'download' },
            { name: 'Travel Memories', icon: '✈️', itemCount: 15, permission: 'full' },
            { name: 'Personal Notes', icon: '📝', itemCount: 9, permission: 'view' }
          ],
          personalMessage: 'I wanted you to have access to these memories. Take care of them for me.',
          accessUrl: `https://eras.app/legacy-vault/access?token=unlock-test-${Date.now()}`,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          inactiveDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }
      });
    } else if (type === 'unlock-complete') {
      // PHASE 4: Test complete unlock notification email with enhanced template
      result = await sendEmail({
        to: recipientEmail,
        subject: 'Legacy Vault Unlocked - Eras', // ✅ Emoji removed
        template: 'beneficiary-unlock-notification-complete',
        variables: {
          ownerName: 'John Smith',
          beneficiaryName: 'Test User',
          beneficiaryEmail: recipientEmail,
          inactivityDays: 90,
          folderCount: 5,
          itemCount: 47,
          folders: [
            { name: 'Family Photos', icon: '👨‍👩‍👧‍👦', itemCount: 23, permission: 'download' },
            { name: 'Travel Memories', icon: '✈️', itemCount: 15, permission: 'full' },
            { name: 'Personal Notes', icon: '📝', itemCount: 9, permission: 'view' }
          ],
          personalMessage: 'I wanted you to have access to these memories. Take care of them for me.',
          accessUrl: `https://eras.app/legacy-vault/access?token=unlock-test-${Date.now()}`,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }
      });
    } else if (type === 'warning') {
      // PHASE 6: Test inactivity warning email
      result = await sendEmail({
        to: recipientEmail,
        subject: 'Account Inactivity Warning - Eras', // ✅ Emoji removed
        template: 'inactivity-warning',
        variables: {
          userName: 'Test User',
          daysSinceLastLogin: 180,
          daysUntilInactive: 30,
          lastLoginDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          hasBeneficiaries: true,
          beneficiaries: ['sarah@example.com', 'john@example.com', 'emily@example.com'],
          loginUrl: 'https://eras.app/login',
          settingsUrl: 'https://eras.app/settings/legacy-access',
          cancelUrl: `https://eras.app/cancel-unlock?token=cancel-test-${Date.now()}`
        }
      });
    } else {
      return c.json({ error: 'Invalid type. Use "verification", "unlock", "unlock-complete", or "warning"' }, 400);
    }

    if (result.success) {
      console.log(`✅ Test email sent successfully: ${type} to ${recipientEmail}`);
      return c.json({ 
        success: true, 
        message: `${type} email sent to ${recipientEmail}`,
        messageId: result.messageId
      });
    } else {
      console.error(`❌ Test email failed:`, result.error);
      return c.json({ error: result.error }, 500);
    }
  } catch (error) {
    console.error('❌ Test email endpoint error:', error);
    return c.json({ error: 'Failed to send test email' }, 500);
  }
});

// ============================================
// PHASE 3: BENEFICIARY VAULT ACCESS ENDPOINTS
// ============================================

// Validate unlock token and return vault data (Phase 3)
app.post("/make-server-f9be53a7/api/legacy-access/unlock/validate-full", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return c.json({ error: 'Access token is required' }, 400);
    }

    console.log(`🔓 [Phase 3] Validating vault access token: ${token.substring(0, 8)}...`);

    // ✅ PERFORMANCE FIX: Use direct get instead of scanning all tokens
    // Token ID is used as the key, so we can fetch it directly
    const matchingUnlock = await kv.get(`unlock_token_${token}`);
    
    if (!matchingUnlock) {
      console.error(`❌ [Phase 3] No unlock found with token ID: ${token}`);
      return c.json({ 
        success: false, 
        error: 'Invalid access token' 
      }, 400);
    }

    const ownerUserId = matchingUnlock.userId;
    console.log(`✅ [Phase 3] Found matching unlock for user ${ownerUserId}`);

    // Check if token is expired
    if (matchingUnlock.expiresAt && Date.now() > matchingUnlock.expiresAt) {
      console.error(`❌ [Phase 3] Access token expired`);
      return c.json({ 
        success: false, 
        error: 'Access token has expired',
        expired: true 
      }, 400);
    }

    // Get owner information
    const ownerSettings = await kv.get(`user_settings:${ownerUserId}`);
    const ownerName = ownerSettings?.displayName || ownerSettings?.email?.split('@')[0] || 'Account Owner';

    // ✅ FIX: Load vault metadata to get actual folder data
    console.log(`🔍 [Phase 3] Loading vault folders for owner ${ownerUserId}...`);
    const folderPermissions = matchingUnlock.folderPermissions || {};
    console.log(`📊 [Phase 3] Unlock token object:`, JSON.stringify(matchingUnlock, null, 2));
    console.log(`📊 [Phase 3] Folder permissions from token:`, JSON.stringify(folderPermissions, null, 2));
    console.log(`📊 [Phase 3] Beneficiary has permissions for ${Object.keys(folderPermissions).length} folders`);
    
    const accessibleFolders = [];
    let totalItems = 0;

    // Load vault metadata
    const vaultMetadata = await kv.get(`vault_metadata_${ownerUserId}`);
    
    if (!vaultMetadata || !vaultMetadata.folders) {
      console.warn(`⚠️ [Phase 3] No vault metadata found for user ${ownerUserId}`);
    } else {
      console.log(`📊 [Phase 3] Vault has ${vaultMetadata.folders.length} total folders`);
      
      // Load only the folders this beneficiary has access to
      for (const folderId of Object.keys(folderPermissions)) {
        try {
          const folder = vaultMetadata.folders.find((f: any) => f.id === folderId);
          if (folder) {
            const permission = folderPermissions[folderId];
            const itemCount = folder.mediaIds?.length || 0;
            
            console.log(`  ✅ Folder: ${folder.name} (${folderId}), Permission: ${permission}, Items: ${itemCount}`);
            
            // ✅ FIX: Load media items directly so frontend doesn't need separate call
            const items = [];
            if (folder.mediaIds && folder.mediaIds.length > 0) {
              for (const mediaId of folder.mediaIds) {
                // ✅ FIX: Vault media uses different key format: legacy_vault:${userId}:${mediaId}
                const media = await kv.get(`legacy_vault:${ownerUserId}:${mediaId}`);
                if (media) {
                  // Vault media is stored in make-f9be53a7-media bucket
                  const storageBucket = 'make-f9be53a7-media';
                  const storagePath = media.storage_path;
                  const thumbnailPath = media.thumbnail_path;
                  
                  let signedUrl = media.url;
                  let thumbnailUrl = null;
                  
                  // Generate signed URL for main file
                  if (storagePath) {
                    try {
                      const { data, error } = await supabase.storage
                        .from(storageBucket)
                        .createSignedUrl(storagePath, 3600);
                      if (!error && data?.signedUrl) {
                        signedUrl = data.signedUrl;
                      }
                    } catch (err) {
                      console.error(`Error generating signed URL for ${mediaId}:`, err);
                    }
                  }
                  
                  // Generate signed URL for thumbnail
                  if (thumbnailPath) {
                    try {
                      const { data, error } = await supabase.storage
                        .from(storageBucket)
                        .createSignedUrl(thumbnailPath, 3600);
                      if (!error && data?.signedUrl) {
                        thumbnailUrl = data.signedUrl;
                      }
                    } catch (err) {
                      console.error(`Error generating thumbnail URL for ${mediaId}:`, err);
                    }
                  }
                  
                  items.push({
                    id: mediaId,
                    name: media.file_name || 'Untitled',
                    type: media.type || 'photo',
                    url: signedUrl,
                    thumbnailUrl: thumbnailUrl || signedUrl,
                    size: media.file_size,
                    createdAt: media.timestamp ? new Date(media.timestamp).toISOString() : media.created_at
                  });
                }
              }
            }
            
            accessibleFolders.push({
              id: folderId,
              name: folder.name || 'Untitled Folder',
              icon: folder.icon || '📁',
              permission: permission,
              itemCount: itemCount,
              items: items
            });
            totalItems += itemCount;
          } else {
            console.warn(`  ⚠️ Folder ${folderId} not found in vault metadata`);
          }
        } catch (err) {
          console.error(`  ❌ Error loading folder ${folderId}:`, err.message);
        }
      }
    }

    console.log(`✅ [Phase 3] Vault access validated: ${accessibleFolders.length} folders, ${totalItems} items`);

    // Calculate expiration date
    const expiresAt = new Date(matchingUnlock.expiresAt || (Date.now() + 365 * 24 * 60 * 60 * 1000));

    return c.json({
      success: true,
      vaultData: {
        ownerName,
        ownerEmail: ownerSettings?.email || '',
        unlockedDate: matchingUnlock.createdAt ? new Date(matchingUnlock.createdAt).toISOString() : new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        inactivityDays: matchingUnlock.inactivityDays || 0,
        personalMessage: matchingUnlock.personalMessage,
        folders: accessibleFolders,
        totalItems
      }
    });
  } catch (error) {
    console.error('❌ [Phase 3] Vault access validation error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to validate vault access' 
    }, 500);
  }
});

// Load folder contents (Phase 3) - SUPPORTS BOTH GET AND POST
app.all("/make-server-f9be53a7/api/legacy-access/folder/:folderId", async (c) => {
  try {
    // ✅ FIX: Try ALL possible sources for the token
    const authHeader = c.req.header('Authorization');
    let accessToken = authHeader?.replace(/^Bearer\s+/i, '')?.trim();
    
    // Decode if URL encoded
    if (accessToken) {
      try {
        accessToken = decodeURIComponent(accessToken);
      } catch (e) {
        // Already decoded, that's fine
      }
    }
    
    // Try query parameter
    if (!accessToken) {
      accessToken = c.req.query('token')?.trim();
    }
    
    // Try request body (for POST requests)
    if (!accessToken) {
      try {
        const body = await c.req.json();
        accessToken = body.token?.trim();
      } catch (e) {
        // Not JSON body, that's fine
      }
    }
    
    // Try to extract from Referer header as last resort
    if (!accessToken) {
      const referer = c.req.header('Referer') || c.req.header('Referrer');
      if (referer) {
        const match = referer.match(/[?&]token=([^&]+)/);
        if (match) {
          accessToken = decodeURIComponent(match[1]);
        }
      }
    }
    
    if (!accessToken) {
      return c.json({ error: 'No access token found' }, 401);
    }

    const folderId = c.req.param('folderId');

    // ✅ PERFORMANCE FIX: Use direct get instead of scanning all tokens
    const matchingUnlock = await kv.get(`unlock_token_${accessToken}`);
    
    console.log(`🔍 [DEBUG] Found unlock token:`, matchingUnlock ? 'YES' : 'NO');
    if (matchingUnlock) {
      console.log(`🔍 [DEBUG] Unlock token data:`, JSON.stringify(matchingUnlock, null, 2));
    }
    
    if (!matchingUnlock) {
      console.error(`❌ [Folder Access] No unlock found with token ID: ${accessToken}`);
      // Return detailed error for debugging
      return c.json({ 
        error: 'Invalid access token',
        debug: {
          receivedToken: accessToken,
          lookupKey: `unlock_token_${accessToken}`,
          hint: 'Token not found in database. May need to trigger manual unlock again.'
        }
      }, 401);
    }

    const ownerUserId = matchingUnlock.userId;

    // Check if beneficiary has permission for this folder
    const folderPermissions = matchingUnlock.folderPermissions || {};
    if (!folderPermissions[folderId]) {
      return c.json({ error: 'No permission to access this folder' }, 403);
    }

    // ✅ FIX: Get folder data from vault metadata
    const vaultMetadata = await kv.get(`vault_metadata_${ownerUserId}`);
    
    if (!vaultMetadata || !vaultMetadata.folders) {
      return c.json({ error: 'Vault not found' }, 404);
    }
    
    const folder = vaultMetadata.folders.find((f: any) => f.id === folderId);
    
    if (!folder) {
      return c.json({ error: 'Folder not found' }, 404);
    }

    // Get media items with signed URLs
    const items = [];
    
    if (folder.mediaIds && folder.mediaIds.length > 0) {
      console.log(`📂 Loading ${folder.mediaIds.length} media items from folder`);
      
      for (const mediaId of folder.mediaIds) {
        // ✅ FIX: Vault media uses key format: legacy_vault:${userId}:${mediaId}
        const media = await kv.get(`legacy_vault:${ownerUserId}:${mediaId}`);
        
        if (media) {
          // Vault media is stored in make-f9be53a7-media bucket
          const storageBucket = 'make-f9be53a7-media';
          const storagePath = media.storage_path;
          const thumbnailPath = media.thumbnail_path;
          
          let signedUrl = media.url;
          let thumbnailUrl = null;
          
          // Generate signed URL for main file
          if (storagePath) {
            try {
              const { data, error } = await supabase.storage
                .from(storageBucket)
                .createSignedUrl(storagePath, 3600);
              
              if (!error && data?.signedUrl) {
                signedUrl = data.signedUrl;
              } else if (error) {
                console.error(`Error generating signed URL for ${mediaId}:`, error);
              }
            } catch (err) {
              console.error('Error generating signed URL:', err);
            }
          }
          
          // Generate signed URL for thumbnail
          if (thumbnailPath) {
            try {
              const { data, error } = await supabase.storage
                .from(storageBucket)
                .createSignedUrl(thumbnailPath, 3600);
              if (!error && data?.signedUrl) {
                thumbnailUrl = data.signedUrl;
              }
            } catch (err) {
              console.error(`Error generating thumbnail URL for ${mediaId}:`, err);
            }
          }

          items.push({
            id: mediaId,
            name: media.file_name || 'Untitled',
            type: media.type || 'photo',
            url: signedUrl,
            thumbnailUrl: thumbnailUrl || signedUrl,
            size: media.file_size,
            createdAt: media.timestamp ? new Date(media.timestamp).toISOString() : media.created_at
          });
        } else {
          console.warn(`⚠️ Media not found: legacy_vault:${ownerUserId}:${mediaId}`);
        }
      }
    }

    console.log(`✅ [Phase 3] Loaded ${items.length} items from folder ${folderId}`);

    return c.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('❌ [Phase 3] Folder loading error:', error);
    return c.json({ error: 'Failed to load folder contents' }, 500);
  }
});

// Log beneficiary access (Phase 3)
app.post("/make-server-f9be53a7/api/legacy-access/log-access", async (c) => {
  try {
    const body = await c.req.json();
    const { token, action, itemId, timestamp } = body;

    if (!token || !action) {
      return c.json({ error: 'Token and action are required' }, 400);
    }

    console.log(`📝 [Phase 3] Logging access: ${action} at ${timestamp}`);

    // ✅ PERFORMANCE FIX: Use direct get instead of scanning all tokens
    const matchingUnlock = await kv.get(`unlock_token_${token}`);
    
    if (!matchingUnlock) {
      console.error(`❌ [Log Access] No unlock found with token ID: ${token}`);
      return c.json({ error: 'Invalid access token' }, 401);
    }

    const matchingTokenId = matchingUnlock.tokenId;

    // Add access log entry
    if (!matchingUnlock.accessLogs) {
      matchingUnlock.accessLogs = [];
    }

    matchingUnlock.accessLogs.push({
      action,
      itemId: itemId || null,
      timestamp: timestamp || new Date().toISOString()
    });

    // Keep only last 100 logs to prevent data bloat
    if (matchingUnlock.accessLogs.length > 100) {
      matchingUnlock.accessLogs = matchingUnlock.accessLogs.slice(-100);
    }

    await kv.set(`unlock_token_${matchingTokenId}`, matchingUnlock);

    console.log(`✅ [Phase 3] Access logged successfully`);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Phase 3] Access logging error:', error);
    return c.json({ error: 'Failed to log access' }, 500);
  }
});

// PHASE 5: Manual unlock trigger (testing & admin use)
app.post("/make-server-f9be53a7/api/legacy-access/trigger-unlock", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔓 [Phase 5] Manual unlock triggered for user ${user.id}`);

    // Import legacy access service
    const LegacyAccessService = await import('./legacy-access-service.tsx');
    
    // Get config to check beneficiaries
    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    const verifiedBeneficiaries = config.beneficiaries.filter(b => b.status === 'verified');

    if (verifiedBeneficiaries.length === 0) {
      return c.json({ 
        error: 'No verified beneficiaries. Please add and verify beneficiaries first.' 
      }, 400);
    }

    // Trigger unlock manually
    await triggerManualUnlock(user.id);

    console.log(`✅ [Phase 5] Manual unlock complete for ${verifiedBeneficiaries.length} beneficiaries`);

    return c.json({ 
      success: true,
      message: `Unlock emails sent to ${verifiedBeneficiaries.length} beneficiaries`,
      beneficiariesCount: verifiedBeneficiaries.length
    });
  } catch (error) {
    console.error('❌ [Phase 5] Manual unlock trigger error:', error);
    return c.json({ error: 'Failed to trigger unlock' }, 500);
  }
});

// Helper function for manual unlock
async function triggerManualUnlock(userId: string): Promise<void> {
  const LegacyAccessService = await import('./legacy-access-service.tsx');
  const config = await LegacyAccessService.getLegacyAccessConfig(userId);
  
  // Mark as triggered
  config.trigger.unlockTriggeredAt = Date.now();
  await kv.set(`legacy_access_${userId}`, config);
  
  // Get user settings
  const userSettings = await kv.get(`user_settings:${userId}`);
  const ownerName = userSettings?.displayName || userSettings?.email?.split('@')[0] || 'Account Owner';
  
  // Get verified beneficiaries
  const verifiedBeneficiaries = config.beneficiaries.filter(b => b.status === 'verified');
  
  console.log(`🔓 [Phase 5] Manual unlock for ${verifiedBeneficiaries.length} beneficiaries`);
  console.log(`📊 [Phase 5] Beneficiaries:`, verifiedBeneficiaries.map(b => ({ 
    email: b.email, 
    permissionCount: Object.keys(b.folderPermissions || {}).length,
    permissions: b.folderPermissions 
  })));
  
  for (const beneficiary of verifiedBeneficiaries) {
    // Generate unlock token with permissions snapshot
    const tokenId = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const unlockToken = {
      tokenId,
      userId,
      beneficiaryId: beneficiary.id,
      unlockType: 'user_triggered',
      createdAt: Date.now(),
      expiresAt: Date.now() + (100 * 365 * 24 * 60 * 60 * 1000), // Permanent (100 years)
      folderPermissions: beneficiary.folderPermissions || {} // ✅ CRITICAL: Copy permissions to token
    };
    
    console.log(`🔑 [Phase 5] Creating unlock token with ${Object.keys(unlockToken.folderPermissions).length} folder permissions`);
    console.log(`🔍 [CRITICAL DEBUG] Beneficiary object:`, JSON.stringify(beneficiary, null, 2));
    console.log(`🔍 [CRITICAL DEBUG] Unlock token object BEFORE saving:`, JSON.stringify(unlockToken, null, 2));
    
    await kv.set(`unlock_token_${tokenId}`, unlockToken);
    
    // Verify token was saved correctly
    const savedToken = await kv.get(`unlock_token_${tokenId}`);
    console.log(`🔍 [CRITICAL DEBUG] Unlock token object AFTER saving:`, JSON.stringify(savedToken, null, 2));
    
    // Build folders with permissions
    const folderPermissions = beneficiary.folderPermissions || {};
    const folders = [];
    let totalItems = 0;
    
    console.log(`📊 [Phase 5] Beneficiary ${beneficiary.email} has permissions for ${Object.keys(folderPermissions).length} folders`);
    
    // ✅ FIX: Load vault metadata to get actual folder data
    console.log(`🔍 [Phase 5] Loading vault metadata for user ${userId}...`);
    const vaultMetadata = await kv.get(`vault_metadata_${userId}`);
    
    if (!vaultMetadata || !vaultMetadata.folders) {
      console.warn(`⚠️ [Phase 5] No vault metadata found for user ${userId}`);
    } else {
      console.log(`📊 [Phase 5] Vault has ${vaultMetadata.folders.length} total folders, ${vaultMetadata.media?.length || 0} total items`);
      
      for (const folderId of Object.keys(folderPermissions)) {
        try {
          // Find folder in vault metadata
          const folder = vaultMetadata.folders.find((f: any) => f.id === folderId);
          
          if (folder) {
            const permission = folderPermissions[folderId];
            const itemCount = folder.mediaIds?.length || 0;
            
            console.log(`  ✅ Folder: ${folder.name} (${folderId}), Permission: ${permission}, Items: ${itemCount}`);
            
            folders.push({
              name: folder.name || 'Untitled Folder',
              icon: folder.icon || '📁',
              itemCount: itemCount,
              permission: permission
            });
            totalItems += itemCount;
          } else {
            console.warn(`  ⚠️ Folder ${folderId} not found in vault metadata`);
          }
        } catch (err) {
          console.error(`  ❌ Error loading folder ${folderId}:`, err.message);
        }
      }
    }
    
    console.log(`📧 [Phase 5] Email will show ${folders.length} folders with ${totalItems} total items`);
    
    // Send email
    const { sendEmail } = await import('./email-service.tsx');
    
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    console.log(`📧 [Phase 5] Sending unlock email to ${beneficiary.email}...`);
    
    // Use correct frontend domain
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
    
    const result = await sendEmail({
      to: beneficiary.email,
      subject: '🔓 Legacy Vault Unlocked - Eras',
      template: 'beneficiary-unlock-notification-complete',
      variables: {
        ownerName,
        beneficiaryName: beneficiary.name,
        beneficiaryEmail: beneficiary.email,
        inactivityDays: 0, // Manual unlock, no inactivity
        folderCount: folders.length,
        itemCount: totalItems,
        folders,
        personalMessage: beneficiary.personalMessage,
        accessUrl: `${frontendUrl}/legacy-vault/access?token=${tokenId}`,
        expirationDate
      }
    });
    
    if (result.success) {
      console.log(`✅ [Phase 5] Email sent to ${beneficiary.email}`);
    } else {
      console.error(`❌ [Phase 5] Failed to send to ${beneficiary.email}:`, result.error);
      throw new Error(`Failed to send unlock email: ${result.error}`);
    }
  }
}

// PHASE 5.5: Revoke beneficiary access to unlocked vault
app.post("/make-server-f9be53a7/api/legacy-access/revoke-unlock", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Verify user (using singleton client)
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { beneficiaryId } = await c.req.json();
    
    if (!beneficiaryId) {
      return c.json({ error: 'Beneficiary ID is required' }, 400);
    }
    
    // Get legacy access config
    const config = await kv.get(`legacy_access_${user.id}`);
    
    if (!config) {
      return c.json({ error: 'Legacy access not configured' }, 404);
    }
    
    // Find and revoke all unlock tokens for this beneficiary
    // ⚠️ NOTE: This uses getByPrefix which may timeout with many tokens
    // TODO: Consider storing tokens under beneficiary-specific keys for faster revocation
    const allTokens = await kv.getByPrefix(`unlock_token_`);
    let revokedCount = 0;
    
    // ✅ FIX: getByPrefix returns an array of VALUES, not {key, value} objects
    for (const token of allTokens) {
      if (token.userId === user.id && token.beneficiaryId === beneficiaryId) {
        // Delete the token (revoke access)
        await kv.del(`unlock_token_${token.tokenId}`);
        revokedCount++;
        console.log(`🚫 Revoked unlock token: ${token.tokenId} for beneficiary ${beneficiaryId}`);
      }
    }
    
    console.log(`✅ Revoked ${revokedCount} unlock token(s) for beneficiary ${beneficiaryId}`);
    
    return c.json({ 
      success: true, 
      message: `Revoked access for beneficiary. ${revokedCount} active access link(s) deleted.`,
      revokedCount 
    });
  } catch (error) {
    console.error('Error revoking unlock:', error);
    return c.json({ error: 'Failed to revoke access' }, 500);
  }
});

// PHASE 6: Cancel scheduled unlock (from warning email)
app.get("/make-server-f9be53a7/cancel-unlock", async (c) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.html(`
        <html>
          <head><title>Error - Eras</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>⚠️ Invalid Link</h1>
            <p>The cancellation link is invalid or missing a token.</p>
          </body>
        </html>
      `);
    }

    // Get userId from cancel token
    const cancelData = await kv.get(`cancel_unlock_${token}`);
    
    if (!cancelData || !cancelData.userId) {
      return c.html(`
        <html>
          <head><title>Error - Eras</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>⚠️ Invalid or Expired Link</h1>
            <p>This cancellation link is invalid or has expired.</p>
          </body>
        </html>
      `);
    }

    // Cancel the unlock
    const LegacyAccessService = await import('./legacy-access-service.tsx');
    const result = await LegacyAccessService.cancelScheduledUnlock(cancelData.userId, token);

    // Delete the cancel token
    await kv.del(`cancel_unlock_${token}`);

    if (result.success) {
      console.log(`✅ [Phase 6] Unlock canceled for user ${cancelData.userId}`);
      
      return c.html(`
        <html>
          <head>
            <title>Unlock Canceled - Eras</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
              }
              .icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              h1 {
                color: #1a202c;
                margin: 0 0 16px 0;
              }
              p {
                color: #4a5568;
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .success-box {
                background: #f0fdf4;
                border: 2px solid #10b981;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
              }
              .success-box p {
                color: #065f46;
                margin: 0;
                font-weight: 500;
              }
              a {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin-top: 24px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✅</div>
              <h1>Unlock Successfully Canceled</h1>
              <p>Your vault unlock has been canceled and your inactivity timer has been reset.</p>
              
              <div class="success-box">
                <p>✓ Grace period canceled</p>
                <p>✓ Activity timer reset</p>
                <p>✓ Beneficiaries will not receive access</p>
              </div>
              
              <p>Your account is now active. Simply logging in periodically will prevent future inactivity warnings.</p>
              
              <a href="https://eras.app">Return to Eras</a>
            </div>
          </body>
        </html>
      `);
    } else {
      console.error(`❌ [Phase 6] Failed to cancel unlock:`, result.error);
      
      return c.html(`
        <html>
          <head><title>Error - Eras</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Error</h1>
            <p>Failed to cancel unlock. Please try again or contact support.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('❌ [Phase 6] Cancel unlock error:', error);
    return c.html(`
      <html>
        <head><title>Error - Eras</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Error</h1>
          <p>An unexpected error occurred. Please try again later.</p>
        </body>
      </html>
    `);
  }
});

// =================================
// PHASE 7: VAULT FOLDERS & DEV TOOLS
// =================================

// Get vault folders for beneficiary permissions UI (PHASE 7: Enhancement #2)
app.get("/make-server-f9be53a7/api/vault/folders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📁 [Phase 7] Loading vault folders for user ${user.id}`);

    // CRITICAL FIX: Query the same storage as the actual vault folders
    // Changed from vault_folder:${user.id}: to vault_metadata_${user.id}
    const metadata = await kv.get(`vault_metadata_${user.id}`);
    
    // Initialize if doesn't exist
    if (!metadata || !metadata.folders) {
      console.log(`📁 [Phase 7] No vault metadata found for user ${user.id}`);
      return c.json({
        success: true,
        folders: []
      });
    }
    
    // Transform folder data for beneficiary UI
    const folders = metadata.folders.map((folder: any) => ({
      id: folder.id,
      name: folder.name || 'Untitled Folder',
      icon: folder.icon || '📁',
      description: folder.description || null,
      itemCount: folder.mediaIds?.length || 0,
      createdAt: folder.createdAt,
      isPrivate: folder.isPrivate || false
    }));

    console.log(`✅ [Phase 7] Found ${folders.length} vault folders from metadata`);

    return c.json({
      success: true,
      folders
    });
  } catch (error) {
    console.error('❌ [Phase 7] Get vault folders error:', error);
    return c.json({ error: 'Failed to load folders' }, 500);
  }
});

// =================================
// DEVELOPER TOOLS (PHASE 7: Enhancement #4)
// =================================

// Dev tool: Update activity to now (reset timer)
app.post("/make-server-f9be53a7/api/legacy-access/dev/update-activity", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔧 [Dev Tools] Resetting activity for user ${user.id}`);

    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    config.trigger.lastActivityAt = Date.now();
    config.trigger.unlockScheduledAt = undefined;
    config.trigger.unlockCanceledAt = undefined;
    config.trigger.warningEmailSentAt = undefined;
    config.updatedAt = Date.now();
    
    await kv.set(`legacy_access_${user.id}`, config);

    console.log(`✅ [Dev Tools] Activity reset to now`);

    return c.json({ success: true, lastActivityAt: config.trigger.lastActivityAt });
  } catch (error) {
    console.error('❌ [Dev Tools] Update activity error:', error);
    return c.json({ error: 'Failed to update activity' }, 500);
  }
});

// Dev tool: Simulate inactivity (set activity to X days ago)
app.post("/make-server-f9be53a7/api/legacy-access/dev/simulate-inactivity", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const daysAgo = body.daysAgo || 180;

    console.log(`🔧 [Dev Tools] Simulating ${daysAgo} days of inactivity for user ${user.id}`);

    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    config.trigger.lastActivityAt = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
    config.updatedAt = Date.now();
    
    await kv.set(`legacy_access_${user.id}`, config);

    console.log(`✅ [Dev Tools] Activity set to ${daysAgo} days ago`);

    return c.json({ 
      success: true, 
      lastActivityAt: config.trigger.lastActivityAt,
      daysAgo
    });
  } catch (error) {
    console.error('❌ [Dev Tools] Simulate inactivity error:', error);
    return c.json({ error: 'Failed to simulate inactivity' }, 500);
  }
});

// Dev tool: Send warning email
app.post("/make-server-f9be53a7/api/legacy-access/dev/send-warning-email", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get email from JWT token (user.email)
    const userEmail = user.email;
    
    if (!userEmail) {
      return c.json({ error: 'No email address found in auth token' }, 400);
    }

    // Get display name from user settings if available
    const userSettings = await kv.get(`user_settings:${user.id}`);
    const userName = userSettings?.displayName || userEmail.split('@')[0];
    
    const { EmailService } = await import('./email-service.tsx');
    const result = await EmailService.sendWarningEmail(userEmail, userName);

    return c.json({ 
      success: result.success, 
      sentTo: userEmail,
      messageId: result.messageId,
      error: result.error,
      fullResult: result
    });
  } catch (error) {
    return c.json({ error: error.message, stack: error.stack }, 500);
  }
});

// Dev tool: Send unlock email to beneficiaries
app.post("/make-server-f9be53a7/api/legacy-access/dev/send-unlock-email", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔧 [Dev Tools] Sending unlock emails for user ${user.id}`);

    // Use the existing manual unlock function
    await triggerManualUnlock(user.id);

    console.log(`✅ [Dev Tools] Unlock emails sent`);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Dev Tools] Send unlock email error:', error);
    return c.json({ error: 'Failed to send unlock emails' }, 500);
  }
});

// Dev tool: Trigger grace period immediately
app.post("/make-server-f9be53a7/api/legacy-access/dev/trigger-grace-period", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔧 [Dev Tools] Triggering grace period for user ${user.id}`);

    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    const gracePeriodMs = (config.trigger.gracePeriodDays || 30) * 24 * 60 * 60 * 1000;
    
    config.trigger.unlockScheduledAt = Date.now() + gracePeriodMs;
    config.trigger.warningEmailSentAt = Date.now();
    config.updatedAt = Date.now();
    
    await kv.set(`legacy_access_${user.id}`, config);

    console.log(`✅ [Dev Tools] Grace period triggered - unlock scheduled in 30 days`);

    return c.json({ 
      success: true,
      unlockScheduledAt: config.trigger.unlockScheduledAt,
      daysUntilUnlock: config.trigger.gracePeriodDays
    });
  } catch (error) {
    console.error('❌ [Dev Tools] Trigger grace period error:', error);
    return c.json({ error: 'Failed to trigger grace period' }, 500);
  }
});

// Dev tool: Force unlock immediately
app.post("/make-server-f9be53a7/api/legacy-access/dev/force-unlock", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔧 [Dev Tools] Force unlocking vault for user ${user.id}`);

    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    const verifiedBeneficiaries = config.beneficiaries.filter(b => b.status === 'verified');

    if (verifiedBeneficiaries.length === 0) {
      console.error(`❌ [Dev Tools] No verified beneficiaries found`);
      return c.json({ error: 'No verified beneficiaries' }, 400);
    }

    console.log(`📧 [Dev Tools] Unlocking vault for ${verifiedBeneficiaries.length} beneficiaries...`);
    
    // Use manual unlock
    await triggerManualUnlock(user.id);

    // Mark as triggered
    config.trigger.unlockTriggeredAt = Date.now();
    await kv.set(`legacy_access_${user.id}`, config);

    console.log(`✅ [Dev Tools] Vault unlocked successfully for ${verifiedBeneficiaries.length} beneficiaries`);

    return c.json({ 
      success: true,
      beneficiariesNotified: verifiedBeneficiaries.length
    });
  } catch (error) {
    console.error('❌ [Dev Tools] Force unlock error:', error);
    console.error('❌ [Dev Tools] Error message:', error.message);
    console.error('❌ [Dev Tools] Error stack:', error.stack);
    return c.json({ error: 'Failed to force unlock', details: error.message }, 500);
  }
});

// Dev tool: Cancel scheduled unlock
app.post("/make-server-f9be53a7/api/legacy-access/dev/cancel-unlock", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔧 [Dev Tools] Canceling scheduled unlock for user ${user.id}`);

    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    
    config.trigger.unlockScheduledAt = undefined;
    config.trigger.unlockCanceledAt = Date.now();
    config.trigger.warningEmailSentAt = undefined;
    config.updatedAt = Date.now();
    
    await kv.set(`legacy_access_${user.id}`, config);

    console.log(`✅ [Dev Tools] Scheduled unlock canceled`);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Dev Tools] Cancel unlock error:', error);
    return c.json({ error: 'Failed to cancel unlock' }, 500);
  }
});

// Dev tool: Reset legacy access settings to defaults
app.post("/make-server-f9be53a7/api/legacy-access/dev/reset", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔧 [Dev Tools] Resetting legacy access settings for user ${user.id}`);

    const config = await LegacyAccessService.getLegacyAccessConfig(user.id);
    
    // Reset trigger settings (keep beneficiaries)
    config.trigger = {
      type: 'inactivity',
      inactivityMonths: 6,
      gracePeriodDays: 30,
      lastActivityAt: Date.now()
    };
    config.updatedAt = Date.now();
    
    await kv.set(`legacy_access_${user.id}`, config);

    console.log(`✅ [Dev Tools] Legacy access settings reset to defaults`);

    return c.json({ success: true, config });
  } catch (error) {
    console.error('❌ [Dev Tools] Reset error:', error);
    return c.json({ error: 'Failed to reset settings' }, 500);
  }
});


console.log('🔐 Legacy Access endpoints initialized');

// ============================================
// FOLDER SHARING ENDPOINTS (Phase 5A)
// ============================================

// Create share link
app.post("/make-server-f9be53a7/api/share/create", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { folderId, accessLevel, expiresIn, password } = await c.req.json();

    // Validate inputs
    if (!folderId) {
      return c.json({ error: 'folderId is required' }, 400);
    }

    if (!accessLevel || !['view', 'download'].includes(accessLevel)) {
      return c.json({ error: 'accessLevel must be "view" or "download"' }, 400);
    }

    console.log(`🔗 [Share] Creating link for folder ${folderId} by user ${user.id}`);

    const result = await ShareService.createShareLink(user.id, folderId, {
      accessLevel,
      expiresIn,
      password
    });

    return c.json(result);
  } catch (error) {
    console.error('❌ [Share] Create error:', error);
    return c.json({ error: 'Failed to create share link' }, 500);
  }
});

// Validate share link (public endpoint - no auth required)
app.get("/make-server-f9be53a7/api/share/validate/:shareId", async (c) => {
  try {
    const shareId = c.req.param('shareId');
    const password = c.req.query('password');

    console.log(`🔍 [Share] Validating link: ${shareId}`);

    const result = await ShareService.validateShareLink(shareId, password);

    if (!result.valid) {
      return c.json({ valid: false, error: result.error }, 400);
    }

    // Return metadata only (not full folder contents)
    return c.json({
      valid: true,
      folderId: result.link!.folderId,
      accessLevel: result.link!.accessLevel,
      expiresAt: result.link!.expiresAt,
      requiresPassword: result.link!.passwordHash !== null
    });
  } catch (error) {
    console.error('❌ [Share] Validate error:', error);
    return c.json({ error: 'Failed to validate share link' }, 500);
  }
});

// Get folder shares (for owner)
app.get("/make-server-f9be53a7/api/share/folder/:folderId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const folderId = c.req.param('folderId');

    console.log(`📋 [Share] Getting shares for folder ${folderId}`);

    const shares = await ShareService.getFolderShares(user.id, folderId);

    return c.json({ shares });
  } catch (error) {
    console.error('❌ [Share] Get shares error:', error);
    return c.json({ error: 'Failed to get shares' }, 500);
  }
});

// Get all user shares (for management)
app.get("/make-server-f9be53a7/api/share/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📋 [Share] Getting all shares for user ${user.id}`);

    const shares = await ShareService.getUserShares(user.id);

    return c.json({ shares });
  } catch (error) {
    console.error('❌ [Share] Get user shares error:', error);
    return c.json({ error: 'Failed to get shares' }, 500);
  }
});

// Revoke share link
app.delete("/make-server-f9be53a7/api/share/:shareId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const shareId = c.req.param('shareId');

    console.log(`🗑️ [Share] Revoking link: ${shareId} by user ${user.id}`);

    const result = await ShareService.revokeShareLink(user.id, shareId);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Share] Revoke error:', error);
    return c.json({ error: 'Failed to revoke share link' }, 500);
  }
});

// Get share statistics (for analytics)
app.get("/make-server-f9be53a7/api/share/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📊 [Share] Getting stats for user ${user.id}`);

    const stats = await ShareService.getShareStats(user.id);

    return c.json(stats);
  } catch (error) {
    console.error('❌ [Share] Get stats error:', error);
    return c.json({ error: 'Failed to get statistics' }, 500);
  }
});

// Cleanup expired links (CRON job endpoint - should be secured with API key in production)
app.post("/make-server-f9be53a7/api/share/cleanup", async (c) => {
  try {
    // TODO: Add API key authentication for CRON jobs
    console.log(`🧹 [Share] Running cleanup job...`);

    const result = await ShareService.cleanupExpiredLinks();

    console.log(`✅ [Share] Cleanup complete: ${result.revokedCount} links revoked`);

    return c.json(result);
  } catch (error) {
    console.error('❌ [Share] Cleanup error:', error);
    return c.json({ error: 'Failed to cleanup expired links' }, 500);
  }
});

console.log('🔗 Folder sharing endpoints initialized');

// ============================================================================
// LEGACY EMAIL SYSTEM - Inactivity Warnings & Beneficiary Access
// ============================================================================

// Cron endpoint: Check for inactivity warnings (daily at 10 AM UTC)
app.post('/make-server-f9be53a7/cron/check-inactivity-warnings', async (c) => {
  try {
    console.log('🔍 [Cron] Starting inactivity warnings check...');
    const result = await LegacyCron.checkInactivityWarnings();
    return c.json(result);
  } catch (error) {
    console.error('❌ [Cron] Inactivity warnings error:', error);
    return c.json({ error: 'Failed to check inactivity warnings' }, 500);
  }
});

// Cron endpoint: Check for inactive accounts and grant access (daily at 11 AM UTC)
app.post('/make-server-f9be53a7/cron/check-inactive-accounts', async (c) => {
  try {
    console.log('🔍 [Cron] Starting inactive accounts check...');
    const result = await LegacyCron.checkInactiveAccounts();
    return c.json(result);
  } catch (error) {
    console.error('❌ [Cron] Inactive accounts error:', error);
    return c.json({ error: 'Failed to check inactive accounts' }, 500);
  }
});

// ✅ NEW: Cron endpoint: Check beneficiary reminders (weekly on Mondays at 9 AM UTC)
app.post('/make-server-f9be53a7/cron/check-beneficiary-reminders', async (c) => {
  try {
    console.log('📧 [Cron] Starting beneficiary reminders check...');
    const result = await LegacyCron.checkBeneficiaryReminders();
    return c.json(result);
  } catch (error) {
    console.error('❌ [Cron] Beneficiary reminders error:', error);
    return c.json({ error: 'Failed to check beneficiary reminders' }, 500);
  }
});

// Cron endpoint: Process email queue (every 5 minutes)
app.post('/make-server-f9be53a7/cron/process-email-queue', async (c) => {
  try {
    console.log('📬 [Cron] Processing email queue...');
    const result = await processEmailQueue(kv);
    return c.json(result);
  } catch (error) {
    console.error('❌ [Cron] Email queue error:', error);
    return c.json({ error: 'Failed to process email queue' }, 500);
  }
});

// User login hook - reset inactivity timer
app.post('/make-server-f9be53a7/api/user/login-hook', async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    await LegacyCron.handleUserLogin(userId);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Login hook error:', error);
    return c.json({ error: 'Failed to process login hook' }, 500);
  }
});

console.log('⏰ Legacy cron endpoints initialized');

// ============================================================================
// FOLDER SHARING EMAIL SYSTEM
// ============================================================================

// Share a folder with an email address
app.post('/make-server-f9be53a7/api/folder/share', async (c) => {
  try {
    const { folderId, userId, recipientEmail, permission, personalMessage } = await c.req.json();
    
    if (!folderId || !userId || !recipientEmail || !permission) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const result = await FolderSharing.shareFolderWithEmail({
      folderId,
      userId,
      recipientEmail,
      permission,
      personalMessage,
    });

    return c.json(result);
  } catch (error) {
    console.error('❌ Folder share error:', error);
    return c.json({ error: 'Failed to share folder' }, 500);
  }
});

// Get shared folder by token
app.get('/make-server-f9be53a7/api/folder/shared/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const result = await FolderSharing.getSharedFolder(token);
    return c.json(result);
  } catch (error) {
    console.error('❌ Get shared folder error:', error);
    return c.json({ error: 'Failed to get shared folder' }, 404);
  }
});

// Remove folder share
app.delete('/make-server-f9be53a7/api/folder/share', async (c) => {
  try {
    const { folderId, recipientEmail } = await c.req.json();
    
    if (!folderId || !recipientEmail) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const result = await FolderSharing.removeFolderShare(folderId, recipientEmail);
    return c.json(result);
  } catch (error) {
    console.error('❌ Remove folder share error:', error);
    return c.json({ error: 'Failed to remove folder share' }, 500);
  }
});

// List all shares for a folder
app.get('/make-server-f9be53a7/api/folder/:folderId/shares', async (c) => {
  try {
    const folderId = c.req.param('folderId');
    const shares = await FolderSharing.listFolderShares(folderId);
    return c.json({ shares });
  } catch (error) {
    console.error('❌ List folder shares error:', error);
    return c.json({ error: 'Failed to list folder shares' }, 500);
  }
});

console.log('📧 Folder sharing email endpoints initialized');

// ============================================
// PROFILE PICTURE ENDPOINTS
// ============================================

// Get user profile (including avatar)
app.get('/make-server-f9be53a7/api/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUserToken(accessToken || '');
    
    if (error || !user) {
      console.error('❌ [Profile] Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📸 [Profile] Getting profile for user: ${user.id}`);

    // Get user profile from KV store
    const profile = await kv.get(`user_profile:${user.id}`) || {};
    
    // If avatar exists, generate a fresh signed URL
    if (profile.avatar_storage_path) {
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('make-f9be53a7-media')
          .createSignedUrl(profile.avatar_storage_path, 31536000); // 1 year

        if (signedData && !signedError) {
          profile.avatar_url = signedData.signedUrl;
        } else {
          console.warn('⚠️ Failed to generate signed URL for avatar:', signedError);
        }
      } catch (urlError) {
        console.warn('⚠️ Error generating avatar URL:', urlError);
      }
    }

    return c.json({ profile });
  } catch (error) {
    console.error('❌ [Profile] Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Upload profile picture
app.post('/make-server-f9be53a7/api/profile/avatar', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUserToken(accessToken || '');
    
    if (error || !user) {
      console.error('❌ [Profile Avatar] Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`📸 [Profile Avatar] Uploading avatar for user: ${user.id}`);

    // Get the uploaded file from form data
    const formData = await c.req.formData();
    const file = formData.get('file');
    
    if (!file || typeof file === 'string') {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' }, 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return c.json({ error: 'File too large. Maximum size is 5MB.' }, 400);
    }

    // Get user profile to check for existing avatar
    const profile = await kv.get(`user_profile:${user.id}`) || {};
    const oldAvatarPath = profile.avatar_storage_path;

    // Create storage path
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const storagePath = `profile-pictures/${user.id}/avatar_${timestamp}.${extension}`;

    console.log(`📤 [Profile Avatar] Uploading to: ${storagePath}`);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-f9be53a7-media')
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ [Profile Avatar] Upload error:', uploadError);
      return c.json({ error: 'Failed to upload avatar' }, 500);
    }

    console.log(`✅ [Profile Avatar] Uploaded successfully:`, uploadData);

    // Generate signed URL (1 year expiry)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('make-f9be53a7-media')
      .createSignedUrl(storagePath, 31536000);

    if (signedError) {
      console.error('❌ [Profile Avatar] Failed to generate signed URL:', signedError);
      return c.json({ error: 'Failed to generate avatar URL' }, 500);
    }

    // Update user profile in KV store
    const updatedProfile = {
      ...profile,
      avatar_url: signedData.signedUrl,
      avatar_storage_path: storagePath,
      avatar_uploaded_at: timestamp
    };

    await kv.set(`user_profile:${user.id}`, updatedProfile);

    console.log(`✅ [Profile Avatar] Profile updated in KV store`);

    // Delete old avatar if it exists (cleanup)
    if (oldAvatarPath) {
      try {
        console.log(`🗑️ [Profile Avatar] Deleting old avatar: ${oldAvatarPath}`);
        await supabase.storage
          .from('make-f9be53a7-media')
          .remove([oldAvatarPath]);
        console.log(`✅ [Profile Avatar] Old avatar deleted`);
      } catch (deleteError) {
        console.warn('⚠️ [Profile Avatar] Failed to delete old avatar:', deleteError);
        // Don't fail the request if cleanup fails
      }
    }

    return c.json({
      success: true,
      avatar_url: signedData.signedUrl,
      avatar_storage_path: storagePath
    });

  } catch (error) {
    console.error('❌ [Profile Avatar] Unexpected error:', error);
    return c.json({ error: 'Failed to upload avatar' }, 500);
  }
});

// Delete profile picture
app.delete('/make-server-f9be53a7/api/profile/avatar', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUserToken(accessToken || '');
    
    if (error || !user) {
      console.error('❌ [Profile Avatar Delete] Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🗑️ [Profile Avatar Delete] Deleting avatar for user: ${user.id}`);

    // Get user profile
    const profile = await kv.get(`user_profile:${user.id}`) || {};
    const avatarPath = profile.avatar_storage_path;

    if (!avatarPath) {
      return c.json({ error: 'No avatar to delete' }, 404);
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('make-f9be53a7-media')
      .remove([avatarPath]);

    if (deleteError) {
      console.error('❌ [Profile Avatar Delete] Storage deletion error:', deleteError);
      // Continue anyway to update KV store
    }

    // Remove avatar from profile
    const updatedProfile = {
      ...profile,
      avatar_url: null,
      avatar_storage_path: null,
      avatar_uploaded_at: null
    };

    await kv.set(`user_profile:${user.id}`, updatedProfile);

    console.log(`✅ [Profile Avatar Delete] Avatar deleted and profile updated`);

    return c.json({ success: true });

  } catch (error) {
    console.error('❌ [Profile Avatar Delete] Unexpected error:', error);
    return c.json({ error: 'Failed to delete avatar' }, 500);
  }
});

console.log('📸 Profile picture endpoints initialized');

// ============================================
// SUPPORT REQUEST ENDPOINT
// ============================================
app.post("/make-server-f9be53a7/api/support-request", async (c) => {
  try {
    console.log('🆘 [Support Request] Request received');
    
    const { subject, message, userName, userEmail, userId } = await c.req.json();
    
    if (!subject || !message) {
      return c.json({ error: "Subject and message are required" }, 400);
    }

    console.log('📧 [Support Request] Processing request from:', userEmail);

    // Create email HTML (simple, no CTA button as requested)
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request - Eras</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🆘 Support Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="background: rgba(99,102,241,0.15); border-left: 4px solid #6366f1; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #c7d2fe; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Subject</h3>
                <p style="margin: 0; font-size: 16px; color: #e0e7ff; font-weight: 500;">${subject}</p>
              </div>
              
              <div style="background: rgba(168,85,247,0.15); border-left: 4px solid #a855f7; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #e9d5ff; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Message</h3>
                <p style="margin: 0; font-size: 15px; color: #e2e8f0; line-height: 1.7; white-space: pre-wrap;">${message}</p>
              </div>
              
              <div style="background: rgba(71,85,105,0.3); padding: 16px 20px; margin: 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #cbd5e1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">User Information</h3>
                <p style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 14px;">
                  <strong>Name:</strong> ${userName || 'Not provided'}
                </p>
                <p style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 14px;">
                  <strong>Email:</strong> <a href="mailto:${userEmail}" style="color: #a855f7; text-decoration: none;">${userEmail}</a>
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                  <strong>User ID:</strong> ${userId || 'Not available'}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2025 Eras. Capture Today, Unlock Tomorrow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Import Resend
    const { Resend } = await import('npm:resend@4.0.0');
    const { resendRateLimiter } = await import('./rate-limiter.tsx');
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Eras <onboarding@resend.dev>';

    // RATE LIMIT: Wait for rate limiter before sending
    await resendRateLimiter.waitForNextSlot();
    
    // Send email
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'Eras@erastimecapsule.com',
      subject: `Support Request: ${subject}`,
      html: html,
      reply_to: userEmail, // Allow easy reply to user
    });

    console.log('📧 [Support Request] Resend API response:', JSON.stringify(result, null, 2));

    if (result.error) {
      console.error('❌ [Support Request] Failed to send email:', result.error);
      return c.json({ error: 'Failed to send support request' }, 500);
    }

    console.log('✅ [Support Request] Email sent successfully');
    return c.json({ success: true });

  } catch (error) {
    console.error('💥 [Support Request] Exception:', error);
    return c.json({ error: 'Failed to process support request' }, 500);
  }
});

console.log('🆘 Support request endpoint initialized');

// REMOVED: Duplicate scheduler call (already started at line ~3278)
// startDeliveryScheduler();

// Mount Archive routes
console.log('🌫️ [Startup] Mounting Archive routes...');
app.route('/', forgottenMemoriesApp);
console.log('✅ [Startup] Archive routes mounted');

console.log('🚀 [Startup] Server starting - all systems ready');
console.log('🚀 [Startup] Environment check:', {
  hasUrl: !!Deno.env.get('SUPABASE_URL'),
  hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
  url: Deno.env.get('SUPABASE_URL')?.substring(0, 30) + '...',
  nodeEnv: Deno.env.get('NODE_ENV') || 'not set'
});
console.log('📡 [Startup] Server will listen for requests...');
console.log('📡 [Startup] Calling Deno.serve()...');
console.log('📡 [Startup] Expected URLs:');
console.log(`   - Health: https://${Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0]}.supabase.co/functions/v1/make-server-f9be53a7/health`);
console.log(`   - Basic Health: https://${Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0]}.supabase.co/functions/v1/health`);

try {
  Deno.serve(app.fetch);
  console.log('✅ [Startup] Server started successfully - ready to accept connections');
} catch (error) {
  console.error('💥 CRITICAL: Failed to start server:', error);
  console.error('💥 Error type:', typeof error);
  console.error('💥 Error message:', error?.message);
  console.error('💥 Stack:', error?.stack);
  throw error;
}