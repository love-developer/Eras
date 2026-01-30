import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Search,
  X,
  Filter,
  Calendar,
  SortDesc,
  Grid2x2,
  Grid3x3,
  LayoutGrid,
  List,
} from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'type-asc' | 'type-desc';
type FilterOption = 'all' | 'photo' | 'video' | 'audio' | 'document';
type ViewMode = '2x2' | '3x3' | '4x4' | 'list';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

interface VaultToolbarProps {
  isMobile: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  debouncedSearchQuery: string;
  filterBy: FilterOption;
  setFilterBy: (value: FilterOption) => void;
  dateFilter: DateFilter;
  setDateFilter: (value: DateFilter) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  resultCount: number;
  showMobileFilters: boolean;
  setShowMobileFilters: (value: boolean) => void;
}

export function VaultToolbar({
  isMobile,
  searchQuery,
  setSearchQuery,
  debouncedSearchQuery,
  filterBy,
  setFilterBy,
  dateFilter,
  setDateFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  resultCount,
  showMobileFilters,
  setShowMobileFilters,
}: VaultToolbarProps) {
  const hasActiveFilters = debouncedSearchQuery || dateFilter !== 'all' || filterBy !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setFilterBy('all');
  };

  if (isMobile) {
    return (
      <div className="space-y-2">
        {/* Search Bar - Only search on mobile, no filters/view options since we use overlay */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-4 rounded-md bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-slate-700"
            >
              <X className="w-4 h-4 text-slate-400" />
            </Button>
          )}
        </div>

        {/* Results count badge for search only */}
        {searchQuery && (
          <div className="flex items-center gap-2 px-1">
            <Badge variant="secondary" className="text-xs bg-slate-800 text-white border-slate-700">
              {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3 h-3 mr-1" />
              Clear search
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="space-y-2">
      <Card className="backdrop-blur-xl shadow-xl sticky top-20 z-40 bg-gradient-to-r from-white/10 to-white/5 border-white/30">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex flex-col gap-3">
            {/* Search Bar Row */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                type="text"
                placeholder="Search by type, date, or file format..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 h-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {/* Type Filter - increased width to prevent text cutoff */}
                <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
                  <SelectTrigger className="min-w-[145px] h-9 text-sm bg-white/20 border-white/40 text-white">
                    <Filter className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Media</SelectItem>
                    <SelectItem value="photo">Photos</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter - increased width to prevent text cutoff */}
                <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                  <SelectTrigger className="min-w-[135px] h-9 text-sm bg-white/20 border-white/40 text-white">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort - increased width to prevent text cutoff */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="min-w-[165px] h-9 text-sm bg-white/20 border-white/40 text-white">
                    <SortDesc className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="type-asc">Type (A-Z)</SelectItem>
                    <SelectItem value="type-desc">Type (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grid Size Options */}
              <div className="flex items-center gap-1 p-1 bg-white/10 rounded-lg border border-white/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('2x2')}
                  className={`h-7 px-2 ${
                    viewMode === '2x2' 
                      ? 'bg-white/30 text-white shadow-md' 
                      : 'text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                  title="2x2 Large Grid"
                >
                  <Grid2x2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('3x3')}
                  className={`h-7 px-2 ${
                    viewMode === '3x3' 
                      ? 'bg-white/30 text-white shadow-md' 
                      : 'text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                  title="3x3 Medium Grid"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('4x4')}
                  className={`h-7 px-2 ${
                    viewMode === '4x4' 
                      ? 'bg-white/30 text-white shadow-md' 
                      : 'text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                  title="4x4 Compact Grid"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-7 px-2 ${
                    viewMode === 'list' 
                      ? 'bg-white/30 text-white shadow-md' 
                      : 'text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count badge */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-1">
          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs text-white/70 hover:text-white hover:bg-white/20"
          >
            <X className="w-3 h-3 mr-1" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
