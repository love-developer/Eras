import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  Share2, 
  Link2, 
  Users, 
  Mail, 
  Copy, 
  CheckCircle, 
  X, 
  Plus, 
  Calendar as CalendarIcon,
  Eye,
  Download,
  Upload,
  Clock,
  Shield,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { useIsMobile } from './ui/use-mobile';

interface FolderSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  currentShares?: any[];
  onSharesUpdate: () => void;
}

const PERMISSION_LEVELS = [
  {
    value: 'view-only',
    label: 'View Only',
    icon: Eye,
    description: 'Can view media but cannot download or contribute',
    color: 'text-blue-500'
  },
  {
    value: 'download-allowed',
    label: 'View & Download',
    icon: Download,
    description: 'Can view and download media',
    color: 'text-purple-500'
  },
  {
    value: 'contribute',
    label: 'Contribute',
    icon: Upload,
    description: 'Can view, download, and add media to the folder',
    color: 'text-green-500'
  }
];

const EXPIRATION_PRESETS = [
  { label: '24 hours', value: addDays(new Date(), 1) },
  { label: '1 week', value: addWeeks(new Date(), 1) },
  { label: '1 month', value: addMonths(new Date(), 1) },
  { label: '3 months', value: addMonths(new Date(), 3) },
  { label: 'Never', value: null }
];

export function FolderSharingDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  currentShares = [],
  onSharesUpdate
}: FolderSharingDialogProps) {
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [recipients, setRecipients] = useState([{ email: '', permission: 'view-only' }]);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeShares, setActiveShares] = useState<any[]>([]);
  const isMobile = useIsMobile();

  // Load existing shares when dialog opens
  useEffect(() => {
    if (open) {
      loadShares();
    }
  }, [open, folderId]);

  const loadShares = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'get_shares',
            folderId
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActiveShares(data.shares || []);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const generateShareLink = async () => {
    try {
      setIsGeneratingLink(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'create_share_link',
            folderId,
            permission: 'view-only',
            expiresAt: expirationDate?.toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      const link = `${window.location.origin}/shared/${data.shareToken}`;
      setShareLink(link);
      toast.success('Share link generated!');
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { email: '', permission: 'view-only' }]);
  };

  const updateRecipient = (index: number, field: string, value: string) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const sendInvitations = async () => {
    try {
      setIsSending(true);
      
      // Validate recipients
      const validRecipients = recipients.filter(r => r.email.trim() && r.email.includes('@'));
      
      if (validRecipients.length === 0) {
        toast.error('Please add at least one valid email address');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'share_with_recipients',
            folderId,
            folderName,
            recipients: validRecipients,
            expiresAt: expirationDate?.toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send invitations');
      }

      toast.success(`Shared folder with ${validRecipients.length} recipient(s)`);
      
      // Reset form
      setRecipients([{ email: '', permission: 'view-only' }]);
      setExpirationDate(null);
      
      // Reload shares
      await loadShares();
      onSharesUpdate();
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error('Failed to send invitations');
    } finally {
      setIsSending(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'revoke_share',
            folderId,
            shareId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to revoke share');
      }

      toast.success('Share access revoked');
      await loadShares();
      onSharesUpdate();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Failed to revoke share');
    }
  };

  const content = (
    <Tabs defaultValue="link" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="link" className="gap-2">
          <Link2 className="w-4 h-4" />
          Link
        </TabsTrigger>
        <TabsTrigger value="recipients" className="gap-2">
          <Mail className="w-4 h-4" />
          Recipients
        </TabsTrigger>
        <TabsTrigger value="manage" className="gap-2">
          <Shield className="w-4 h-4" />
          Manage
        </TabsTrigger>
      </TabsList>

      {/* Share Link Tab */}
      <TabsContent value="link" className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link2 className="w-4 h-4" />
            <p>Generate a secure link to share this folder</p>
          </div>

          {/* Expiration Date Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Link Expiration</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPIRATION_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant={expirationDate?.getTime() === preset.value?.getTime() || (!expirationDate && !preset.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpirationDate(preset.value)}
                  className="h-9"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            {/* Custom Date Picker */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {expirationDate && !EXPIRATION_PRESETS.some(p => p.value?.getTime() === expirationDate.getTime())
                    ? format(expirationDate, 'PPP')
                    : 'Custom date...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={(date) => {
                    setExpirationDate(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={generateShareLink}
            disabled={isGeneratingLink}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
          >
            {isGeneratingLink ? (
              <>Generating...</>
            ) : shareLink ? (
              <>Regenerate Link</>
            ) : (
              <>Generate Share Link</>
            )}
          </Button>

          {shareLink && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Share Link</p>
                  <p className="text-sm font-mono truncate">{shareLink}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyShareLink}
                  className="flex-shrink-0"
                >
                  {copiedLink ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {expirationDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Expires {format(expirationDate, 'PPP')}
                </div>
              )}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Recipients Tab */}
      <TabsContent value="recipients" className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <p>Share folder with specific people</p>
          </div>

          {/* Recipients List */}
          <div className="space-y-2">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="recipient@email.com"
                  value={recipient.email}
                  onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={recipient.permission}
                  onValueChange={(value) => updateRecipient(index, 'permission', value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <level.icon className={`w-3 h-3 ${level.color}`} />
                          <span className="text-sm">{level.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {recipients.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => removeRecipient(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addRecipient}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Recipient
          </Button>

          {/* Permission Level Info */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium mb-2">Permission Levels:</p>
            {PERMISSION_LEVELS.map((level) => (
              <div key={level.value} className="flex items-start gap-2">
                <level.icon className={`w-3 h-3 mt-0.5 ${level.color}`} />
                <div>
                  <p className="text-xs font-medium">{level.label}</p>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={sendInvitations}
            disabled={isSending}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
          >
            {isSending ? 'Sending...' : 'Send Invitations'}
          </Button>
        </div>
      </TabsContent>

      {/* Manage Tab */}
      <TabsContent value="manage" className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <p>Manage active shares and permissions</p>
          </div>

          {activeShares.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Share2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active shares</p>
              <p className="text-xs mt-1">Share this folder using the Link or Recipients tab</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeShares.map((share) => (
                <div key={share.id} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{share.recipientEmail || 'Link share'}</p>
                        <Badge variant="outline" className="text-xs">
                          {share.permission}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {share.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires {format(new Date(share.expiresAt), 'PP')}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          Shared {format(new Date(share.createdAt), 'PP')}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => revokeShare(share.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-t border-purple-500/20"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl bg-gradient-to-r from-white via-purple-100 to-fuchsia-100 bg-clip-text text-transparent">
              Share "{folderName}"
            </SheetTitle>
            <SheetDescription className="text-slate-300">
              Control access and permissions for this folder
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-purple-500/20 shadow-2xl shadow-purple-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl bg-gradient-to-r from-white via-purple-100 to-fuchsia-100 bg-clip-text text-transparent flex items-center gap-2">
              <Share2 className="w-6 h-6 text-purple-400" />
              Share "{folderName}"
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Control access and permissions for this folder
            </DialogDescription>
          </DialogHeader>
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
