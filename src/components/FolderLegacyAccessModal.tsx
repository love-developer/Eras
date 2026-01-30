import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Shield, Users, Eye, Download, Globe, Info, CheckCircle2, ChevronRight, X, UserPlus, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateFolderLegacyAccess } from '../utils/legacyAccessInheritance';
import type { FolderLegacyAccess, FolderBeneficiary } from '../utils/legacyAccessInheritance';

interface FolderLegacyAccessModalProps {
  folder: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (folderId: string, legacyAccess: FolderLegacyAccess) => Promise<void>;
  currentUserId?: string;
  globalBeneficiariesCount?: number;
  globalBeneficiaries?: FolderBeneficiary[];
  onViewGlobalSettings?: () => void;
}

export function FolderLegacyAccessModal({
  folder,
  isOpen,
  onClose,
  onSave,
  currentUserId,
  globalBeneficiariesCount = 0,
  globalBeneficiaries = [],
  onViewGlobalSettings
}: FolderLegacyAccessModalProps) {
  // State - SIMPLIFIED
  const [mode, setMode] = useState<'global' | 'custom' | 'none'>('global');
  const [beneficiaries, setBeneficiaries] = useState<FolderBeneficiary[]>([]);
  const [accessType, setAccessType] = useState<'view' | 'download' | 'full'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newBeneficiaryEmail, setNewBeneficiaryEmail] = useState('');
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');

  // Initialize from folder's existing settings
  useEffect(() => {
    if (folder?.legacyAccess) {
      setMode(folder.legacyAccess.mode || 'global');
      setBeneficiaries(folder.legacyAccess.beneficiaries || []);
      setAccessType(folder.legacyAccess.accessType || 'view');
    } else {
      // Reset to defaults
      setMode('global');
      setBeneficiaries([]);
      setAccessType('view');
    }
  }, [folder]);

  const handleAddBeneficiary = () => {
    if (!newBeneficiaryEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    // Basic email validation
    if (!newBeneficiaryEmail.includes('@') || !newBeneficiaryEmail.includes('.')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if already exists
    if (beneficiaries.some(b => b.email.toLowerCase() === newBeneficiaryEmail.toLowerCase())) {
      toast.error('This beneficiary has already been added');
      return;
    }

    const newBeneficiary: FolderBeneficiary = {
      email: newBeneficiaryEmail.trim().toLowerCase(),
      name: newBeneficiaryName.trim() || newBeneficiaryEmail.trim(),
      permission: 'view', // Default to view, they can change it
      addedAt: new Date().toISOString(),
      addedBy: currentUserId || 'unknown'
    };

    setBeneficiaries([...beneficiaries, newBeneficiary]);
    setNewBeneficiaryEmail('');
    setNewBeneficiaryName('');
    setShowAddForm(false);
    toast.success(`${newBeneficiary.name} added`);
  };

  const handleRemoveBeneficiary = (email: string) => {
    const beneficiary = beneficiaries.find(b => b.email === email);
    setBeneficiaries(beneficiaries.filter(b => b.email !== email));
    toast.success(`${beneficiary?.name || email} removed`);
  };

  const handleUpdatePermission = (email: string, permission: 'view' | 'download' | 'full') => {
    setBeneficiaries(
      beneficiaries.map(b => 
        b.email === email ? { ...b, permission } : b
      )
    );
  };

  const handleCopyFromGlobal = () => {
    if (!globalBeneficiaries || globalBeneficiaries.length === 0) {
      toast.error('No global beneficiaries to copy');
      return;
    }

    const newBeneficiaries: FolderBeneficiary[] = globalBeneficiaries.map(b => ({
      ...b,
      permission: 'view', // Default to view permission when copying
      addedAt: new Date().toISOString(),
      addedBy: currentUserId || 'unknown'
    }));

    // Filter out duplicates
    const existingEmails = new Set(beneficiaries.map(b => b.email.toLowerCase()));
    const uniqueNew = newBeneficiaries.filter(b => !existingEmails.has(b.email.toLowerCase()));

    if (uniqueNew.length === 0) {
      toast.info('All global beneficiaries are already added');
      return;
    }

    setBeneficiaries([...beneficiaries, ...uniqueNew]);
    toast.success(`Added ${uniqueNew.length} ${uniqueNew.length === 1 ? 'beneficiary' : 'beneficiaries'}`);
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      const legacyAccessConfig: FolderLegacyAccess = {
        mode,
        beneficiaries,
        accessType,
        updatedAt: new Date().toISOString()
      };

      // Validate configuration
      const validation = validateFolderLegacyAccess(legacyAccessConfig);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid configuration');
        setIsSubmitting(false);
        return;
      }

      await onSave(folder.id, legacyAccessConfig);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to save legacy access:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!folder) return null;

  // SUCCESS CONFIRMATION MODAL
  if (showConfirmation) {
    const totalBeneficiaries = mode === 'global' 
      ? globalBeneficiariesCount 
      : beneficiaries.length;

    return (
      <Dialog open={isOpen} onOpenChange={() => { setShowConfirmation(false); onClose(); }}>
        <DialogContent className="max-w-lg border-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl text-white font-semibold mb-1">
                  {mode === 'none' ? 'Legacy Access Removed' : 'Legacy Access Configured'}
                </h2>
                <p className="text-sm text-white">Settings saved successfully</p>
              </div>
            </div>

            <div className="space-y-4 bg-white/5 rounded-lg p-4 border border-white/10">
              {/* Folder Info */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{folder.icon || '📁'}</span>
                <Badge style={{ backgroundColor: folder.color || '#6366f1' }} className="text-white border-0">
                  {folder.name}
                </Badge>
              </div>

              {mode !== 'none' && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Who can access:</span>
                    <span className="text-white flex items-center gap-2">
                      {mode === 'global' ? (
                        <><Globe className="w-4 h-4 text-blue-400" /> Everyone ({totalBeneficiaries})</>
                      ) : (
                        <><Users className="w-4 h-4 text-purple-400" /> {totalBeneficiaries} specific {totalBeneficiaries === 1 ? 'person' : 'people'}</>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">What they can do:</span>
                    <span className="text-white flex items-center gap-2">
                      {accessType === 'view' && <><Eye className="w-4 h-4 text-blue-400" /> View Only</>}
                      {accessType === 'download' && <><Download className="w-4 h-4 text-green-400" /> Download</>}
                      {accessType === 'full' && <><Shield className="w-4 h-4 text-yellow-400" /> Full Access</>}
                    </span>
                  </div>
                </div>
              )}

              {mode === 'none' && (
                <p className="text-sm text-white">
                  This folder will remain private and not be shared with any beneficiaries when your Legacy Access is triggered.
                </p>
              )}
            </div>

            <Button
              onClick={() => { setShowConfirmation(false); onClose(); }}
              className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // MAIN CONFIGURATION MODAL
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden border-0 p-0">
        {/* Background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
              linear-gradient(180deg, rgba(15, 20, 40, 0.98) 0%, rgba(5, 5, 15, 0.99) 100%)
            `,
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        />

        {/* Scrollable Content */}
        <div className="relative z-10 overflow-y-auto max-h-[90vh] p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-400" />
              Legacy Access
            </DialogTitle>
            <DialogDescription className="text-white">
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-2xl">{folder.icon || '📁'}</span>
                <Badge 
                  style={{ backgroundColor: folder.color || '#6366f1' }}
                  className="text-white border-0"
                >
                  {folder.name}
                </Badge>
                <span className="text-xs text-white">
                  • {folder.mediaIds?.length || 0} {(folder.mediaIds?.length || 0) === 1 ? 'item' : 'items'}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Context Banner */}
          <div className="mb-6 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-white">
                Configure who can access this folder when your Legacy Access is triggered
              </p>
              <p className="text-xs text-white mt-1">
                Global Legacy Access: {globalBeneficiariesCount > 0 ? (
                  <span className="text-white">Active ({globalBeneficiariesCount} {globalBeneficiariesCount === 1 ? 'beneficiary' : 'beneficiaries'})</span>
                ) : (
                  <span className="text-white">Not configured</span>
                )}
              </p>
            </div>
            {onViewGlobalSettings && (
              <button
                onClick={onViewGlobalSettings}
                className="text-xs text-white hover:text-white flex items-center gap-1 whitespace-nowrap"
              >
                View Settings
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* SECTION 1: WHO CAN ACCESS */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Who can access this folder?
            </h3>
            
            <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)} className="space-y-3">
              {/* Everyone (Global) */}
              <Label 
                htmlFor="global" 
                className="flex items-start space-x-3 p-4 rounded-lg border-2 border-white/10 bg-white/5 hover:bg-white/8 transition-all cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10"
              >
                <RadioGroupItem value="global" id="global" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-semibold">Everyone in my Legacy Access</span>
                    <Badge variant="outline" className="text-xs border-blue-400/50 text-blue-300">
                      {globalBeneficiariesCount} {globalBeneficiariesCount === 1 ? 'person' : 'people'}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/70">
                    All your global beneficiaries can access this folder
                  </p>
                </div>
              </Label>

              {/* Only Specific People */}
              <Label 
                htmlFor="custom" 
                className="flex items-start space-x-3 p-4 rounded-lg border-2 border-white/10 bg-white/5 hover:bg-white/8 transition-all cursor-pointer has-[:checked]:border-purple-500 has-[:checked]:bg-purple-500/10"
              >
                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-semibold">Only specific people</span>
                  </div>
                  <p className="text-sm text-white/70">
                    Choose exactly who can access this folder
                  </p>
                </div>
              </Label>

              {/* Nobody */}
              <Label 
                htmlFor="none" 
                className="flex items-start space-x-3 p-4 rounded-lg border-2 border-white/10 bg-white/5 hover:bg-white/8 transition-all cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10"
              >
                <RadioGroupItem value="none" id="none" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <X className="w-5 h-5 text-red-400" />
                    <span className="text-white font-semibold">Nobody (Private forever)</span>
                  </div>
                  <p className="text-sm text-white/70">
                    This folder will not be accessible after trigger
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* CUSTOM MODE: Add Beneficiaries */}
          {mode === 'custom' && (
            <div className="mb-8 p-5 rounded-xl border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Specific People ({beneficiaries.length})
                </h4>
                {globalBeneficiariesCount > 0 && !showAddForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyFromGlobal}
                    className="text-xs border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
                  >
                    Copy from Global ({globalBeneficiariesCount})
                  </Button>
                )}
              </div>

              {/* Add Beneficiary Form */}
              {!showAddForm ? (
                <Button
                  onClick={() => setShowAddForm(true)}
                  variant="outline"
                  className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Person
                </Button>
              ) : (
                <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        value={newBeneficiaryEmail}
                        onChange={(e) => setNewBeneficiaryEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className="pl-10 bg-white/5 border-white/20 text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBeneficiary()}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Name (Optional)</Label>
                    <Input
                      value={newBeneficiaryName}
                      onChange={(e) => setNewBeneficiaryName(e.target.value)}
                      placeholder="Jane Doe"
                      className="bg-white/5 border-white/20 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBeneficiary()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddBeneficiary} className="flex-1 bg-green-600 hover:bg-green-700">
                      Add
                    </Button>
                    <Button onClick={() => setShowAddForm(false)} variant="outline" className="border-white/20 text-white">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Beneficiaries List */}
              {beneficiaries.length > 0 && (
                <div className="space-y-2 mt-4">
                  {beneficiaries.map((beneficiary) => (
                    <div
                      key={beneficiary.email}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{beneficiary.name || beneficiary.email}</p>
                        <p className="text-xs text-white/60 truncate">{beneficiary.email}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <select
                          value={beneficiary.permission}
                          onChange={(e) => handleUpdatePermission(beneficiary.email, e.target.value as any)}
                          className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 text-white"
                        >
                          <option value="view">View</option>
                          <option value="download">Download</option>
                          <option value="full">Full</option>
                        </select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveBeneficiary(beneficiary.email)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {beneficiaries.length === 0 && !showAddForm && (
                <div className="text-center py-6 text-white/50 text-sm">
                  No people added yet. Click "Add Person" to start.
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: WHAT CAN THEY DO (Only if not "none") */}
          {mode !== 'none' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                What can they do?
              </h3>
              
              <RadioGroup value={accessType} onValueChange={(v: any) => setAccessType(v)} className="space-y-3">
                {/* View Only */}
                <Label 
                  htmlFor="view" 
                  className="flex items-start space-x-3 p-4 rounded-lg border-2 border-white/10 bg-white/5 hover:bg-white/8 transition-all cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10"
                >
                  <RadioGroupItem value="view" id="view" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-semibold">View Only</span>
                    </div>
                    <p className="text-sm text-white/70">
                      They can browse and see content, but cannot save copies
                    </p>
                  </div>
                </Label>

                {/* Download */}
                <Label 
                  htmlFor="download" 
                  className="flex items-start space-x-3 p-4 rounded-lg border-2 border-white/10 bg-white/5 hover:bg-white/8 transition-all cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-500/10"
                >
                  <RadioGroupItem value="download" id="download" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="w-5 h-5 text-green-400" />
                      <span className="text-white font-semibold">Download</span>
                    </div>
                    <p className="text-sm text-white/70">
                      They can view and save individual files or the entire folder as ZIP
                    </p>
                  </div>
                </Label>

                {/* Full Access */}
                <Label 
                  htmlFor="full" 
                  className="flex items-start space-x-3 p-4 rounded-lg border-2 border-white/10 bg-white/5 hover:bg-white/8 transition-all cursor-pointer has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-500/10"
                >
                  <RadioGroupItem value="full" id="full" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-semibold">Full Access</span>
                    </div>
                    <p className="text-sm text-white/70">
                      They can view, download, and share this folder with others
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* Save Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              disabled={isSubmitting || (mode === 'custom' && beneficiaries.length === 0)}
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
