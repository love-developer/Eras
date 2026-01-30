import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Share2,
  Crown,
  Sparkles,
  Star,
  Zap,
  Sunrise,
  Link2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { TitleDisplay } from "./TitleDisplay";
import { toast } from "sonner";
import { getTitleIcon, getTitleConfig } from "../utils/titleConfigs";

interface TitleRewardModalEnhancedProps {
  title: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  achievementName: string;
  isOpen: boolean;
  onClose: () => void;
  onViewTitles?: () => void;
}

/**
 * 🌅 HORIZON TITLE UNLOCK CELEBRATION - DUAL-LAYER CHROMATIC FUSION v4.0
 *
 * NEW IN V4.0 - CHROMATIC FUSION & PLATFORM SHARE SUITE:
 * ✅ Dual-Layer Chromatic Fusion: Title-specific colors overlay on rarity foundation
 * ✅ NEW HORIZON branding (Horizon Gallery aligned)
 * ✅ Platform-Optimized Share Suite (Twitter/X, Facebook, LinkedIn, Copy Link)
 * ✅ Improved share text with flavor text and achievement context
 * ✅ Mobile-first adaptive share (native share on mobile, custom drawer on desktop)
 * ✅ Title-colored "NEW HORIZON" label with gradient
 * ✅ Title-colored light rays (replaces generic white)
 * ✅ Title-colored badge rim with pulsing effect
 * ✅ Mixed particle colors (50% title colors, 50% rarity colors)
 * ✅ Horizon Gallery button with title color accent
 * ✅ Glassmorphism effects
 * ✅ Mobile-optimized (no gradients on small screens for performance)
 */
export function TitleRewardModalEnhanced({
  title,
  rarity,
  achievementName,
  isOpen,
  onClose,
  onViewTitles,
}: TitleRewardModalEnhancedProps) {
  const [animationPhase, setAnimationPhase] = useState<
    "entry" | "reveal" | "glow" | "burst" | "idle" | "complete"
  >("entry");
  const [showButtons, setShowButtons] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [shareExpanded, setShareExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Get title-specific configuration for Chromatic Fusion
  const titleConfig = getTitleConfig(title);
  const titleColors = titleConfig.colors;
  const titleIcon = titleConfig.icon;
  const titleFlavorText = titleConfig.flavorText;

  // Handler to emit event when modal closes
  const handleClose = React.useCallback(() => {
    console.log("👑 [Title Modal] Closing - emitting titleModalClosed event", {
      title,
      rarity,
      achievementName,
    });

    // Emit custom event with title details
    window.dispatchEvent(
      new CustomEvent("titleModalClosed", {
        detail: {
          title: title,
          rarity: rarity,
          achievementName: achievementName,
          timestamp: Date.now(),
        },
      }),
    );

    // Call original close handler
    onClose();
  }, [title, rarity, achievementName, onClose]);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    // Detect mobile for share functionality
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      setShareExpanded(false);
      setCopiedLink(false);
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (shareExpanded) {
          setShareExpanded(false);
        } else {
          handleClose();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, shareExpanded, handleClose]);

  // Enhanced rarity configurations
  const getRarityConfig = (rarity: string) => {
    const configs = {
      common: {
        colors: [
          "#FFFFFF",
          "#E5E7EB",
          "#D1D5DB",
          "#F3F4F6",
          "#C0C5CE",
          "#B8BFC8",
        ],
        gradient: "from-slate-400 via-slate-300 to-slate-200",
        glow: "shadow-[0_0_40px_rgba(226,232,240,0.6)]",
        ringGlow: "ring-slate-300/40",
        particles: 80,
        shake: 0,
        duration: 2000,
        lightRays: 0,
        badge: "circle",
        bgGradient: "from-slate-600 via-slate-500 to-slate-400",
      },
      uncommon: {
        colors: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#22C55E"],
        gradient: "from-emerald-500 via-green-400 to-emerald-300",
        glow: "shadow-[0_0_60px_rgba(16,185,129,0.8)]",
        ringGlow: "ring-emerald-400/50",
        particles: 120,
        shake: 1,
        duration: 2500,
        lightRays: 0,
        badge: "hexagon",
        bgGradient: "from-emerald-600 via-green-500 to-emerald-400",
      },
      rare: {
        colors: ["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"],
        gradient: "from-purple-600 via-violet-500 to-purple-400",
        glow: "shadow-[0_0_80px_rgba(139,92,246,1)]",
        ringGlow: "ring-purple-400/60",
        particles: 150,
        shake: 2,
        duration: 3000,
        lightRays: 4,
        badge: "star12",
        bgGradient: "from-purple-700 via-violet-600 to-purple-500",
      },
      epic: {
        colors: ["#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"],
        gradient: "from-amber-500 via-yellow-400 to-amber-300",
        glow: "shadow-[0_0_100px_rgba(245,158,11,1.2)]",
        ringGlow: "ring-yellow-400/70",
        particles: 200,
        shake: 4,
        duration: 3500,
        lightRays: 8,
        badge: "octagon",
        bgGradient: "from-amber-600 via-yellow-500 to-amber-400",
      },
      legendary: {
        colors: ["#FF6B6B", "#FF8E4D", "#FFD44D", "#4DFFEA", "#FF4DD8"],
        gradient:
          "from-rose-500 via-orange-400 via-yellow-300 via-cyan-400 to-pink-400",
        glow: "shadow-[0_0_120px_rgba(255,107,107,1.5),0_0_80px_rgba(77,255,234,1),0_0_60px_rgba(255,77,216,1)]",
        ringGlow: "ring-pink-400/80",
        particles: 250,
        shake: 6,
        duration: 4000,
        lightRays: 12,
        badge: "eclipse",
        bgGradient:
          "from-rose-600 via-orange-500 via-yellow-400 via-cyan-500 to-pink-500",
      },
    };
    return configs[rarity] || configs.common;
  };

  const config = getRarityConfig(rarity);

  // Platform-specific share functionality
  const getShareText = (
    platform: "twitter" | "facebook" | "linkedin" | "generic",
  ) => {
    const baseUrl = window.location.origin;
    const rarityEmoji =
      {
        common: "⚪",
        uncommon: "🟢",
        rare: "🟣",
        epic: "🟡",
        legendary: "🌈",
      }[rarity] || "👑";

    switch (platform) {
      case "twitter":
        return {
          text: `🌅 Unlocked: ${titleIcon} ${title} - "${titleFlavorText}"\n\nI've unlocked a new horizon in @ErasApp!\n\nEvery moment captured is a gift to my future self 📦\n\n#TimeCapsule #DigitalLegacy #ErasApp`,
          url: baseUrl,
        };

      case "facebook":
        return {
          text: `🌅 New Horizon Unlocked!\n\nI just earned the "${title}" title (${titleIcon} ${titleFlavorText}) by ${achievementName.toLowerCase()} in Eras!\n\nIt's incredible to think that I'm literally sending messages to my future self. Every photo, video, and memory I capture today becomes a treasure tomorrow.\n\nStarting my legacy journey — who's with me? ${rarityEmoji}\n\n${baseUrl}\n#ErasTimeCapsule #PreserveYourLegacy`,
          url: baseUrl,
        };

      case "linkedin":
        return {
          text: `🏆 Achievement Unlocked: ${title}\n\n${titleFlavorText}\n\nI've started using Eras to build a digital legacy — capturing today's moments to unlock tomorrow's memories.\n\nThe concept of time-locked content is fascinating from both a personal archival and digital wellness perspective.\n\nIf you're interested in intentional memory preservation and building a meaningful digital legacy, check out Eras.\n\n${baseUrl}\n#DigitalLegacy #PersonalArchiving #Innovation`,
          url: baseUrl,
        };

      default: // generic / copy link
        return {
          text: `🌅 I unlocked "${title}" ${titleIcon} in Eras!\n\n"${titleFlavorText}"\n\nAchievement: ${achievementName}\nMy legacy journey has begun — capturing today, unlocking tomorrow ⏳\n\nStart your own legacy: ${baseUrl}`,
          url: baseUrl,
        };
    }
  };

  const handleShareTwitter = () => {
    const { text, url } = getShareText("twitter");
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
    toast.success("Opening Twitter...");
    setShareExpanded(false);
  };

  const handleShareFacebook = () => {
    const { url } = getShareText("facebook");
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "_blank", "width=555,height=555");
    toast.success("Opening Facebook...");
    setShareExpanded(false);
  };

  const handleShareLinkedIn = () => {
    const { text, url } = getShareText("linkedin");
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, "_blank", "width=520,height=570");
    toast.success("Opening LinkedIn...");
    setShareExpanded(false);
  };

  const handleCopyLink = async () => {
    const { text } = getShareText("generic");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    const { text, url } = getShareText("generic");
    try {
      if (navigator.share) {
        await navigator.share({
          title: `New Horizon: ${title}`,
          text: text,
          url: url,
        });
        toast.success("Shared successfully!");
      } else {
        await handleCopyLink();
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  };

  useEffect(() => {
    if (isOpen && title) {
      console.log(
        "🌅 [Horizon Chromatic Fusion v4.0] Celebration:",
        title,
        rarity,
      );
      console.log("🎨 [Title Colors]:", titleColors);
      console.log("✨ [Flavor Text]:", titleFlavorText);
      setAnimationPhase("entry");
      setShowButtons(false);
      setShakeIntensity(0);

      // Remove existing confetti canvas
      const existingCanvas = document.getElementById("title-enhanced-confetti");
      if (existingCanvas && existingCanvas.parentNode) {
        existingCanvas.parentNode.removeChild(existingCanvas);
      }

      // Create confetti canvas
      const confettiCanvas = document.createElement("canvas");
      confettiCanvas.id = "title-enhanced-confetti";
      confettiCanvas.style.position = "fixed";
      confettiCanvas.style.top = "0";
      confettiCanvas.style.left = "0";
      confettiCanvas.style.width = "100%";
      confettiCanvas.style.height = "100%";
      confettiCanvas.style.pointerEvents = "none";
      confettiCanvas.style.zIndex = "2147483647";
      document.body.appendChild(confettiCanvas);

      const customConfetti = confetti.create(confettiCanvas, {
        resize: true,
        useWorker: false,
      });

      // CHROMATIC FUSION: Mix title colors with rarity colors for confetti
      const fusedColors = [...titleColors, ...config.colors];

      // ENHANCED CONFETTI SEQUENCES BY RARITY
      const fireEnhancedConfetti = () => {
        if (prefersReducedMotion) {
          setTimeout(() => {
            customConfetti({
              particleCount: 15,
              angle: 90,
              spread: 45,
              origin: { y: 0.5, x: 0.5 },
              colors: fusedColors,
              startVelocity: 20,
              gravity: 0.8,
            });
          }, 600);
          return;
        }

        switch (rarity) {
          case "common":
            setTimeout(() => {
              customConfetti({
                particleCount: 80,
                angle: 90,
                spread: 70,
                origin: { y: 0.5, x: 0.5 },
                colors: fusedColors,
                startVelocity: 28,
                gravity: 0.8,
                ticks: 150,
              });
            }, 600);
            break;

          case "uncommon":
            setTimeout(() => {
              for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * 360;
                setTimeout(() => {
                  customConfetti({
                    particleCount: 20,
                    angle: angle,
                    spread: 25,
                    origin: { y: 0.5, x: 0.5 },
                    colors: fusedColors,
                    startVelocity: 32,
                    gravity: 0.7,
                  });
                }, i * 60);
              }
            }, 600);
            setTimeout(() => {
              customConfetti({
                particleCount: 100,
                angle: 90,
                spread: 120,
                origin: { y: 0.5, x: 0.5 },
                colors: fusedColors,
                startVelocity: 30,
                gravity: 0.75,
              });
            }, 1000);
            break;

          case "rare":
            setTimeout(() => {
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * 360;
                setTimeout(() => {
                  customConfetti({
                    particleCount: 25,
                    angle: angle,
                    spread: 20,
                    origin: { y: 0.5, x: 0.5 },
                    colors: fusedColors,
                    startVelocity: 40,
                    gravity: 0.6,
                    shapes: ["circle", "square"],
                  });
                }, i * 50);
              }
            }, 600);
            setTimeout(() => {
              customConfetti({
                particleCount: 150,
                angle: 90,
                spread: 180,
                origin: { y: 0.5, x: 0.5 },
                colors: fusedColors,
                startVelocity: 35,
                gravity: 0.7,
                ticks: 200,
              });
            }, 1200);
            break;

          case "epic":
            setShakeIntensity(4);
            setTimeout(() => setShakeIntensity(0), 500);

            setTimeout(() => {
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * 360;
                setTimeout(() => {
                  customConfetti({
                    particleCount: 40,
                    angle: angle,
                    spread: 15,
                    origin: { y: 0.5, x: 0.5 },
                    colors: fusedColors,
                    startVelocity: 50,
                    gravity: 0.5,
                    shapes: ["square"],
                    scalar: 1.2,
                  });
                }, i * 60);
              }
            }, 600);

            [800, 1100, 1400].forEach((delay, idx) => {
              setTimeout(() => {
                customConfetti({
                  particleCount: 100 - idx * 25,
                  angle: 90,
                  spread: 140 + idx * 20,
                  origin: { y: 0.5, x: 0.5 },
                  colors: fusedColors,
                  startVelocity: 45 - idx * 5,
                  gravity: 0.65,
                  ticks: 250,
                });
              }, delay);
            });
            break;

          case "legendary":
            setShakeIntensity(6);
            setTimeout(() => setShakeIntensity(3), 500);
            setTimeout(() => setShakeIntensity(0), 1000);

            setTimeout(() => {
              for (let i = 0; i < 24; i++) {
                const angle = (i / 24) * 360;
                setTimeout(() => {
                  customConfetti({
                    particleCount: 20,
                    angle: angle,
                    spread: 10,
                    origin: { y: 0.5, x: 0.5 },
                    colors: fusedColors,
                    startVelocity: 55,
                    gravity: 0.4,
                    shapes: ["circle", "square"],
                    scalar: 1.5,
                    ticks: 300,
                  });
                }, i * 30);
              }
            }, 600);

            [900, 1200, 1500, 1800, 2100].forEach((delay, idx) => {
              setTimeout(() => {
                customConfetti({
                  particleCount: 100,
                  angle: 90,
                  spread: 360,
                  origin: { y: 0.5, x: 0.5 },
                  colors: fusedColors,
                  startVelocity: 50 - idx * 5,
                  gravity: 0.7,
                  ticks: 300,
                  shapes: ["circle", "square"],
                });
              }, delay);
            });

            setTimeout(() => {
              customConfetti({
                particleCount: 150,
                angle: 90,
                spread: 120,
                origin: { y: 0.3, x: 0.5 },
                colors: fusedColors,
                startVelocity: 60,
                gravity: 0.8,
                ticks: 350,
              });
            }, 2400);
            break;
        }
      };

      fireEnhancedConfetti();

      // Animation phase transitions
      const timings = {
        common: [0, 600, 1200, 1500, 1800],
        uncommon: [0, 700, 1400, 1800, 2200],
        rare: [0, 800, 1600, 2200, 2800],
        epic: [0, 900, 1800, 2500, 3200],
        legendary: [0, 1000, 2000, 2800, 3600],
      }[rarity] || [0, 600, 1200, 1500, 1800];

      setTimeout(() => setAnimationPhase("reveal"), timings[1]);
      setTimeout(() => setAnimationPhase("glow"), timings[2]);
      setTimeout(() => setAnimationPhase("burst"), timings[3]);
      setTimeout(() => {
        setAnimationPhase("idle");
        setShowButtons(true);
      }, timings[4]);
      setTimeout(() => setAnimationPhase("complete"), config.duration);

      return () => {
        setTimeout(() => {
          const canvas = document.getElementById("title-enhanced-confetti");
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }, 3000);
      };
    }
  }, [isOpen, title, rarity, prefersReducedMotion]);

  if (!mounted || !title) return null;

  // Badge geometry clip paths
  const getBadgeClipPath = (badge: string) => {
    const paths = {
      circle: "circle(50%)",
      hexagon: "polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%)",
      star12:
        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
      octagon:
        "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
      eclipse: "circle(50%)",
    };
    return paths[badge] || paths.circle;
  };

  // Create title color gradient string for inline styles
  const titleGradient =
    titleColors.length >= 2
      ? `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`
      : titleColors[0] || "#ffffff";

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 backdrop-blur-md"
            style={{
              zIndex: 2147483645,
              background:
                rarity === "legendary"
                  ? "radial-gradient(circle at center, rgba(0,0,0,0.7), rgba(0,0,0,0.95))"
                  : rarity === "epic"
                    ? "radial-gradient(circle at center, rgba(0,0,0,0.75), rgba(0,0,0,0.9))"
                    : "rgba(0, 0, 0, 0.85)",
            }}
            onClick={() => {
              if (shareExpanded) {
                setShareExpanded(false);
              } else {
                handleClose();
              }
            }}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4 md:p-8 pointer-events-none"
            style={{ zIndex: 2147483646 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100, rotateX: 45 }}
              animate={{
                scale: animationPhase === "burst" ? [1, 1.05, 1] : 1,
                opacity: 1,
                y: 0,
                rotateX: 0,
                x: prefersReducedMotion
                  ? 0
                  : shakeIntensity > 0
                    ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity, 0]
                    : 0,
              }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 150,
                duration: 0.8,
              }}
              className={`relative w-full max-w-lg md:max-w-2xl rounded-[2.5rem] overflow-hidden pointer-events-auto bg-gradient-to-br ${config.bgGradient} ${config.glow}`}
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* CHROMATIC FUSION: Title color overlay on edges */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 20% 20%, ${titleColors[0]}40 0%, transparent 40%), radial-gradient(circle at 80% 80%, ${titleColors[titleColors.length - 1]}40 0%, transparent 40%)`,
                }}
              />

              {/* CHROMATIC FUSION: Title-colored light rays */}
              <div
                className="absolute inset-0 opacity-20"
                style={{ overflow: "hidden", pointerEvents: "none" }}
              >
                {!prefersReducedMotion &&
                  config.lightRays > 0 &&
                  [...Array(config.lightRays)].map((_, i) => {
                    const angle = (360 / config.lightRays) * i;
                    const rayColor = titleColors[i % titleColors.length];
                    return (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{
                          width: "3px",
                          height: "100%",
                          background: `linear-gradient(to bottom, transparent 0%, transparent 45%, ${rayColor}B3 50%, transparent 55%, transparent 100%)`,
                          left: "50%",
                          top: "0",
                          transformOrigin: "50% 50%",
                          transform: `translateX(-50%) rotate(${angle}deg)`,
                        }}
                        animate={{
                          opacity: [0.4, 0.8, 0.4],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                      />
                    );
                  })}
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2.5 md:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>

              {/* Content Container */}
              <div className="relative flex flex-col items-center text-center px-6 md:px-12 py-12 md:py-20">
                {/* CHROMATIC FUSION: Title-colored "NEW HORIZON" Label */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: -30 }}
                  animate={{
                    opacity: animationPhase === "entry" ? 0 : 1,
                    scale: animationPhase === "burst" ? [1, 1.15, 1] : 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.2,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="mb-8"
                >
                  <div
                    className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full backdrop-blur-md shadow-lg"
                    style={{
                      border: `2px solid ${titleColors[0]}66`,
                      background: `linear-gradient(135deg, ${titleColors[0]}26, ${titleColors[titleColors.length - 1]}26)`,
                    }}
                  >
                    <span className="text-xl md:text-2xl text-white/90 drop-shadow-lg">
                      {titleIcon}
                    </span>
                    <span
                      className="text-base md:text-lg tracking-wider drop-shadow-lg"
                      style={{
                        background: titleGradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontWeight: 600,
                      }}
                    >
                      NEW HORIZON
                    </span>
                    <span className="text-xl md:text-2xl text-white/90 drop-shadow-lg">
                      {titleIcon}
                    </span>
                  </div>
                </motion.div>

                {/* Enhanced Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{
                    scale: animationPhase === "burst" ? [1, 1.2, 1] : 1,
                    rotate: animationPhase === "reveal" ? [0, 360] : 0,
                    opacity: 1,
                  }}
                  transition={{
                    scale: { duration: 0.6, delay: 0.4 },
                    rotate: {
                      duration: 1,
                      delay: 0.3,
                      ease: [0.34, 1.56, 0.64, 1],
                    },
                    opacity: { duration: 0.5, delay: 0.3 },
                  }}
                  className="relative mb-10"
                >
                  {/* CHROMATIC FUSION: Title-colored pulsing rim */}
                  {!prefersReducedMotion && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          boxShadow: `0 0 0 8px ${titleColors[0]}40`,
                        }}
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.6, 0.2, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          boxShadow: `0 0 0 4px ${titleColors[titleColors.length - 1]}40`,
                        }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 0.1, 0.4],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5,
                        }}
                      />
                    </>
                  )}

                  {/* Main Badge */}
                  <div
                    className={`w-36 h-36 md:w-44 md:h-44 bg-gradient-to-br ${config.gradient} flex items-center justify-center relative`}
                    style={{
                      clipPath: getBadgeClipPath(config.badge),
                      boxShadow:
                        "0 20px 60px rgba(0,0,0,0.5), inset 0 0 40px rgba(255,255,255,0.3)",
                    }}
                  >
                    {/* Inner radial highlight */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)",
                      }}
                    />

                    {/* Icon */}
                    <span
                      className="relative z-10 text-6xl md:text-7xl drop-shadow-2xl"
                      style={{
                        filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8))",
                      }}
                    >
                      {titleIcon}
                    </span>

                    {/* Epic+ additional effects */}
                    {(rarity === "epic" || rarity === "legendary") &&
                      !prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-0"
                          animate={{
                            rotate: [0, 360],
                          }}
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          {[...Array(8)].map((_, i) => (
                            <Star
                              key={i}
                              className="absolute text-white/80"
                              style={{
                                width: "12px",
                                height: "12px",
                                left: `${50 + 45 * Math.cos((i / 8) * 2 * Math.PI)}%`,
                                top: `${50 + 45 * Math.sin((i / 8) * 2 * Math.PI)}%`,
                                transform: "translate(-50%, -50%)",
                              }}
                            />
                          ))}
                        </motion.div>
                      )}

                    {/* Legendary: Dual-ring eclipse effect */}
                    {rarity === "legendary" && !prefersReducedMotion && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-white/60"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.8, 0.3, 0.8],
                            rotate: [0, 180, 360],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{ width: "100%", height: "100%" }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-white/40"
                          animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.6, 0.2, 0.6],
                            rotate: [360, 180, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{ width: "100%", height: "100%" }}
                        />
                      </>
                    )}
                  </div>

                  {/* CHROMATIC FUSION: Title-colored floating particles */}
                  {!prefersReducedMotion && animationPhase !== "entry" && (
                    <>
                      {[
                        ...Array(
                          rarity === "legendary"
                            ? 20
                            : rarity === "epic"
                              ? 16
                              : 12,
                        ),
                      ].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full"
                          style={{
                            backgroundColor:
                              i % 2 === 0
                                ? titleColors[i % titleColors.length]
                                : config.colors[i % config.colors.length],
                            opacity: 0.8,
                            left: '50%',
                            top: '50%',
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 0.8, 0],
                            x: [0, (Math.random() - 0.5) * 150],
                            y: [0, (Math.random() - 0.5) * 150],
                          }}
                          transition={{
                            duration: 2 + Math.random(),
                            delay: Math.random() * 0.5,
                            repeat: Infinity,
                            repeatDelay: Math.random() * 1.5,
                          }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>

                {/* Title Display */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: animationPhase === "burst" ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="mb-6"
                >
                  <TitleDisplay
                    title={title}
                    rarity={rarity}
                    className="text-4xl md:text-5xl"
                  />
                </motion.div>

                {/* Achievement source */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="text-white/90 text-sm md:text-base mb-3"
                >
                  Unlocked by achieving{" "}
                  <span className="font-semibold text-white">
                    {achievementName}
                  </span>
                </motion.p>

                {/* Flavor Text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="text-white/70 italic text-xs md:text-sm mb-3"
                >
                  "{titleFlavorText}"
                </motion.p>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="text-white/80 text-sm md:text-base mb-10"
                >
                  Activate this title in the Horizon Gallery to showcase your
                  legacy
                </motion.p>

                {/* Action Buttons */}
                <AnimatePresence>
                  {showButtons && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col gap-3 w-full max-w-md"
                    >
                      {/* CHROMATIC FUSION: Horizon Gallery button with title color accent */}
                      {onViewTitles && (
                        <motion.button
                          onClick={() => {
                            onViewTitles();
                            handleClose();
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3.5 rounded-2xl bg-white text-gray-900 font-semibold transition-all hover:shadow-xl flex items-center justify-center gap-2 relative overflow-hidden"
                        >
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{
                              background: titleGradient,
                            }}
                          />
                          <Sunrise className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
                          <span className="relative z-10">Horizon Gallery</span>
                        </motion.button>
                      )}

                      {/* Share Button Suite */}
                      {isMobile ? (
                        // Mobile: Native Share
                        <motion.button
                          onClick={handleNativeShare}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold transition-all flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                          <span>Share</span>
                        </motion.button>
                      ) : (
                        // Desktop: Platform-specific share drawer
                        <div className="relative">
                          <motion.button
                            onClick={() => setShareExpanded(!shareExpanded)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold transition-all flex items-center justify-center gap-2"
                          >
                            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                            <span>Share</span>
                            <motion.span
                              animate={{ rotate: shareExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              ▼
                            </motion.span>
                          </motion.button>

                          {/* Share Platform Drawer */}
                          <AnimatePresence>
                            {shareExpanded && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-2xl z-50"
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Twitter/X */}
                                  <button
                                    onClick={handleShareTwitter}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white text-sm font-medium"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    <span>Twitter/X</span>
                                  </button>

                                  {/* Facebook */}
                                  <button
                                    onClick={handleShareFacebook}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white text-sm font-medium"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    <span>Facebook</span>
                                  </button>

                                  {/* LinkedIn */}
                                  <button
                                    onClick={handleShareLinkedIn}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white text-sm font-medium"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    <span>LinkedIn</span>
                                  </button>

                                  {/* Copy Link */}
                                  <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white text-sm font-medium"
                                  >
                                    {copiedLink ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Link2 className="w-4 h-4" />
                                        <span>Copy Link</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
