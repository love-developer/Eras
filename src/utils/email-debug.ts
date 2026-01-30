// Email Delivery Debug Utilities
// Run these from browser console to debug email delivery

import { projectId, publicAnonKey } from './supabase/info';

// Check the last delivered capsule and see if email was sent
export async function checkLastDelivery() {
  console.log('🔍 Checking last delivery...');
  
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/test/last-delivery-logs`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    console.log('📊 Last Delivery Result:', data);
    
    if (data.latestDeliveredCapsule) {
      console.log('✅ Last delivered capsule found:');
      console.log('   ID:', data.latestDeliveredCapsule.id);
      console.log('   Title:', data.latestDeliveredCapsule.title);
      console.log('   Delivered At:', data.latestDeliveredCapsule.delivered_at);
      console.log('   Attempts:', data.latestDeliveredCapsule.delivery_attempts);
      console.log('   Type:', data.latestDeliveredCapsule.recipient_type);
      
      if (data.latestDeliveredCapsule.delivery_error) {
        console.error('❌ Delivery Error:', data.latestDeliveredCapsule.delivery_error);
      }
      
      console.log('\n💡 Now check your Supabase Edge Function logs:');
      console.log('   1. Go to Supabase Dashboard');
      console.log('   2. Navigate to Edge Functions');
      console.log('   3. Click on "make-server-f9be53a7" function');
      console.log('   4. View Logs');
      console.log('   5. Look for logs with [EMAIL SERVICE] or [DELIVERY-SERVICE]');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error checking last delivery:', error);
    throw error;
  }
}

// Manually trigger delivery check
export async function triggerDelivery() {
  console.log('🚀 Triggering manual delivery check...');
  
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/trigger-delivery`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    console.log('📨 Delivery Result:', data);
    
    if (data.success) {
      console.log(`✅ Delivery check complete:`);
      console.log(`   Processed: ${data.processed}`);
      console.log(`   Successful: ${data.successful}`);
      console.log(`   Failed: ${data.failed}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error triggering delivery:', error);
    throw error;
  }
}

// Make functions available globally in console
if (typeof window !== 'undefined') {
  (window as any).emailDebug = {
    checkLastDelivery,
    triggerDelivery,
  };
  console.log('📧 Email debug tools loaded. Use:');
  console.log('   emailDebug.checkLastDelivery() - Check last delivered capsule');
  console.log('   emailDebug.triggerDelivery() - Manually trigger delivery check');
}
