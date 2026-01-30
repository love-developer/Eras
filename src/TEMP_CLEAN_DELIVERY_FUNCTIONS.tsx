// CLEAN VERSION OF DELIVERY FUNCTIONS - TO BE MERGED INTO delivery-service.tsx

  private static async markDeliverySuccessful(capsule: TimeCapsule) {
    // Get media file IDs to include in the capsule object for easier retrieval later
    const mediaIds = await kv.get(`capsule_media:${capsule.id}`) || [];
    
    const updatedCapsule = {
      ...capsule,
      status: 'delivered' as const,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media_files: mediaIds
    };
    
    await kv.set(`capsule:${capsule.id}`, updatedCapsule);

    // Remove from global scheduled list
    try {
      const scheduledList = await kv.get('scheduled_capsules_global') || [];
      const filtered = scheduledList.filter((id: string) => id !== capsule.id);
      if (filtered.length < scheduledList.length) {
        await kv.set('scheduled_capsules_global', filtered);
        console.log(`✅ Removed capsule ${capsule.id} from global scheduled list (${filtered.length} remaining)`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to remove capsule from scheduled list (non-critical):', error);
    }

    // Add capsule to recipient's received list
    try {
      if (capsule.recipient_type === 'self') {
        // SELF-DELIVERY: Add to sender's received list
        await this.handleSelfDelivery(capsule);
      } else {
        // OTHERS-DELIVERY: Check if user exists, add immediately or defer to pending
        await this.handleOthersDelivery(capsule);
      }
    } catch (error) {
      console.warn('Failed to add capsule to received list:', error);
    }
  }

  // Handle self-delivery: add to sender's received list
  private static async handleSelfDelivery(capsule: TimeCapsule) {
    const userId = capsule.created_by;
    const receivedKey = `user_received:${userId}`;
    const receivedList = await kv.get(receivedKey) || [];
    
    if (!receivedList.includes(capsule.id)) {
      receivedList.push(capsule.id);
      await kv.set(receivedKey, receivedList);
      console.log(`✅ Added capsule ${capsule.id} to user ${userId}'s received list (self-delivery)`);
      
      // Create notification
      await this.createReceivedNotification(userId, capsule, 'You (Past Self)');
      
      // Track achievement
      try {
        console.log(`🎯 [Achievement] Tracking capsule_received for user ${userId}`);
        await checkAndUnlockAchievements(userId, 'capsule_received', {
          capsuleId: capsule.id,
          deliveryType: 'self',
          deliveredAt: new Date().toISOString()
        });
        console.log(`✅ [Achievement] Successfully tracked capsule_received`);
      } catch (achievementError) {
        console.error(`❌ [Achievement] Failed to track capsule_received:`, achievementError);
      }
    }
  }

  // Handle others-delivery: find existing users and add to their received list immediately
  private static async handleOthersDelivery(capsule: TimeCapsule) {
    console.log(`📧 Processing "others" delivery for capsule ${capsule.id}`);
    
    // Extract recipient emails
    const recipientEmails = this.extractRecipientEmails(capsule);
    console.log(`📧 Found ${recipientEmails.length} unique recipient email(s) for capsule ${capsule.id}`);
    
    let foundExistingUser = false;
    
    // For each recipient email, check if user exists
    for (const email of recipientEmails) {
      try {
        console.log(`🔍 Checking if user exists for email: ${email}`);
        
        const { data: users, error } = await this.supabase.auth.admin.listUsers();
        
        if (!error && users && users.users) {
          const matchingUser = users.users.find(u => u.email?.toLowerCase() === email);
          
          if (matchingUser) {
            foundExistingUser = true;
            await this.addToExistingUserReceived(capsule, matchingUser, email);
          } else {
            console.log(`📋 User ${email} doesn't exist yet, will add to pending list`);
          }
        } else {
          console.warn(`⚠️ Error querying users for ${email}:`, error);
        }
      } catch (userLookupError) {
        console.warn(`⚠️ Error looking up user ${email}:`, userLookupError);
      }
    }
    
    // If no existing users were found, add to pending list
    if (!foundExistingUser) {
      console.log(`📋 No existing users found for capsule ${capsule.id}, adding to pending list`);
      await this.addToPendingCapsules(capsule);
      console.log(`📋 [Achievement] capsule_received tracking deferred until recipient claims capsule`);
      console.log(`📋 Notification for capsule ${capsule.id} will be created when recipient claims it`);
    }
  }

  // Extract all recipient emails from capsule recipients array
  private static extractRecipientEmails(capsule: TimeCapsule): string[] {
    const recipientEmails: string[] = [];
    
    if (capsule.recipients && Array.isArray(capsule.recipients)) {
      for (const recipient of capsule.recipients) {
        let email: string | null = null;
        
        if (typeof recipient === 'string' && recipient.includes('@')) {
          email = recipient.toLowerCase().trim();
        } else if (typeof recipient === 'object' && recipient !== null) {
          const r = recipient as any;
          const extracted = r.email || r.value || r.contact || r.address;
          if (extracted && typeof extracted === 'string' && extracted.includes('@')) {
            email = extracted.toLowerCase().trim();
          }
        }
        
        if (email && !recipientEmails.includes(email)) {
          recipientEmails.push(email);
        }
      }
    }
    
    return recipientEmails;
  }

  // Add capsule to existing user's received list
  private static async addToExistingUserReceived(capsule: TimeCapsule, user: any, email: string) {
    const receivedKey = `user_received:${user.id}`;
    const receivedList = await kv.get(receivedKey) || [];
    
    if (!receivedList.includes(capsule.id)) {
      receivedList.push(capsule.id);
      await kv.set(receivedKey, receivedList);
      console.log(`✅ 🎯 IMMEDIATELY added capsule ${capsule.id} to existing user ${user.id}'s (${email}) received list`);
      
      // Get sender name for notification
      let senderName = 'Someone Special';
      try {
        const senderProfile = await kv.get(`profile:${capsule.created_by}`);
        if (senderProfile) {
          senderName = senderProfile.display_name || 
                     `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || 
                     'Someone Special';
        }
      } catch (profileError) {
        console.warn(`⚠️ Could not load sender profile:`, profileError);
      }
      
      // Create notification
      await this.createReceivedNotification(user.id, capsule, senderName);
      
      // Track achievement
      try {
        console.log(`🎯 [Achievement] Tracking capsule_received for existing user ${user.id}`);
        await checkAndUnlockAchievements(user.id, 'capsule_received', {
          capsuleId: capsule.id,
          deliveryType: 'received',
          deliveredAt: new Date().toISOString()
        });
        console.log(`✅ [Achievement] Successfully tracked capsule_received for existing user`);
      } catch (achievementError) {
        console.error(`❌ [Achievement] Failed to track capsule_received:`, achievementError);
      }
    } else {
      console.log(`ℹ️ Capsule ${capsule.id} already in user ${user.id}'s received list`);
    }
  }

  // Helper function to create received notification (centralized for both self and others delivery)
  private static async createReceivedNotification(userId: string, capsule: TimeCapsule, senderName: string) {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        type: 'received_capsule',
        capsuleId: capsule.id,
        capsuleTitle: capsule.title || 'Untitled Capsule',
        senderName: senderName,
        message: senderName === 'You (Past Self)' 
          ? `Your time capsule "${capsule.title || 'Untitled Capsule'}" has been delivered!`
          : `${senderName} sent you a time capsule: "${capsule.title || 'Untitled Capsule'}"`,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Add to user's notifications array (using single array system)
      const notificationsKey = `notifications:${userId}`;
      const notifications = await kv.get(notificationsKey) || [];
      notifications.unshift(notification); // Add to front
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await kv.set(notificationsKey, notifications);
      console.log(`🔔 Created "received_capsule" notification for user ${userId}`);
    } catch (notifError) {
      console.error(`❌ Failed to create notification:`, notifError);
      // Don't let notification failure block delivery
    }
  }
