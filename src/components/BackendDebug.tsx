import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { DatabaseService } from '../utils/supabase/database';
import { toast } from 'sonner@2.0.3';

export function BackendDebug() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResults, setConnectionResults] = useState(null);
  const [lastTestTime, setLastTestTime] = useState(null);

  const testBackendConnection = async () => {
    setIsTestingConnection(true);
    try {
      console.log('🔍 Running backend connection test...');
      const results = await DatabaseService.testConnection();
      setConnectionResults(results);
      setLastTestTime(new Date().toISOString());
      toast.success('Backend connection test completed');
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      setConnectionResults({
        status: 'error',
        error: error.message,
        health: null,
        environment: null,
        database: null
      });
      setLastTestTime(new Date().toISOString());
      toast.error(`Connection test failed: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testSimpleHealth = async () => {
    try {
      const health = await DatabaseService.checkBackendHealth();
      toast.success(`Backend is healthy: ${health.service}`);
    } catch (error) {
      toast.error(`Backend health check failed: ${error.message}`);
    }
  };

  const renderStatus = (status, label) => {
    if (status === null || status === undefined) {
      return <Badge variant="secondary">Unknown</Badge>;
    }
    if (status === true || status === 'ok') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>;
    }
    if (status === false || status === 'error') {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const renderEnvironmentStatus = (env) => {
    if (!env) return null;
    
    const missingCount = env.missing?.length || 0;
    const totalCount = Object.keys(env.environment || {}).length;
    const presentCount = totalCount - missingCount;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Environment Variables</span>
          <span className="text-xs text-muted-foreground">
            {presentCount}/{totalCount} present
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(env.environment || {}).map(([key, present]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="font-mono">{key}</span>
              {present ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </div>
          ))}
        </div>
        
        {env.missing && env.missing.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-red-600">Missing: {env.missing.join(', ')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Backend Debug Console
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test and diagnose backend connectivity issues
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testBackendConnection}
            disabled={isTestingConnection}
            className="flex items-center gap-2"
          >
            {isTestingConnection ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Full Connection Test
          </Button>
          
          <Button 
            variant="outline"
            onClick={testSimpleHealth}
            disabled={isTestingConnection}
          >
            Quick Health Check
          </Button>
        </div>

        {lastTestTime && (
          <p className="text-xs text-muted-foreground">
            Last test: {new Date(lastTestTime).toLocaleString()}
          </p>
        )}

        {connectionResults && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Status</span>
                {renderStatus(connectionResults.status, 'Overall')}
              </div>

              {connectionResults.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Error:</strong> {connectionResults.error}
                  </p>
                </div>
              )}

              {connectionResults.health && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Server Health</span>
                    {renderStatus(connectionResults.health.status, 'Health')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Service: {connectionResults.health.service || 'Unknown'}
                  </p>
                </div>
              )}

              {connectionResults.environment && renderEnvironmentStatus(connectionResults.environment)}

              {connectionResults.database && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Database Connection</span>
                    {renderStatus(connectionResults.database.status, 'Database')}
                  </div>
                  {connectionResults.database.error && (
                    <p className="text-xs text-red-600">
                      {connectionResults.database.error.message || connectionResults.database.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>502 Bad Gateway:</strong> Usually indicates server startup issues or missing environment variables</p>
          <p><strong>Quick fixes:</strong> Check environment variables, restart the server, or wait for auto-recovery</p>
        </div>
      </CardContent>
    </Card>
  );
}