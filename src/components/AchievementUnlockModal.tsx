import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Share2,
  Sparkles,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Send,
  Copy,
  Check,
  Trophy,
  Zap,
  // Achievement Icons
  Lock,
  Star,
  Crown,
  PlayCircle,
  Inbox,
  Camera,
  Video,
  Mic,
  Sunset,
  Palette,
  Wand2,
  Sticker,
  Clock,
  CalendarDays,
  CalendarRange,
  Cake,
  Package,
  Archive,
  Landmark,
  Film,
  Moon,
  Gift,
  Shield,
  Clapperboard,
  Globe,
  Wand,
  Layers,
  CalendarClock,
  CalendarCheck2,
  RefreshCcw,
  Users,
  Hourglass,
  Target,
  Mailbox,
  Medal,
  Library,
  ScrollText,
  Rocket,
  AudioWaveform,
  Shapes,
  Compass,
  Flame,
  Sunrise,
  Stars,
  Cloud,
  Heart,
  PartyPopper,
  Gem,
  ImagePlay,
  MoonStar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface AchievementUnlockModalProps {
  achievement: any;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 🏆 ERAS ACHIEVEMENT UNLOCK - TROPHY CASE DISPLAY
 *
 * Premium museum gallery aesthetic:
 * - Vertical glass display case (portrait orientation)
 * - 3D trophy on wooden pedestal with brass nameplate
 * - Spotlight illumination from above
 * - Glass reflections and parallax effects
 * - Velvet backdrop (color by rarity)
 * - Rotating trophy showcase
 * - Camera flash + glass shine effects
 *
 * Visual Language by Rarity:
 * - Common: Small cup, gray velvet, single spotlight
 * - Uncommon: Larger trophy, teal velvet, duo spotlights
 * - Rare: Star-topped trophy, purple velvet, multiple lights
 * - Epic: Golden chalice, amber velvet, rotating spotlight
 * - Legendary: Crystal multi-tier trophy, rainbow velvet, disco ball effect
 */
export function AchievementUnlockModal({
  achievement,
  isOpen,
  onClose,
}: AchievementUnlockModalProps) {
  const [phase, setPhase] = useState<
    "trigger" | "reveal" | "context" | "complete"
  >("trigger");
  const [mounted, setMounted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasClosedRef, setHasClosedRef] = useState(false); // Prevent duplicate close events

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  // Reset close guard when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasClosedRef(false);
      console.log("🔓 [AU Modal] Modal opened, reset close guard");
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Haptic feedback (mobile)
  const triggerHaptic = useCallback(() => {
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate([50, 100, 50]);
      }
    } catch (error) {
      console.log("Haptic feedback not supported");
    }
  }, []);

  // Animation sequence + confetti
  useEffect(() => {
    if (isOpen && achievement && !prefersReducedMotion) {
      setPhase("trigger");
      triggerHaptic();

      // Create confetti canvas - Fresh canvas each time to avoid worker conflicts
      const existingCanvas = document.getElementById(
        "achievement-confetti-canvas",
      );
      if (existingCanvas) {
        existingCanvas.remove();
      }

      const confettiCanvas = document.createElement("canvas");
      confettiCanvas.id = "achievement-confetti-canvas";
      confettiCanvas.style.position = "fixed";
      confettiCanvas.style.top = "0";
      confettiCanvas.style.left = "0";
      confettiCanvas.style.width = "100%";
      confettiCanvas.style.height = "100%";
      confettiCanvas.style.pointerEvents = "none";
      confettiCanvas.style.zIndex = "2147483647";
      document.body.appendChild(confettiCanvas);

      // Create confetti instance - useWorker: false to avoid canvas resize errors
      const customConfetti = confetti.create(confettiCanvas, {
        resize: true,
        useWorker: false,
      });

      const rarityColors = getRarityParticleColors(achievement.rarity);

      // Burst sequence based on rarity
      const particleCount = getRarityParticleCount(achievement.rarity);

      // Center burst (100ms)
      setTimeout(() => {
        customConfetti({
          particleCount: particleCount * 0.5,
          angle: 90,
          spread: 100,
          origin: { y: 0.5, x: 0.5 },
          colors: rarityColors,
          startVelocity: 45,
          gravity: 1.0,
        });
      }, 100);

      // Left side burst (200ms)
      setTimeout(() => {
        customConfetti({
          particleCount: particleCount * 0.3,
          angle: 60,
          spread: 55,
          origin: { y: 0.6, x: 0 },
          colors: rarityColors,
          startVelocity: 35,
        });
      }, 200);

      // Right side burst (300ms)
      setTimeout(() => {
        customConfetti({
          particleCount: particleCount * 0.3,
          angle: 120,
          spread: 55,
          origin: { y: 0.6, x: 1 },
          colors: rarityColors,
          startVelocity: 35,
        });
      }, 300);

      // Phase transitions
      setTimeout(() => setPhase("reveal"), 600);
      setTimeout(() => setPhase("context"), 2000);
      setTimeout(() => setPhase("complete"), 3000);

      // Cleanup
      return () => {
        setTimeout(() => {
          const canvas = document.getElementById("achievement-confetti-canvas");
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }, 5000);
      };
    } else if (isOpen && prefersReducedMotion) {
      // Skip to complete for reduced motion
      setPhase("complete");
    }
  }, [isOpen, achievement, prefersReducedMotion, triggerHaptic]);

  if (!achievement || !mounted) return null;

  // Map icon names
  const iconMap: Record<string, any> = {
    PlayCircle,
    Send,
    Inbox,
    Camera,
    Video,
    Mic,
    Sunset,
    Sparkles,
    Palette,
    Wand2,
    Sticker,
    Clock,
    CalendarDays,
    CalendarRange,
    Cake,
    Package,
    Archive,
    Landmark,
    Star,
    Film,
    Moon,
    Gift,
    Shield,
    Clapperboard,
    Globe,
    Wand,
    Layers,
    CalendarClock,
    CalendarCheck2,
    RefreshCcw,
    Users,
    Hourglass,
    Crown,
    Trophy,
    Target,
    Lock,
    Mailbox,
    Medal,
    Library,
    ScrollText,
    Rocket,
    Zap,
    AudioWaveform,
    Shapes,
    Compass,
    Flame,
    Sunrise,
    Stars,
    Cloud,
    Heart,
    PartyPopper,
    Gem,
    ImagePlay,
    MoonStar,
  };

  const IconComponent = iconMap[achievement.icon] || Trophy;

  // Rarity configuration - TROPHY CASE DISPLAY
  const rarityConfig = getRarityConfig(achievement.rarity);

  const shareText =
    achievement.shareText ||
    `🏆 I just unlocked the "${achievement.title}" achievement in Eras!\n\n${achievement.description}\n\nCapture today, unlock tomorrow ⏳`;

  const shareUrl = window.location.origin;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareToSocial = (platform: string) => {
    let url = "";

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "copy":
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        toast.success("Copied to clipboard!", { icon: "📋", duration: 2000 });
        setShowShareMenu(false);
        return;
      case "native":
        if (navigator.share) {
          navigator
            .share({
              title: `Achievement Unlocked: ${achievement.title}`,
              text: shareText,
              url: shareUrl,
            })
            .catch(() => {
              navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
              toast.success("Share text copied to clipboard!", {
                icon: "📋",
                duration: 2000,
              });
            });
        }
        setShowShareMenu(false);
        return;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
      setShowShareMenu(false);
    }
  };

  const handleClose = () => {
    // ⛔ BULLETPROOF GUARD: Prevent duplicate close events
    if (hasClosedRef) {
      console.log("⏭️ [AU Modal] Already closed, ignoring duplicate close");
      return;
    }

    console.log("🔒 [AU Modal] User initiated close for:", achievement?.id);
    setHasClosedRef(true);

    // Close modal visually first
    onClose();

    // 🔒 Only dispatch event if there's a valid achievement
    if (!achievement?.id) {
      console.warn(
        "⚠️ [AU Modal] No achievement to close, skipping event dispatch",
      );
      return;
    }

    // Dispatch close event globally for Title Unlock sequence
    // This event-driven approach ensures Title Unlock only fires after user action
    const eventDetail = {
      achievement: achievement.id,
      title: achievement.rewards?.title,
      rarity: achievement.rarity,
      achievementName: achievement.title,
      timestamp: Date.now(),
    };

    const event = new CustomEvent("achievementClosed", {
      detail: eventDetail,
    });

    console.log(
      "📡 [AU Modal] Dispatching achievementClosed event:",
      eventDetail,
    );
    window.dispatchEvent(event);

    // 🔒 Store in sessionStorage to prevent replay
    if (achievement.rewards?.title) {
      const titleEventKey = `eras_title_event_${achievement.id}_${eventDetail.timestamp}`;
      sessionStorage.setItem(titleEventKey, "dispatched");
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Dark gallery */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0"
            style={{
              zIndex: 2147483646,
              background:
                "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%)",
            }}
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 2147483647 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -100 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1], // easeOutBack
              }}
              className="relative w-full pointer-events-auto"
              style={{
                maxWidth: isMobile ? "340px" : "420px",
                maxHeight: isMobile ? "90vh" : "85vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute -top-12 right-0 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                aria-label="Close achievement modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* 🏛️ TROPHY CASE DISPLAY */}
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(to bottom, #1a1a1a 0%, #0a0a0a 100%)",
                  boxShadow:
                    "0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* Museum Header */}
                <div
                  className="relative px-6 py-3 md:py-4 border-b"
                  style={{
                    background:
                      "linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: phase === "trigger" ? 0 : 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                      <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
                      <span className="text-[10px] md:text-xs font-semibold text-amber-300 uppercase tracking-wider">
                        Achievement Unlocked
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Glass Display Case */}
                <div className="relative px-6 py-4 md:py-8">
                  {/* Spotlight beams from top */}
                  {!prefersReducedMotion && phase !== "trigger" && (
                    <>
                      {rarityConfig.spotlights.map((spotlight, i) => (
                        <motion.div
                          key={i}
                          className="absolute top-0 pointer-events-none"
                          style={{
                            left: spotlight.position,
                            transform: "translateX(-50%)",
                            width: "80px",
                            height: "100%",
                            background: `linear-gradient(to bottom, ${spotlight.color} 0%, transparent 60%)`,
                            opacity: 0.4,
                            filter: "blur(20px)",
                          }}
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: [0, 0.4, 0.3, 0.4],
                          }}
                          transition={{
                            duration: 3,
                            delay: i * 0.2,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* Velvet backdrop */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: phase === "trigger" ? 0 : 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="absolute inset-x-6 top-8 bottom-32 rounded-2xl"
                    style={{
                      background: rarityConfig.velvetColor,
                      boxShadow: "inset 0 2px 20px rgba(0, 0, 0, 0.8)",
                      transformOrigin: "top",
                    }}
                  >
                    {/* Velvet texture */}
                    <div
                      className="absolute inset-0 opacity-30 rounded-2xl"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)",
                        backgroundSize: "100px 100px",
                      }}
                    />
                  </motion.div>

                  {/* Trophy on Pedestal */}
                  <div
                    className="relative flex flex-col items-center"
                    style={{ minHeight: isMobile ? "200px" : "280px" }}
                  >
                    {/* Trophy */}
                    <motion.div
                      initial={{ y: 100, opacity: 0 }}
                      animate={{
                        y: phase === "trigger" ? 100 : 0,
                        opacity: phase === "trigger" ? 0 : 1,
                        rotateY: phase !== "trigger" ? 360 : 0, // ⚡ Spin as long as we're not in trigger phase
                      }}
                      transition={{
                        y: {
                          delay: 0.6,
                          duration: 0.8,
                          ease: [0.34, 1.56, 0.64, 1],
                        },
                        opacity: { delay: 0.6, duration: 0.6 },
                        rotateY: {
                          delay: 1.2,
                          duration: 3,
                          ease: "linear",
                          repeat: phase !== "trigger" ? Infinity : 0, // ⚡ Infinite smooth rotation while modal is visible
                        },
                      }}
                      className="relative z-10 mb-2 md:mb-4"
                      style={{
                        perspective: "1000px",
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {/* Trophy glow */}
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 0.3, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{
                          background: `radial-gradient(circle, ${rarityConfig.glowColor} 0%, transparent 70%)`,
                          filter: "blur(30px)",
                        }}
                      />

                      {/* Trophy icon in glass-like container */}
                      <div
                        className="relative flex items-center justify-center"
                        style={{
                          width: isMobile ? "90px" : "140px",
                          height: isMobile ? "90px" : "140px",
                          background:
                            achievement.visual?.gradientStart &&
                            achievement.visual?.gradientEnd
                              ? `linear-gradient(135deg, ${achievement.visual.gradientStart} 0%, ${achievement.visual.gradientEnd} 100%)`
                              : rarityConfig.trophyGradient,
                          borderRadius: "20px",
                          boxShadow: `0 10px 40px ${rarityConfig.glowColor}, inset 0 2px 4px rgba(255, 255, 255, 0.3)`,
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        {/* Glass shine effect */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%)",
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            delay: 2,
                            ease: "easeInOut",
                          }}
                        />

                        <IconComponent
                          className={`${isMobile ? "w-12 h-12" : "w-20 h-20"} text-white relative z-10`}
                          strokeWidth={1.5}
                          style={{
                            filter:
                              "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))",
                          }}
                        />
                      </div>

                      {/* Camera flash effect */}
                      {!prefersReducedMotion && phase === "reveal" && (
                        <motion.div
                          className="absolute inset-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.3, delay: 1.0 }}
                          style={{
                            background:
                              "radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 60%)",
                            filter: "blur(10px)",
                          }}
                        />
                      )}
                    </motion.div>

                    {/* Wooden Pedestal */}
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: phase === "trigger" ? 0 : 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="relative"
                      style={{
                        width: isMobile ? "75px" : "120px",
                        height: isMobile ? "45px" : "70px",
                        transformOrigin: "bottom",
                      }}
                    >
                      {/* Pedestal top */}
                      <div
                        className="absolute top-0 left-0 right-0 h-3"
                        style={{
                          background:
                            "linear-gradient(to bottom, #8b5a3c 0%, #6b4423 100%)",
                          borderRadius: "4px 4px 0 0",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                        }}
                      />

                      {/* Pedestal body */}
                      <div
                        className="absolute top-3 left-2 right-2 bottom-3"
                        style={{
                          background:
                            "linear-gradient(to bottom, #6b4423 0%, #5a3618 100%)",
                          boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.5)",
                        }}
                      />

                      {/* Pedestal base */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3"
                        style={{
                          background:
                            "linear-gradient(to bottom, #6b4423 0%, #4a2f15 100%)",
                          borderRadius: "0 0 4px 4px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.7)",
                        }}
                      />
                    </motion.div>

                    {/* Brass Nameplate */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity:
                          phase === "context" || phase === "complete" ? 1 : 0,
                        y: 0,
                      }}
                      transition={{ delay: 2.2, duration: 0.5 }}
                      className="relative mt-1 md:mt-2 px-3 md:px-4 py-1.5 md:py-2 rounded-md"
                      style={{
                        background:
                          "linear-gradient(135deg, #d4af37 0%, #a88734 50%, #d4af37 100%)",
                        boxShadow:
                          "0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <div className="text-center">
                        <div className="text-[10px] md:text-xs font-serif text-black/80 uppercase tracking-widest mb-0.5">
                          Achievement
                        </div>
                        <div
                          className={`${isMobile ? "text-xs" : "text-base"} font-serif font-bold text-black`}
                        >
                          {achievement.title}
                        </div>
                      </div>

                      {/* Engraved texture */}
                      <div
                        className="absolute inset-0 opacity-20 rounded-md pointer-events-none"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)",
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Glass panels reflection */}
                  {!prefersReducedMotion && phase !== "trigger" && (
                    <>
                      <motion.div
                        className="absolute left-6 top-8 bottom-32 w-1 opacity-20"
                        style={{
                          background:
                            "linear-gradient(to bottom, transparent 0%, white 50%, transparent 100%)",
                        }}
                        animate={{
                          opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="absolute right-6 top-8 bottom-32 w-1 opacity-20"
                        style={{
                          background:
                            "linear-gradient(to bottom, transparent 0%, white 50%, transparent 100%)",
                        }}
                        animate={{
                          opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                          duration: 3,
                          delay: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Info Section */}
                <div
                  className="relative px-6 pb-6"
                  style={{
                    background:
                      "linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 100%)",
                  }}
                >
                  {/* Rarity Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity:
                        phase === "context" || phase === "complete" ? 1 : 0,
                      scale: 1,
                    }}
                    transition={{ delay: 2.4, duration: 0.4 }}
                    className="flex justify-center mb-2 md:mb-3"
                  >
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                      style={{
                        background: rarityConfig.badgeGradient,
                        color: "rgba(0, 0, 0, 0.8)",
                        boxShadow: `0 2px 12px ${rarityConfig.glowColor}`,
                      }}
                    >
                      {achievement.rarity}
                    </span>
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity:
                        phase === "context" || phase === "complete" ? 1 : 0,
                      y: 0,
                    }}
                    transition={{ delay: 2.6, duration: 0.4 }}
                    className="text-center text-sm text-white/70 leading-snug md:leading-relaxed mb-2 md:mb-3"
                  >
                    {achievement.description}
                  </motion.p>

                  {/* Title Reward */}
                  {achievement.rewards?.title && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{
                        opacity:
                          phase === "context" || phase === "complete" ? 1 : 0,
                        scale: 1,
                      }}
                      transition={{ delay: 2.8, duration: 0.4 }}
                      className="mb-2 md:mb-3 px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                    >
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-white/80">
                          Title Unlocked:{" "}
                          <span className="font-semibold italic text-white">
                            "{achievement.rewards.title}"
                          </span>
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Metadata */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: phase === "complete" ? 1 : 0 }}
                    transition={{ delay: 3.0, duration: 0.4 }}
                    className="flex items-center justify-center gap-3 mb-3 md:mb-4 text-xs text-white/50"
                  >
                    <span>{achievement.rewards?.points || 0} points</span>
                    <span>•</span>
                    <span>
                      {achievement.unlockedAt
                        ? new Date(achievement.unlockedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                    </span>
                  </motion.div>

                  {/* Social Share Menu */}
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                      >
                        <p className="text-xs text-white/60 mb-3 text-center">
                          Share your achievement:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => shareToSocial("facebook")}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                          >
                            <Facebook className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-white/70">
                              Facebook
                            </span>
                          </button>

                          <button
                            onClick={() => shareToSocial("twitter")}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                          >
                            <Twitter className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-white/70">X</span>
                          </button>

                          <button
                            onClick={() => shareToSocial("linkedin")}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                          >
                            <Linkedin className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-white/70">
                              LinkedIn
                            </span>
                          </button>

                          <button
                            onClick={() => shareToSocial("whatsapp")}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                          >
                            <MessageCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-white/70">
                              WhatsApp
                            </span>
                          </button>

                          <button
                            onClick={() => shareToSocial("telegram")}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                          >
                            <Send className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-white/70">
                              Telegram
                            </span>
                          </button>

                          <button
                            onClick={() => shareToSocial("copy")}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                          >
                            <Copy className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-white/70">
                              Copy
                            </span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: phase === "complete" ? 1 : 0,
                      y: phase === "complete" ? 0 : 20,
                    }}
                    transition={{
                      delay: 3.2,
                      duration: 0.4,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className="flex gap-2.5"
                  >
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all flex items-center justify-center gap-2 border border-white/20"
                    >
                      <Share2 className="w-4 h-4 text-white" />
                      <span className="text-sm font-semibold text-white">
                        Share
                      </span>
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}

// Rarity configuration helper - TROPHY CASE DISPLAY
function getRarityConfig(rarity: string) {
  const configs = {
    common: {
      velvetColor: "linear-gradient(to bottom, #4a5568 0%, #2d3748 100%)", // Gray velvet
      trophyGradient:
        "radial-gradient(circle at 35% 35%, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)",
      badgeGradient: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)",
      glowColor: "rgba(148, 163, 184, 0.4)",
      spotlights: [{ position: "50%", color: "rgba(255, 255, 255, 0.3)" }],
    },
    uncommon: {
      velvetColor: "linear-gradient(to bottom, #0f766e 0%, #134e4a 100%)", // Teal velvet
      trophyGradient:
        "radial-gradient(circle at 35% 35%, #ccfbf1 0%, #5eead4 50%, #14b8a6 100%)",
      badgeGradient: "linear-gradient(135deg, #5eead4 0%, #14b8a6 100%)",
      glowColor: "rgba(20, 184, 166, 0.5)",
      spotlights: [
        { position: "40%", color: "rgba(94, 234, 212, 0.4)" },
        { position: "60%", color: "rgba(20, 184, 166, 0.3)" },
      ],
    },
    rare: {
      velvetColor: "linear-gradient(to bottom, #6b21a8 0%, #581c87 100%)", // Purple velvet
      trophyGradient:
        "radial-gradient(circle at 35% 35%, #e9d5ff 0%, #c084fc 50%, #9333ea 100%)",
      badgeGradient: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)",
      glowColor: "rgba(147, 51, 234, 0.6)",
      spotlights: [
        { position: "35%", color: "rgba(192, 132, 252, 0.4)" },
        { position: "50%", color: "rgba(147, 51, 234, 0.5)" },
        { position: "65%", color: "rgba(168, 85, 247, 0.3)" },
      ],
    },
    epic: {
      velvetColor: "linear-gradient(to bottom, #b45309 0%, #92400e 100%)", // Amber velvet
      trophyGradient:
        "radial-gradient(circle at 35% 35%, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)",
      badgeGradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
      glowColor: "rgba(245, 158, 11, 0.7)",
      spotlights: [
        { position: "30%", color: "rgba(254, 243, 199, 0.5)" },
        { position: "50%", color: "rgba(251, 191, 36, 0.6)" },
        { position: "70%", color: "rgba(245, 158, 11, 0.5)" },
      ],
    },
    legendary: {
      velvetColor:
        "linear-gradient(135deg, #1e1b4b 0%, #581c87 25%, #831843 50%, #be123c 75%, #7c2d12 100%)", // Rainbow velvet
      trophyGradient:
        "radial-gradient(circle at 35% 35%, #ffffff 0%, #fbbf24 25%, #f472b6 50%, #a78bfa 75%, #06b6d4 100%)",
      badgeGradient:
        "linear-gradient(135deg, #fbbf24 0%, #f472b6 50%, #a78bfa 100%)",
      glowColor: "rgba(244, 114, 182, 0.8)",
      spotlights: [
        { position: "25%", color: "rgba(251, 191, 36, 0.5)" },
        { position: "40%", color: "rgba(244, 114, 182, 0.6)" },
        { position: "60%", color: "rgba(167, 139, 250, 0.5)" },
        { position: "75%", color: "rgba(6, 182, 212, 0.4)" },
      ],
    },
  };

  return configs[rarity as keyof typeof configs] || configs.common;
}

function getRarityParticleColors(rarity: string) {
  const colors = {
    common: ["#ffffff", "#cbd5e1", "#94a3b8"],
    uncommon: ["#ccfbf1", "#5eead4", "#14b8a6"],
    rare: ["#e9d5ff", "#c084fc", "#9333ea", "#7c3aed"],
    epic: ["#fef3c7", "#fbbf24", "#f59e0b", "#ea580c"],
    legendary: ["#ffffff", "#fbbf24", "#f472b6", "#a78bfa", "#06b6d4"],
  };

  return colors[rarity as keyof typeof colors] || colors.common;
}

function getRarityParticleCount(rarity: string) {
  const counts = {
    common: 40,
    uncommon: 50,
    rare: 60,
    epic: 80,
    legendary: 100,
  };

  return counts[rarity as keyof typeof counts] || 40;
}
