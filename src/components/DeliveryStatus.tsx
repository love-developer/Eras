import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Zap,
  TrendingUp,
  AlertTriangle,
  Activity,
  Shield,
  RotateCcw,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns@4.1.0';
import { DatabaseService } from '../utils/supabase/database';
import { projectId } from '../utils/supabase/info';
import { getUserTimeZone, getTimeZoneAbbreviation } from '../utils/timezone';

interface DeliveryStats {
  processed: number;
  successful: number;
  failed: number;
}

interface DeliveryHealth {
  status: string;
  delivery_system: string;
  timestamp: string;
  services: {
    email: boolean;
  };
}

export function DeliveryStatus() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessResult, setLastProcessResult] = useState<DeliveryStats | null>(null);
  const [deliveryHealth, setDeliveryHealth] = useState<DeliveryHealth | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  useEffect(() => {
    checkDeliveryHealth();
    // Check health every 30 seconds
    const interval = setInterval(() => {
      checkDeliveryHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkDeliveryHealth = async () => {
    try {
      const response = await DatabaseService.makeRequest('/api/health/delivery');
      setDeliveryHealth(response);
    } catch (error) {
      console.error('Health check failed:', error);
      setDeliveryHealth({
        status: 'error',
        delivery_system: 'offline',
        timestamp: new Date().toISOString(),
        services: { email: false }
      });
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const manualProcessDeliveries = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('📨 Manual delivery processing triggered');
      const result = await DatabaseService.makeRequest('/api/delivery/process', {
        method: 'POST'
      });
      
      if (result.success) {
        setLastProcessResult({
          processed: result.processed || 0,
          successful: result.successful || 0,
          failed: result.failed || 0
        });
        
        toast.success(`✅ Delivery processing complete: ${result.processed || 0} processed, ${result.successful || 0} successful, ${result.failed || 0} failed`);
        console.log('Manual processing result:', result);
      } else {
        toast.error('Delivery processing failed');
        console.error('Manual processing failed:', result);
      }
    } catch (error) {
      toast.error('Failed to process deliveries');
      console.error('Manual processing error:', error);
    } finally {
      setIsProcessing(false);
      // Refresh health status
      await checkDeliveryHealth();
    }
  };

  const testEmailDelivery = async () => {
    const email = prompt('Enter your email address for testing:');
    if (!email) return;

    console.log('🧪 Testing email delivery to:', email);

    try {
      const response = await DatabaseService.makeRequest('/api/test/email', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (response.success) {
        toast.success('✅ Test email sent successfully!');
        console.log('Test email successful:', response);
      } else {
        toast.error(`❌ Test email failed: ${response.error}`);
        console.error('Test email failed:', response);
      }
    } catch (error) {
      toast.error('Test email request failed');
      console.error('Test email error:', error);
    }
  };

  const checkAPIKey = async () => {
    console.log('🔑 Checking API key status...');
    toast.info('🔍 Checking API key...');

    try {
      const response = await DatabaseService.makeRequest('/api/test/env');
      
      console.log('🔑 API Key Check Results:', response);
      
      if (response.apiKeyValid) {
        toast.success(`✅ API Key is valid! Preview: ${response.apiKeyPreview}`);
      } else if (response.apiKeyExists) {
        toast.error(`❌ API Key exists but is invalid! Preview: ${response.apiKeyPreview}`);
        if (response.instructions) {
          toast.info('💡 Please update your RESEND_API_KEY in Supabase environment variables');
        }
      } else {
        toast.error('❌ No RESEND_API_KEY found in environment variables');
        toast.info('💡 Please add RESEND_API_KEY to your Supabase environment variables');
      }
      
      // Show detailed info in console
      console.log('📋 Detailed API Key Status:', {
        exists: response.apiKeyExists,
        valid: response.apiKeyValid,
        length: response.apiKeyLength,
        startsWithRe: response.apiKeyStartsWithRe,
        preview: response.apiKeyPreview,
        error: response.resendError
      });
      
    } catch (error) {
      toast.error('Failed to check API key');
      console.error('API key check error:', error);
    }
  };

  const directAPITest = async () => {
    const email = prompt('Enter your email address:');
    if (!email) {
      toast.error('Email is required for testing');
      return;
    }

    const apiKey = prompt('Enter your Resend API key (starts with re_):');
    if (!apiKey) {
      toast.error('API key is required for testing');
      return;
    }

    if (!apiKey.startsWith('re_')) {
      toast.error('Invalid API key format. Must start with "re_"');
      return;
    }

    console.log('🧪 Direct API test starting...');
    console.log('📧 Email:', email);
    console.log('🔑 API Key Preview:', `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    
    toast.info('🧪 Testing API key directly...');

    try {
      const response = await DatabaseService.makeRequest('/api/test/email-direct', {
        method: 'POST',
        body: JSON.stringify({ email, apiKey })
      });

      if (response.success) {
        toast.success('✅ Direct API test successful! Check your email.');
        toast.info('💡 Your API key is working. Now update it in Supabase environment variables.');
        console.log('✅ Direct API test successful:', response);
      } else {
        toast.error(`❌ Direct API test failed: ${response.error}`);
        console.error('❌ Direct API test failed:', response);
      }
    } catch (error) {
      toast.error('Direct API test request failed');
      console.error('💥 Direct API test error:', error);
    }
  };

  const debugImmediateDelivery = async () => {
    console.log('🔍 Debug: Checking immediate delivery system...');
    toast.info('🔍 Debugging immediate delivery...');

    try {
      const response = await DatabaseService.makeRequest('/api/debug/delivery', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'debug@test.com',
          immediate: true 
        })
      });

      console.log('🔍 Immediate delivery debug result:', response);

      if (response.success) {
        toast.success(`✅ Debug complete! Found ${response.dueCapsules} due capsules`);
        console.log('Debug details:', response);
        
        if (response.dueCapsules === 0) {
          toast.info('📦 No capsules are currently due for delivery');
        }
        
        if (response.apiKeyStatus === 'invalid') {
          toast.warning('🔑 API key issue detected');
        }
        
        if (response.deliveryAttempts > 0) {
          toast.info(`📊 Found ${response.deliveryAttempts} recent delivery attempts`);
        }
      } else {
        toast.error(`❌ Debug failed: ${response.error}`);
        console.error('Debug failed:', response);
      }
    } catch (error) {
      toast.error('Debug request failed');
      console.error('💥 Debug error:', error);
    }
  };

  const quickFixEmailIssue = async () => {
    console.log('🚨 Quick Fix: Diagnosing email delivery issue...');
    toast.info('🔍 Diagnosing email system...');
    
    setIsProcessing(true);
    try {
      // Step 1: Skip delivery enabling (emergency stop removed)
      
      // Step 2: Check API key
      console.log('🔑 Step 2: Checking API key...');
      const response = await DatabaseService.makeRequest('/api/test/environment', {
        method: 'GET'
      });
      
      console.log('📋 API key status:', response);
      
      if (!response.apiKey?.valid) {
        toast.error('❌ ROOT CAUSE: Invalid or missing Resend API key');
        toast.info('💡 SOLUTION: Use "Direct API Test" to enter a valid key');
        console.error('❌ API key issue detected:', response.apiKey);
        return;
      }
      
      // Step 3: Test email
      console.log('📧 Step 3: Testing email delivery...');
      const email = prompt('Enter your email to test the fix:');
      if (!email) return;
      
      const testResponse = await DatabaseService.makeRequest('/api/test/email', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      if (testResponse.success) {
        toast.success('✅ FIXED! Email system is now working!');
        console.log('✅ Email delivery fixed successfully');
        
        // Auto-test immediate delivery
        console.log('🚀 Testing immediate capsule delivery...');
        await debugImmediateDelivery();
      } else {
        toast.error('❌ Email test still failing');
        console.error('❌ Email test failed:', testResponse);
      }
      
    } catch (error) {
      toast.error('❌ Quick fix failed');
      console.error('💥 Quick fix error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getHealthStatusBadge = (status: string) => {
    if (isLoadingHealth) {
      return <Badge variant="outline">Loading...</Badge>;
    }
    
    switch (status) {
      case 'ok':
      case 'operational':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Operational</Badge>;
      default:
        return <Badge variant="destructive">Offline</Badge>;
    }
  };

  const getServiceStatusBadge = (isConfigured: boolean, serviceName: string) => {
    if (isLoadingHealth) {
      return <Badge variant="outline">Loading...</Badge>;
    }
    
    if (isConfigured) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Ready</Badge>;
    } else {
      return <Badge variant="destructive">Not Configured</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Delivery System Controls
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={testEmailDelivery}
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <Mail className="w-4 h-4" />
                Test Email
              </Button>
              
              <Button 
                onClick={checkAPIKey}
                variant="outline"
                className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200"
              >
                <CheckCircle className="w-4 h-4" />
                Check API Key
              </Button>
              
              <Button 
                onClick={quickFixEmailIssue}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                variant="outline"
              >
                <AlertTriangle className="w-4 h-4" />
                {isProcessing ? 'Fixing...' : '🚨 FIX EMAIL NOW'}
              </Button>
              
              <Button 
                onClick={directAPITest}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                variant="outline"
              >
                <Zap className="w-4 h-4" />
                💡 ENTER VALID API KEY
              </Button>
              
              <Button 
                onClick={manualProcessDeliveries}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Processing...' : 'Process Now'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Delivery System</span>
                {getHealthStatusBadge(deliveryHealth?.delivery_system || 'unknown')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                {getHealthStatusBadge(deliveryHealth?.status || 'unknown')}
              </div>
              {deliveryHealth?.timestamp && (
                <p className="text-xs text-muted-foreground">
                  Last checked: {deliveryHealth.timestamp && !isNaN(new Date(deliveryHealth.timestamp).getTime())
                    ? format(new Date(deliveryHealth.timestamp), 'MMM d, yyyy h:mm a')
                    : 'Unknown time'
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Email Service</span>
                </div>
                {getServiceStatusBadge(deliveryHealth?.services?.email || false, 'Email')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={debugImmediateDelivery}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Debug Immediate Delivery
              </Button>
              <Button 
                onClick={checkDeliveryHealth}
                variant="outline"
                className="w-full flex items-center gap-2"
                disabled={isLoadingHealth}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingHealth ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Statistics */}
      {lastProcessResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Last Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{lastProcessResult.processed}</div>
                <p className="text-sm text-muted-foreground">Total Processed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{lastProcessResult.successful}</div>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{lastProcessResult.failed}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            How Delivery Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Scheduled Processing</h4>
                <p className="text-sm text-muted-foreground">
                  The system automatically checks for due capsules every 15 minutes and processes them in the background.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Email Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Time capsules are delivered via email using the Resend service. Recipients get a secure viewing link.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Reliable Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Failed deliveries are automatically retried with exponential backoff. You can also trigger manual processing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}