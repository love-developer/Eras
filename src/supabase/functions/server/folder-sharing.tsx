import { sendEmail, queueEmail } from './email-service.tsx';
import * as kv from './kv_store.tsx';

// Share a folder with an email address
export async function shareFolderWithEmail(params: {
  folderId: string;
  userId: string;
  recipientEmail: string;
  permission: 'View' | 'Edit' | 'Full Access';
  personalMessage?: string;
}) {
  const { folderId, userId, recipientEmail, permission, personalMessage } = params;

  try {
    // Get folder details
    const folder = await kv.get(`vault_folder:${userId}:${folderId}`);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Get user details
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already shared with this email
    const shareKey = `folder_share:${folderId}:${recipientEmail}`;
    const existingShare = await kv.get(shareKey);

    if (existingShare && existingShare.status === 'active') {
      // Update permission if different
      if (existingShare.permission !== permission) {
        await kv.set(shareKey, {
          ...existingShare,
          permission: permission,
          updatedAt: new Date().toISOString(),
        });
        console.log(`🔄 Updated permission for ${recipientEmail} to ${permission}`);
      }
      return { success: true, alreadyShared: true, shareId: existingShare.id };
    }

    // Get folder content stats
    const folderItems = await kv.getByPrefix(`vault_item:${userId}:${folderId}:`);
    
    let photoCount = 0;
    let videoCount = 0;
    let audioCount = 0;

    for (const { value: item } of folderItems) {
      if (item.type === 'photo' || item.type === 'image') photoCount++;
      else if (item.type === 'video') videoCount++;
      else if (item.type === 'audio') audioCount++;
    }

    // Generate unique share token
    const shareToken = crypto.randomUUID();
    const shareId = crypto.randomUUID();

    // Save share record
    const share = {
      id: shareId,
      folderId: folderId,
      recipientEmail: recipientEmail,
      permission: permission,
      shareToken: shareToken,
      sharedBy: userId,
      sharedAt: new Date().toISOString(),
      status: 'pending',
      emailSent: false,
    };

    await kv.set(shareKey, share);

    // Prepare email variables
    const appUrl = Deno.env.get('APP_URL') || 'https://eras.app';
    const emailVars = {
      recipientEmail: recipientEmail,
      userName: user.name || user.email,
      userEmail: user.email,
      folderName: folder.name,
      folderIcon: folder.icon || '📂',
      folderDescription: folder.description || null,
      itemCount: folderItems.length,
      photoCount: photoCount,
      videoCount: videoCount,
      audioCount: audioCount,
      permission: permission,
      personalMessage: personalMessage || null,
      shareUrl: `${appUrl}/vault/shared/${shareToken}`,
      shareDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      appUrl: appUrl,
    };

    // Send email
    const result = await sendEmail({
      to: recipientEmail,
      subject: `${user.name || user.email} shared a Legacy Vault folder with you: "${folder.name}"`,
      template: 'folder-share-invitation',
      variables: emailVars,
    });

    if (result.success) {
      // Mark email as sent
      await kv.set(shareKey, {
        ...share,
        emailSent: true,
        emailSentAt: new Date().toISOString(),
        status: 'active',
      });
      console.log(`✅ Folder share invitation sent to ${recipientEmail}`);
    } else {
      // Queue for retry
      await queueEmail({
        type: 'folder-share-invitation',
        recipientEmail: recipientEmail,
        subject: `${user.name || user.email} shared a Legacy Vault folder with you: "${folder.name}"`,
        template: 'folder-share-invitation',
        variables: emailVars,
      }, kv);
    }

    return {
      success: result.success,
      shareId: shareId,
      shareToken: shareToken,
    };
  } catch (error) {
    console.error('❌ Error sharing folder:', error);
    throw error;
  }
}

// Get shared folder by token
export async function getSharedFolder(shareToken: string) {
  try {
    // Find share by token
    const shares = await kv.getByPrefix('folder_share:');
    const share = shares.find(s => s.value.shareToken === shareToken);

    if (!share || share.value.status !== 'active') {
      throw new Error('Share not found or inactive');
    }

    // Get folder details
    const folder = await kv.get(`vault_folder:${share.value.sharedBy}:${share.value.folderId}`);
    
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Get folder items
    const items = await kv.getByPrefix(`vault_item:${share.value.sharedBy}:${share.value.folderId}:`);

    return {
      share: share.value,
      folder: folder,
      items: items.map(i => i.value),
    };
  } catch (error) {
    console.error('❌ Error getting shared folder:', error);
    throw error;
  }
}

// Remove folder share
export async function removeFolderShare(folderId: string, recipientEmail: string) {
  try {
    const shareKey = `folder_share:${folderId}:${recipientEmail}`;
    const share = await kv.get(shareKey);

    if (!share) {
      throw new Error('Share not found');
    }

    // Mark as inactive
    await kv.set(shareKey, {
      ...share,
      status: 'revoked',
      revokedAt: new Date().toISOString(),
    });

    console.log(`🗑️ Folder share revoked for ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error removing folder share:', error);
    throw error;
  }
}

// List all shares for a folder
export async function listFolderShares(folderId: string) {
  try {
    const shares = await kv.getByPrefix(`folder_share:${folderId}:`);
    return shares
      .map(s => s.value)
      .filter(s => s.status === 'active');
  } catch (error) {
    console.error('❌ Error listing folder shares:', error);
    throw error;
  }
}
