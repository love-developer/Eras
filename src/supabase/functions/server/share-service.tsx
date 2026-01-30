/**
 * Share Service - Encrypted Link Management
 * 
 * Handles creation, validation, and revocation of folder share links.
 * 
 * Key Features:
 * - Cryptographically secure share tokens
 * - Password protection (hashed)
 * - Expiry management
 * - View/download permissions
 * - Access tracking and analytics
 * 
 * Phase 5A: Core sharing functionality
 * Phase 5B: Vault integration (future)
 * Phase 5C: Audit logs and analytics (future)
 */

import * as kv from './kv_store.tsx';

// ===========================
// Types & Interfaces
// ===========================

export interface ShareLink {
  id: string;                    // share_abc123
  folderId: string;
  ownerId: string;
  accessLevel: 'view' | 'download';
  passwordHash: string | null;
  expiresAt: number | null;      // timestamp or null = never
  createdAt: number;
  revokedAt: number | null;
  viewCount: number;
  lastAccessedAt: number | null;
  metadata: {
    createdFrom: 'web' | 'mobile';
    userAgent?: string;
  };
}

export interface CreateShareOptions {
  accessLevel: 'view' | 'download';
  expiresIn?: number;  // milliseconds
  password?: string;
}

export interface ValidateShareResult {
  valid: boolean;
  link?: ShareLink;
  error?: string;
}

export interface RevokeShareResult {
  success: boolean;
  error?: string;
}

// ===========================
// Core Functions
// ===========================

/**
 * Generate cryptographically secure share token
 */
function generateShareToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password using SHA-256
 * Note: In production, consider using bcrypt or Argon2 for stronger security
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify password against hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const testHash = await hashPassword(password);
  return testHash === hash;
}

// ===========================
// Public API
// ===========================

/**
 * Create a new share link for a folder
 */
export async function createShareLink(
  ownerId: string,
  folderId: string,
  options: CreateShareOptions
): Promise<{ shareId: string; shareUrl: string }> {
  const shareId = `share_${generateShareToken()}`;
  
  const link: ShareLink = {
    id: shareId,
    folderId,
    ownerId,
    accessLevel: options.accessLevel,
    passwordHash: options.password ? await hashPassword(options.password) : null,
    expiresAt: options.expiresIn ? Date.now() + options.expiresIn : null,
    createdAt: Date.now(),
    revokedAt: null,
    viewCount: 0,
    lastAccessedAt: null,
    metadata: {
      createdFrom: 'web'  // Can be enhanced to detect from headers
    }
  };

  // Save share link
  await kv.set(shareId, link);
  
  // Track active shares for this folder
  const folderKey = `folder_${folderId}_shares`;
  const activeShares = await kv.get<string[]>(folderKey) || [];
  await kv.set(folderKey, [...activeShares, shareId]);

  // Track shares by owner (for bulk operations)
  const ownerKey = `user_${ownerId}_shares`;
  const userShares = await kv.get<string[]>(ownerKey) || [];
  await kv.set(ownerKey, [...userShares, shareId]);

  console.log(`🔗 [Share] Created link ${shareId} for folder ${folderId}`);

  return {
    shareId,
    shareUrl: `${Deno.env.get('APP_URL') || 'https://eras.app'}/s/${shareId}`
  };
}

/**
 * Validate and retrieve share link
 * This is called when someone tries to access a shared folder
 */
export async function validateShareLink(
  shareId: string,
  password?: string
): Promise<ValidateShareResult> {
  const link = await kv.get<ShareLink>(shareId);
  
  if (!link) {
    return { valid: false, error: 'Share link not found' };
  }

  // Check if revoked
  if (link.revokedAt) {
    return { valid: false, error: 'Share link has been revoked' };
  }

  // Check if expired
  if (link.expiresAt && Date.now() > link.expiresAt) {
    return { valid: false, error: 'Share link has expired' };
  }

  // Check password if required
  if (link.passwordHash) {
    if (!password) {
      return { valid: false, error: 'Password required' };
    }
    const passwordValid = await verifyPassword(password, link.passwordHash);
    if (!passwordValid) {
      return { valid: false, error: 'Invalid password' };
    }
  }

  // Update access tracking
  link.viewCount++;
  link.lastAccessedAt = Date.now();
  await kv.set(shareId, link);

  console.log(`👁️ [Share] Link ${shareId} accessed (view count: ${link.viewCount})`);

  return { valid: true, link };
}

/**
 * Revoke a share link (owner only)
 */
export async function revokeShareLink(
  ownerId: string,
  shareId: string
): Promise<RevokeShareResult> {
  const link = await kv.get<ShareLink>(shareId);
  
  if (!link) {
    return { success: false, error: 'Share link not found' };
  }

  // Verify ownership
  if (link.ownerId !== ownerId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Already revoked?
  if (link.revokedAt) {
    return { success: false, error: 'Share link already revoked' };
  }

  // Mark as revoked
  link.revokedAt = Date.now();
  await kv.set(shareId, link);

  console.log(`🗑️ [Share] Revoked link ${shareId}`);

  return { success: true };
}

/**
 * Get all active shares for a folder (owner only)
 */
export async function getFolderShares(
  ownerId: string,
  folderId: string
): Promise<ShareLink[]> {
  const folderKey = `folder_${folderId}_shares`;
  const shareIds = await kv.get<string[]>(folderKey) || [];
  
  // Fetch all shares
  const shares = await Promise.all(
    shareIds.map(id => kv.get<ShareLink>(id))
  );
  
  // Filter out nulls, wrong owner, and revoked
  return shares.filter((link): link is ShareLink => 
    link !== null && 
    link.ownerId === ownerId &&
    !link.revokedAt
  );
}

/**
 * Get all shares created by a user (for management UI)
 */
export async function getUserShares(
  ownerId: string
): Promise<ShareLink[]> {
  const ownerKey = `user_${ownerId}_shares`;
  const shareIds = await kv.get<string[]>(ownerKey) || [];
  
  const shares = await Promise.all(
    shareIds.map(id => kv.get<ShareLink>(id))
  );
  
  return shares.filter((link): link is ShareLink => 
    link !== null && 
    link.ownerId === ownerId &&
    !link.revokedAt
  );
}

/**
 * Bulk revoke all expired links (cleanup job)
 */
export async function cleanupExpiredLinks(): Promise<{ revokedCount: number }> {
  let revokedCount = 0;
  
  // Get all share keys
  const allShares = await kv.getByPrefix<ShareLink>('share_');
  
  const now = Date.now();
  
  for (const share of allShares) {
    if (share && share.expiresAt && now > share.expiresAt && !share.revokedAt) {
      share.revokedAt = now;
      await kv.set(share.id, share);
      revokedCount++;
    }
  }

  console.log(`🧹 [Share] Cleanup complete: ${revokedCount} expired links revoked`);

  return { revokedCount };
}

/**
 * Get share statistics (for analytics dashboard - Phase 5C)
 */
export async function getShareStats(ownerId: string): Promise<{
  totalShares: number;
  activeShares: number;
  totalViews: number;
  expiringThisWeek: number;
}> {
  const shares = await getUserShares(ownerId);
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  
  return {
    totalShares: shares.length,
    activeShares: shares.filter(s => !s.revokedAt).length,
    totalViews: shares.reduce((sum, s) => sum + s.viewCount, 0),
    expiringThisWeek: shares.filter(s => 
      s.expiresAt && 
      s.expiresAt > now && 
      s.expiresAt < now + oneWeek
    ).length
  };
}

/**
 * Check if a user has permission to view a folder via share link
 */
export async function checkSharePermission(
  shareId: string,
  requestedAction: 'view' | 'download'
): Promise<{ allowed: boolean; error?: string }> {
  const link = await kv.get<ShareLink>(shareId);
  
  if (!link) {
    return { allowed: false, error: 'Share link not found' };
  }

  if (link.revokedAt) {
    return { allowed: false, error: 'Share link revoked' };
  }

  if (link.expiresAt && Date.now() > link.expiresAt) {
    return { allowed: false, error: 'Share link expired' };
  }

  // Check permission level
  if (requestedAction === 'download' && link.accessLevel === 'view') {
    return { allowed: false, error: 'Download not permitted (view-only link)' };
  }

  return { allowed: true };
}

// ===========================
// Export service
// ===========================

export default {
  createShareLink,
  validateShareLink,
  revokeShareLink,
  getFolderShares,
  getUserShares,
  cleanupExpiredLinks,
  getShareStats,
  checkSharePermission
};
