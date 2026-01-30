/**
 * 🔧 Supabase Bucket Size Limit Instructions
 * 
 * Shows clear instructions when user hits bucket size limits
 */

import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

interface BucketSizeLimitErrorProps {
  fileSizeMB: number;
  onClose: () => void;
}

export function BucketSizeLimitError({ fileSizeMB, onClose }: BucketSizeLimitErrorProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">Storage Bucket Size Limit Exceeded</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Your file (<strong>{fileSizeMB.toFixed(0)}MB</strong>) exceeds the Supabase Storage bucket size limit.
        </p>
        
        <div className="bg-black/20 p-3 rounded-lg space-y-2 text-sm">
          <p className="font-semibold">To fix this:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to your Supabase Dashboard → Storage</li>
            <li>Click on the <code className="bg-black/30 px-1 rounded">make-f9be53a7-media</code> bucket</li>
            <li>Click Settings (gear icon in top right)</li>
            <li>Under "File size limit", increase to <strong>500MB</strong> or higher</li>
            <li>Click <strong>Save</strong></li>
            <li>Return here and try uploading again</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.open('https://supabase.com/dashboard/project/_/storage/buckets', '_blank');
            }}
            className="gap-2"
          >
            Open Supabase Dashboard
            <ExternalLink className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            I'll do it later
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
