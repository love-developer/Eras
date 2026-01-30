import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { CalendarIcon, MapPin, Smile, Heart, Star, Sparkles, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeId } from './ThemeRegistry';

interface ThemeSpecificInputsProps {
  themeId: string;
  metadata: any;
  onChange: (metadata: any) => void;
}

export function ThemeSpecificInputs({ themeId, metadata, onChange }: ThemeSpecificInputsProps) {
  const [localMetadata, setLocalMetadata] = useState(metadata || {});

  useEffect(() => {
    setLocalMetadata(metadata || {});
  }, [metadata]);

  const updateField = (field: string, value: any) => {
    const updated = { ...localMetadata, [field]: value };
    setLocalMetadata(updated);
    onChange(updated);
  };

  // All themes now use the standard template body - no theme-specific inputs
  return null;
}