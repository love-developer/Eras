// Time zone utility functions for Eras application
import { format } from 'date-fns';

// Common time zones with their IANA names and display labels
export const TIME_ZONES = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label:'Mountain Time (MT)', offset: 'UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/-7' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9/-8' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'UTC-10' },
  
  // Europe
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Rome', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Madrid', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Amsterdam', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Stockholm', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
  { value: 'Europe/Helsinki', label: 'Eastern European Time (EET)', offset: 'UTC+2/+3' },
  { value: 'Europe/Athens', label: 'Eastern European Time (EET)', offset: 'UTC+2/+3' },
  { value: 'Europe/Istanbul', label: 'Turkey Time (TRT)', offset: 'UTC+3' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time (MSK)', offset: 'UTC+3' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: 'UTC+4' },
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time (PKT)', offset: 'UTC+5' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: 'UTC+5:30' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time (BST)', offset: 'UTC+6' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)', offset: 'UTC+7' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time (HKT)', offset: 'UTC+8' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 'UTC+10/+11' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time (AET)', offset: 'UTC+10/+11' },
  { value: 'Australia/Brisbane', label: 'Australian Eastern Time (AET)', offset: 'UTC+10' },
  { value: 'Australia/Perth', label: 'Australian Western Time (AWT)', offset: 'UTC+8' },
  
  // Other regions
  { value: 'Africa/Cairo', label: 'Eastern European Time (EET)', offset: 'UTC+2' },
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time (SAST)', offset: 'UTC+2' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT)', offset: 'UTC-3' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (ART)', offset: 'UTC-3' },
  { value: 'Pacific/Auckland', label: 'New Zealand Standard Time (NZST)', offset: 'UTC+12/+13' },
];

/**
 * Get the user's detected time zone based on their browser
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect user time zone:', error);
    return 'UTC'; // fallback
  }
}

/**
 * Get a user-friendly display name for a time zone
 */
export function getTimeZoneDisplay(timeZone: string | { value: string; label: string; offset: string }): string {
  // Handle if an object is passed instead of a string
  if (typeof timeZone === 'object' && timeZone !== null) {
    if ('label' in timeZone && 'offset' in timeZone) {
      return `${timeZone.label} (${timeZone.offset})`;
    }
    if ('value' in timeZone) {
      timeZone = timeZone.value;
    } else {
      console.warn('Invalid timezone object passed to getTimeZoneDisplay:', timeZone);
      return 'Unknown Timezone';
    }
  }
  
  // Ensure we have a string
  if (typeof timeZone !== 'string') {
    console.warn('Invalid timezone type passed to getTimeZoneDisplay:', typeof timeZone, timeZone);
    return 'Unknown Timezone';
  }
  
  const found = TIME_ZONES.find(tz => tz.value === timeZone);
  if (found) {
    return `${found.label} (${found.offset})`;
  }
  
  // For time zones not in our list, try to format nicely
  try {
    const now = new Date();
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const offsetStr = `UTC${sign}${offsetHours.toString().padStart(2, '0')}${offsetMins > 0 ? ':' + offsetMins.toString().padStart(2, '0') : ''}`;
    
    return `${timeZone.replace('_', ' ')} (${offsetStr})`;
  } catch (error) {
    console.warn('Error formatting timezone:', error);
    return timeZone || 'Unknown Timezone';
  }
}

/**
 * Convert a local date/time to UTC for database storage
 */
export function toUTC(date: Date, timeZone: string): Date {
  try {
    console.log('🌍 toUTC conversion:', {
      inputDate: date,
      inputISO: date.toISOString(),
      timeZone: timeZone
    });

    // Get the date/time components as they would appear in the target timezone
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    
    // Create a new date assuming the components are in UTC
    const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));
    
    // Get the offset of the target timezone at this moment
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone,
      timeZoneName: 'longOffset'
    });
    
    const offsetString = formatter.formatToParts(utcDate).find(part => part.type === 'timeZoneName')?.value;
    const offsetMatch = offsetString?.match(/GMT([+-])(\d{2}):(\d{2})/);
    
    if (offsetMatch) {
      const sign = offsetMatch[1] === '+' ? 1 : -1;
      const offsetHours = parseInt(offsetMatch[2], 10);
      const offsetMinutes = parseInt(offsetMatch[3], 10);
      const totalOffsetMinutes = sign * (offsetHours * 60 + offsetMinutes);
      
      // Adjust for the timezone offset
      return new Date(utcDate.getTime() - (totalOffsetMinutes * 60000));
    }
    
    return utcDate;
  } catch (error) {
    console.warn('UTC conversion failed:', error);
    return date;
  }
}

/**
 * Convert a UTC date from database to local time zone
 * CRITICAL: This creates a Date object whose browser-local components match the target timezone's components
 * This is necessary because JavaScript Date objects don't have timezone info - they're always UTC internally
 */
export function fromUTC(utcDate: Date, timeZone: string): Date {
  try {
    // Get the date/time components as they appear in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(utcDate);
    const getValue = (type: string) => {
      const part = parts.find(p => p.type === type);
      return part ? parseInt(part.value, 10) : 0;
    };
    
    // Extract components in target timezone
    const year = getValue('year');
    const month = getValue('month') - 1; // 0-based for Date constructor
    const day = getValue('day');
    const hour = getValue('hour');
    const minute = getValue('minute');
    const second = getValue('second');
    
    // Create a Date object with these components in the BROWSER'S local timezone
    // This is intentionally "lying" about the timezone to make the rest of the code work
    // When the code later calls getFullYear(), getMonth(), etc. on this Date object,
    // it will get back these components (in browser's timezone), which we then pass
    // to convertToUTCForStorage WITH the target timezone to get the correct UTC time
    const result = new Date(year, month, day, hour, minute, second);
    
    console.log('🌍 fromUTC conversion:', {
      utcInput: utcDate.toISOString(),
      targetTimezone: timeZone,
      extractedComponents: { year, month: month+1, day, hour, minute, second },
      resultAsString: result.toString(),
      resultLocalComponents: {
        year: result.getFullYear(),
        month: result.getMonth() + 1,
        day: result.getDate(),
        hour: result.getHours(),
        minute: result.getMinutes()
      }
    });
    
    return result;
  } catch (error) {
    console.warn('❌ Local time conversion failed:', error);
    return utcDate;
  }
}

/**
 * Format a date in a specific time zone
 */
export function formatInUserTimeZone(
  date: Date, 
  timeZone: string, 
  formatString: string = 'PPP p'
): string {
  try {
    // Convert the date to the target timezone for formatting
    const zonedDate = fromUTC(date, timeZone);
    return format(zonedDate, formatString);
  } catch (error) {
    console.warn('Time zone formatting failed:', error);
    return format(date, formatString);
  }
}

/**
 * Get current time in a specific time zone
 */
export function getCurrentTimeInTimeZone(timeZone: string): Date {
  try {
    const now = new Date();
    
    // Get current time in the specified timezone
    const options = {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    const timeString = now.toLocaleString('sv-SE', options);
    return new Date(timeString);
  } catch (error) {
    console.warn('Current time conversion failed:', error);
    return new Date();
  }
}

/**
 * Calculate delivery time with time zone awareness
 */
export function calculateDeliveryDateTime(
  deliveryDate: Date | null,
  deliveryTime: string,
  customValues: {
    customHour?: string;
    customMinute?: string;
    customPeriod?: string;
  },
  timeZone: string
): Date {
  const now = getCurrentTimeInTimeZone(timeZone);
  
  switch (deliveryTime) {
    case 'immediate':
      return now;
      
    case 'custom_time':
      if (!deliveryDate) return now;
      
      // Work with the delivery date in the user's timezone
      const localDeliveryDate = new Date(deliveryDate);
      const hour = customValues.customPeriod === 'PM' && customValues.customHour !== '12' 
        ? parseInt(customValues.customHour || '12') + 12 
        : customValues.customPeriod === 'AM' && customValues.customHour === '12'
        ? 0
        : parseInt(customValues.customHour || '12');
      
      localDeliveryDate.setHours(hour, parseInt(customValues.customMinute || '0'), 0, 0);
      return localDeliveryDate;
      
    default:
      if (deliveryDate) {
        const localDeliveryDate = new Date(deliveryDate);
        localDeliveryDate.setHours(12, 0, 0, 0);
        return localDeliveryDate;
      }
      return now;
  }
}

/**
 * Check if a time zone is valid
 */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone }).format(new Date());
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get time zone abbreviation (e.g., "PST", "EST")
 */
export function getTimeZoneAbbreviation(timeZone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart?.value || timeZone;
  } catch (error) {
    return timeZone;
  }
}

/**
 * Simple and reliable timezone conversion for the Create Capsule component
 * Converts local time components to UTC for storage
 */
export function convertToUTCForStorage(
  year: number,
  month: number, // 0-based (0 = January)
  day: number,
  hour: number, // 24-hour format
  minute: number,
  timeZone: string
): Date {
  try {
    console.log('🌍 convertToUTCForStorage INPUT:', {
      year,
      month: month + 1, // Display as 1-based
      day,
      hour,
      minute,
      timeZone
    });

    // Validate inputs
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
      throw new Error('Invalid date components provided');
    }

    // 1. Create a "naive" date (UTC) with the desired components
    // This represents "The time we want it to be in the target timezone"
    const targetComponentsAsUTC = new Date(Date.UTC(year, month, day, hour, minute, 0));
    
    // 2. Iterative approach to find the UTC time that produces these components in the target timezone
    // Start with a guess: assume UTC = Target Time (usually off by offset)
    let guess = new Date(targetComponentsAsUTC);
    
    // Limit iterations to prevent infinite loops (though it usually converges in 1-2 steps)
    for (let i = 0; i < 4; i++) {
       // Check what time our guess is in the target timezone
       const formattedInZone = guess.toLocaleString('en-US', {
          timeZone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false
       });
       
       // Parse the formatted string back to components to compare with what we want
       // Format is typically "M/D/YYYY, HH:MM:SS" or similar depending on locale, 
       // but en-US with specific options usually gives "M/D/YYYY, HH:MM:SS"
       const parts = formattedInZone.match(/(\d+)\/(\d+)\/(\d+),\s+(\d+):(\d+):(\d+)/);
       
       if (!parts) {
         // Fallback if parsing fails (shouldn't happen with en-US)
         console.warn('Could not parse localized date string:', formattedInZone);
         // Try simplified offset method
         const offset = guess.getTimezoneOffset(); // This is browser offset, not target!
         // We can't use browser offset.
         break;
       }
       
       const [_, m, d, y, h, min, s] = parts.map(Number);
       // Create a UTC date from what the timezone "says" it is
       const actualInZoneAsUTC = new Date(Date.UTC(y, m-1, d, h, min, s));
       
       // Calculate difference between what we want (targetComponentsAsUTC) and what we got (actualInZoneAsUTC)
       const diff = targetComponentsAsUTC.getTime() - actualInZoneAsUTC.getTime();
       
       // If difference is 0 (or negligible), we found the correct UTC time!
       if (Math.abs(diff) < 1000) {
         console.log(`✅ Timezone conversion converged in ${i+1} iterations`);
         console.log('🌍 CONVERSION RESULT:', {
           input: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${timeZone}`,
           utcResult: guess.toISOString()
         });
         return guess;
       }
       
       // Apply difference to refine our guess
       guess = new Date(guess.getTime() + diff);
    }
    
    // If we exit loop without perfect match (rare, maybe ambiguous time due to DST transition)
    console.log('⚠️ Timezone conversion approximation used');
    return guess;

  } catch (error) {
    console.error('🚨 Timezone conversion failed:', error);
    
    // Emergency fallback: Just return the date as UTC
    return new Date(Date.UTC(year, month, day, hour, minute, 0));
  }
}