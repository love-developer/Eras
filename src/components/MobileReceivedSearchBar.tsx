import React from 'react';
import { X, RefreshCw, Filter } from 'lucide-react';
import { Input } from './ui/input';

interface MobileReceivedSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
  placeholder?: string;
}

export const MobileReceivedSearchBar: React.FC<MobileReceivedSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  hasActiveFilters,
  onClearFilters,
  onRefresh,
  placeholder = 'Search received capsules...',
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'favorites', label: '⭐ Fav' },
    { value: 'with_media', label: '📷 Media' },
    { value: 'this_week', label: '📅 Week' },
  ];

  return (
    <div className="md:hidden space-y-2">
      {/* Row 1: Search Bar + Filter Toggle */}
      <div className="flex items-center gap-2">
        {/* Search Bar - Takes up most space */}
        <div className="flex-1">
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 px-3 bg-slate-800 border-slate-700 text-sm placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
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
          {/* Filter Buttons */}
          <div className="flex-1 flex gap-1.5 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => onFilterChange(filter.value)}
                className={`h-8 px-2.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                  selectedFilter === filter.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="h-8 px-2 rounded border border-slate-700 bg-slate-800 text-red-400 hover:bg-red-950/30 hover:border-red-700 transition-colors flex-shrink-0"
              aria-label="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="h-8 px-2 rounded border border-slate-700 bg-slate-800 text-slate-400 hover:text-blue-400 hover:border-slate-600 transition-colors flex-shrink-0"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
