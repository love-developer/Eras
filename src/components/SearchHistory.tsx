import React from 'react';
import { Clock, Trash2, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface SearchHistoryProps {
  history: string[];
  onSelect: (term: string) => void;
  onClear: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onClear,
}) => {
  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-400">
        No recent searches
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Recent Searches
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>

      <Separator className="bg-slate-700 my-1" />

      {/* History Items */}
      <div className="space-y-0.5 px-1">
        {history.map((term, index) => (
          <button
            key={index}
            onClick={() => onSelect(term)}
            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 rounded transition-colors flex items-center gap-2 group"
          >
            <TrendingUp className="w-3 h-3 text-slate-500 group-hover:text-slate-400" />
            <span className="flex-1 truncate">{term}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
