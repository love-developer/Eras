import React from 'react';
import { ArrowUpDown, Calendar, Image, MessageCircle, TrendingUp, Clock } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu';

export type SortOption = 
  | 'newest'
  | 'oldest'
  | 'most-media'
  | 'most-echoes'
  | 'alphabetical';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
}) => {
  const sortOptions: { value: SortOption; label: string; icon: any }[] = [
    { value: 'newest', label: 'Newest First', icon: Calendar },
    { value: 'oldest', label: 'Oldest First', icon: Clock },
    { value: 'most-media', label: 'Most Media', icon: Image },
    { value: 'most-echoes', label: 'Most Echoes', icon: MessageCircle },
    { value: 'alphabetical', label: 'Alphabetical', icon: TrendingUp },
  ];

  const currentOption = sortOptions.find(opt => opt.value === value);
  const Icon = currentOption?.icon || ArrowUpDown;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="border-slate-700 hover:bg-slate-800"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Sort: {currentOption?.label || 'Newest First'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-slate-800 border-slate-700"
      >
        <DropdownMenuLabel className="text-slate-300">Sort By</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as SortOption)}>
          {sortOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="text-slate-300 hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
              >
                <OptionIcon className="w-4 h-4 mr-2" />
                {option.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
