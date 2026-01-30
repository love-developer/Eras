import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * ONE-TIME CLEANUP UTILITY
 * 
 * This component removes the old "hidden capsules" system.
 * Run this once, then you can delete this file.
 * 
 * After running this cleanup:
 * 1. All user_hidden lists will be permanently deleted
 * 2. Capsules will be truly deleted instead of hidden
 * 3. You can safely delete this CleanupHiddenCapsules.tsx file
 */
export function CleanupHiddenCapsules() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runCleanup = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      console.log('🧹 Running cleanup of hidden capsules lists...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/cleanup/hidden-lists`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Cleanup failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Cleanup result:', data);
      
      setResult(data);
      toast.success(`Successfully removed ${data.removed} hidden lists!`);
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      toast.error(`Cleanup failed: ${error.message}`);
      setResult({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Cleanup Hidden Capsules
        </CardTitle>
        <CardDescription>
          One-time cleanup to remove the old "hidden capsules" system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-2">What this does:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Removes all "user_hidden" lists from the database</li>
                <li>Ensures deleted capsules are truly deleted going forward</li>
                <li>This is a one-time migration - safe to run multiple times</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={runCleanup}
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? 'Running Cleanup...' : 'Run Cleanup Now'}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.error 
              ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-start gap-3">
              {result.error ? (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              )}
              <div className={`text-sm ${
                result.error 
                  ? 'text-red-700 dark:text-red-300' 
                  : 'text-green-700 dark:text-green-300'
              }`}>
                {result.error ? (
                  <>
                    <p className="font-medium mb-1">Cleanup Failed</p>
                    <p>{result.error}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium mb-1">Cleanup Complete!</p>
                    <p>{result.message}</p>
                    <p className="mt-2 text-xs opacity-75">
                      You can now safely delete the CleanupHiddenCapsules.tsx file.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
