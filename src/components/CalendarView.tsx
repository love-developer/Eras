import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Mail,
  Phone,
  User,
  Users,
  Image,
  Video,
  Mic,
  FileText,
  X,
  Loader2,
  Eye,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getYear, getMonth, setMonth, setYear, isToday, isFuture, isPast } from 'date-fns';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { DatabaseService } from '../utils/supabase/database';
import { MediaPreviewModal } from './MediaPreviewModal';
import { MediaThumbnail } from './MediaThumbnail';

interface CalendarViewProps {
  onClose?: () => void;
  onViewCapsule?: (capsule: Capsule) => void;
  onCreateCapsule?: (date: Date) => void; // Quick Add: Create capsule for specific date
}

interface Capsule {
  id: string;
  title: string;
  text_message?: string;
  delivery_date: string;
  delivery_method: 'email';
  recipient_type: 'self' | 'others';
  self_contact?: string;
  recipients?: any[];
  status: 'scheduled' | 'delivered' | 'draft';
  created_at: string;
  updated_at?: string; // For tracking draft revisions
  media_count?: number;
  is_received?: boolean;
  attachments?: Array<{
    id: string;
    url: string;
    type: string;
    filename: string;
    size: number;
  }>;
  media_files?: Array<{
    id: string;
    url: string;
    type: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }>;
}

export function CalendarView({ onClose, onViewCapsule, onCreateCapsule }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [capsules, setCapsules] = useState<Capsule[]>([]); // SENT capsules only (matching Dashboard)
  const [receivedCapsules, setReceivedCapsules] = useState<Capsule[]>([]); // RECEIVED capsules only (matching Dashboard)
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [showCapsuleDialog, setShowCapsuleDialog] = useState(false);
  const [showCapsuleListDialog, setShowCapsuleListDialog] = useState(false);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [deduplicatedTotal, setDeduplicatedTotal] = useState(0); // Deduplicated count matching Dashboard logic
  const [receivedCount, setReceivedCount] = useState(0); // Total received count (for stats display)
  const [receivedLoading, setReceivedLoading] = useState(true); // ✅ NEW: Track loading state for received capsules
  const [sentCapsulesCount, setSentCapsulesCount] = useState({ scheduled: 0, delivered: 0, draft: 0, failed: 0 }); // Counts for sent capsules only
  
  const currentMonth = getMonth(currentDate);
  const currentYear = getYear(currentDate);

  // Get user ID from auth
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        console.log('📅 CalendarView: Component mounting with user:', session.user.id);
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  // Load capsules when userId is available
  useEffect(() => {
    if (userId) {
      console.log('📅 CalendarView: useEffect triggered with userId:', userId);
      loadCapsules();
    }
  }, [userId]);

  const loadCapsules = async () => {
    console.log('📅 CalendarView: Starting to load capsules...')
    setIsLoading(true);
    setReceivedLoading(true); // ✅ Start loading received
    
    try {
      // ✅ PHASE 3: Cache-First Strategy - Show cached received data immediately
      const receivedCacheKey = `received_capsules_${userId}`;
      const cachedReceivedStr = localStorage.getItem(receivedCacheKey);
      
      if (cachedReceivedStr) {
        try {
          const cachedReceived = JSON.parse(cachedReceivedStr);
          const cacheAge = Date.now() - cachedReceived.timestamp;
          
          // Show cached data immediately
          console.log(`⚡ [CalendarView] Using cached received data (age: ${Math.round(cacheAge/1000)}s)`);
          setReceivedCount(cachedReceived.count || 0);
          setReceivedCapsules(cachedReceived.capsules || []);
          setReceivedLoading(false); // ✅ Cache loaded
        } catch (e) {
          console.warn('Failed to parse cached received data:', e);
        }
      }
      
      console.log('📅 CalendarView: Fetching capsules via DatabaseService...');
      
      // Fetch both sent and received capsules
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;
      
      // Match Dashboard's logic: Load ALL capsules to ensure accurate calendar and stats
      // Classic view fetches everything to calculate stats correctly client-side if server stats fail,
      // and we need all capsules to populate the calendar grid anyway.
      const LIMIT = undefined; // Fetch all
      
      // ✅ PHASE 2: Parallel fetching (already implemented)
      const [sentResult, receivedData, serverStats] = await Promise.all([
        DatabaseService.getUserTimeCapsules(userId, LIMIT, 0),
        DatabaseService.getReceivedCapsules(userId, userEmail),
        DatabaseService.getCapsuleStats(userId)
      ]);
      
      console.log('📅 CalendarView: Received sent capsules:', sentResult);
      console.log('📅 CalendarView: Received received capsules:', receivedData);
      
      const sentCapsules = sentResult.capsules || [];
      const receivedCapsules = receivedData || [];
      
      // Store sent capsules in capsules state
      setCapsules(sentCapsules);
      
      // Store received capsules in receivedCapsules state
      setReceivedCapsules(receivedCapsules);
      
      // Use Server Stats if available (to match Classic View exactly), otherwise calculate
      if (serverStats && !serverStats.error) {
        console.log('📅 Using Server Stats:', serverStats);
        setSentCapsulesCount({
          scheduled: serverStats.scheduled || 0,
          delivered: serverStats.delivered || 0,
          draft: serverStats.draft || 0,
          failed: serverStats.failed || 0
        });
        
        // ✅ CRITICAL FIX: Calculate received count EXACTLY like Classic View (Dashboard.tsx line 1753-1757)
        // Count self-delivered capsules + received capsules (without double-counting)
        const calculatedReceivedCount = sentCapsules.filter(c => 
          c.status === 'delivered' && c.recipient_type === 'self'
        ).length + receivedCapsules.filter(rc => 
          !sentCapsules.some(sc => sc.id === rc.id) // Don't double-count
        ).length;
        
        setReceivedCount(calculatedReceivedCount);
        setReceivedLoading(false); // ✅ Done loading received
        
        const totalCount = (serverStats.total || 0) + 
                          Math.max(0, receivedCapsules.length - (serverStats.selfOnlyDelivered || 0));
        setDeduplicatedTotal(totalCount);
      } else {
        // Fallback to client-side calculation (now accurate because we fetched ALL capsules)
        
        // 1. Scheduled: All scheduled capsules (excluding drafts)
        const scheduled = sentCapsules.filter(c => 
          c.delivery_date && c.status !== 'delivered' && c.status !== 'failed' && c.status !== 'draft'
        );
        
        // 2. Delivered: All delivered capsules (MATCHING CLASSIC VIEW)
        // Classic view counts ALL delivered capsules in the "Delivered" tab/stat
        const delivered = sentCapsules.filter(c => c.status === 'delivered');
        
        const draft = sentCapsules.filter(c => 
          (c.status === 'draft') || (!c.delivery_date && c.status !== 'delivered' && c.status !== 'failed')
        );
        const failed = sentCapsules.filter(c => c.status === 'failed');
        
        // Set stats
        setSentCapsulesCount({
          scheduled: scheduled.length,
          delivered: delivered.length,
          draft: draft.length,
          failed: failed.length
        });
        
        // ✅ CRITICAL FIX: Calculate received count EXACTLY like Classic View (fallback path)
        // Count self-delivered capsules + received capsules (without double-counting)
        const calculatedReceivedCount = sentCapsules.filter(c => 
          c.status === 'delivered' && c.recipient_type === 'self'
        ).length + receivedCapsules.filter(rc => 
          !sentCapsules.some(sc => sc.id === rc.id) // Don't double-count
        ).length;
        
        setReceivedCount(calculatedReceivedCount);
        setReceivedLoading(false); // ✅ Done loading received (fallback path)
        
        // Deduplicated total
        const selfOnlyDelivered = sentCapsules.filter(c => 
          c.status === 'delivered' && c.recipient_type === 'self'
        );
        const totalCreated = sentCapsules.length;
        const receivedFromOthersOnly = Math.max(0, receivedCapsules.length - selfOnlyDelivered.length);
        setDeduplicatedTotal(totalCreated + receivedFromOthersOnly);
      }
      
    } catch (error) {
      console.error('📅 CalendarView: Error loading capsules:', error);
      toast.error('Failed to load capsules. Please try again.');
      setReceivedLoading(false); // ✅ Stop loading on error
    } finally {
      setIsLoading(false);
    }
  };

  // Get capsules for a specific date
  const getCapsulesForDate = (date: Date) => {
    // CRITICAL FIX: Match Dashboard's "Classic View" logic EXACTLY
    // Calendar should show ALL capsules that appear in Classic view (24 capsules, not 14)
    // This includes: sent capsules + received capsules, with self-delivered marked as received
    
    // Step 1: Process sent capsules - mark self-delivered as received
    const processedSentCapsules = capsules.map(c => {
      const isSelfDelivered = c.status === 'delivered' && c.recipient_type === 'self';
      const isInReceivedList = receivedCapsules.some(rc => rc.id === c.id);
      
      if (isSelfDelivered || isInReceivedList) {
        return { ...c, is_received: true, status: 'received', _displayId: `received_${c.id}` };
      }
      return { ...c, is_received: false, _displayId: `sent_${c.id}` };
    });
    
    // Step 2: Build set of IDs already included (for deduplication)
    const includedIds = new Set(processedSentCapsules.map(c => c.id));
    
    // Step 3: Add received capsules that are NOT already in sent list
    const additionalReceivedCapsules = receivedCapsules
      .filter(rc => {
        const alreadyIncluded = includedIds.has(rc.id);
        const isSelfDelivered = rc.status === 'delivered' && rc.recipient_type === 'self';
        return !alreadyIncluded && !isSelfDelivered;
      })
      .map(rc => ({ ...rc, is_received: true, status: 'received', _displayId: `received_${rc.id}` }));
    
    // Step 4: Combine all capsules (matching Classic View)
    const allCapsulesForCalendar = [...processedSentCapsules, ...additionalReceivedCapsules];
    
    return allCapsulesForCalendar.filter(capsule => {
      // For DRAFTS: Show on created/revised date (updated_at takes priority over created_at)
      if (capsule.status === 'draft' || !capsule.delivery_date) {
        const draftDate = capsule.updated_at ? new Date(capsule.updated_at) : new Date(capsule.created_at);
        return isSameDay(draftDate, date);
      }
      
      // For SCHEDULED/DELIVERED/RECEIVED: Show on delivery date
      const deliveryDate = new Date(capsule.delivery_date);
      return isSameDay(deliveryDate, date);
    });
  };

  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for calendar grid
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date cell click (clicking on the date itself, not a capsule chip)
  const handleDateClick = (date: Date, event: React.MouseEvent) => {
    // Check if the click was on a capsule chip (it will have stopPropagation)
    if ((event.target as HTMLElement).closest('[data-capsule-chip]')) {
      return; // Let the chip's click handler deal with it
    }
    
    const dateCapsules = getCapsulesForDate(date);
    setSelectedDate(date); // Always set selected date for visual feedback
    
    if (dateCapsules.length > 0) {
      if (dateCapsules.length === 1) {
        // Single capsule - open via parent viewer
        if (onViewCapsule) {
          onViewCapsule(dateCapsules[0]);
        }
      } else {
        // Multiple capsules - show list dialog
        setShowCapsuleListDialog(true);
      }
    } else {
      // ⚡ QUICK ADD: Empty date clicked - create capsule for this date
      // Only allow Quick Add for today and future dates, not past dates
      const isDateInPast = isPast(date) && !isToday(date);
      if (onCreateCapsule && !isDateInPast) {
        console.log('📅 Quick Add triggered for date:', date);
        onCreateCapsule(date);
        toast.success(`Creating capsule for ${format(date, 'MMM d, yyyy')}`, {
          description: 'Delivery date has been pre-filled!',
          duration: 3000,
        });
      }
    }
  };

  // Handle individual capsule chip click
  const handleCapsuleChipClick = (capsule: Capsule, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent date click from firing
    console.log('📅 CalendarView: Chip clicked:', {
      id: capsule.id,
      _displayId: capsule._displayId,
      title: capsule.title,
      is_received: capsule.is_received,
      status: capsule.status
    });
    // Use parent's viewer instead of our own
    if (onViewCapsule) {
      onViewCapsule(capsule);
    }
  };

  // Handle capsule click from the list dialog
  const handleCapsuleClick = (capsule: Capsule) => {
    console.log('📅 CalendarView: List item clicked:', {
      id: capsule.id,
      _displayId: capsule._displayId,
      title: capsule.title,
      is_received: capsule.is_received,
      status: capsule.status
    });
    // 🔥 FIX: DON'T close the list dialog - keep it open so user returns to it after viewing capsule
    // setShowCapsuleListDialog(false); // REMOVED - keep dialog open
    // Use parent's viewer instead of our own
    if (onViewCapsule) {
      onViewCapsule(capsule);
    }
  };

  // Handle media preview
  const handleViewMedia = (attachment: any) => {
    setPreviewMedia({
      id: attachment.id,
      file_name: attachment.filename || attachment.file_name,    // ✅ Support both formats
      file_type: attachment.type || attachment.file_type,
      file_size: attachment.size || attachment.file_size,         // ✅ Support both formats
      url: attachment.url,
      created_at: new Date().toISOString()
    });
    setShowMediaPreview(true);
  };

  // Check if a capsule can be edited
  const canEditCapsule = (capsule: Capsule) => {
    if (!capsule) return false;
    
    // Received capsules cannot be edited
    if (capsule.is_received) return false;
    
    // Drafts are always editable
    if (!capsule.delivery_date || capsule.status === 'draft') return true;
    
    // Delivered capsules cannot be edited
    if (capsule.status === 'delivered') return false;
    
    // For scheduled capsules, check if there's enough time before delivery
    if (capsule.status === 'scheduled') {
      try {
        const deliveryTime = new Date(capsule.delivery_date);
        const now = new Date();
        const minMinutesBeforeDelivery = 1;
        const timeDiff = deliveryTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        return minutesDiff >= minMinutesBeforeDelivery;
      } catch {
        return false;
      }
    }
    
    return false;
  };

  // Get status color
  const getStatusColor = (status: string, isReceived: boolean = false) => {
    // If it's a received capsule, use gold/yellow color
    if (isReceived) {
      return 'bg-yellow-500';
    }
    
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'draft':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/20 dark:text-green-300 dark:border-green-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950/20 dark:text-gray-300 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <>
      <div className="w-full h-full overflow-auto bg-slate-950">
        <Card className="border-0 shadow-none h-full bg-slate-950">
          <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-indigo-900/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Calendar View
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  Visualize your time capsule timeline
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 md:p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <>
                {/* Calendar Header - MOBILE ONLY */}
                <div className="flex md:hidden items-center justify-center gap-2 mb-3">
                  {/* Left: Previous */}
                  <button
                    onClick={goToPreviousMonth}
                    className="h-9 w-9 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center shrink-0 text-white text-lg"
                    aria-label="Previous month"
                  >
                    ‹
                  </button>

                  {/* Center: Month + Year */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={currentMonth.toString()}
                      onValueChange={(value) => {
                        const monthIndex = parseInt(value);
                        setCurrentDate(setMonth(setYear(new Date(), currentYear), monthIndex));
                      }}
                    >
                      <SelectTrigger className="h-9 w-[140px] bg-slate-800 border-slate-700 text-white text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={currentYear.toString()}
                      onValueChange={(value) => {
                        const year = parseInt(value);
                        setCurrentDate(setMonth(setYear(new Date(), year), currentMonth));
                      }}
                    >
                      <SelectTrigger className="h-9 w-[70px] bg-slate-800 border-slate-700 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 21 }, (_, i) => {
                          const year = new Date().getFullYear() - 1 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Right: Next */}
                  <button
                    onClick={goToNextMonth}
                    className="h-9 w-9 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center shrink-0 text-white text-lg"
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>

                {/* Calendar Header - DESKTOP ONLY */}
                <div className="hidden md:grid grid-cols-3 items-center mb-3">
                  {/* Left spacer */}
                  <div></div>

                  {/* Center navigation controls */}
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={goToPreviousMonth}
                      className="h-8 w-8 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center shrink-0 text-white text-lg"
                      aria-label="Previous month"
                    >
                      ‹
                    </button>
                    <Select
                      value={currentMonth.toString()}
                      onValueChange={(value) => {
                        const monthIndex = parseInt(value);
                        setCurrentDate(setMonth(setYear(new Date(), currentYear), monthIndex));
                      }}
                    >
                      <SelectTrigger className="w-auto min-w-[120px] h-8 text-sm bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={currentYear.toString()}
                      onValueChange={(value) => {
                        const year = parseInt(value);
                        setCurrentDate(setMonth(setYear(new Date(), year), currentMonth));
                      }}
                    >
                      <SelectTrigger className="w-24 h-8 text-sm bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 21 }, (_, i) => {
                          const year = new Date().getFullYear() - 1 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={goToNextMonth}
                      className="h-8 w-8 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center shrink-0 text-white text-lg"
                      aria-label="Next month"
                    >
                      ›
                    </button>
                  </div>

                  {/* Right today button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToToday}
                      className="h-8 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                      title="Jump to current month"
                    >
                      <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                      Today
                    </Button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden backdrop-blur-sm">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 bg-slate-800/80 border-b border-slate-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div
                        key={day}
                        className="text-center py-1 text-xs font-semibold text-slate-300"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7">
                    {paddingDays.map((_, index) => (
                      <div
                        key={`padding-${index}`}
                        className="h-16 md:h-20 border-r border-b border-slate-800 bg-slate-900/30"
                      />
                    ))}
                    
                    {calendarDays.map(day => {
                      const dayNumber = day.getDate();
                      const dateCapsules = getCapsulesForDate(day);
                      const hasCapsules = dateCapsules.length > 0;
                      const isCurrentDay = isToday(day);
                      const isFutureDay = isFuture(day);
                      const isPastDay = isPast(day) && !isCurrentDay;
                      const isSelectedDay = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <div
                          key={day.toISOString()}
                          onClick={(e) => handleDateClick(day, e)}
                          className={`group h-16 md:h-20 border-r border-b border-slate-800 p-1 transition-all ${
                            hasCapsules 
                              ? 'cursor-pointer hover:bg-indigo-950/30' 
                              : 'cursor-pointer hover:bg-green-950/20 hover:ring-1 hover:ring-green-500/30'
                          } ${isCurrentDay ? 'bg-indigo-950/40 ring-1 ring-indigo-500/50' : ''} ${
                            isSelectedDay && !isCurrentDay ? 'ring-2 ring-indigo-500 ring-inset' : ''
                          }`}
                          title={hasCapsules ? undefined : '➕ Click to create capsule'}
                        >
                          <div className="h-full flex flex-col">
                            <div className={`text-xs mb-1 flex-shrink-0 ${
                              isCurrentDay 
                                ? 'font-bold text-indigo-400' 
                                : isPastDay
                                  ? 'text-slate-600'
                                  : 'text-slate-300'
                            }`}>
                              {dayNumber}
                            </div>
                            
                            {hasCapsules && (
                              <>
                                {/* MOBILE: Color indicators only */}
                                <div className="md:hidden flex-1 flex flex-wrap gap-0.5 content-start overflow-hidden min-h-0">
                                  {dateCapsules.map(capsule => {
                                    const colorClass = capsule.is_received 
                                      ? 'bg-yellow-500' 
                                      : capsule.status === 'scheduled' 
                                        ? 'bg-blue-500' 
                                        : capsule.status === 'delivered' 
                                          ? 'bg-green-500' 
                                          : 'bg-purple-500';
                                    return (
                                      <div
                                        key={capsule._displayId || capsule.id}
                                        className={`w-full h-1.5 rounded ${colorClass}`}
                                        title={capsule.title || 'Untitled'}
                                      />
                                    );
                                  })}
                                </div>

                                {/* DESKTOP: Text previews */}
                                <div className="hidden md:flex flex-1 flex-col gap-0.5 overflow-hidden min-h-0">
                                  {dateCapsules.slice(0, 3).map(capsule => (
                                    <div
                                      key={capsule._displayId || capsule.id}
                                      data-capsule-chip
                                      onClick={(e) => handleCapsuleChipClick(capsule, e)}
                                      className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate ${getStatusColor(capsule.status, capsule.is_received)} text-white font-medium shadow-sm cursor-pointer hover:opacity-80 transition-opacity`}
                                      title={capsule.title}
                                      style={{ 
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'block'
                                      }}
                                    >
                                      {capsule.title || 'Untitled'}
                                    </div>
                                  ))}
                                  {dateCapsules.length > 3 && (
                                    <div className="text-[9px] text-slate-400 px-1 font-medium">
                                      +{dateCapsules.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                            
                            {/* Quick Add indicator for empty dates */}
                            {!hasCapsules && onCreateCapsule && (
                              <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="text-2xl text-green-400">+</div>
                                  <div className="hidden md:block text-[10px] text-green-400">Add</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-2 md:gap-4 mt-2 text-[10px] md:text-sm flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded bg-blue-500" />
                    <span className="text-slate-300 whitespace-nowrap">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded bg-green-500" />
                    <span className="text-slate-300 whitespace-nowrap">Delivered</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded bg-yellow-500" />
                    <span className="text-slate-300 whitespace-nowrap">Received</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded bg-purple-500" />
                    <span className="text-slate-300 whitespace-nowrap">Draft</span>
                  </div>
                  {onCreateCapsule && (
                    <div className="flex items-center gap-1 ml-2 md:ml-4 border-l border-slate-700 pl-2 md:pl-4">
                      <div className="text-green-400 text-sm md:text-base">➕</div>
                      <span className="text-green-400 whitespace-nowrap">Click empty dates to create</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-2 mt-2">
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-blue-900/50 backdrop-blur-sm">
                    <div className="text-lg md:text-xl font-bold text-blue-400">
                      {sentCapsulesCount.scheduled}
                    </div>
                    <div className="text-[9px] md:text-xs text-blue-300 mt-0.5 whitespace-nowrap">Scheduled</div>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-green-900/50 backdrop-blur-sm">
                    <div className="text-lg md:text-xl font-bold text-green-400">
                      {sentCapsulesCount.delivered}
                    </div>
                    <div className="text-[9px] md:text-xs text-green-300 mt-0.5 whitespace-nowrap">Delivered</div>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-yellow-900/50 backdrop-blur-sm">
                    <div className="text-lg md:text-xl font-bold text-yellow-400">
                      {/* ✅ Show loading state for received count */}
                      {receivedLoading ? (
                        <span className="animate-pulse opacity-60">...</span>
                      ) : (
                        receivedCount
                      )}
                    </div>
                    <div className="text-[9px] md:text-xs text-yellow-300 mt-0.5 whitespace-nowrap">Received</div>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-purple-900/50 backdrop-blur-sm">
                    <div className="text-lg md:text-xl font-bold text-purple-400">
                      {sentCapsulesCount.draft}
                    </div>
                    <div className="text-[9px] md:text-xs text-purple-300 mt-0.5 whitespace-nowrap">Drafts</div>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700 backdrop-blur-sm">
                    <div className="text-lg md:text-xl font-bold text-slate-300">
                      {sentCapsulesCount.scheduled + sentCapsulesCount.delivered + receivedCount + sentCapsulesCount.draft}
                    </div>
                    <div className="text-[9px] md:text-xs text-slate-400 mt-0.5 whitespace-nowrap">Total</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Capsule Detail Dialog */}
        <Dialog open={showCapsuleDialog} onOpenChange={setShowCapsuleDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-800">
            {selectedCapsule && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white">
                    <CalendarIcon className="w-5 h-5 text-indigo-400" />
                    {selectedCapsule.title || 'Untitled Capsule'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    View details for this time capsule
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedCapsule.is_received ? (
                      <Badge className="bg-purple-950/30 text-purple-300 border-purple-700">
                        <Mail className="w-3 h-3 mr-1" />
                        Received
                      </Badge>
                    ) : (
                      <Badge className={getStatusBadgeColor(selectedCapsule.status)}>
                        {selectedCapsule.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                        {selectedCapsule.status === 'delivered' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {selectedCapsule.status === 'draft' && <FileText className="w-3 h-3 mr-1" />}
                        {selectedCapsule.status.charAt(0).toUpperCase() + selectedCapsule.status.slice(1)}
                      </Badge>
                    )}
                  </div>

                  {/* Delivery Date */}
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-indigo-900/50 backdrop-blur-sm">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <div className="text-sm text-indigo-300">
                      {format(new Date(selectedCapsule.delivery_date), "MMMM do, yyyy h:mm a")}
                    </div>
                  </div>

                  {/* Recipient Info */}
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 backdrop-blur-sm">
                    {selectedCapsule.recipient_type === 'self' ? (
                      <User className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Users className="w-5 h-5 text-slate-400" />
                    )}
                    <div className="text-sm text-slate-300 flex items-center gap-2">
                      {selectedCapsule.delivery_method === 'email' ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                      {selectedCapsule.recipient_type === 'self' 
                        ? selectedCapsule.self_contact || 'Self'
                        : `${selectedCapsule.recipients?.length || 0} recipient(s)`
                      }
                    </div>
                  </div>

                  {/* Message Preview */}
                  {selectedCapsule.text_message && (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-amber-900/30 backdrop-blur-sm">
                      <div className="text-sm text-amber-100/80 line-clamp-3 mb-2">
                        {selectedCapsule.text_message}
                      </div>
                      <button
                        onClick={() => {
                          const isDeliveredOrReceived = selectedCapsule.status === 'delivered' || selectedCapsule.is_received;
                          
                          if (isDeliveredOrReceived) {
                            // For delivered/received: Show in viewer modal
                            setShowCapsuleDialog(false);
                            if (onViewCapsule) {
                              onViewCapsule(selectedCapsule);
                            }
                          } else {
                            // For scheduled/draft: Navigate to edit
                            if (onViewCapsule) {
                              setShowCapsuleDialog(false);
                              onViewCapsule(selectedCapsule);
                            } else {
                              toast.info('Full capsule viewer not available');
                            }
                          }
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors group"
                      >
                        <span>View full capsule</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
                  )}

                  {/* Media Attachments */}
                  {((selectedCapsule.attachments && selectedCapsule.attachments.length > 0) || 
                    (selectedCapsule.media_files && selectedCapsule.media_files.length > 0)) && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Media Attachments ({selectedCapsule.media_files?.length || selectedCapsule.attachments?.length || 0})
                      </div>
                      <div className="space-y-2">
                        {/* Show media_files if available (received capsules) */}
                        {selectedCapsule.media_files && selectedCapsule.media_files.map((mediaFile) => {
                          return (
                            <button
                              key={mediaFile.id}
                              onClick={() => handleViewMedia({
                                id: mediaFile.id,
                                url: mediaFile.url,
                                type: mediaFile.type || mediaFile.file_type,
                                filename: mediaFile.file_name,
                                size: mediaFile.file_size
                              })}
                              className="w-full flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-indigo-900/50 hover:bg-slate-700/50 hover:border-indigo-700 transition-all group backdrop-blur-sm"
                            >
                              <div className="flex-shrink-0">
                                <MediaThumbnail
                                  mediaFile={{
                                    id: mediaFile.id,
                                    file_name: mediaFile.file_name,
                                    file_type: mediaFile.file_type || mediaFile.type,
                                    type: mediaFile.type || mediaFile.file_type,
                                    file_size: mediaFile.file_size,
                                    url: mediaFile.url,
                                    created_at: new Date().toISOString()
                                  }}
                                  size="md"
                                  showOverlay={false}
                                />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  {mediaFile.file_name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {(mediaFile.file_size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                              <Eye className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                            </button>
                          );
                        })}
                        {/* Show attachments if available (sent capsules) */}
                        {selectedCapsule.attachments && selectedCapsule.attachments.map((attachment) => {
                          return (
                            <button
                              key={attachment.id}
                              onClick={() => handleViewMedia(attachment)}
                              className="w-full flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-indigo-900/50 hover:bg-slate-700/50 hover:border-indigo-700 transition-all group backdrop-blur-sm"
                            >
                              <div className="flex-shrink-0">
                                <MediaThumbnail
                                  mediaFile={{
                                    id: attachment.id,
                                    file_name: attachment.filename,
                                    file_type: attachment.type,
                                    type: attachment.type,
                                    file_size: attachment.size,
                                    url: attachment.url,
                                    created_at: new Date().toISOString()
                                  }}
                                  size="md"
                                  showOverlay={false}
                                />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  {attachment.filename}
                                </div>
                                <div className="text-xs text-indigo-300">
                                  {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                              <Eye className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-800">
                    {format(new Date(selectedCapsule.created_at), 'PPP')}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Date Capsules List Dialog (when multiple capsules on same date) */}
        {selectedDate && (
          <Dialog open={showCapsuleListDialog} onOpenChange={(open) => {
            setShowCapsuleListDialog(open);
            if (!open) setSelectedDate(null);
          }}>
            <DialogContent className="max-w-xl bg-slate-900 border-slate-800 p-0 h-[85vh] flex flex-col overflow-hidden">
              <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-slate-800 flex-shrink-0">
                <DialogTitle className="flex items-center gap-2 text-white">
                  <CalendarIcon className="w-5 h-5 text-indigo-400" />
                  {format(selectedDate, 'MMMM d, yyyy')}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm md:text-base">
                  {getCapsulesForDate(selectedDate).length} capsule{getCapsulesForDate(selectedDate).length !== 1 ? 's' : ''} scheduled for this date
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-4 md:px-6 py-4">
                  <div className="space-y-4 pb-4">
                    {getCapsulesForDate(selectedDate).map(capsule => {
                      // Truncate message to first 14 words
                      const truncateToWords = (text: string, wordLimit: number) => {
                        if (!text) return '';
                        const words = text.split(' ');
                        if (words.length <= wordLimit) return text;
                        return words.slice(0, wordLimit).join(' ') + '...';
                      };

                      // Determine what time to show based on status
                      const getTimeDisplay = () => {
                        if (capsule.is_received) {
                          return format(new Date(capsule.delivery_date), 'p');
                        } else if (capsule.status === 'delivered') {
                          return format(new Date(capsule.delivery_date), 'p');
                        } else if (capsule.status === 'scheduled') {
                          return format(new Date(capsule.delivery_date), 'MMM d, yyyy • p');
                        } else {
                          const draftTime = capsule.updated_at || capsule.created_at;
                          return format(new Date(draftTime), 'p');
                        }
                      };

                      return (
                        <div
                          key={capsule._displayId || capsule.id}
                          onClick={() => handleCapsuleClick(capsule)}
                          className="w-full p-5 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer"
                        >
                          {/* Title */}
                          <h3 className="text-base font-semibold text-white text-center mb-3 line-clamp-2">
                            {capsule.title || 'Untitled Capsule'}
                          </h3>

                          {/* Badge */}
                          <div className="flex justify-center mb-3">
                            {capsule.is_received ? (
                              <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                Received
                              </span>
                            ) : (
                              <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                                capsule.status === 'scheduled' 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                  : capsule.status === 'delivered'
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}>
                                {capsule.status.charAt(0).toUpperCase() + capsule.status.slice(1)}
                              </span>
                            )}
                          </div>

                          {/* Message */}
                          {capsule.text_message && (
                            <p className="text-sm text-slate-300 text-center mb-3 leading-relaxed">
                              {truncateToWords(capsule.text_message, 14)}
                            </p>
                          )}

                          {/* Time/Date */}
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeDisplay()}</span>
                            {capsule.media_count > 0 && (
                              <>
                                <span className="mx-1">•</span>
                                <Image className="w-4 h-4" />
                                <span>{capsule.media_count}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Media Preview Modal */}
        {previewMedia && (
          <MediaPreviewModal
            isOpen={showMediaPreview}
            onClose={() => {
              setShowMediaPreview(false);
              setPreviewMedia(null);
            }}
            mediaFile={previewMedia}
          />
        )}
      </div>
    </>
  );
}