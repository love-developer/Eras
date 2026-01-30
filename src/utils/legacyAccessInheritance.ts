/**
 * Legacy Access Inheritance System
 * 
 * Computes effective beneficiaries for folders during legacy unlock.
 * Handles folder-level overrides while maintaining global settings as default.
 */

export interface GlobalBeneficiary {
  userId?: string;
  email: string;
  name?: string;
  verificationStatus?: 'pending' | 'verified';
  addedAt?: string;
}

export interface FolderBeneficiary {
  userId?: string;
  email: string;
  name?: string;
  permission: 'view' | 'download' | 'full';
  addedAt: string;
  addedBy: string;
}

export interface FolderLegacyAccess {
  mode: 'global' | 'custom' | 'none';
  beneficiaries: FolderBeneficiary[];
  accessType: 'view' | 'download' | 'full';
  updatedAt?: string;
  auditLog?: Array<{
    action: string;
    userId: string;
    timestamp: string;
    details: Record<string, any>;
  }>;
  // DEPRECATED: Kept for backward compatibility, no longer used in UI
  inheritGlobal?: boolean;
  visibility?: 'hidden' | 'locked' | 'visible';
}

export interface VaultFolder {
  id: string;
  name: string;
  color?: string;
  userId: string;
  parentId?: string | null;
  capsule_count?: number;
  legacyAccess?: FolderLegacyAccess;
}

export interface ComputedBeneficiary {
  email: string;
  name: string;
  permission: 'view' | 'download' | 'full';
  source: 'global' | 'folder-custom';
}

export interface ComputedFolderAccess {
  folderId: string;
  folderName: string;
  folderColor?: string;
  itemCount?: number;
  beneficiaries: ComputedBeneficiary[];
  visibility: 'hidden' | 'locked' | 'visible';
}

/**
 * Computes effective beneficiaries for a folder during legacy unlock
 * 
 * @param folder - The vault folder with optional legacyAccess configuration
 * @param globalBeneficiaries - Global legacy access beneficiaries from vault settings
 * @returns Computed list of who can access this folder and their permissions
 */
export function computeFolderLegacyAccess(
  folder: VaultFolder,
  globalBeneficiaries: GlobalBeneficiary[]
): ComputedFolderAccess {
  
  // CASE 1: No custom settings OR mode is 'global' → inherit global
  if (!folder.legacyAccess || folder.legacyAccess.mode === 'global') {
    return {
      folderId: folder.id,
      folderName: folder.name,
      folderColor: folder.color,
      itemCount: folder.capsule_count || 0,
      beneficiaries: globalBeneficiaries.map(b => ({
        email: b.email,
        name: b.name || b.email,
        permission: 'full' as const,  // Global beneficiaries get full access by default
        source: 'global' as const
      })),
      visibility: 'visible'  // Global = always visible
    };
  }
  
  // CASE 2: Custom mode
  const customBeneficiaries: ComputedBeneficiary[] = folder.legacyAccess.beneficiaries.map(b => ({
    email: b.email,
    name: b.name || b.email,
    permission: b.permission,
    source: 'folder-custom' as const
  }));
  
  // CASE 2A: Inherit global + custom (hybrid mode)
  if (folder.legacyAccess.inheritGlobal) {
    const globalMapped: ComputedBeneficiary[] = globalBeneficiaries.map(b => ({
      email: b.email,
      name: b.name || b.email,
      permission: 'view' as const,  // Global gets read-only when mixed with custom
      source: 'global' as const
    }));
    
    // Merge and dedupe by email (custom permissions take precedence)
    const merged = [...customBeneficiaries];
    globalMapped.forEach(global => {
      if (!merged.some(c => c.email === global.email)) {
        merged.push(global);
      }
    });
    
    return {
      folderId: folder.id,
      folderName: folder.name,
      folderColor: folder.color,
      itemCount: folder.capsule_count || 0,
      beneficiaries: merged,
      visibility: folder.legacyAccess.visibility
    };
  }
  
  // CASE 2B: Custom only (no global inheritance)
  return {
    folderId: folder.id,
    folderName: folder.name,
    folderColor: folder.color,
    itemCount: folder.capsule_count || 0,
    beneficiaries: customBeneficiaries,
    visibility: folder.legacyAccess.visibility
  };
}

/**
 * Computes access for ALL folders in vault for a specific beneficiary email
 * Used in Legacy Unlock Portal to show "Your Accessible Folders"
 * 
 * @param folders - All folders in the vault
 * @param globalBeneficiaries - Global legacy access beneficiaries
 * @param beneficiaryEmail - Email of the beneficiary accessing the vault
 * @returns List of folders this beneficiary can access with their permissions
 */
export function computeBeneficiaryFolderAccess(
  folders: VaultFolder[],
  globalBeneficiaries: GlobalBeneficiary[],
  beneficiaryEmail: string
): ComputedFolderAccess[] {
  
  return folders
    .map(folder => computeFolderLegacyAccess(folder, globalBeneficiaries))
    .filter(computed => {
      // Only include folders where this beneficiary has access
      return computed.beneficiaries.some(b => b.email.toLowerCase() === beneficiaryEmail.toLowerCase());
    })
    .map(computed => ({
      ...computed,
      // Filter beneficiaries to only show THIS person's access level
      beneficiaries: computed.beneficiaries.filter(
        b => b.email.toLowerCase() === beneficiaryEmail.toLowerCase()
      )
    }));
}

/**
 * Checks if a beneficiary has access to a specific folder
 * 
 * @param folder - The folder to check
 * @param globalBeneficiaries - Global legacy access beneficiaries
 * @param beneficiaryEmail - Email of the beneficiary
 * @returns Permission level if they have access, null otherwise
 */
export function getBeneficiaryPermission(
  folder: VaultFolder,
  globalBeneficiaries: GlobalBeneficiary[],
  beneficiaryEmail: string
): 'view' | 'download' | 'full' | null {
  
  const computed = computeFolderLegacyAccess(folder, globalBeneficiaries);
  const beneficiary = computed.beneficiaries.find(
    b => b.email.toLowerCase() === beneficiaryEmail.toLowerCase()
  );
  
  return beneficiary ? beneficiary.permission : null;
}

/**
 * Validates if a folder's legacy access configuration is valid
 * 
 * @param legacyAccess - The folder's legacy access configuration
 * @returns Object with isValid flag and error message if invalid
 */
export function validateFolderLegacyAccess(
  legacyAccess: FolderLegacyAccess
): { isValid: boolean; error?: string } {
  
  // Custom mode must have at least one beneficiary (unless inheriting global)
  if (legacyAccess.mode === 'custom') {
    if (legacyAccess.beneficiaries.length === 0 && !legacyAccess.inheritGlobal) {
      return {
        isValid: false,
        error: 'Custom mode requires at least one beneficiary or global inheritance enabled'
      };
    }
    
    // Check for duplicate emails
    const emails = legacyAccess.beneficiaries.map(b => b.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      return {
        isValid: false,
        error: 'Duplicate beneficiary emails are not allowed'
      };
    }
    
    // Validate email format (basic check)
    for (const beneficiary of legacyAccess.beneficiaries) {
      if (!beneficiary.email.includes('@')) {
        return {
          isValid: false,
          error: `Invalid email format: ${beneficiary.email}`
        };
      }
    }
  }
  
  return { isValid: true };
}

/**
 * Gets a summary of folder legacy access for display purposes
 * 
 * @param folder - The folder
 * @param globalBeneficiaries - Global beneficiaries
 * @returns Human-readable summary string
 */
export function getFolderAccessSummary(
  folder: VaultFolder,
  globalBeneficiaries: GlobalBeneficiary[]
): string {
  
  if (!folder.legacyAccess || folder.legacyAccess.mode === 'global') {
    const count = globalBeneficiaries.length;
    return count === 0 
      ? 'No legacy access configured'
      : `Inherits global access (${count} ${count === 1 ? 'beneficiary' : 'beneficiaries'})`;
  }
  
  const computed = computeFolderLegacyAccess(folder, globalBeneficiaries);
  const count = computed.beneficiaries.length;
  
  if (folder.legacyAccess.inheritGlobal) {
    return `Custom access (${count} ${count === 1 ? 'beneficiary' : 'beneficiaries'} including global)`;
  }
  
  return `Custom access (${count} ${count === 1 ? 'beneficiary' : 'beneficiaries'})`;
}