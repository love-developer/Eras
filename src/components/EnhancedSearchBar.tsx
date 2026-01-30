import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Clock, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { AdvancedFilters, FilterOptions } from './AdvancedFilters';
import { SearchHistory } from './SearchHistory';

interface EnhancedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  placeholder?: string;
  showHistory?: boolean;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  value,
  onChange,
  onFilterChange,
  placeholder = 'Search capsules by title, message, sender, or media...',
  showHistory = true,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('eras-search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    const newHistory = [
      searchTerm,
      ...searchHistory.filter(item => item !== searchTerm)
    ].slice(0, 10); // Keep last 10 searches

    setSearchHistory(newHistory);
    localStorage.setItem('eras-search-history', JSON.stringify(newHistory));
  };

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('eras-search-history');
  };

  // Handle search change
  const handleSearchChange = (newValue: string) => {
    onChange(newValue);
    if (newValue.trim()) {
      saveToHistory(newValue);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    onFilterChange(newFilters);

    // Count active filters
    let count = 0;
    if (newFilters.dateFrom || newFilters.dateTo) count++;
    if (newFilters.mediaTypes && newFilters.mediaTypes.length > 0) count++;
    if (newFilters.folder) count++;
    if (newFilters.status && newFilters.status.length > 0) count++;
    if (newFilters.hasEchoes !== undefined) count++;

    setActiveFilterCount(count);
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters: FilterOptions = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setActiveFilterCount(0);
  };

  // Clear search
  const clearSearch = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="relative flex items-center gap-2">
        {/* Search Input with History */}
        <Popover open={showSearchHistory && showHistory} onOpenChange={setShowSearchHistory}>
          <PopoverTrigger asChild>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                value={value}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => showHistory && setShowSearchHistory(true)}
                placeholder={placeholder}
                className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
              {value && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </PopoverTrigger>
          {showHistory && searchHistory.length > 0 && (
            <PopoverContent 
              align="start" 
              className="w-[400px] p-0 bg-slate-800 border-slate-700"
              onInteractOutside={() => setShowSearchHistory(false)}
            >
              <SearchHistory
                history={searchHistory}
                onSelect={(term) => {
                  handleSearchChange(term);
                  setShowSearchHistory(false);
                }}
                onClear={clearHistory}
              />
            </PopoverContent>
          )}
        </Popover>

        {/* Advanced Filters Button */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className={`relative border-slate-700 hover:bg-slate-800 ${
                activeFilterCount > 0 ? 'border-blue-500 bg-blue-500/10' : ''
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            align="end" 
            className="w-[400px] p-0 bg-slate-800 border-slate-700"
          >
            <AdvancedFilters
              filters={filters}
              onChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button (when filters active) */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.dateFrom && (
            <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300 flex items-center gap-2">
              <span>From: {new Date(filters.dateFrom).toLocaleDateString()}</span>
              <button
                onClick={() => handleFilterChange({ ...filters, dateFrom: undefined })}
                className="hover:text-blue-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.dateTo && (
            <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300 flex items-center gap-2">
              <span>To: {new Date(filters.dateTo).toLocaleDateString()}</span>
              <button
                onClick={() => handleFilterChange({ ...filters, dateTo: undefined })}
                className="hover:text-blue-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.mediaTypes && filters.mediaTypes.length > 0 && (
            <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-300 flex items-center gap-2">
              <span>Media: {filters.mediaTypes.join(', ')}</span>
              <button
                onClick={() => handleFilterChange({ ...filters, mediaTypes: [] })}
                className="hover:text-violet-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.folder && (
            <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300 flex items-center gap-2">
              <span>Folder: {filters.folder}</span>
              <button
                onClick={() => handleFilterChange({ ...filters, folder: undefined })}
                className="hover:text-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.status && filters.status.length > 0 && (
            <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs text-cyan-300 flex items-center gap-2">
              <span>Status: {filters.status.join(', ')}</span>
              <button
                onClick={() => handleFilterChange({ ...filters, status: [] })}
                className="hover:text-cyan-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.hasEchoes !== undefined && (
            <div className="px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full text-xs text-pink-300 flex items-center gap-2">
              <span>{filters.hasEchoes ? 'Has Echoes' : 'No Echoes'}</span>
              <button
                onClick={() => handleFilterChange({ ...filters, hasEchoes: undefined })}
                className="hover:text-pink-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
