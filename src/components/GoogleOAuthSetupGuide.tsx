import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Circle, ExternalLink, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function GoogleOAuthSetupGuide({ projectRef, supabaseUrl, redirectUri }) {
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const toggleStep = (stepId) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const steps = [
    {
      id: 'google-console',
      title: 'Open Google Cloud Console',
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Open Console
        </Button>
      )
    },
    {
      id: 'create-project',
      title: 'Create or Select Project',
      description: 'Create a new project or select an existing one'
    },
    {
      id: 'enable-apis',
      title: 'Enable Required APIs',
      description: 'Go to APIs & Services → Library, search and enable "Google+ API"'
    },
    {
      id: 'oauth-consent',
      title: 'Configure OAuth Consent Screen',
      description: 'APIs & Services → OAuth consent screen → External → Fill required fields'
    },
    {
      id: 'create-credentials',
      title: 'Create OAuth 2.0 Credentials',
      description: 'APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID → Web application'
    },
    {
      id: 'javascript-origins',
      title: 'Add JavaScript Origins',
      description: 'In the credential form, add this URL to Authorized JavaScript origins:',
      copyable: supabaseUrl,
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => copyToClipboard(supabaseUrl)}
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy URL
        </Button>
      )
    },
    {
      id: 'redirect-uris',
      title: 'Add Redirect URIs',
      description: 'Add this URL to Authorized redirect URIs:',
      copyable: redirectUri,
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => copyToClipboard(redirectUri)}
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy URI
        </Button>
      )
    },
    {
      id: 'save-credentials',
      title: 'Save & Copy Credentials',
      description: 'Click Create, then copy the Client ID and Client Secret'
    },
    {
      id: 'supabase-dashboard',
      title: 'Open Supabase Dashboard',
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Open Dashboard
        </Button>
      )
    },
    {
      id: 'enable-google-provider',
      title: 'Enable Google Provider',
      description: 'Go to Authentication → Providers → find Google → toggle it ON'
    },
    {
      id: 'paste-credentials',
      title: 'Paste Google Credentials',
      description: 'Enter your Client ID and Client Secret from Google Cloud Console'
    },
    {
      id: 'save-supabase',
      title: 'Save Configuration',
      description: 'Click Save in Supabase dashboard'
    }
  ];

  const completionRate = (completedSteps.size / steps.length) * 100;

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔧 Google OAuth Setup Checklist</span>
          <Badge variant={completionRate === 100 ? "default" : "secondary"}>
            {Math.round(completionRate)}% Complete
          </Badge>
        </CardTitle>
        
        {completionRate < 100 && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Complete all steps below to fix the "accounts.google.com refused to connect" error.
            </AlertDescription>
          </Alert>
        )}
        
        {completionRate === 100 && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription className="text-green-700">
              ✅ Setup complete! Try Google sign-in now. It may take 1-2 minutes for changes to take effect.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <button
                onClick={() => toggleStep(step.id)}
                className="mt-1 flex-shrink-0"
              >
                {completedSteps.has(step.id) ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium">
                    {index + 1}. {step.title}
                  </h4>
                  {step.action}
                </div>
                
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
                
                {step.copyable && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm font-mono break-all">
                    {step.copyable}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🎯 Quick Reference - Your Project Details:
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Project Reference:</strong> <code className="bg-white dark:bg-gray-800 px-1 rounded">{projectRef}</code>
            </div>
            <div>
              <strong>Supabase URL:</strong> <code className="bg-white dark:bg-gray-800 px-1 rounded">{supabaseUrl}</code>
            </div>
            <div>
              <strong>Redirect URI:</strong> <code className="bg-white dark:bg-gray-800 px-1 rounded">{redirectUri}</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}