import React from 'react';
import { Folder, MoreVertical, Edit3, Trash2, Image, Download, Lock, Shield, Globe } from 'lucide-react';
import { Card } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface VaultFolderProps {
  id: string;
  name: string;
  color?: string;
  mediaCount: number;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onExport?: () => void; // Phase 4C: Export functionality
  // REMOVED: onShare - share folder functionality redundant with Legacy Access
  onLegacyAccess?: () => void; // NEW: Legacy Access configuration
  isSelected?: boolean;
  isHovering?: boolean;
  // Template customization
  icon?: string; // Emoji or icon identifier
  description?: string; // Folder description
  isTemplateFolder?: boolean; // Whether this was created from a template
  // Legacy Access status
  legacyAccessMode?: 'global' | 'custom' | 'none' | null; // Phase 2 #4: Status badge
  legacyAccessBeneficiaryCount?: number; // Number of beneficiaries
  // Share status - REMOVED: Share folder functionality redundant with Legacy Access
  // Privacy
  isPrivate?: boolean;
  // Menu state
  isMenuOpen?: boolean; // Track if this folder's menu is open
  onMenuOpenChange?: (open: boolean) => void; // Callback when menu opens/closes
}

const COLOR_SCHEMES = {
  blue: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-400/30', text: 'text-blue-400', hover: 'group-hover:border-blue-400/50', hoverText: 'group-hover:text-blue-400' },
  purple: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-400/30', text: 'text-purple-400', hover: 'group-hover:border-purple-400/50', hoverText: 'group-hover:text-purple-400' },
  pink: { bg: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-400/30', text: 'text-pink-400', hover: 'group-hover:border-pink-400/50', hoverText: 'group-hover:text-pink-400' },
  green: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-400/30', text: 'text-green-400', hover: 'group-hover:border-green-400/50', hoverText: 'group-hover:text-green-400' },
  yellow: { bg: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-400/30', text: 'text-yellow-400', hover: 'group-hover:border-yellow-400/50', hoverText: 'group-hover:text-yellow-400' },
  orange: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-400/30', text: 'text-orange-400', hover: 'group-hover:border-orange-400/50', hoverText: 'group-hover:text-orange-400' },
  red: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-400/30', text: 'text-red-400', hover: 'group-hover:border-red-400/50', hoverText: 'group-hover:text-red-400' },
  slate: { bg: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-400/30', text: 'text-slate-400', hover: 'group-hover:border-slate-400/50', hoverText: 'group-hover:text-slate-400' },
};

export function VaultFolder({
  id,
  name,
  color = 'blue',
  mediaCount,
  onClick,
  onRename,
  onDelete,
  onExport,
  onLegacyAccess,
  isSelected = false,
  isHovering = false,
  icon,
  description,
  isTemplateFolder = false,
  legacyAccessMode,
  legacyAccessBeneficiaryCount,
  isPrivate = false,
  isMenuOpen = false,
  onMenuOpenChange
}: VaultFolderProps) {
  const colorScheme = COLOR_SCHEMES[color as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.blue;
  
  // Permanent system folders (Photos, Videos, Audio, Documents)
  const PERMANENT_FOLDERS = ['Photos', 'Videos', 'Audio', 'Documents'];
  const isPermanentFolder = PERMANENT_FOLDERS.includes(name);
  
  // Temporal glow states (Phase 4A)
  const isSmartFolder = name.toLowerCase().includes('photo') || name.toLowerCase().includes('video') || name.toLowerCase().includes('audio') || name.toLowerCase().includes('document');
  
  // System folder definitive colors (Glassmorphism Enhancement)
  const getSystemFolderStyle = () => {
    if (name === 'Photos') {
      return 'bg-blue-900/80 border-blue-500/50 shadow-2xl shadow-blue-500/40 backdrop-blur-xl ring-1 ring-white/10 hover:shadow-blue-500/60 hover:scale-[1.03]';
    }
    if (name === 'Videos') {
      return 'bg-purple-900/80 border-purple-500/50 shadow-2xl shadow-purple-500/40 backdrop-blur-xl ring-1 ring-white/10 hover:shadow-purple-500/60 hover:scale-[1.03]';
    }
    if (name === 'Audio') {
      return 'bg-pink-900/80 border-pink-500/50 shadow-2xl shadow-pink-500/40 backdrop-blur-xl ring-1 ring-white/10 hover:shadow-pink-500/60 hover:scale-[1.03]';
    }
    if (name === 'Documents') {
      return 'bg-amber-900/80 border-amber-500/50 shadow-2xl shadow-amber-500/40 backdrop-blur-xl ring-1 ring-white/10 hover:shadow-amber-500/60 hover:scale-[1.03]';
    }
    return null;
  };
  
  const systemFolderStyle = getSystemFolderStyle();
  
  return (
    <Card 
      className={`
        group relative overflow-hidden cursor-pointer w-full min-w-0
        transition-all duration-500
        ${isHovering
          ? 'bg-gradient-to-br from-emerald-900/70 via-green-900/70 to-emerald-900/70 border-emerald-400/70 shadow-2xl shadow-emerald-500/40 scale-105 ring-4 ring-emerald-400/50 backdrop-blur-xl'
          : isSelected 
            ? 'bg-gradient-to-br from-blue-900/70 via-purple-900/70 to-blue-900/70 border-blue-400/60 shadow-2xl shadow-blue-500/30 ring-2 ring-purple-400/50 animate-pulse backdrop-blur-xl' 
            : systemFolderStyle
            ? systemFolderStyle
            : isTemplateFolder
            ? `bg-slate-900/85 backdrop-blur-xl border-2 ${colorScheme.border} shadow-2xl shadow-${color}-500/30 hover:shadow-${color}-500/50 ring-1 ring-white/10 hover:scale-[1.03] relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/5 before:via-white/10 before:to-white/5 before:opacity-0 before:transition-opacity before:duration-700 hover:before:opacity-100`
            : isSmartFolder
            ? 'bg-slate-900/85 backdrop-blur-xl border-slate-600/70 shadow-2xl shadow-black/40 ring-1 ring-white/10 hover:border-purple-500/50 hover:shadow-purple-500/30 hover:scale-[1.03] relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:via-purple-500/10 before:to-blue-500/10 before:opacity-0 before:transition-opacity before:duration-1000 hover:before:opacity-100'
            : 'bg-slate-900/90 backdrop-blur-xl border-slate-600/80 shadow-2xl shadow-black/40 ring-1 ring-white/10 hover:border-purple-500/40 hover:shadow-purple-500/20 hover:scale-[1.03]'
        }
      `}
      onClick={(e) => {
        console.log('🗂️ Folder clicked:', name, id);
        onClick();
      }}
    >
      {/* Temporal Glow Effect for Active Folder */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 animate-pulse" />
      )}
      
      {/* Smart Folder Rotating Gradient (Future enhancement indicator) */}
      {isSmartFolder && !isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      )}
      {/* Animated gradient border glow */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
        bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-xl
        ${isSelected ? 'opacity-30' : ''}
      `} />
      
      {/* 3-dot menu - Simplified for mobile, premium for desktop */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
        <DropdownMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button
              className={`
                relative overflow-hidden
                h-8 w-8 sm:h-9 sm:w-9
                flex items-center justify-center
                rounded-lg sm:rounded-xl
                bg-black/80 sm:bg-gradient-to-br sm:from-slate-800/95 sm:via-slate-900/95 sm:to-black/95
                backdrop-blur-md sm:backdrop-blur-xl
                border border-white/30 sm:border-2 sm:border-white/20
                hover:border-white/50 sm:hover:border-white/40
                shadow-lg sm:shadow-xl
                hover:shadow-xl sm:hover:shadow-2xl
                transition-all duration-300
                active:scale-95 sm:hover:scale-110
                group/menu
              `}
            >
              {/* Desktop-only shimmer sweep */}
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/menu:translate-x-full transition-transform duration-1000" />
              
              {/* Desktop-only pulsing gradient glow */}
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-pink-500/0 group-hover/menu:from-purple-500/30 group-hover/menu:via-blue-500/30 group-hover/menu:to-pink-500/30 transition-all duration-500" />
              
              {/* Desktop-only rotating border glow */}
              <div className="hidden sm:block absolute inset-0 opacity-0 group-hover/menu:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-sm" />
              </div>
              
              {/* Icon with sparkle particles */}
              <div className="relative flex items-center justify-center">
                <MoreVertical className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white drop-shadow-md sm:drop-shadow-lg transition-transform sm:group-hover/menu:scale-110 relative z-10" />
                
                {/* Desktop-only corner sparkles */}
                <div className="hidden sm:block absolute -top-1 -right-1 w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover/menu:opacity-100 transition-opacity shadow-lg shadow-white/50" />
                <div className="hidden sm:block absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover/menu:opacity-100 transition-opacity delay-75 shadow-lg shadow-white/50" />
                <div className="hidden sm:block absolute -top-1 -left-1 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover/menu:opacity-100 transition-opacity delay-100 shadow-lg shadow-blue-400/50" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-black/50 min-w-[220px] p-2 z-[9999]"
            sideOffset={8}
          >
            {/* Only show rename for non-permanent folders */}
            {!isPermanentFolder && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
                className="group rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-200 focus:bg-blue-500/20 hover:bg-blue-500/20 focus:outline-none border border-transparent hover:border-blue-500/30"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white font-medium text-sm">Rename</span>
                </div>
              </DropdownMenuItem>
            )}
            
            {/* Phase 4C: Share option - always show for folders with share capability */}
            {/* REMOVED: Share folder option - redundant with Legacy Access system */}
            
            {/* Phase 4C: Export option - always show for folders with export capability */}
            {onExport && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (mediaCount > 0) {
                    onExport();
                  }
                }}
                disabled={mediaCount === 0}
                className={mediaCount > 0 
                  ? "group rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-200 focus:bg-purple-500/20 hover:bg-purple-500/20 focus:outline-none border border-transparent hover:border-purple-500/30" 
                  : "rounded-lg px-3 py-2.5 cursor-not-allowed opacity-40"}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    mediaCount > 0 
                      ? 'bg-purple-500/10 group-hover:bg-purple-500/20' 
                      : 'bg-slate-500/10'
                  }`}>
                    <Download className={`w-4 h-4 ${mediaCount > 0 ? 'text-purple-400' : 'text-slate-500'}`} />
                  </div>
                  <span className={`font-medium text-sm ${mediaCount > 0 ? 'text-white' : 'text-slate-500'}`}>Export as ZIP</span>
                </div>
              </DropdownMenuItem>
            )}
            
            {/* NEW: Legacy Access configuration - redirects to global settings */}
            {onLegacyAccess && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onLegacyAccess();
                }}
                className="group rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-200 focus:bg-amber-500/20 hover:bg-amber-500/20 focus:outline-none border border-transparent hover:border-amber-500/30"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-white font-medium text-sm">Legacy Access Settings</span>
                </div>
              </DropdownMenuItem>
            )}
            
            {/* Only show delete for non-permanent folders */}
            {!isPermanentFolder && (
              <>
                <DropdownMenuSeparator className="bg-slate-700/50 my-2" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="group rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-200 focus:bg-red-500/20 hover:bg-red-500/20 focus:outline-none border border-transparent hover:border-red-500/30"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-red-400 font-medium text-sm">Delete</span>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="relative p-3 sm:p-4">
        {/* CENTERED layout - everything stacked vertically */}
        <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-2.5">
          
          {/* Folder icon - PERFECTLY CENTERED with Template badge */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`
              p-2.5 sm:p-3 rounded-xl transition-all duration-300 shadow-lg
              ${name === 'Photos' 
                ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 border-2 border-blue-400/50 shadow-blue-500/40'
                : name === 'Videos'
                ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 border-2 border-purple-400/50 shadow-purple-500/40'
                : name === 'Audio'
                ? 'bg-gradient-to-br from-pink-500/30 to-pink-600/30 border-2 border-pink-400/50 shadow-pink-500/40'
                : name === 'Documents'
                ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/30 border-2 border-amber-400/50 shadow-amber-500/40'
                : isTemplateFolder 
                ? `bg-gradient-to-br ${colorScheme.bg} border-2 ${colorScheme.border} ${colorScheme.hover} ring-2 ring-white/10` 
                : `bg-gradient-to-br ${colorScheme.bg} border ${colorScheme.border} ${colorScheme.hover}`
              }
            `}>
              {icon ? (
                // Custom emoji icon for template folders
                <span className="text-2xl sm:text-3xl leading-none block" role="img" aria-label={name}>
                  {icon}
                </span>
              ) : (
                // Default folder icon with system folder color coding
                <Folder className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                  name === 'Photos' ? 'text-blue-300 group-hover:text-blue-200'
                  : name === 'Videos' ? 'text-purple-300 group-hover:text-purple-200'
                  : name === 'Audio' ? 'text-pink-300 group-hover:text-pink-200'
                  : name === 'Documents' ? 'text-amber-300 group-hover:text-amber-200'
                  : `${colorScheme.text} ${colorScheme.hoverText}`
                }`} />
              )}
            </div>
            
            {/* Template badge - only show for template folders */}
            {isTemplateFolder && (
              <Badge 
                variant="outline" 
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 ${colorScheme.border} bg-gradient-to-r ${colorScheme.bg} backdrop-blur-sm`}
              >
                <span className={colorScheme.text}>Template</span>
              </Badge>
            )}
          </div>
          
          {/* Folder name - ONE LINE ONLY with lock icon */}
          <div className="flex items-center w-full px-2 min-w-0 justify-center">
            <div className="flex items-center gap-1 min-w-0 max-w-full">
              {isPermanentFolder && (
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" title="System folder" />
              )}
              {isPrivate && !isPermanentFolder && (
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 shrink-0" title="Private folder" />
              )}
              <h3 className={`
                text-sm sm:text-base font-semibold truncate min-w-0
                transition-colors duration-300
                ${isSelected 
                  ? 'text-blue-100' 
                  : 'text-slate-200 group-hover:text-white'
                }
              `}>
                {name}
              </h3>
            </div>
          </div>
          
          {/* Item count - ALWAYS show between name and description */}
          <p className="text-[10px] sm:text-xs text-slate-500 text-center w-full px-2 truncate whitespace-nowrap overflow-hidden">
            {mediaCount === 0 ? 'Empty folder' : `${mediaCount} ${mediaCount === 1 ? 'item' : 'items'}`}
          </p>
          
          {/* Folder description - Show if available */}
          {description && (
            <p className="text-[10px] sm:text-xs text-slate-400 text-center w-full px-2 line-clamp-2 leading-tight">
              {description}
            </p>
          )}
          
          {/* Phase 2 #4: Legacy Access Status Badge */}
          {legacyAccessMode && legacyAccessMode !== 'none' && (
            <div className="mt-1">
              <Badge 
                variant="outline" 
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 ${
                  legacyAccessMode === 'global' 
                    ? 'border-blue-400/40 bg-blue-500/10 text-blue-400' 
                    : 'border-purple-400/40 bg-purple-500/10 text-purple-400'
                } backdrop-blur-sm flex items-center gap-1`}
              >
                {legacyAccessMode === 'global' ? (
                  <><Globe className="w-2.5 h-2.5" /> Global Access</>
                ) : (
                  <><Shield className="w-2.5 h-2.5" /> Custom ({legacyAccessBeneficiaryCount || 0})</>
                )}
              </Badge>
            </div>
          )}
          
          {/* Share status badge - REMOVED: Share folder functionality redundant with Legacy Access */}

          {/* Private badge */}
          {isPrivate && (
            <div className="mt-1">
              <Badge 
                variant="outline" 
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 border-purple-400/40 bg-purple-500/10 text-purple-400 backdrop-blur-sm flex items-center gap-1`}
              >
                <><Lock className="w-2.5 h-2.5" /> Private</>
              </Badge>
            </div>
          )}
          
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50 animate-pulse" />
      )}
    </Card>
  );
}