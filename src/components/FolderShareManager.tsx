/**
 * Folder Share Manager - Create and manage share links
 * 
 * Mobile-first design with bottom sheet on mobile, dialog on desktop
 * 
 * Features:
 * - Generate encrypted share links
 * - View/Download permissions
 * - Expiry options (24h, 7d, never)
 * - Password protection
 * - Active shares management
 * - Copy to clipboard
 * - Revoke functionality
 * - QR Code generation
 * 
 * Phase 5A: Core sharing
 * Phase 5B: Vault integration (future)
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useIsMobile } from './ui/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Share2, Link2, Copy, Trash2, Eye, Download, Lock, 
  Calendar, CheckCircle, AlertCircle, ExternalLink, Loader2, QrCode
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';
import QRCodeLib from 'qrcode';
import { copyToClipboard } from '../utils/clipboard';

interface ShareLink {
  id: string;
  accessLevel: 'view' | 'download';
  expiresAt: number | null;
  createdAt: number;
  viewCount: number;
  passwordHash: string | null;
}

interface Props {
  folderId: string;
  folderName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FolderShareManager({ folderId, folderName, open, onOpenChange }: Props) {
  const isMobile = useIsMobile();
  const { session } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [activeShares, setActiveShares] = useState<ShareLink[]>([]);
  
  // Create link state
  const [accessLevel, setAccessLevel] = useState<'view' | 'download'>('view');
  const [expiryOption, setExpiryOption] = useState<'24h' | '7d' | 'never'>('7d');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);

  // QR Code state
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrCodeShareUrl, setQrCodeShareUrl] = useState<string>('');

  // Load existing shares when dialog opens
  useEffect(() => {
    if (open && session?.access_token) {
      loadShares();
    }
  }, [open, folderId]);

  const loadShares = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/share/folder/${folderId}`,
        {
          headers: {
            'Authorization': `Bearer ${session!.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load shares');
      }

      const data = await response.json();
      setActiveShares(data.shares || []);
    } catch (error: any) {
      console.error('Failed to load shares:', error);
      toast.error('Failed to load share links');
    } finally {
      setLoading(false);
    }
  };

  const createShareLink = async () => {
    try {
      setLoading(true);

      const expiresIn = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        'never': undefined
      }[expiryOption];

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/share/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            folderId,
            accessLevel,
            expiresIn,
            password: usePassword ? password : undefined
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create share link');
      }

      const { shareUrl } = await response.json();

      // Copy to clipboard with fallback
      try {
        await copyToClipboard(shareUrl);
        toast.success('Share link created!', {
          description: 'Link copied to clipboard',
          duration: 3000
        });
      } catch (clipErr) {
        console.error('Clipboard error:', clipErr);
        toast.success('Share link created!', {
          description: `Link: ${shareUrl}`,
          duration: 5000
        });
      }

      // Reload shares
      await loadShares();

      // Reset form
      setPassword('');
      setUsePassword(false);
      setAccessLevel('view');
      setExpiryOption('7d');
    } catch (error: any) {
      console.error('Failed to create share:', error);
      toast.error(error.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const revokeLink = async (shareId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/share/${shareId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke link');
      }

      toast.success('Share link revoked');
      await loadShares();
    } catch (error: any) {
      console.error('Failed to revoke:', error);
      toast.error(error.message || 'Failed to revoke share link');
    }
  };

  const copyLink = async (shareId: string) => {
    const url = `${window.location.origin}/s/${shareId}`;
    try {
      await copyToClipboard(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Clipboard error:', err);
      toast.error('Could not copy to clipboard', {
        description: `Link: ${url}`,
        duration: 5000
      });
    }
  };

  const showQrCode = async (shareId: string) => {
    const url = `${window.location.origin}/s/${shareId}`;
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
      setQrCodeShareUrl(url);
      setQrCodeModalOpen(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.download = `eras-share-qr-${Date.now()}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    toast.success('QR code downloaded!');
  };

  const formatExpiryDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never expires';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  const content = (
    <div className="space-y-6">
      {/* Create New Share */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" />
            Create Share Link
          </CardTitle>
          <CardDescription>
            Share "{folderName}" with others
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Level */}
          <div className="space-y-2">
            <Label>Permission Level</Label>
            <div className="flex gap-2">
              <Button
                variant={accessLevel === 'view' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAccessLevel('view')}
                className="flex-1"
                disabled={loading}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Only
              </Button>
              <Button
                variant={accessLevel === 'download' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAccessLevel('download')}
                className="flex-1"
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label>Expires After</Label>
            <div className="flex gap-2">
              <Button
                variant={expiryOption === '24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExpiryOption('24h')}
                className="flex-1"
                disabled={loading}
              >
                24 Hours
              </Button>
              <Button
                variant={expiryOption === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExpiryOption('7d')}
                className="flex-1"
                disabled={loading}
              >
                7 Days
              </Button>
              <Button
                variant={expiryOption === 'never' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExpiryOption('never')}
                className="flex-1"
                disabled={loading}
              >
                Never
              </Button>
            </div>
          </div>

          {/* Password Protection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-password"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="rounded border-gray-600"
                disabled={loading}
              />
              <Label htmlFor="use-password" className="cursor-pointer">
                Password Protection (Optional)
              </Label>
            </div>
            {usePassword && (
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            )}
          </div>

          <Button 
            onClick={createShareLink} 
            disabled={loading || (usePassword && !password)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Generate Share Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Shares */}
      {activeShares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Share Links ({activeShares.length})</span>
              {activeShares.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {activeShares.reduce((sum, s) => sum + s.viewCount, 0)} total views
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeShares.map((share) => (
              <div
                key={share.id}
                className="p-3 rounded-lg border border-gray-700 bg-gray-800/30 space-y-2 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {share.accessLevel === 'view' ? (
                          <><Eye className="w-3 h-3 mr-1" /> View Only</>
                        ) : (
                          <><Download className="w-3 h-3 mr-1" /> Download</>
                        )}
                      </Badge>
                      {share.passwordHash && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          <Lock className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatExpiryDate(share.expiresAt)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {share.viewCount} {share.viewCount === 1 ? 'view' : 'views'}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(share.id)}
                      title="Copy link"
                      className="hover:bg-green-500/20 hover:text-green-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showQrCode(share.id)}
                      title="Show QR Code"
                      className="hover:bg-purple-500/20 hover:text-purple-400"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to revoke this share link?')) {
                          revokeLink(share.id);
                        }
                      }}
                      title="Revoke link"
                      className="hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {activeShares.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <Share2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No active share links yet</p>
          <p className="text-xs mt-1">Create your first link above</p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Share Folder</SheetTitle>
            </SheetHeader>
            <div className="mt-6">{content}</div>
          </SheetContent>
        </Sheet>

        {/* QR Code Modal - Portal with proper z-index */}
        <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
          <DialogContent className="sm:max-w-md" style={{ zIndex: 10000 }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-400" />
                Share QR Code
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* QR Code Display */}
              <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                )}
              </div>

              {/* URL Display */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={qrCodeShareUrl}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await copyToClipboard(qrCodeShareUrl);
                        toast.success('Link copied!');
                      } catch (err) {
                        console.error('Clipboard error:', err);
                        toast.error('Could not copy to clipboard');
                      }
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={downloadQrCode}
                  className="flex-1"
                  variant="default"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR
                </Button>
                <Button
                  onClick={() => setQrCodeModalOpen(false)}
                  className="flex-1"
                  variant="outline"
                >
                  Close
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Scan this QR code to access the shared folder
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Folder</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal - Portal with proper z-index */}
      <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
        <DialogContent className="sm:max-w-md" style={{ zIndex: 10000 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-400" />
              Share QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="bg-white p-6 rounded-lg flex items-center justify-center">
              {qrCodeDataUrl && (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              )}
            </div>

            {/* URL Display */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={qrCodeShareUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await copyToClipboard(qrCodeShareUrl);
                      toast.success('Link copied!');
                    } catch (err) {
                      console.error('Clipboard error:', err);
                      toast.error('Could not copy to clipboard');
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={downloadQrCode}
                className="flex-1"
                variant="default"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
              <Button
                onClick={() => setQrCodeModalOpen(false)}
                className="flex-1"
                variant="outline"
              >
                Close
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Scan this QR code to access the shared folder
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}