import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function EmailDebugPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastDeliveryInfo, setLastDeliveryInfo] = useState<any>(null);

  const checkLastDelivery = async () => {
    setIsChecking(true);
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
      console.log('📊 Last Delivery Info:', data);
      setLastDeliveryInfo(data);

      if (data.success) {
        toast.success('Check browser console for detailed delivery info');
      } else {
        toast.error(data.message || 'Failed to fetch delivery logs');
      }
    } catch (error) {
      console.error('Error fetching last delivery:', error);
      toast.error('Failed to fetch delivery logs');
    } finally {
      setIsChecking(false);
    }
  };

  const manualTriggerDelivery = async () => {
    setIsChecking(true);
    try {
      toast.info('Triggering manual delivery check...');
      
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
      console.log('📨 Manual Delivery Result:', data);

      if (data.success) {
        toast.success(`Delivery check complete: ${data.processed} processed, ${data.successful} successful, ${data.failed} failed`);
      } else {
        toast.error('Delivery check failed');
      }
    } catch (error) {
      console.error('Error triggering delivery:', error);
      toast.error('Failed to trigger delivery');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">📧 Email Delivery Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={checkLastDelivery}
            disabled={isChecking}
            variant="outline"
            className="w-full"
          >
            {isChecking ? 'Checking...' : '🔍 Check Last Delivery'}
          </Button>
          
          <Button
            onClick={manualTriggerDelivery}
            disabled={isChecking}
            variant="outline"
            className="w-full"
          >
            {isChecking ? 'Processing...' : '🚀 Trigger Manual Delivery'}
          </Button>
        </div>

        {lastDeliveryInfo && (
          <div className="mt-4 p-4 bg-slate-800 rounded text-xs text-white space-y-2">
            <div className="font-bold text-green-400">Last Delivered Capsule:</div>
            {lastDeliveryInfo.latestDeliveredCapsule ? (
              <>
                <div><span className="text-gray-400">ID:</span> {lastDeliveryInfo.latestDeliveredCapsule.id}</div>
                <div><span className="text-gray-400">Title:</span> {lastDeliveryInfo.latestDeliveredCapsule.title}</div>
                <div><span className="text-gray-400">Status:</span> {lastDeliveryInfo.latestDeliveredCapsule.status}</div>
                <div><span className="text-gray-400">Delivered At:</span> {lastDeliveryInfo.latestDeliveredCapsule.delivered_at}</div>
                <div><span className="text-gray-400">Delivery Attempts:</span> {lastDeliveryInfo.latestDeliveredCapsule.delivery_attempts}</div>
                <div><span className="text-gray-400">Type:</span> {lastDeliveryInfo.latestDeliveredCapsule.recipient_type}</div>
                {lastDeliveryInfo.latestDeliveredCapsule.delivery_error && (
                  <div className="text-red-400">
                    <span className="text-gray-400">Error:</span> {lastDeliveryInfo.latestDeliveredCapsule.delivery_error}
                  </div>
                )}
              </>
            ) : (
              <div className="text-yellow-400">{lastDeliveryInfo.message}</div>
            )}
            <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-gray-400">
              💡 Check your browser console and Supabase Function logs for detailed email delivery flow
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-4 p-3 bg-slate-800 rounded">
          <div className="font-bold text-white mb-2">How to debug:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Check Last Delivery" to see info about the most recent delivered capsule</li>
            <li>Check your browser console for detailed logs</li>
            <li>Go to Supabase Dashboard → Edge Functions → Logs to see server-side email delivery logs</li>
            <li>Look for logs starting with [EMAIL SERVICE] or [DELIVERY-SERVICE]</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
