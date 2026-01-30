import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Unlock, FolderOpen, Download, Eye, AlertCircle, Shield, Calendar, Clock, ArrowLeft, Image as ImageIcon, Video, Music, FileText, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BeneficiaryVaultAccessProps {
  accessToken?: string;
  onBack?: () => void;
}

interface VaultFolder {
  id: string;
  name: string;
  icon: string;
  permission: 'view' | 'download';
  itemCount: number;
  items?: VaultItem[];
}

interface VaultItem {
  id: string;
  name: string;
  type: 'image' | 'photo' | 'video' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  size?: number;
  createdAt: string;
}

interface VaultData {
  ownerName: string;
  ownerEmail: string;
  unlockedDate: string;
  expiresAt: string;
  inactivityDays: number;
  personalMessage?: string;
  folders: VaultFolder[];
  totalItems: number;
}

type AccessState = 'loading' | 'unlocked' | 'expired' | 'invalid' | 'error';

export function BeneficiaryVaultAccess({ accessToken, onBack }: BeneficiaryVaultAccessProps) {
  const [state, setState] = useState<AccessState>('loading');
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<VaultFolder | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  useEffect(() => {
    if (accessToken) {
      validateAccessToken(accessToken);
    } else {
      setState('invalid');
      setErrorMessage('No access token provided');
    }
  }, [accessToken]);

  const validateAccessToken = async (token: string) => {
    try {
      setState('loading');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/unlock/validate-full`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`, // ✅ Required for Edge Function access
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setVaultData(data.vaultData);
        setState('unlocked');
        
        // Log access for transparency
        logAccess(token);
      } else if (data.expired) {
        setState('expired');
      } else {
        setState('invalid');
        setErrorMessage(data.error || 'Invalid access token');
      }
    } catch (error) {
      console.error('Access validation error:', error);
      setState('error');
      setErrorMessage('Unable to connect to the server. Please try again later.');
    }
  };

  const logAccess = async (token: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/log-access`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`, // ✅ Required for Edge Function access
          },
          body: JSON.stringify({ 
            token,
            action: 'vault_accessed',
            timestamp: new Date().toISOString()
          }),
        }
      );
    } catch (error) {
      console.error('Access logging error:', error);
      // Don't block user if logging fails
    }
  };

  const loadFolderContents = async (folder: VaultFolder) => {
    // ✅ FIX: Items are now included in the folder data from validate-full
    // No need for separate API call
    console.log('✅ NEW CODE LOADED - Folder has', folder.items?.length || 0, 'items pre-loaded');
    
    if (folder.items && folder.items.length > 0) {
      setSelectedFolder(folder);
      return;
    }
    
    // Fallback: if items aren't pre-loaded, show empty folder  
    console.warn('⚠️ No items found in folder:', folder.name);
    setSelectedFolder({ ...folder, items: [] });
  };

  const handleDownload = async (item: VaultItem) => {
    if (!accessToken) return;

    try {
      // Log download action
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/log-access`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`, // ✅ Required for Edge Function access
          },
          body: JSON.stringify({ 
            token: accessToken,
            action: 'item_downloaded',
            itemId: item.id,
            timestamp: new Date().toISOString()
          }),
        }
      );

      // Trigger download
      const link = document.createElement('a');
      link.href = item.url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case 'view':
        return (
          <div className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
            <Eye className="w-3 h-3" />
            View Only
          </div>
        );
      case 'download':
        return (
          <div className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">
            <Download className="w-3 h-3" />
            Download
          </div>
        );
      default:
        return null;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'photo':
        return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-pink-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-cyan-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
      <h2 className="text-2xl text-white mb-2">Validating Access...</h2>
      <p className="text-slate-400">Please wait while we verify your permissions</p>
    </div>
  );

  const renderExpiredState = () => (
    <div className="text-center py-12">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-orange-500/30 blur-xl" />
        <Lock className="relative w-20 h-20 text-orange-400 mx-auto" />
      </div>
      
      <h2 className="text-3xl text-white mb-4">
        Access Link Expired
      </h2>
      
      <p className="text-slate-300 text-lg mb-8">
        This access link has expired. Access links are valid for 1 year from unlock.
      </p>

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
        <p className="text-orange-200 text-sm mb-4">
          <strong>What to do:</strong>
        </p>
        <p className="text-slate-300 text-sm">
          If you believe this is an error, please contact support@eras.app for assistance.
        </p>
      </div>

      <button
        onClick={() => window.location.href = '/'}
        className="px-8 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all shadow-lg"
      >
        Go to Eras Home
      </button>
    </div>
  );

  const renderInvalidState = () => (
    <div className="text-center py-12">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-red-500/30 blur-xl" />
        <AlertCircle className="relative w-20 h-20 text-red-400 mx-auto" />
      </div>
      
      <h2 className="text-3xl text-white mb-4">
        Invalid Access Link
      </h2>
      
      <p className="text-slate-300 text-lg mb-6">
        {errorMessage || 'This access link is not valid.'}
      </p>

      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
        <p className="text-red-200 text-sm mb-4">
          <strong>Possible reasons:</strong>
        </p>
        <ul className="text-slate-300 text-sm text-left space-y-1">
          <li>• The link is malformed or incomplete</li>
          <li>• The vault access was revoked</li>
          <li>• The account owner cancelled access</li>
          <li>• The link was already used</li>
        </ul>
      </div>

      <button
        onClick={() => window.location.href = '/'}
        className="px-8 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all shadow-lg"
      >
        Go to Eras Home
      </button>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-12">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-red-500/30 blur-xl" />
        <AlertCircle className="relative w-20 h-20 text-red-400 mx-auto" />
      </div>
      
      <h2 className="text-3xl text-white mb-4">
        Connection Error
      </h2>
      
      <p className="text-slate-300 text-lg mb-8">
        {errorMessage || 'Unable to connect to the server. Please try again.'}
      </p>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all shadow-lg"
        >
          Go to Home
        </button>
      </div>
    </div>
  );

  const renderItemViewer = () => {
    if (!selectedItem) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              {getFileIcon(selectedItem.type)}
              <div>
                <h3 className="text-white font-semibold">{selectedItem.name}</h3>
                <p className="text-slate-400 text-sm">{formatFileSize(selectedItem.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedFolder?.permission !== 'view' && (
                <button
                  onClick={() => handleDownload(selectedItem)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-auto flex items-center justify-center">
            {(selectedItem.type === 'image' || selectedItem.type === 'photo') && (
              <img 
                src={selectedItem.url} 
                alt={selectedItem.name}
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />
            )}
            {selectedItem.type === 'video' && (
              <video 
                src={selectedItem.url} 
                controls
                className="w-full rounded-lg"
              />
            )}
            {selectedItem.type === 'audio' && (
              <audio 
                src={selectedItem.url} 
                controls
                className="w-full"
              />
            )}
            {selectedItem.type === 'document' && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-4">
                  Document preview not available
                </p>
                {selectedFolder?.permission !== 'view' && (
                  <button
                    onClick={() => handleDownload(selectedItem)}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                  >
                    Download to View
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFolderView = () => {
    if (!selectedFolder) return null;

    return (
      <div className="animate-fade-in-up">
        {/* Folder Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedFolder(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Folders
          </button>
          {getPermissionBadge(selectedFolder.permission)}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl">{selectedFolder.icon}</span>
            <div>
              <h2 className="text-2xl text-white font-semibold">{selectedFolder.name}</h2>
              <p className="text-slate-400">{selectedFolder.itemCount} items</p>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {isLoadingFolder ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading folder contents...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFolder.items?.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-slate-800/50 rounded-xl overflow-hidden hover:bg-slate-700/50 transition-all text-left group"
              >
                {/* Thumbnail Preview for Images/Videos */}
                {(item.type === 'image' || item.type === 'photo' || item.type === 'video') && (
                  <div className="relative aspect-video bg-slate-900/50">
                    <img 
                      src={item.thumbnailUrl || item.url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                
                {/* File Info */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {getFileIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-slate-400 text-sm">{formatFileSize(item.size)}</p>
                      <p className="text-slate-500 text-xs mt-1">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderVaultDashboard = () => {
    if (!vaultData) return null;

    return (
      <div className="animate-fade-in-up">
        {/* Vault Header */}
        <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-purple-500/20 rounded-2xl">
              <Shield className="w-12 h-12 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl text-white font-bold mb-1">
                {vaultData.ownerName}'s Legacy Vault
              </h1>
              <p className="text-slate-400">
                Unlocked on {formatDate(vaultData.unlockedDate)}
              </p>
            </div>
          </div>

          {/* Personal Message */}
          {vaultData.personalMessage && (
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4 mb-6">
              <h3 className="text-pink-300 font-semibold mb-2 flex items-center gap-2">
                💌 Personal Message
              </h3>
              <p className="text-slate-300 italic">
                "{vaultData.personalMessage}"
              </p>
            </div>
          )}

          {/* Vault Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyan-500/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className="text-slate-400 text-sm">Folders</p>
                  <p className="text-white text-2xl font-bold">{vaultData.folders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-slate-400 text-sm">Total Items</p>
                  <p className="text-white text-2xl font-bold">{vaultData.totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-slate-400 text-sm">Inactive</p>
                  <p className="text-white text-2xl font-bold">{vaultData.inactivityDays} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Access Expiration Notice */}
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-300 font-semibold mb-1">Access expires on {formatDate(vaultData.expiresAt)}</p>
              <p className="text-slate-400">
                This vault will remain accessible for one year from unlock date
              </p>
            </div>
          </div>
        </div>

        {/* Folders Grid */}
        <h2 className="text-2xl text-white font-bold mb-4">Vault Folders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaultData.folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                setSelectedFolder(folder);
                loadFolderContents(folder);
              }}
              className="bg-slate-800/50 rounded-xl p-6 hover:bg-slate-700/50 transition-all text-center group"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-6xl mb-2">{folder.icon}</span>
                <h3 className="text-xl text-white font-semibold group-hover:text-purple-300 transition-colors">
                  {folder.name}
                </h3>
                <p className="text-slate-400">{folder.itemCount} items</p>
                {getPermissionBadge(folder.permission)}
              </div>
            </button>
          ))}
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Privacy & Security
          </h3>
          <ul className="text-slate-400 text-sm space-y-2">
            <li>✓ Your access is logged for transparency</li>
            <li>✓ The account owner cannot see when you access content</li>
            <li>✓ Downloaded files remain private on your device</li>
            <li>✓ This vault is read-only - original content is preserved</li>
          </ul>
        </div>

        {/* Go to Your Eras CTA */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all shadow-lg hover:shadow-purple-500/50"
          >
            Go to Your Eras
          </button>
          <p className="text-slate-400 text-sm mt-3">
            Access your own time capsules and create new memories
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background Effects - MOBILE SAFE */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        {state === 'loading' && renderLoadingState()}
        {state === 'expired' && renderExpiredState()}
        {state === 'invalid' && renderInvalidState()}
        {state === 'error' && renderErrorState()}
        {state === 'unlocked' && !selectedFolder && renderVaultDashboard()}
        {state === 'unlocked' && selectedFolder && renderFolderView()}
      </div>

      {/* Item Viewer Modal */}
      {selectedItem && renderItemViewer()}
    </div>
  );
}