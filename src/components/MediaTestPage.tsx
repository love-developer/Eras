import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { FileUploadTest } from './FileUploadTest';
import { DraggableMediaList } from './DraggableMediaList';
import { MediaPreview } from './MediaPreview';
import { BackendDebug } from './BackendDebug';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function MediaTestPage() {
  const [envDebugData, setEnvDebugData] = useState<any>(null);
  const [isCheckingEnv, setIsCheckingEnv] = useState(false);

  const checkEnvironmentVariables = async () => {
    setIsCheckingEnv(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/debug/env`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnvDebugData(data);
      } else {
        console.error('Failed to fetch environment variables');
        setEnvDebugData({ error: 'Failed to fetch' });
      }
    } catch (error) {
      console.error('Error checking environment variables:', error);
      setEnvDebugData({ error: error.message });
    }
    setIsCheckingEnv(false);
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Test various system features including media upload and backend integrations.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="media" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="media">Media Tests</TabsTrigger>
          <TabsTrigger value="debug">Backend Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload Test */}
            <div>
              <h3 className="text-lg font-medium mb-4">Upload Test</h3>
              <FileUploadTest />
            </div>

            {/* Media Preview Test */}
            <div>
              <h3 className="text-lg font-medium mb-4">Media Preview Test</h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a file first, then create a time capsule to see media previews.
                  </p>
                  <MediaPreview capsuleId="test_capsule_id" size="md" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Draggable Media List Test */}
          <Card>
            <CardHeader>
              <CardTitle>Drag & Drop Media List Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This will show draggable media files once you upload some files and create a time capsule.
              </p>
              <DraggableMediaList 
                capsuleId="test_capsule_id" 
                allowReorder={true}
                showRemove={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <BackendDebug />
        </TabsContent>
      </Tabs>
    </div>
  );
}