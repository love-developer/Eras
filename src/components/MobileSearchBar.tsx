import React from 'react';
import { Search, Calendar as CalendarIcon, Grid3x3, List, X, RefreshCw, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';

interface MobileSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRefresh?: () => void;
  lastSync?: Date;
  placeholder?: string;
  filterMediaType: string;
  onFilterMediaTypeChange: (type: string) => void;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedDate,
  onDateSelect,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
  onRefresh,
  lastSync,
  placeholder = 'Search capsules...',
  filterMediaType,
  onFilterMediaTypeChange,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="md:hidden space-y-2">
      {/* Row 1: Search Bar + Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Search Bar - Takes up most space, NO ICON */}
        <div className="flex-1">
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 px-3 bg-slate-800 border-slate-700 text-sm placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* View Toggle - Compact */}
        <div className="flex rounded-md overflow-hidden border border-slate-700 h-9">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`px-2.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Grid view"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`px-2.5 border-l border-slate-700 transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-9 px-2.5 rounded-md border transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          aria-label="Toggle filters"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: Filters (Collapsible) */}
      {showFilters && (
        <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          {/* Media Type Filter */}
          <div className="flex-1 flex gap-1.5">
            {['all', 'video', 'audio', 'image'].map((type) => (
              <button
                key={type}
                onClick={() => onFilterMediaTypeChange(type)}
                className={`flex-1 h-8 text-xs font-medium rounded border transition-colors ${
                  filterMediaType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`h-8 px-2.5 rounded border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedDate
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {selectedDate ? format(selectedDate, 'M/d') : 'Date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="h-8 px-2 rounded border border-slate-700 bg-slate-800 text-red-400 hover:bg-red-950/30 hover:border-red-700 transition-colors"
              aria-label="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Refresh */}
          {onRefresh && lastSync && (
            <button
              onClick={onRefresh}
              className="h-8 px-2 rounded border border-slate-700 bg-slate-800 text-slate-400 hover:text-blue-400 hover:border-slate-600 transition-colors"
              aria-label={`Refresh - Last synced: ${format(lastSync, 'PPp')}`}
              title={`Last synced: ${format(lastSync, 'PPp')}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};