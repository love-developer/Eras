import React from 'react';
import { Calendar, Image, Video, Music, Folder, CheckCircle, MessageCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Calendar as CalendarComponent } from './ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Separator } from './ui/separator';

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  mediaTypes?: string[];
  folder?: string;
  status?: string[];
  hasEchoes?: boolean;
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  onClose: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onChange,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = React.useState<FilterOptions>(filters);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const toggleMediaType = (type: string) => {
    const currentTypes = localFilters.mediaTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    updateFilter('mediaTypes', newTypes);
  };

  const toggleStatus = (status: string) => {
    const currentStatuses = localFilters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    updateFilter('status', newStatuses);
  };

  const applyFilters = () => {
    onChange(localFilters);
    onClose();
  };

  const clearAll = () => {
    const emptyFilters: FilterOptions = {};
    setLocalFilters(emptyFilters);
    onChange(emptyFilters);
  };

  return (
    <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">Advanced Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Separator className="bg-slate-700" />

      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-sm text-slate-300 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date Range
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {/* From Date */}
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left border-slate-700 hover:bg-slate-800"
                >
                  {localFilters.dateFrom
                    ? new Date(localFilters.dateFrom).toLocaleDateString()
                    : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <CalendarComponent
                  mode="single"
                  selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
                  onSelect={(date) => updateFilter('dateFrom', date?.toISOString())}
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left border-slate-700 hover:bg-slate-800"
                >
                  {localFilters.dateTo
                    ? new Date(localFilters.dateTo).toLocaleDateString()
                    : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <CalendarComponent
                  mode="single"
                  selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
                  onSelect={(date) => updateFilter('dateTo', date?.toISOString())}
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Media Types */}
      <div className="space-y-3">
        <Label className="text-sm text-slate-300 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Media Types
        </Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={localFilters.mediaTypes?.includes('image') || false}
              onCheckedChange={() => toggleMediaType('image')}
            />
            <Image className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
            <span className="text-sm text-slate-400 group-hover:text-slate-300">Images</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={localFilters.mediaTypes?.includes('video') || false}
              onCheckedChange={() => toggleMediaType('video')}
            />
            <Video className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
            <span className="text-sm text-slate-400 group-hover:text-slate-300">Videos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={localFilters.mediaTypes?.includes('audio') || false}
              onCheckedChange={() => toggleMediaType('audio')}
            />
            <Music className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
            <span className="text-sm text-slate-400 group-hover:text-slate-300">Audio</span>
          </label>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Status */}
      <div className="space-y-3">
        <Label className="text-sm text-slate-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Status
        </Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={localFilters.status?.includes('scheduled') || false}
              onCheckedChange={() => toggleStatus('scheduled')}
            />
            <span className="text-sm text-slate-400 group-hover:text-slate-300">Scheduled</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={localFilters.status?.includes('delivered') || false}
              onCheckedChange={() => toggleStatus('delivered')}
            />
            <span className="text-sm text-slate-400 group-hover:text-slate-300">Delivered</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={localFilters.status?.includes('received') || false}
              onCheckedChange={() => toggleStatus('received')}
            />
            <span className="text-sm text-slate-400 group-hover:text-slate-300">Received</span>
          </label>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Has Echoes */}
      <div className="space-y-3">
        <Label className="text-sm text-slate-300 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Echoes
        </Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={localFilters.hasEchoes === true}
              onCheckedChange={(checked) => 
                updateFilter('hasEchoes', checked ? true : undefined)
              }
            />
            <span className="text-sm text-slate-400 group-hover:text-slate-300">
              Has echoes/reactions
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={localFilters.hasEchoes === false}
              onCheckedChange={(checked) => 
                updateFilter('hasEchoes', checked ? false : undefined)
              }
            />
            <span className="text-sm text-slate-400 group-hover:text-slate-300">
              No echoes/reactions
            </span>
          </label>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="flex-1 border-slate-700 hover:bg-slate-800"
        >
          Clear All
        </Button>
        <Button
          size="sm"
          onClick={applyFilters}
          className="flex-1 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};
