import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, ArrowRight, FolderPlus, X } from 'lucide-react';
import {
  FOLDER_TEMPLATES,
  TEMPLATE_CATEGORIES,
  FolderTemplate,
  getTemplatesByCategory,
  searchTemplates
} from '../utils/folder-templates';

interface FolderTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: FolderTemplate) => void;
}

export function FolderTemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate
}: FolderTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Debug: Log template count on open (MUST be before early return)
  useEffect(() => {
    if (open) {
      const allTemplates = Object.values(FOLDER_TEMPLATES);
      const allKeys = Object.keys(FOLDER_TEMPLATES);
      console.log('='.repeat(60));
      console.log('🎯 [TEMPLATE DEBUG] FOLDER_TEMPLATES object keys:', allKeys);
      console.log('🎯 [TEMPLATE DEBUG] Total unique keys:', allKeys.length);
      console.log('🎯 [TEMPLATE DEBUG] Total template objects:', allTemplates.length);
      console.log('🎯 [TEMPLATE DEBUG] Template IDs from values:', allTemplates.map(t => t.id));
      console.log('🎯 [TEMPLATE DEBUG] Are there duplicates?', allKeys.length !== new Set(allKeys).size);
      console.log('='.repeat(60));
    }
  }, [open]);

  if (!open) return null;

  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : selectedCategory === 'all'
    ? Object.values(FOLDER_TEMPLATES)
    : getTemplatesByCategory(selectedCategory);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ 
        isolation: 'isolate',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Container - Fixed with proper scrolling */}
      <div
        className="relative w-full max-w-4xl animate-in zoom-in-95 fade-in duration-200"
        style={{ 
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Content */}
        <div className="flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-purple-500/20 shadow-2xl shadow-purple-900/50 backdrop-blur-xl rounded-lg overflow-hidden" style={{ overflowX: 'hidden' }}>
          {/* Cosmic Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

          {/* Header - Fixed at top */}
          <div className="relative flex-shrink-0 p-6 border-b border-slate-700/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-400/30">
                  <FolderPlus className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    Folder Templates
                  </h2>
                  <p className="text-sm text-slate-400">
                    Start organizing with pre-designed Eras-themed folder structures
                    <Badge variant="outline" className="ml-2 text-xs border-purple-500/30 text-purple-400">
                      {Object.keys(FOLDER_TEMPLATES).length} templates
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 focus:border-purple-500/50 text-slate-200"
              />
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div 
            className="relative flex-1 overflow-y-auto overflow-x-hidden"
            style={{ 
              maxHeight: 'calc(100vh - 16rem)',
              overflowY: 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'contain'
            }}
          >
            <div className="p-6">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid grid-cols-3 sm:grid-cols-6 bg-slate-800/50 mb-6 w-full overflow-hidden">
                  <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-slate-300">
                    All
                  </TabsTrigger>
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-slate-300"
                    >
                      <span className="mr-1">{cat.icon}</span>
                      <span className="hidden sm:inline">{cat.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>



                <TabsContent value={selectedCategory} className="mt-0">
                  {filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <FolderPlus className="w-12 h-12 mb-3 opacity-50" />
                      <p>No templates found</p>
                      <p className="text-sm">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTemplates.map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onSelect={() => {
                            onSelectTemplate(template);
                            onOpenChange(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render as portal to escape parent CSS
  return createPortal(modalContent, document.body);
}

interface TemplateCardProps {
  template: FolderTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{template.icon}</span>
            <div>
              <CardTitle className="text-base text-slate-100 group-hover:text-purple-300 transition-colors">
                {template.name}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {template.folders.length} folders
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/20">
            {template.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-300 line-clamp-2">
          {template.description}
        </p>

        {/* Folder Preview */}
        <div className="flex flex-wrap gap-1.5">
          {template.folders.slice(0, 4).map((folder, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-xs border-slate-600 bg-slate-800/50 text-slate-300"
            >
              {folder.icon && <span className="mr-1">{folder.icon}</span>}
              {folder.name}
            </Badge>
          ))}
          {template.folders.length > 4 && (
            <Badge variant="outline" className="text-xs border-slate-600 bg-slate-800/50 text-slate-400">
              +{template.folders.length - 4} more
            </Badge>
          )}
        </div>

        <Button
          onClick={onSelect}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/50"
          size="sm"
        >
          Use Template
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
