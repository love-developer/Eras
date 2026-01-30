import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ServerHealthCheck() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error' | 'idle'>('idle');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timing, setTiming] = useState<number | null>(null);

  const checkHealth = async () => {
    setStatus('checking');
    setError(null);
    setResponse(null);
    setTiming(null);

    const startTime = Date.now();

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/health`;
      
      console.log('🔍 Testing health endpoint:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const endTime = Date.now();
      setTiming(endTime - startTime);

      if (res.ok) {
        const data = await res.json();
        setResponse(data);
        setStatus('ok');
        console.log('✅ Server is healthy:', data);
      } else {
        const text = await res.text();
        setError(`HTTP ${res.status}: ${text}`);
        setStatus('error');
        console.error('❌ Server returned error:', res.status, text);
      }
    } catch (err: any) {
      const endTime = Date.now();
      setTiming(endTime - startTime);
      
      if (err.name === 'AbortError') {
        setError('Request timed out after 10 seconds - Server is not responding');
      } else if (err.message?.includes('Failed to fetch')) {
        setError('Failed to fetch - Server is down or CORS issue');
      } else {
        setError(err.message || 'Unknown error');
      }
      setStatus('error');
      console.error('❌ Health check failed:', err);
    }
  };

  useEffect(() => {
    // Auto-check on mount
    checkHealth();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🏥 Server Health Check
              {status === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'ok' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
            </CardTitle>
            <CardDescription>
              Testing: make-server-f9be53a7
            </CardDescription>
          </div>
          <Button
            onClick={checkHealth}
            disabled={status === 'checking'}
            size="sm"
          >
            {status === 'checking' ? 'Checking...' : 'Test Again'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          {status === 'checking' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Checking...
            </Badge>
          )}
          {status === 'ok' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ✅ Server is UP
            </Badge>
          )}
          {status === 'error' && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              ❌ Server is DOWN
            </Badge>
          )}
          {status === 'idle' && (
            <Badge variant="outline">
              Waiting...
            </Badge>
          )}
        </div>

        {/* Timing */}
        {timing !== null && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Response Time:</span>
            <Badge variant="secondary">{timing}ms</Badge>
          </div>
        )}

        {/* Success Response */}
        {status === 'ok' && response && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-green-700">✅ Server is Running</div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>✅ Server version: {response.version}</div>
              <div>✅ Environment configured: {response.environment?.hasSupabaseUrl ? 'Yes' : 'No'}</div>
              <div>✅ Service keys present: {response.environment?.hasServiceKey ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}

        {/* Error Response */}
        {status === 'error' && error && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-red-700">❌ Server is Not Responding</div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-2">Possible Causes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Edge Function not deployed to Supabase</li>
                    <li>Edge Function crashed on startup</li>
                    <li>Environment variables missing</li>
                    <li>Network connectivity issue</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
              <div className="text-sm font-semibold text-blue-800">🔧 How to Fix:</div>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Go to Supabase Dashboard → Edge Functions</li>
                <li>Check if "make-server-f9be53a7" exists</li>
                <li>If missing or crashed, redeploy:
                  <code className="block ml-6 mt-1 bg-blue-100 p-1 rounded text-xs">
                    supabase functions deploy make-server-f9be53a7
                  </code>
                </li>
                <li>Check logs for errors</li>
                <li>Verify environment variables are set</li>
              </ol>
            </div>
          </div>
        )}

        {/* Connection Info */}
        <div className="pt-4 border-t space-y-2 text-xs text-gray-500">
          <div>Project ID: <code className="bg-gray-100 px-1 rounded">{projectId}</code></div>
          <div>Endpoint: <code className="bg-gray-100 px-1 rounded break-all">
            https://{projectId}.supabase.co/functions/v1/make-server-f9be53a7/health
          </code></div>
        </div>
      </CardContent>
    </Card>
  );
}
