import React from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Eye, Download, FileArchive, Shield } from 'lucide-react';

interface FolderLegacyBeneficiaryRowProps {
  beneficiary: {
    email: string;
    name?: string;
    permission: 'view' | 'download' | 'export' | 'full';
  };
  onUpdatePermission: (email: string, permission: string) => void;
  onRemove: (email: string) => void;
}

export function FolderLegacyBeneficiaryRow({
  beneficiary,
  onUpdatePermission,
  onRemove
}: FolderLegacyBeneficiaryRowProps) {
  const initials = (beneficiary.name || beneficiary.email)
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const permissionConfig = {
    view: { icon: Eye, label: 'View Only', color: 'text-blue-400' },
    download: { icon: Download, label: 'Download', color: 'text-green-400' },
    export: { icon: FileArchive, label: 'Export ZIP', color: 'text-purple-400' },
    full: { icon: Shield, label: 'Full Access', color: 'text-yellow-400' }
  };

  const config = permissionConfig[beneficiary.permission];
  const PermissionIcon = config.icon;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
      {/* Avatar */}
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {beneficiary.name || beneficiary.email}
        </p>
        <p className="text-slate-400 text-xs truncate">{beneficiary.email}</p>
      </div>

      {/* Permission Selector */}
      <Select
        value={beneficiary.permission}
        onValueChange={(v) => onUpdatePermission(beneficiary.email, v)}
      >
        <SelectTrigger className="w-full sm:w-[160px] bg-white/5 border-white/10 text-white text-sm">
          <div className="flex items-center gap-2">
            <PermissionIcon className={`w-3 h-3 ${config.color}`} />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="view">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>View Only</span>
            </div>
          </SelectItem>
          <SelectItem value="download">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" />
              <span>Download</span>
            </div>
          </SelectItem>
          <SelectItem value="export">
            <div className="flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-purple-400" />
              <span>Export ZIP</span>
            </div>
          </SelectItem>
          <SelectItem value="full">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span>Full Access</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(beneficiary.email)}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 self-end sm:self-auto"
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Remove beneficiary</span>
      </Button>
    </div>
  );
}
