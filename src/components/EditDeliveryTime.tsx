import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Clock, Calendar as CalendarIcon, Globe, Edit } from 'lucide-react';
import { format, setYear, setMonth, isToday } from 'date-fns@4.1.0';
import { toast } from 'sonner@2.0.3';
import { DatabaseService } from '../utils/supabase/database';
import { TIME_ZONES, getUserTimeZone, formatInUserTimeZone, convertToUTCForStorage } from '../utils/timezone';

interface EditDeliveryTimeProps {
  capsule: any;
  onUpdate: () => void;
}

export function EditDeliveryTime({ capsule, onUpdate }: EditDeliveryTimeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    deliveryDate: null,
    deliveryTime: 'custom_time',
    customHour: '12',
    customMinute: '00',
    customPeriod: 'PM',
    timeZone: getUserTimeZone()
  });
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [timeUntilDelivery, setTimeUntilDelivery] = useState('');

  // Generate years (current year + 20 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear + i);
  
  // Months array
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Check if capsule can be edited (at least 1 minute before delivery)
  const checkCanEdit = () => {
    if (!capsule || capsule.status !== 'scheduled' || !capsule.delivery_date || !capsule.delivery_time) {
      console.log('❌ checkCanEdit failed - missing data:', {
        hasCapsule: !!capsule,
        status: capsule?.status,
        hasDeliveryDate: !!capsule?.delivery_date,
        hasDeliveryTime: !!capsule?.delivery_time
      });
      setCanEdit(false);
      return;
    }

    try {
      // Parse the stored UTC delivery date/time
      const deliveryDateTime = new Date(`${capsule.delivery_date}T${capsule.delivery_time}:00.000Z`);
      if (isNaN(deliveryDateTime.getTime())) {
        console.log('❌ checkCanEdit failed - invalid delivery date:', capsule.delivery_date, capsule.delivery_time);
        setCanEdit(false);
        return;
      }
      
      const now = new Date();
      const timeDifference = deliveryDateTime.getTime() - now.getTime();
      const minutesUntilDelivery = Math.floor(timeDifference / (1000 * 60));

      console.log('✅ checkCanEdit calculated:', {
        deliveryDateTime: deliveryDateTime.toISOString(),
        now: now.toISOString(),
        minutesUntilDelivery,
        canEdit: minutesUntilDelivery >= 1
      });

      setCanEdit(minutesUntilDelivery >= 1);
      
      if (minutesUntilDelivery >= 1) {
        const hoursUntil = Math.floor(minutesUntilDelivery / 60);
        const remainingMinutes = minutesUntilDelivery % 60;
        
        if (hoursUntil > 24) {
          const daysUntil = Math.floor(hoursUntil / 24);
          const remainingHours = hoursUntil % 24;
          setTimeUntilDelivery(`${daysUntil} day${daysUntil !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`);
        } else if (hoursUntil > 0) {
          setTimeUntilDelivery(`${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
        } else {
          setTimeUntilDelivery(`${minutesUntilDelivery} minute${minutesUntilDelivery !== 1 ? 's' : ''}`);
        }
      } else {
        setTimeUntilDelivery('');
      }
    } catch (error) {
      console.error('Error checking if capsule can be edited:', error);
      setCanEdit(false);
    }
  };

  // Initialize form data when capsule changes or dialog opens
  useEffect(() => {
    if (capsule && isOpen) {
      try {
        // Parse the stored UTC delivery date/time and convert to user's timezone for editing
        if (!capsule.delivery_date || !capsule.delivery_time) {
          return; // Skip if invalid data
        }
        const utcDeliveryDateTime = new Date(`${capsule.delivery_date}T${capsule.delivery_time}:00.000Z`);
        if (isNaN(utcDeliveryDateTime.getTime())) {
          return; // Skip if invalid date
        }
        
        // Convert to user's timezone for display/editing
        const userTimeZone = capsule.time_zone || getUserTimeZone();
        const localDateTime = new Date(utcDeliveryDateTime.toLocaleString('en-US', { timeZone: userTimeZone }));
        
        setDeliveryData({
          deliveryDate: localDateTime,
          deliveryTime: 'custom_time',
          customHour: capsule.custom_hour || localDateTime.getHours() > 12 ? 
            (localDateTime.getHours() - 12).toString().padStart(2, '0') :
            localDateTime.getHours() === 0 ? '12' : localDateTime.getHours().toString().padStart(2, '0'),
          customMinute: capsule.custom_minute || localDateTime.getMinutes().toString().padStart(2, '0'),
          customPeriod: capsule.custom_period || (localDateTime.getHours() >= 12 ? 'PM' : 'AM'),
          timeZone: userTimeZone
        });
        
        setCalendarDate(localDateTime);
      } catch (error) {
        console.error('Error initializing form data:', error);
        // Fallback to current values
        setDeliveryData({
          deliveryDate: new Date(),
          deliveryTime: 'custom_time',
          customHour: '12',
          customMinute: '00',
          customPeriod: 'PM',
          timeZone: capsule.time_zone || getUserTimeZone()
        });
      }
    }
  }, [capsule, isOpen]);

  // Check if editing is allowed when component mounts and periodically
  useEffect(() => {
    checkCanEdit();
    const interval = setInterval(checkCanEdit, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [capsule]);

  const handleYearChange = (year) => {
    const newDate = setYear(calendarDate, parseInt(year));
    setCalendarDate(newDate);
  };

  const handleMonthChange = (monthIndex) => {
    const newDate = setMonth(calendarDate, parseInt(monthIndex));
    setCalendarDate(newDate);
  };

  const handleDateSelect = (date) => {
    if (date) {
      setDeliveryData(prev => ({ ...prev, deliveryDate: date }));
      setCalendarDate(date);
      setIsCalendarOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate that we still can edit (recheck)
      if (!canEdit) {
        toast.error('This capsule can no longer be edited - delivery time is too close');
        setIsOpen(false);
        return;
      }

      // Validate delivery date
      if (!deliveryData.deliveryDate) {
        toast.error('Please select a delivery date');
        return;
      }

      // Check if scheduling for a time that has already passed today
      if (isToday(deliveryData.deliveryDate)) {
        const now = new Date();
        const selectedHour = deliveryData.customPeriod === 'PM' && deliveryData.customHour !== '12' 
          ? parseInt(deliveryData.customHour) + 12 
          : deliveryData.customPeriod === 'AM' && deliveryData.customHour === '12'
          ? 0
          : parseInt(deliveryData.customHour);
        const selectedMinute = parseInt(deliveryData.customMinute);
        
        const selectedTime = new Date();
        selectedTime.setHours(selectedHour, selectedMinute, 0, 0);
        
        if (selectedTime <= now) {
          toast.error('Cannot schedule a capsule for a time that has already passed today. Please select a future time or a future date.');
          return;
        }
      }

      // Convert the local time to UTC for storage
      const hour = deliveryData.customPeriod === 'PM' && deliveryData.customHour !== '12' 
        ? parseInt(deliveryData.customHour) + 12 
        : deliveryData.customPeriod === 'AM' && deliveryData.customHour === '12'
        ? 0
        : parseInt(deliveryData.customHour);
      const minute = parseInt(deliveryData.customMinute);
      
      const utcDateTime = convertToUTCForStorage(
        deliveryData.deliveryDate.getFullYear(),
        deliveryData.deliveryDate.getMonth(),
        deliveryData.deliveryDate.getDate(),
        hour,
        minute,
        deliveryData.timeZone
      );
      
      const deliveryDate = format(utcDateTime, 'yyyy-MM-dd');
      const deliveryTime = format(utcDateTime, 'HH:mm');

      // Update the capsule
      await DatabaseService.updateTimeCapsule(capsule.id, {
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        custom_hour: deliveryData.customHour,
        custom_minute: deliveryData.customMinute,
        custom_period: deliveryData.customPeriod,
        time_zone: deliveryData.timeZone
      });

      toast.success('Delivery time updated successfully!');
      setIsOpen(false);
      onUpdate(); // Refresh the dashboard
    } catch (error) {
      console.error('Error updating delivery time:', error);
      toast.error('Failed to update delivery time');
    } finally {
      setIsLoading(false);
    }
  };

  // Only render for scheduled capsules
  if (capsule?.status !== 'scheduled') {
    console.log('🚫 EditDeliveryTime: Not rendering because status is not scheduled:', capsule?.status);
    return null;
  }

  console.log('✅ EditDeliveryTime: Rendering button. Can edit:', canEdit, 'Capsule:', {
    id: capsule?.id,
    delivery_date: capsule?.delivery_date,
    delivery_time: capsule?.delivery_time,
    status: capsule?.status
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className={`flex items-center gap-1 px-2 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!canEdit}
          title={!canEdit ? 'Cannot edit - delivery time is too close' : 'Edit delivery time'}
        >
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Time</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Delivery Time
          </DialogTitle>
          <DialogDescription>
            Change when this time capsule should be delivered. The delivery date and time will be updated accordingly.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Current delivery:</strong> {timeUntilDelivery} from now
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              You can edit this capsule until 1 minute before delivery
            </p>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Delivery Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryData.deliveryDate ? (
                    format(deliveryData.deliveryDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="p-3 border-b bg-muted/30">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={calendarDate.getMonth().toString()}
                      onValueChange={handleMonthChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={calendarDate.getFullYear().toString()}
                      onValueChange={handleYearChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Calendar
                  mode="single"
                  selected={deliveryData.deliveryDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  month={calendarDate}
                  onMonthChange={setCalendarDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          {deliveryData.deliveryDate && (
            <div className="space-y-2">
              <Label className="text-sm">Choose delivery time</Label>
              <div className="flex items-center gap-2">
                {/* Hour */}
                <Select
                  value={deliveryData.customHour}
                  onValueChange={(value) => setDeliveryData(prev => ({ 
                    ...prev, 
                    customHour: value 
                  }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = (i + 1).toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                <span className="text-muted-foreground">:</span>
                
                {/* Minute */}
                <Input
                  type="text"
                  className="w-20 text-center"
                  value={deliveryData.customMinute}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,2}$/.test(value)) {
                      setDeliveryData(prev => ({ 
                        ...prev, 
                        customMinute: value
                      }));
                    }
                  }}
                  onFocus={(e) => {
                    if (deliveryData.customMinute === '00') {
                      setDeliveryData(prev => ({ ...prev, customMinute: '' }));
                    }
                    e.target.select();
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value === '' || isNaN(parseInt(value))) {
                      setDeliveryData(prev => ({ ...prev, customMinute: '00' }));
                    } else {
                      const numValue = parseInt(value);
                      const validValue = Math.max(0, Math.min(59, numValue));
                      setDeliveryData(prev => ({ ...prev, customMinute: validValue.toString().padStart(2, '0') }));
                    }
                  }}
                  placeholder="00"
                  maxLength={2}
                />
                
                {/* AM/PM */}
                <Select
                  value={deliveryData.customPeriod}
                  onValueChange={(value) => setDeliveryData(prev => ({ 
                    ...prev, 
                    customPeriod: value 
                  }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Time Zone Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Time Zone
            </Label>
            <Select
              value={deliveryData.timeZone}
              onValueChange={(value) => setDeliveryData(prev => ({ 
                ...prev, 
                timeZone: value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your time zone" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {TIME_ZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    <div className="flex flex-col">
                      <span>{tz.label}</span>
                      <span className="text-xs text-muted-foreground">{tz.offset}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Updating...' : 'Update Delivery Time'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}