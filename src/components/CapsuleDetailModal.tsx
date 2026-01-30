import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useIsMobile } from './ui/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, Gift, FileText, Mail, Phone, Instagram, Twitter, Facebook, User, Calendar, ExternalLink, Wand2, Edit } from 'lucide-react';
import { CeremonyOverlay } from './capsule-themes/CeremonyOverlay';
import { EchoPanel } from './EchoPanel';
import { EchoSocialTimeline } from './EchoSocialTimeline';
import { MediaThumbnail } from './MediaThumbnail';
import { toast } from 'sonner';
import { DatabaseService } from '../utils/supabase/database';
import { mediaCache } from '../utils/mediaCache';

interface CapsuleDetailModalProps {
  capsule: any;
  isOpen: boolean;
  onClose: () => void;
  onEditDetails?: (capsule: any) => void;
  onEditCapsule?: (capsule: any) => void;
  onMediaClick?: (media: any) => void;
  canEdit?: boolean;
  onEchoSent?: () => void;
}

// ⚡ PERFORMANCE: In-memory cache for ceremony tracking (faster than sessionStorage)
const ceremoniesShownCache = new Map<string, boolean>();

// ⚡ PERFORMANCE: Memoized theme parser - parse once per capsule
const parseCapsuleTheme = (capsule: any): string => {
  try {
    if (!capsule) return 'standard';
    
    // Check root-level theme field FIRST
    if (capsule.theme) {
      return capsule.theme;
    }
    
    // Handle both object and string metadata
    const metadata = typeof capsule.metadata === 'string' 
      ? JSON.parse(capsule.metadata) 
      : capsule.metadata;
    
    if (metadata?.theme) {
      return metadata.theme;
    }
    
    return 'standard';
  } catch (e) {
    console.warn('🎨 Error parsing theme:', e);
    return 'standard';
  }
};

export function CapsuleDetailModal({
  capsule,
  isOpen,
  onClose,
  onEditDetails,
  onEditCapsule,
  onMediaClick,
  canEdit = false,
  onEchoSent
}: CapsuleDetailModalProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  
  // ⚡ MOBILE DETECTION for performance optimizations
  const isMobile = useIsMobile();
  
  // ⚡ PERFORMANCE: Show content immediately, ceremony state determines animation
  const [showCeremony, setShowCeremony] = useState(false);
  const [isCeremonyComplete, setIsCeremonyComplete] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false); // New: Track if heavy content is ready
  const [showAllRecipients, setShowAllRecipients] = useState(false); // Track if showing all recipients
  
  // 🚀 PERFORMANCE FIX: Enrich media with thumbnails for instant loading
  // 🚀 PERFORMANCE: Uses global cache for instant loading
  const [enrichedMedia, setEnrichedMedia] = useState<any[]>([]);

  // ⚡ PERFORMANCE: Memoize theme parsing - only recompute when capsule.id changes
  const themeId = useMemo(() => {
    if (!capsule) return 'standard';
    return parseCapsuleTheme(capsule);
  }, [capsule?.id, capsule?.theme, capsule?.metadata]);
  
  // 🔥 CRITICAL FIX: Enrich media with thumbnails when modal opens
  // This ensures we use pre-generated thumbnails (instant <200ms loading)
  // instead of client-side generation (slow 30-60s with full video download)
  // 🚀 PERFORMANCE: Uses global cache for instant loading
  useEffect(() => {
    if (!isOpen || !capsule?.id) {
      setEnrichedMedia([]);
      return;
    }
    
    // Get raw media from any available source
    const rawMedia = capsule.attachments || capsule.media || capsule.media_files || [];
    
    // Quick check: Do we already have thumbnails for all videos?
    const allVideosHaveThumbnails = rawMedia
      .filter((m: any) => m.type === 'video' || m.file_type?.startsWith('video/'))
      .every((m: any) => m.thumbnail);
    
    if (allVideosHaveThumbnails || rawMedia.length === 0) {
      console.log('✅ [CapsuleDetailModal] Media already has thumbnails, using as-is');
      setEnrichedMedia(rawMedia);
      // Cache for future use
      if (rawMedia.length > 0) {
        mediaCache.set(capsule.id, rawMedia);
      }
      return;
    }
    
    // 🚀 PERFORMANCE: Check cache first (instant!)
    const cached = mediaCache.get(capsule.id);
    if (cached) {
      console.log('⚡ [CapsuleDetailModal] Using cached media - INSTANT load!');
      setEnrichedMedia(cached);
      return;
    }
    
    // Cache miss - need to fetch full media data with thumbnails from server
    console.log('🔄 [CapsuleDetailModal] Cache MISS - fetching media with thumbnails...');
    
    const enrichMedia = async () => {
      try {
        const mediaWithThumbnails = await DatabaseService.getCapsuleMediaFiles(capsule.id);
        console.log('✅ [CapsuleDetailModal] Media enriched with thumbnails:', mediaWithThumbnails.length, 'files');
        
        // Store in cache for future instant loading
        mediaCache.set(capsule.id, mediaWithThumbnails);
        
        setEnrichedMedia(mediaWithThumbnails);
      } catch (error) {
        console.warn('⚠️ [CapsuleDetailModal] Could not enrich media, using raw data:', error);
        setEnrichedMedia(rawMedia); // Fallback to raw data
      }
    };
    
    enrichMedia();
  }, [isOpen, capsule?.id]);

  // ⚡ PERFORMANCE: PROGRESSIVE ENHANCEMENT + MOBILE OPTIMIZATION
  // On mobile: Show content INSTANTLY, then ceremony plays as overlay
  // On desktop: Keep existing behavior (ceremony blocks content)
  useEffect(() => {
    if (!isOpen || !capsule) return;
    
    const isNewReceived = capsule.isReceived && !capsule.viewed_at;
    const hasAlreadyShown = ceremoniesShownCache.has(capsule.id);
    // ✅ Only show ceremony for non-standard themes (per user request)
    const shouldShowCeremony = !hasAlreadyShown && themeId !== 'standard';
    
    console.log('🎬 [CapsuleDetail] Mobile Optimization:', {
      isMobile,
      shouldShowCeremony,
      capsuleId: capsule.id,
      themeId,
      hasAlreadyShown
    });
    
    // MOBILE: Progressive Enhancement - Show content immediately!
    if (isMobile) {
      // Content is ALWAYS ready on mobile (instant loading)
      setIsContentReady(true);
      setIsCeremonyComplete(true); // Content visible immediately
      
      // Ceremony plays OVER the content after short delay
      if (shouldShowCeremony) {
        setTimeout(() => {
          console.log('📱 [Mobile] Starting ceremony overlay...');
          setShowCeremony(true);
          ceremoniesShownCache.set(capsule.id, true);
        }, 100); // Small delay to let content render first
      } else {
        setShowCeremony(false);
      }
      
      return;
    }
    
    // DESKTOP: Original behavior (ceremony blocks content)
    const scheduleWork = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback, { timeout: 300 }); // Increased timeout for mobile
      } else {
        setTimeout(callback, 0);
      }
    };
    
    scheduleWork(() => {
      if (hasAlreadyShown) {
        setShowCeremony(false);
        setIsCeremonyComplete(true);
        setIsContentReady(true);
        return;
      }
      
      if (shouldShowCeremony) {
        setShowCeremony(true);
        setIsCeremonyComplete(false);
        ceremoniesShownCache.set(capsule.id, true);
        
        // Persist to sessionStorage in background
        try {
          const stored = sessionStorage.getItem('eras-ceremonies-shown');
          const shown = stored ? new Set(JSON.parse(stored)) : new Set();
          shown.add(capsule.id);
          sessionStorage.setItem('eras-ceremonies-shown', JSON.stringify(Array.from(shown)));
        } catch (err) {
          console.warn('Failed to persist ceremony state:', err);
        }
      } else {
        setShowCeremony(false);
        setIsCeremonyComplete(true);
      }
      
      setIsContentReady(true);
    });
    
    // Cleanup
    return () => {
      setIsContentReady(false);
    };
  }, [isOpen, capsule?.id, themeId, isMobile]);
  
  // ⚡ PERFORMANCE: Load sessionStorage cache on mount (once)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('eras-ceremonies-shown');
      if (stored) {
        const shown = new Set(JSON.parse(stored));
        shown.forEach(id => ceremoniesShownCache.set(id, true));
        console.log('📥 Loaded ceremony cache:', ceremoniesShownCache.size, 'entries');
      }
    } catch (err) {
      console.warn('Failed to load ceremony cache:', err);
    }
  }, []);

  if (!capsule) return null;

  // Convert media_urls to media objects if needed
  if (capsule.media_urls && capsule.media_urls.length > 0 && !capsule.media && !capsule.media_files && !capsule.attachments) {
    capsule.media = capsule.media_urls.map((url: string, index: number) => ({
      id: `media_url_${index}`,
      url: url,
      type: url.includes('/video/') || url.match(/\.(mp4|webm|mov)/) ? 'video' : 
            url.includes('/audio/') || url.match(/\.(mp3|wav|m4a|ogg)/) ? 'audio' : 'photo',
      file_type: url.includes('/video/') || url.match(/\.(mp4|webm|mov)/) ? 'video/mp4' : 
                 url.includes('/audio/') || url.match(/\.(mp3|wav|m4a|ogg)/) ? 'audio/mp3' : 'image/jpeg'
    }));
  }

  // Status styling with portal colors
  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          gradient: 'from-blue-500 to-indigo-600',
          portalGradient: 'from-blue-400/40 via-indigo-500/30 to-blue-600/20',
          glowColor: 'rgba(59, 130, 246, 0.6)',
          glowColorRgb: '59, 130, 246',
          particleTint: 'rgba(99, 102, 241, 0.4)',
          icon: Clock
        };
      case 'delivered':
        return {
          label: 'Delivered',
          gradient: 'from-emerald-500 to-teal-600',
          portalGradient: 'from-emerald-400/40 via-green-500/30 to-teal-600/20',
          glowColor: 'rgba(0, 230, 118, 0.6)',
          glowColorRgb: '0, 230, 118',
          particleTint: 'rgba(67, 160, 71, 0.4)',
          icon: Gift
        };
      case 'received':
        return {
          label: 'Received',
          gradient: 'from-yellow-400 to-amber-500',
          portalGradient: 'from-yellow-300/40 via-amber-400/30 to-yellow-500/20',
          glowColor: 'rgba(255, 215, 0, 0.6)',
          glowColorRgb: '255, 215, 0',
          particleTint: 'rgba(251, 192, 45, 0.4)',
          icon: Gift
        };
      case 'draft':
        return {
          label: 'Draft',
          gradient: 'from-purple-500 to-violet-600',
          portalGradient: 'from-purple-400/40 via-violet-500/30 to-purple-600/20',
          glowColor: 'rgba(168, 85, 247, 0.6)',
          glowColorRgb: '168, 85, 247',
          particleTint: 'rgba(139, 92, 246, 0.4)',
          icon: FileText
        };
      default:
        return {
          label: status,
          gradient: 'from-slate-500 to-slate-600',
          portalGradient: 'from-slate-400/40 via-slate-500/30 to-slate-600/20',
          glowColor: 'rgba(100, 116, 139, 0.6)',
          glowColorRgb: '100, 116, 139',
          particleTint: 'rgba(148, 163, 184, 0.4)',
          icon: Clock
        };
    }
  };

  const statusDisplay = getStatusDisplay(capsule.isReceived || capsule.is_received ? 'received' : capsule.status);
  const StatusIcon = statusDisplay.icon;

  // Get recipient info
  const getRecipientInfo = () => {
    if (capsule.recipient_type === 'email') {
      return {
        icon: Mail,
        label: 'Email',
        value: capsule.recipient_email,
        color: 'text-blue-400'
      };
    } else if (capsule.recipient_type === 'phone') {
      return {
        icon: Phone,
        label: 'Phone',
        value: capsule.recipient_phone,
        color: 'text-green-400'
      };
    } else if (capsule.recipient_type === 'social') {
      const platformIcons = {
        instagram: Instagram,
        twitter: Twitter,
        facebook: Facebook
      };
      return {
        icon: platformIcons[capsule.recipient_social_platform as keyof typeof platformIcons] || User,
        label: capsule.recipient_social_platform || 'Social',
        value: capsule.recipient_social_handle,
        color: 'text-purple-400'
      };
    }
    return null;
  };

  const recipientInfo = getRecipientInfo();

  // Get recipient name for delivered capsules
  const getRecipientName = () => {
    // Handle 'self' recipient type
    if (capsule.recipient_type === 'self') {
      return 'yourself';
    }
    
    // Handle multiple recipients
    if (capsule.recipient_type === 'others' && capsule.recipients && capsule.recipients.length > 0) {
      // Use recipient_names if available (from backend lookup)
      if (capsule.recipient_names && capsule.recipient_names.length > 0) {
        const names = capsule.recipient_names;
        if (names.length === 1) {
          return names[0];
        }
        
        // Show first 5 recipients
        if (showAllRecipients || names.length <= 5) {
          return names.join(', ');
        }
        
        // Show first 5 + clickable "+N"
        const firstFive = names.slice(0, 5).join(', ');
        const remaining = names.length - 5;
        return (
          <>
            {firstFive}{' '}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAllRecipients(true);
              }}
              className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              +{remaining}
            </button>
          </>
        );
      }
      
      // Fallback to raw email/phone
      const recipients = capsule.recipients.map((r: any) => {
        if (typeof r === 'string') return r;
        if (typeof r === 'object' && r !== null) {
          return r.email || r.phone || r.contact || r.value || r.address || '';
        }
        return '';
      }).filter((r: string) => r);
      
      if (recipients.length === 1) {
        return recipients[0];
      }
      
      // Show first 5 recipients
      if (showAllRecipients || recipients.length <= 5) {
        return recipients.join(', ');
      }
      
      // Show first 5 + clickable "+N"
      const firstFive = recipients.slice(0, 5).join(', ');
      const remaining = recipients.length - 5;
      return (
        <>
          {firstFive}{' '}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllRecipients(true);
            }}
            className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
          >
            +{remaining}
          </button>
        </>
      );
    }
    
    // Handle single recipient (email, phone, social)
    if (capsule.recipient_email) {
      return capsule.recipient_email;
    }
    if (capsule.recipient_phone) {
      return capsule.recipient_phone;
    }
    if (capsule.recipient_social_handle) {
      return capsule.recipient_social_handle;
    }
    
    return 'recipient';
  };

  // Get other recipients for received capsules (excludes current user)
  const getOtherRecipients = () => {
    // Only show for received capsules with multiple recipients
    if (!capsule.recipients || capsule.recipients.length === 0) {
      return null;
    }

    // Use recipient_names if available (from backend lookup)
    if (capsule.recipient_names && capsule.recipient_names.length > 0) {
      const names = capsule.recipient_names;
      
      // Show first 5 recipients
      if (showAllRecipients || names.length <= 5) {
        return names.join(', ');
      }
      
      // Show first 5 + clickable "+N"
      const firstFive = names.slice(0, 5).join(', ');
      const remaining = names.length - 5;
      return (
        <>
          {firstFive}{' '}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllRecipients(true);
            }}
            className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
          >
            +{remaining}
          </button>
        </>
      );
    }
    
    // Fallback to raw email/phone
    const recipients = capsule.recipients.map((r: any) => {
      if (typeof r === 'string') return r;
      if (typeof r === 'object' && r !== null) {
        return r.email || r.phone || r.contact || r.value || r.address || '';
      }
      return '';
    }).filter((r: string) => r);
    
    if (recipients.length === 0) {
      return null;
    }
    
    // Show first 5 recipients
    if (showAllRecipients || recipients.length <= 5) {
      return recipients.join(', ');
    }
    
    // Show first 5 + clickable "+N"
    const firstFive = recipients.slice(0, 5).join(', ');
    const remaining = recipients.length - 5;
    return (
      <>
        {firstFive}{' '}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAllRecipients(true);
          }}
          className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
        >
          +{remaining}
        </button>
      </>
    );
  };

  // Format delivery date/time
  const formatDeliveryTime = () => {
    if (!capsule.delivery_date) {
      return 'Not scheduled';
    }
    
    try {
      // 🐛 DEBUG: Log what we're receiving from the database
      console.log('📅 [CapsuleDetailModal] Formatting delivery time:', {
        capsuleId: capsule.id,
        delivery_date: capsule.delivery_date,
        delivery_time: capsule.delivery_time,
        timezone: capsule.timezone,
        time_zone: capsule.time_zone
      });
      
      // delivery_date is already a full UTC ISO string (e.g., "2025-12-25T20:00:00.000Z")
      // that was created using convertToUTCForStorage() when the capsule was saved
      // We just need to parse it and display it in the capsule's timezone
      let utcDateTime = new Date(capsule.delivery_date);
      
      // ❌ REMOVED: This was incorrectly re-constructing the datetime
      // The delivery_date already contains the complete UTC datetime,
      // combining it with delivery_time and adding 'Z' was treating local time as UTC
      
      if (isNaN(utcDateTime.getTime())) {
        return 'Invalid delivery date';
      }
      
      const displayTimeZone = capsule.timezone || capsule.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      console.log('📅 [CapsuleDetailModal] Parsed delivery date:', {
        utcDateTime: utcDateTime.toISOString(),
        displayTimeZone,
        utcHours: utcDateTime.getUTCHours(),
        utcMinutes: utcDateTime.getUTCMinutes()
      });
      
      const dateFormatted = utcDateTime.toLocaleString('en-US', {
        timeZone: displayTimeZone,
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      const timeFormatted = utcDateTime.toLocaleString('en-US', {
        timeZone: displayTimeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const result = `${dateFormatted} at ${timeFormatted}`;
      console.log('📅 [CapsuleDetailModal] Final formatted result:', result);
      
      return result;
    } catch (error) {
      console.error('Error formatting delivery time:', error);
      return 'Invalid date';
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // ✅ SMART BEHAVIOR: If ceremony is showing, skip it instead of closing
        // This prevents ESC key, clicking outside, or other Dialog close triggers
        // from closing the modal during the animation
        if (!open) {
          if (showCeremony) {
            console.log('⏭️ Dialog close triggered during ceremony - skipping animation instead');
            setShowCeremony(false);
            setIsCeremonyComplete(true);
            return; // Don't close the modal
          }
          console.log('❌ Dialog closing normally');
          onClose();
        }
      }}
    >
      <DialogContent 
        className="max-w-4xl border-0 [&>button:nth-child(2)]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{
          padding: 0,
          gap: 0,
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          // ⚡ FIX 1: MOBILE PERFORMANCE - Disable GPU hints on mobile
          ...(isMobile ? {} : {
            willChange: 'opacity, transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            perspective: 1000,
          }),
          // ⚡ FIX 1: MOBILE PERFORMANCE - Simple background on mobile (no complex gradients)
          background: isMobile 
            ? `linear-gradient(135deg, rgba(15, 20, 40, 0.98) 0%, rgba(5, 5, 15, 0.99) 100%)`
            : `
              radial-gradient(circle at 30% 30%, ${statusDisplay.glowColor.replace('0.6', '0.15')} 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, ${statusDisplay.glowColor.replace('0.6', '0.1')} 0%, transparent 50%),
              radial-gradient(circle at center, rgba(15, 20, 40, 0.98) 0%, rgba(5, 5, 15, 0.99) 100%)
            `,
          // ⚡ FIX 1: MOBILE PERFORMANCE - Remove expensive backdrop blur on mobile
          ...(isMobile ? {} : {
            backdropFilter: 'blur(20px)',
          }),
          // ⚡ FIX 1: MOBILE PERFORMANCE - Simplified shadow on mobile
          boxShadow: isMobile
            ? `0 8px 32px rgba(0, 0, 0, 0.6)`
            : `0 0 80px ${statusDisplay.glowColor.replace('0.6', '0.25')}, 0 0 40px ${statusDisplay.glowColor.replace('0.6', '0.15')}`
        }}
        aria-describedby="capsule-detail-description"
      >
        <DialogDescription id="capsule-detail-description" className="sr-only">
          View and interact with your time capsule content, including messages, media, and social echoes.
        </DialogDescription>

        {/* ⚡ FIX 1: MOBILE PERFORMANCE - Disable particle system on mobile */}
        {!isMobile && (
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden opacity-60"
            aria-hidden="true"
            style={{
              maskImage: 'radial-gradient(circle at center, black 0%, transparent 100%)'
            }}
          >
            <div 
              className="absolute w-[200%] h-[200%] animate-particle-drift-1"
              style={{
                backgroundImage: `
                  radial-gradient(2px 2px at 20% 30%, white, transparent),
                  radial-gradient(2px 2px at 60% 70%, white, transparent),
                  radial-gradient(1px 1px at 50% 50%, white, transparent),
                  radial-gradient(1px 1px at 80% 10%, white, transparent),
                  radial-gradient(2px 2px at 90% 60%, white, transparent),
                  radial-gradient(1px 1px at 15% 85%, rgba(255,255,255,0.8), transparent),
                  radial-gradient(2px 2px at 40% 40%, rgba(255,255,255,0.6), transparent)
                `,
                backgroundSize: '200% 200%'
              }}
            />
            
            <div 
              className="absolute w-[200%] h-[200%] animate-particle-drift-2 hidden md:block"
              style={{
                backgroundImage: `
                  radial-gradient(1px 1px at 40% 20%, rgba(255,255,255,0.5), transparent),
                  radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.5), transparent),
                  radial-gradient(2px 2px at 30% 60%, rgba(255,255,255,0.5), transparent),
                  radial-gradient(1px 1px at 85% 45%, rgba(255,255,255,0.4), transparent)
                `,
                backgroundSize: '250% 250%'
              }}
            />
          </div>
        )}

        {/* ⚡ FIX 1: MOBILE PERFORMANCE - Simplified portal glow on mobile */}
        {!isMobile && (
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none animate-portal-expand"
            style={{
              background: `radial-gradient(circle, ${statusDisplay.glowColor} 0%, transparent 70%)`,
              boxShadow: `
                0 0 40px ${statusDisplay.glowColor},
                0 0 80px ${statusDisplay.glowColor.replace('0.6', '0.4')},
                inset 0 0 60px ${statusDisplay.glowColor.replace('0.6', '0.2')}`
            }}
            aria-hidden="true"
          />
        )}

        {/* ⚡ FIX 2: MOBILE PERFORMANCE - Ceremony is non-blocking on mobile (runs in background) */}
        {/* ⚡ FIX 2: On mobile, ceremony plays as overlay while content is visible */}
        <CeremonyOverlay 
          themeId={themeId}
          isVisible={showCeremony}
          isNewReceived={capsule.isReceived && !capsule.viewed_at}
          onComplete={() => {
            setShowCeremony(false);
            setIsCeremonyComplete(true);
          }}
        />

        {/* ⚡ FIX 3: MOBILE PERFORMANCE - Custom close button always visible with high z-index */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // ✅ SMART BEHAVIOR: Skip ceremony if showing, otherwise close modal
            if (showCeremony) {
              console.log('⏭️ Skipping opening ceremony animation');
              setShowCeremony(false);
              setIsCeremonyComplete(true);
            } else {
              console.log('❌ Closing capsule modal');
              onClose();
            }
          }}
          className="absolute top-4 right-4 z-[250] h-10 w-10 rounded-full bg-slate-800/80 hover:bg-slate-700/90 text-white shadow-lg transition-all"
          style={{
            // ⚡ FIX 3: Always visible, never hidden by ceremony
            opacity: 1,
            pointerEvents: 'auto',
          }}
          aria-label={showCeremony ? "Skip animation" : "Close capsule"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Button>

        {/* HEADER - Fixed at top */}
        <div 
          style={{
            flexShrink: 0,
            padding: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            // ⚡ FIX 2: MOBILE - Content always visible (ceremony is non-blocking)
            opacity: (isMobile || isCeremonyComplete) ? 1 : 0,
            transition: 'opacity 1s ease-in-out'
          }}
        >
          <DialogHeader className="animate-content-fade-in" style={{ animationDelay: '0ms', gap: 0 }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-3 text-white animate-content-fade-in" style={{ 
                  animationDelay: '0ms',
                  fontFamily: "'Space Grotesk', -apple-system, system-ui, sans-serif",
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 20px rgba(0, 0, 0, 0.5)'
                }}>
                  {capsule.title || 'Time Capsule Portal'}
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-sm border-0 outline-0" style={{
                  fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                  fontWeight: 400,
                  opacity: 0.8,
                  letterSpacing: '0.01em',
                  border: 'none',
                  outline: 'none'
                }}>
                  {(capsule.isReceived || capsule.is_received || capsule.status === 'received') && capsule.sender_name 
                    ? (() => {
                        const otherRecipients = getOtherRecipients();
                        const recipientText = otherRecipients ? ` to ${otherRecipients}` : '';
                        return `Delivered by ${capsule.sender_name}${recipientText} on ${formatDeliveryTime()}`;
                      })()
                    : capsule.status === 'delivered' && !(capsule.isReceived || capsule.is_received)
                    ? `Delivered to ${getRecipientName()} on ${formatDeliveryTime()}`
                    : 'View complete details of your time capsule including message, media, and delivery information'
                  }
                </DialogDescription>
                <Badge 
                  className={`bg-gradient-to-r ${statusDisplay.gradient} text-white border-0 animate-content-fade-in`}
                  style={{ 
                    animationDelay: '100ms',
                    boxShadow: `0 4px 12px ${statusDisplay.glowColor.replace('0.6', '0.3')}`
                  }}
                >
                  <StatusIcon className="w-3 h-3 mr-1.5" />
                  {statusDisplay.label}
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* SCROLLABLE CONTENT - Takes remaining space */}
        <div 
          className="portal-scroll"
          style={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y', // Allow vertical scrolling on mobile
            isolation: 'isolate', // Create new stacking context
            // ⚡ FIX 2: MOBILE - Content always visible (ceremony is non-blocking)
            opacity: (isMobile || isCeremonyComplete) ? 1 : 0,
            transition: 'opacity 1s ease-in-out'
          }}
        >
          <div style={{ padding: '24px' }} className="space-y-6">
            {/* Delivery Information - ONLY show for scheduled/draft capsules */}
            {capsule.status !== 'received' && capsule.status !== 'delivered' && (
              <Card 
                className="border-white/10 overflow-hidden animate-content-fade-in" 
                style={{ 
                  animationDelay: '400ms',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-white flex items-center gap-2" style={{
                    fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                  }}>
                    <Calendar className="w-4 h-4" />
                    Delivery Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Delivery Time</p>
                      <p className="text-white">{formatDeliveryTime()}</p>
                    </div>
                    {capsule.timezone && (
                      <div>
                        <p className="text-sm text-slate-400">Timezone</p>
                        <p className="text-white">{capsule.timezone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sender/Recipient Information */}
            {(recipientInfo || ((capsule.isReceived || capsule.is_received || capsule.status === 'received') && capsule.sender_name)) && (
              <Card 
                className="border-white/10 overflow-hidden animate-content-fade-in" 
                style={{ 
                  animationDelay: '500ms',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent className="p-4">
                  <h3 className="text-white flex items-center gap-2 mb-3" style={{
                    fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                  }}>
                    <User className="w-4 h-4" />
                    {(capsule.isReceived || capsule.is_received || capsule.status === 'received') ? 'Sent By' : 'Recipient'}
                  </h3>
                  <div className="flex items-center gap-3">
                    {(capsule.isReceived || capsule.is_received || capsule.status === 'received') && capsule.sender_name ? (
                      <>
                        <div className="p-2 rounded-lg text-yellow-400 bg-white/5 backdrop-blur-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Sender</p>
                          <p className="text-white">{capsule.sender_name}</p>
                        </div>
                      </>
                    ) : recipientInfo ? (
                      <>
                        <div className={`p-2 rounded-lg ${recipientInfo.color} bg-white/5 backdrop-blur-sm`}>
                          <recipientInfo.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">{recipientInfo.label}</p>
                          <p className="text-white">{recipientInfo.value}</p>
                        </div>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message */}
            {(capsule.message || capsule.text_message) && (
              <Card 
                className="border-white/10 overflow-hidden animate-content-fade-in" 
                style={{ 
                  animationDelay: '600ms',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent className="p-4">
                  <h3 className="text-white flex items-center gap-2 mb-3" style={{
                    fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                  }}>
                    <FileText className="w-4 h-4" />
                    Message
                  </h3>
                  <div 
                    className="p-4 rounded-lg"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
                      backgroundColor: 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <p className="text-white whitespace-pre-wrap leading-relaxed">
                      {capsule.message || capsule.text_message}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Media Gallery */}
            {((capsule.media && capsule.media.length > 0) || (capsule.media_files && capsule.media_files.length > 0) || (capsule.attachments && capsule.attachments.length > 0) || (capsule.media_urls && capsule.media_urls.length > 0)) && (
              <Card 
                className="border-white/10 overflow-hidden animate-content-fade-in" 
                style={{ 
                  animationDelay: '700ms',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent className="p-4">
                  <h3 className="text-white flex items-center gap-2 mb-4" style={{
                    fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                  }}>
                    <Gift className="w-4 h-4" />
                    Media ({enrichedMedia?.length || (capsule.media || capsule.media_files || capsule.attachments)?.length || 0})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(enrichedMedia.length > 0 ? enrichedMedia : (capsule.media || capsule.media_files || capsule.attachments))?.map((media: any, index: number) => (
                      <div
                        key={media.id || index}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMediaClick?.(media);
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group transition-all duration-200"
                        style={{
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = `0 4px 12px rgba(${statusDisplay.glowColorRgb}, 0.4)`;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <MediaThumbnail
                          mediaFile={media}
                          size="lg"
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        
                        <div className="absolute top-2 right-2 z-10 pointer-events-none">
                          <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm">
                            {media.type === 'photo' && '📷'}
                            {media.type === 'video' && '🎥'}
                            {media.type === 'audio' && '🎵'}
                          </Badge>
                        </div>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <ExternalLink className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Enhancements Applied */}
            {capsule.ai_text_enhancements && capsule.ai_text_enhancements.length > 0 && (
              <Card 
                className="border-white/10 overflow-hidden animate-content-fade-in" 
                style={{ 
                  animationDelay: '800ms',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent className="p-4">
                  <h3 className="text-white flex items-center gap-2 mb-3" style={{
                    fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                  }}>
                    <Wand2 className="w-4 h-4" />
                    AI Enhancements Applied
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {capsule.ai_text_enhancements.map((enhancement: string, index: number) => (
                      <Badge 
                        key={index}
                        variant="secondary" 
                        className="bg-purple-500/20 text-purple-300 border-purple-500/30 backdrop-blur-sm"
                      >
                        {enhancement}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Echo Panel */}
            {capsule.id && 
             capsule.allow_echoes !== false && 
             (capsule.status?.toLowerCase() === 'received' || capsule.status?.toLowerCase() === 'delivered') && (
              <div 
                className="animate-content-fade-in" 
                style={{ 
                  animationDelay: '900ms'
                }}
              >
                <EchoPanel capsuleId={capsule.id} onEchoSent={onEchoSent} />
              </div>
            )}

            {/* Social Echo Timeline */}
            {capsule.id && 
             capsule.allow_echoes !== false && 
             (capsule.status?.toLowerCase() === 'delivered' || capsule.status?.toLowerCase() === 'received') && (
              <Card 
                className="border-white/10 overflow-visible animate-content-fade-in" 
                style={{ 
                  animationDelay: '1000ms',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent className="p-4 overflow-visible">
                  <EchoSocialTimeline capsuleId={capsule.id} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* FOOTER - Fixed at bottom */}
        <div 
          style={{
            flexShrink: 0,
            padding: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, transparent 100%)',
            backdropFilter: 'blur(10px)',
            // ⚡ FIX 2: MOBILE - Content always visible (ceremony is non-blocking)
            opacity: (isMobile || isCeremonyComplete) ? 1 : 0,
            transition: 'opacity 1s ease-in-out'
          }}
          className="animate-content-fade-in"
        >
          <div className="flex justify-between gap-3">
            {canEdit ? (
              <Button
                onClick={() => {
                  onEditCapsule?.(capsule);
                  onClose();
                }}
                variant="outline"
                className="portal-action-btn border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, rgba(${statusDisplay.glowColorRgb}, 0.1), rgba(${statusDisplay.glowColorRgb}, 0.15))`
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Capsule
              </Button>
            ) : (capsule.status === 'scheduled' && !capsule.isReceived) && (
              <Button
                onClick={() => {
                  toast.error('Cannot edit capsule within 1 minute of scheduled delivery time', {
                    description: 'This capsule is locked and will be delivered soon.'
                  });
                }}
                variant="outline"
                className="portal-action-btn border-white/20 text-slate-500 opacity-50 cursor-not-allowed backdrop-blur-sm"
                disabled
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Capsule (Locked)
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="portal-action-btn border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, rgba(${statusDisplay.glowColorRgb}, 0.1), rgba(${statusDisplay.glowColorRgb}, 0.15))`
              }}
            >
              Close
            </Button>
          </div>
        </div>

        <style>{`
          button[aria-label="Close"],
          button:has(.lucide-x),
          [data-slot="dialog-content"] > button:first-of-type {
            border: none !important;
            outline: none !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          }

          [data-slot="dialog-content"]::before,
          [data-slot="dialog-content"]::after {
            display: none !important;
          }

          @keyframes portalExpand {
            from {
              transform: translate(-50%, -50%) scale(0);
              opacity: 0;
            }
            to {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }

          .animate-portal-expand {
            animation: portalExpand 900ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }

          @keyframes contentFadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-content-fade-in {
            animation: contentFadeIn 600ms ease-in-out forwards;
            opacity: 0;
          }

          @keyframes particleDrift1 {
            from { transform: translate(0, 0); }
            to { transform: translate(-50%, -50%); }
          }

          @keyframes particleDrift2 {
            from { transform: translate(0, 0); }
            to { transform: translate(-30%, -30%); }
          }

          .animate-particle-drift-1 {
            animation: particleDrift1 25s linear infinite;
          }

          .animate-particle-drift-2 {
            animation: particleDrift2 30s linear infinite reverse;
          }

          .portal-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .portal-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }

          .portal-scroll::-webkit-scrollbar-thumb {
            background: rgba(${statusDisplay.glowColorRgb}, 0.3);
            border-radius: 4px;
            transition: background 0.2s;
          }

          .portal-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(${statusDisplay.glowColorRgb}, 0.5);
          }

          .portal-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(${statusDisplay.glowColorRgb}, 0.4);
          }

          .portal-action-btn:active {
            transform: translateY(0);
          }

          @media (max-width: 768px) {
            .animate-portal-expand {
              animation-duration: 500ms;
            }
            .animate-content-fade-in {
              animation-duration: 400ms;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .animate-portal-expand,
            .animate-content-fade-in,
            .animate-particle-drift-1,
            .animate-particle-drift-2 {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
            
            .portal-action-btn:hover {
              transform: none;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}