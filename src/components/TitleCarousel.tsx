import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
  Share2,
  Crown,
  Sparkles,
  X,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Send,
  Copy,
} from "lucide-react";
import { TitleData } from "../hooks/useTitles";
import { toast } from "sonner";
import { getTitleConfig } from "../utils/titleConfigs";

interface TitleCarouselProps {
  titles: TitleData[];
  equippedAchievementId: string | null;
  onEquip: (achievementId: string | null) => Promise<void>;
  equipping: boolean;
}

/**
 * 🎠 ERAS LEGACY TITLES CAROUSEL - COMPACT & FINITE
 *
 * Visual & Behavior Polish:
 * - 50% smaller overall size (tighter, more efficient layout)
 * - Arrows at far edges (left/right bounds, never overlay cards)
 * - Finite scrolling: no wrap/rewind (disabled arrows at boundaries)
 * - Responsive sizing: Desktop 960px / Tablet 720px / Mobile full-width
 * - Smooth snap-to-center scrolling with multi-card step
 * - All existing logic preserved (locked/unlocked, equip, share)
 */
export function TitleCarousel({
  titles,
  equippedAchievementId,
  onEquip,
  equipping,
}: TitleCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingTitle, setAnimatingTitle] = useState<TitleData | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Responsive visible count
  const getVisibleCount = () => {
    if (typeof window === "undefined") return 4;
    const width = window.innerWidth;
    if (width < 768) return 2; // Mobile: 2 visible
    if (width < 1024) return 3; // Tablet: 3 visible
    return 4; // Desktop: 4 visible
  };

  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Find currently equipped title and set as initial selection
  useEffect(() => {
    if (equippedAchievementId) {
      const equippedIndex = titles.findIndex(
        (t) => t.achievementId === equippedAchievementId,
      );
      if (equippedIndex !== -1) {
        setSelectedIndex(equippedIndex);
        // Auto-scroll to equipped title
        scrollToIndex(equippedIndex);
      }
    }
  }, [equippedAchievementId, titles]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const selectedTitle = titles[selectedIndex];

  // Badge geometry configuration
  const getBadgeGeometry = (rarity: string, titleName: string) => {
    // Get colors from titleConfig for this specific title
    const titleConfig = getTitleConfig(titleName);
    const titleColors = titleConfig.colors;

    switch (rarity) {
      case "common":
        return {
          clipPath: "circle(50% at 50% 50%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}99`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      case "uncommon":
        return {
          clipPath:
            "polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}B3`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      case "rare":
        return {
          clipPath:
            "polygon(50% 0%, 58% 28%, 86% 18%, 68% 43%, 98% 50%, 68% 57%, 86% 82%, 58% 72%, 50% 100%, 42% 72%, 14% 82%, 32% 57%, 2% 50%, 32% 43%, 14% 18%, 42% 28%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}CC`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      case "epic":
        return {
          clipPath:
            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}E6`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      case "legendary":
        return {
          clipPath: "circle(50% at 50% 50%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}FF`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      default:
        return {
          clipPath: "circle(50% at 50% 50%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}99`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
    }
  };

  // Scroll to specific index with smooth animation
  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const card = carouselRef.current.children[0].children[
        index
      ] as HTMLElement;
      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  };

  // Navigation handlers - INFINITE (circular wrap)
  const scrollToPrevious = () => {
    const step = 1; // Move one card at a time
    let newIndex = selectedIndex - step;

    // Wrap to end if at start
    if (newIndex < 0) {
      newIndex = titles.length - 1;
    }

    setSelectedIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const scrollToNext = () => {
    const step = 1; // Move one card at a time
    let newIndex = selectedIndex + step;

    // Wrap to start if at end
    if (newIndex >= titles.length) {
      newIndex = 0;
    }

    setSelectedIndex(newIndex);
    scrollToIndex(newIndex);
  };

  // Keyboard support - infinite scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, titles.length]);

  // Handle clicking on a title card
  const handleCardClick = (index: number) => {
    setSelectedIndex(index);
    scrollToIndex(index);
  };

  // Equip with animation
  const handleEquip = async () => {
    if (!selectedTitle || !selectedTitle.isUnlocked || equipping || isAnimating)
      return;

    setIsAnimating(true);
    setAnimatingTitle(selectedTitle);

    // Phase duration based on device
    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 2.2 : 2.8;

    try {
      await onEquip(selectedTitle.achievementId);

      // Wait for animation to complete
      setTimeout(() => {
        setIsAnimating(false);
        setAnimatingTitle(null);
      }, duration * 1000);
    } catch (error) {
      setIsAnimating(false);
      setAnimatingTitle(null);
    }
  };

  // Unequip all titles (removes equipped title, shows just "Welcome, User!")
  const handleUnequip = async () => {
    if (equipping || isAnimating || !equippedAchievementId) return;

    try {
      await onEquip(null); // Pass null to unequip
      toast.success('Title unequipped! You\'ll see just "Welcome, User!" now.');
    } catch (error) {
      toast.error("Failed to unequip title");
    }
  };

  // Enhanced social media sharing - matches Achievement modal
  const getRarityEmoji = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "👑";
      case "epic":
        return "💎";
      case "rare":
        return "✨";
      case "uncommon":
        return "⚡";
      default:
        return "🌟";
    }
  };

  const shareToSocial = (platform: string) => {
    if (!selectedTitle) return;

    const rarityEmoji = getRarityEmoji(selectedTitle.rarity);
    const shareText = `${rarityEmoji} I just equipped the "${selectedTitle.title}" ${selectedTitle.rarity} title in Eras!\n\n${selectedTitle.description}\n\nCapture today, unlock tomorrow ⏳`;
    const shareUrl = window.location.origin;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    let url = "";

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=ErasApp,LegacyTitles,DigitalIdentity`;
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
        toast.success("Title details copied to clipboard!", {
          icon: "📋",
          duration: 2000,
        });
        setShowShareMenu(false);
        return;
      case "native":
        if (navigator.share) {
          navigator
            .share({
              title: `Legacy Title: ${selectedTitle.title}`,
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

  const badgeConfig = selectedTitle
    ? getBadgeGeometry(selectedTitle.rarity, selectedTitle.title)
    : null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isTablet =
    typeof window !== "undefined" &&
    window.innerWidth >= 768 &&
    window.innerWidth < 1024;

  // Responsive sizing - 50% SMALLER than original, with increased height for full visibility
  const cardWidth = isMobile ? 110 : isTablet ? 130 : 160; // Was 220/260/320
  const cardGap = isMobile ? 10 : isTablet ? 12 : 16; // Was 20/24/32
  const carouselHeight = isMobile ? 145 : isTablet ? 175 : 205; // Increased for full icon + text visibility

  return (
    <div
      className="relative mx-auto"
      style={{
        maxWidth: isMobile ? "calc(100% - 24px)" : isTablet ? "720px" : "960px",
      }}
    >
      {/* Carousel Container - 50% SMALLER */}
      <div className="relative mb-4 flex items-center gap-4">
        {/* Left Arrow - CENTERED on same row as icons */}
        <motion.button
          onClick={scrollToPrevious}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 20px rgba(147, 51, 234, 0.6)",
          }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 p-2.5 rounded-full bg-purple-900/80 hover:bg-purple-800/90 backdrop-blur-md border border-purple-600/40 transition-all shadow-lg"
          style={{
            opacity: 0.8,
            minWidth: "44px",
            minHeight: "44px",
          }}
          aria-label="Previous titles"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </motion.button>

        {/* Carousel scroll area */}
        <div
          ref={carouselRef}
          className="flex-1 overflow-x-auto overflow-y-visible scrollbar-hide snap-x snap-mandatory"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
            minHeight: `${carouselHeight}px`,
            overscrollBehavior: "auto",
          }}
        >
          <div
            className="flex py-4 px-4"
            style={{
              gap: `${cardGap}px`,
            }}
          >
            {titles.map((title, index) => {
              const isSelected = index === selectedIndex;
              const isEquipped = title.achievementId === equippedAchievementId;
              const isHovered = hoveredIndex === index;
              const config = getBadgeGeometry(title.rarity, title.title);
              const titleConfig = getTitleConfig(title.title); // Get emoji icon from title name
              const emojiIcon = titleConfig.icon;

              return (
                <motion.div
                  key={title.achievementId}
                  className="flex-shrink-0 snap-center cursor-pointer relative group"
                  onClick={() => handleCardClick(index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  initial={false}
                  animate={{
                    scale: isSelected ? 1.05 : 0.88,
                    opacity: title.isUnlocked ? (isSelected ? 1 : 0.75) : 0.45,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  whileHover={
                    title.isUnlocked ? { scale: isSelected ? 1.08 : 0.92 } : {}
                  }
                  style={{
                    width: `${cardWidth}px`,
                    scrollSnapAlign: "center",
                  }}
                >
                  {/* Tooltip for locked titles */}
                  {!title.isUnlocked && isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg bg-gray-900/95 border border-gray-700/50 backdrop-blur-sm text-xs text-gray-300 whitespace-nowrap shadow-xl"
                    >
                      🔒 {title.description}
                    </motion.div>
                  )}

                  <div className="relative">
                    {/* Rarity color ring */}
                    <div
                      className="absolute -inset-1 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${config.ringColor}40 0%, transparent 70%)`,
                        filter: "blur(8px)",
                        opacity: isSelected && title.isUnlocked ? 0.8 : 0,
                      }}
                    />

                    {/* Circular Halo Badge - Matching PrestigeBar Style */}
                    <motion.div
                      className="w-full aspect-square flex items-center justify-center relative rounded-full transition-all duration-300"
                      style={{
                        background: title.isUnlocked
                          ? `linear-gradient(135deg, ${titleConfig.colors[0]}, ${titleConfig.colors[1]})`
                          : "radial-gradient(circle, #3a3a3a, #1a1a1a)",
                        boxShadow:
                          isSelected && title.isUnlocked
                            ? `${config.glowSize} ${config.glow}`
                            : "none",
                        filter: title.isUnlocked
                          ? "blur(0px) grayscale(0%)"
                          : "blur(1.5px) grayscale(100%)",
                      }}
                      animate={
                        isSelected && title.isUnlocked
                          ? titleConfig.animation === "clock-tick"
                            ? { rotate: [0, 5, 0] }
                            : titleConfig.animation === "camera-flash"
                              ? { scale: [1, 1.05, 1] }
                              : titleConfig.animation === "star-twinkle"
                                ? { scale: [1, 1.1, 1], rotate: [0, 180, 360] }
                                : titleConfig.animation === "curtain-sway"
                                  ? { x: [-1, 1, -1] }
                                  : titleConfig.animation === "page-turn"
                                    ? { rotateY: [0, 10, 0] }
                                    : titleConfig.animation === "thread-weave"
                                      ? { x: [-2, 2, -2], y: [-1, 1, -1] }
                                      : titleConfig.animation === "anvil-strike"
                                        ? { y: [0, -2, 0], scale: [1, 1.05, 1] }
                                        : titleConfig.animation === "wave-pulse"
                                          ? { scaleY: [1, 1.1, 1] }
                                          : titleConfig.animation ===
                                              "ripple-out"
                                            ? { scale: [1, 1.08, 1] }
                                            : titleConfig.animation ===
                                                "blueprint-scan"
                                              ? { opacity: [1, 0.8, 1] }
                                              : titleConfig.animation ===
                                                  "scroll-unfurl"
                                                ? { scaleX: [1, 1.05, 1] }
                                                : titleConfig.animation ===
                                                    "crown-sparkle"
                                                  ? {
                                                      scale: [1, 1.1, 1],
                                                      rotate: [0, -5, 0],
                                                    }
                                                  : titleConfig.animation ===
                                                      "book-glow"
                                                    ? {
                                                        filter: [
                                                          "brightness(1)",
                                                          "brightness(1.2)",
                                                          "brightness(1)",
                                                        ],
                                                      }
                                                    : titleConfig.animation ===
                                                        "supernova"
                                                      ? {
                                                          scale: [1, 1.2, 1],
                                                          rotate: [0, 360, 720],
                                                        }
                                                      : titleConfig.animation ===
                                                          "vortex-spin"
                                                        ? { rotate: [0, 360] }
                                                        : {
                                                            scale: [1, 1.05, 1],
                                                          }
                          : {}
                      }
                      transition={{
                        duration:
                          titleConfig.intensity === "supreme"
                            ? 2
                            : titleConfig.intensity === "high"
                              ? 2.5
                              : 3,
                        repeat: isSelected && title.isUnlocked ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Inner circular highlight */}
                      {title.isUnlocked && (
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)",
                          }}
                        />
                      )}

                      {/* Emoji Icon or Lock */}
                      {title.isUnlocked ? (
                        <span
                          className="text-4xl sm:text-5xl drop-shadow-lg relative z-10"
                          style={{
                            filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))",
                          }}
                        >
                          {emojiIcon}
                        </span>
                      ) : (
                        <Lock className="w-1/3 h-1/3 text-gray-600 relative z-10" />
                      )}

                      {/* Subtle particle animation for rare+ unlocked titles */}
                      {title.isUnlocked &&
                        !prefersReducedMotion &&
                        (title.rarity === "rare" ||
                          title.rarity === "epic" ||
                          title.rarity === "legendary") &&
                        isSelected && (
                          <>
                            {[...Array(6)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                  background: config.ringColor,
                                  left: "50%",
                                  top: "50%",
                                }}
                                animate={{
                                  scale: [0, 1.5, 0],
                                  opacity: [0, 0.8, 0],
                                  x: Math.cos((i / 6) * Math.PI * 2) * 30,
                                  y: Math.sin((i / 6) * Math.PI * 2) * 30,
                                }}
                                transition={{
                                  duration: 1.5,
                                  delay: i * 0.15,
                                  repeat: Infinity,
                                  repeatDelay: 2,
                                }}
                              />
                            ))}
                          </>
                        )}
                    </motion.div>

                    {/* Equipped indicator */}
                    {isEquipped && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-lg"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}

                    {/* Lock icon for locked titles */}
                    {!title.isUnlocked && (
                      <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-gray-900/90 border border-gray-700/50 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-gray-500" />
                      </div>
                    )}

                    {/* Glow pulse for selected unlocked */}
                    {isSelected &&
                      title.isUnlocked &&
                      !prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.3, 0.1, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          style={{
                            background: `radial-gradient(circle at center, ${config.glow} 0%, transparent 70%)`,
                            filter: "blur(12px)",
                          }}
                        />
                      )}
                  </div>

                  {/* Title name below badge */}
                  <div className="text-center mt-1.5">
                    <p
                      className={`text-xs font-semibold truncate px-1 ${
                        title.isUnlocked ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {title.title}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Arrow - CENTERED on same row as icons */}
        <motion.button
          onClick={scrollToNext}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 20px rgba(147, 51, 234, 0.6)",
          }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 p-2.5 rounded-full bg-purple-900/80 hover:bg-purple-800/90 backdrop-blur-md border border-purple-600/40 transition-all shadow-lg"
          style={{
            opacity: 0.8,
            minWidth: "44px",
            minHeight: "44px",
          }}
          aria-label="Next titles"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </motion.button>
      </div>

      {/* Selected Title Details - COMPACT */}
      {selectedTitle && (
        <div className="relative">
          <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-950/40 via-indigo-950/40 to-purple-950/40 border border-purple-800/30 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Title info */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                  {selectedTitle.title}
                </h3>
                <p className="text-gray-400 text-xs md:text-sm mb-1.5">
                  {selectedTitle.description}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full bg-black/30 border text-xs uppercase tracking-wider font-semibold"
                    style={{
                      borderColor: `${getBadgeGeometry(selectedTitle.rarity, selectedTitle.title).ringColor}40`,
                      color: getBadgeGeometry(
                        selectedTitle.rarity,
                        selectedTitle.title,
                      ).ringColor,
                    }}
                  >
                    {selectedTitle.rarity}
                  </span>
                  {selectedTitle.isUnlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-xs text-green-300 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/30 text-xs text-gray-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {selectedTitle.isUnlocked && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEquip}
                      disabled={
                        equipping ||
                        isAnimating ||
                        selectedTitle.achievementId === equippedAchievementId
                      }
                      className={`px-4 md:px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 border shadow-lg ${
                        selectedTitle.achievementId === equippedAchievementId
                          ? "bg-green-600/20 border-green-500/30 text-green-300 cursor-default"
                          : "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 border-purple-400/30 text-white hover:shadow-xl"
                      }`}
                      style={{
                        boxShadow:
                          selectedTitle.achievementId === equippedAchievementId
                            ? "none"
                            : "0 0 25px rgba(147, 51, 234, 0.4)",
                      }}
                    >
                      {selectedTitle.achievementId === equippedAchievementId ? (
                        <>
                          <Check className="w-4 h-4" />
                          Equipped
                        </>
                      ) : equipping || isAnimating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <Sparkles className="w-4 h-4" />
                          </motion.div>
                          Equipping...
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4" />
                          Equip
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-700/50 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unequip All Button - Only show if a title is currently equipped */}
      {equippedAchievementId && (
        <div className="mt-3 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUnequip}
            disabled={equipping || isAnimating}
            className="px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 border border-red-500/30 bg-red-950/30 hover:bg-red-950/50 text-red-300 hover:text-red-200 shadow-lg"
          >
            <X className="w-4 h-4" />
            {equipping || isAnimating ? "Unequipping..." : "Unequip All Titles"}
          </motion.button>
        </div>
      )}

      {/* Equip Animation Overlay */}
      <AnimatePresence>
        {isAnimating && animatingTitle && (
          <EquipAnimation
            title={animatingTitle}
            onComplete={() => {
              setIsAnimating(false);
              setAnimatingTitle(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Share Menu */}
      <AnimatePresence>
        {showShareMenu && selectedTitle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 mx-auto p-4 rounded-2xl border w-full max-w-xs"
            style={{
              background: `linear-gradient(135deg, ${getBadgeGeometry(selectedTitle.rarity, selectedTitle.title).ringColor}15, ${getBadgeGeometry(selectedTitle.rarity, selectedTitle.title).ringColor}05)`,
              borderColor: `${getBadgeGeometry(selectedTitle.rarity, selectedTitle.title).ringColor}30`,
              backdropFilter: "blur(12px)",
            }}
          >
            <p
              className="text-xs mb-3 text-center font-medium"
              style={{
                color: getBadgeGeometry(
                  selectedTitle.rarity,
                  selectedTitle.title,
                ).ringColor,
              }}
            >
              Share your {selectedTitle.rarity} title:
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => shareToSocial("facebook")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/10"
              >
                <Facebook className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span className="text-xs text-white/80">Facebook</span>
              </button>

              <button
                onClick={() => shareToSocial("twitter")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/10"
              >
                <Twitter className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span className="text-xs text-white/80">X</span>
              </button>

              <button
                onClick={() => shareToSocial("linkedin")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/10"
              >
                <Linkedin className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span className="text-xs text-white/80">LinkedIn</span>
              </button>

              <button
                onClick={() => shareToSocial("whatsapp")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/10"
              >
                <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span className="text-xs text-white/80">WhatsApp</span>
              </button>

              <button
                onClick={() => shareToSocial("telegram")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/10"
              >
                <Send className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span className="text-xs text-white/80">Telegram</span>
              </button>

              <button
                onClick={() => shareToSocial("copy")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/10"
              >
                <Copy className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span className="text-xs text-white/80">Copy</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 🌟 EQUIP ANIMATION OVERLAY
 * Smooth, rarity-scaled animations that match the Eras brand
 */
function EquipAnimation({
  title,
  onComplete,
}: {
  title: TitleData;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<
    | "intro"
    | "particle-burst"
    | "badge-form"
    | "shine"
    | "title-reveal"
    | "complete"
  >("intro");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const badgeConfig = getBadgeGeometry(title.rarity, title.title);
  const titleConfig = getTitleConfig(title.title); // Get emoji icon from title name
  const emojiIcon = titleConfig.icon;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Rarity-based configuration
  const rarityConfig = {
    common: {
      particleCount: isMobile ? 8 : 12,
      burstRadius: isMobile ? 50 : 80,
      duration: 1.8,
      shineIntensity: 0.6,
    },
    uncommon: {
      particleCount: isMobile ? 12 : 18,
      burstRadius: isMobile ? 60 : 100,
      duration: 2.0,
      shineIntensity: 0.75,
    },
    rare: {
      particleCount: isMobile ? 16 : 24,
      burstRadius: isMobile ? 70 : 120,
      duration: 2.3,
      shineIntensity: 0.85,
    },
    epic: {
      particleCount: isMobile ? 24 : 36,
      burstRadius: isMobile ? 80 : 140,
      duration: 2.6,
      shineIntensity: 0.95,
    },
    legendary: {
      particleCount: isMobile ? 32 : 48,
      burstRadius: isMobile ? 100 : 160,
      duration: 3.0,
      shineIntensity: 1.0,
    },
  };

  const config =
    rarityConfig[title.rarity as keyof typeof rarityConfig] ||
    rarityConfig.common;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      setTimeout(onComplete, 500);
      return;
    }

    // Smooth phase transitions based on rarity
    const introDuration = 300;
    const particleBurstDuration = 500 + (config.duration - 1.8) * 200; // Scales with rarity
    const badgeFormDuration = 600 + (config.duration - 1.8) * 150;
    const shineDuration = 400 + (config.duration - 1.8) * 100;
    const titleRevealDuration = 500;
    const completeDuration = 300;

    const timeline = [
      { phase: "particle-burst" as const, delay: introDuration },
      {
        phase: "badge-form" as const,
        delay: introDuration + particleBurstDuration,
      },
      {
        phase: "shine" as const,
        delay: introDuration + particleBurstDuration + badgeFormDuration,
      },
      {
        phase: "title-reveal" as const,
        delay:
          introDuration +
          particleBurstDuration +
          badgeFormDuration +
          shineDuration,
      },
      {
        phase: "complete" as const,
        delay:
          introDuration +
          particleBurstDuration +
          badgeFormDuration +
          shineDuration +
          titleRevealDuration,
      },
    ];

    const timers = timeline.map(({ phase, delay }) =>
      setTimeout(() => setPhase(phase), delay),
    );

    const completeTimer = setTimeout(
      onComplete,
      introDuration +
        particleBurstDuration +
        badgeFormDuration +
        shineDuration +
        titleRevealDuration +
        completeDuration,
    );

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [title.rarity, onComplete]);

  function getBadgeGeometry(rarity: string, titleName: string) {
    // Get colors from titleConfig for this specific title
    const titleConfig = getTitleConfig(titleName);
    const titleColors = titleConfig.colors;

    switch (rarity) {
      case "common":
        return {
          clipPath: "circle(50% at 50% 50%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}99`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      case "uncommon":
        return {
          clipPath:
            "polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}B3`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      case "rare":
        return {
          clipPath:
            "polygon(50% 0%, 58% 28%, 86% 18%, 68% 43%, 98% 50%, 68% 57%, 86% 82%, 58% 72%, 50% 100%, 42% 72%, 14% 82%, 32% 57%, 2% 50%, 32% 43%, 14% 18%, 42% 28%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}CC`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      case "epic":
        return {
          clipPath:
            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}E6`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      case "legendary":
        return {
          clipPath: "circle(50% at 50% 50%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}FF`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
      default:
        return {
          clipPath: "circle(50% at 50% 50%)",
          gradient: `linear-gradient(135deg, ${titleColors[0]}, ${titleColors[1]})`,
          glow: `${titleColors[0]}99`,
          particleColor: titleColors[0],
          ringColor: titleColors[0],
        };
    }
  }

  if (prefersReducedMotion) return null;

  const phaseIndex = [
    "intro",
    "particle-burst",
    "badge-form",
    "shine",
    "title-reveal",
    "complete",
  ].indexOf(phase);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.9) 100%)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* PHASE 1: Particle Burst - Converging energy */}
      {phaseIndex >= 1 && phaseIndex < 3 && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(config.particleCount)].map((_, i) => {
            const angle = (i / config.particleCount) * Math.PI * 2;
            const distance = config.burstRadius;

            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full"
                style={{
                  width: isMobile ? "4px" : "6px",
                  height: isMobile ? "4px" : "6px",
                  background: badgeConfig.particleColor,
                  boxShadow: `0 0 ${isMobile ? "8px" : "12px"} ${badgeConfig.glow}`,
                }}
                initial={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1.2, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.02,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              />
            );
          })}
        </div>
      )}

      {/* PHASE 2: Badge Formation - Material coalescing */}
      {phaseIndex >= 2 && phaseIndex < 5 && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{
            scale: phaseIndex === 4 ? 0.9 : 1,
            opacity: 1,
            rotate: 0,
          }}
          transition={{
            scale: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
            opacity: { duration: 0.4 },
            rotate: { duration: 0.6, ease: "easeOut" },
          }}
          className={isMobile ? "w-28 h-28" : "w-40 h-40"}
          style={{
            background: badgeConfig.gradient,
            clipPath: badgeConfig.clipPath,
            boxShadow: `0 0 ${isMobile ? "40px" : "60px"} ${badgeConfig.glow}, 0 8px 32px rgba(0, 0, 0, 0.8)`,
          }}
        >
          {/* Inner highlight shimmer */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6) 0%, transparent 70%)",
              clipPath: badgeConfig.clipPath,
            }}
          />

          {/* Icon with smooth entrance */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <span
              className={`${isMobile ? "text-5xl" : "text-7xl"} drop-shadow-lg`}
              style={{
                filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
              }}
            >
              {emojiIcon}
            </span>
          </motion.div>

          {/* Orbital rings - continuous during badge phase */}
          {phaseIndex === 2 && (
            <>
              {[0, 1].map((i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute inset-0"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{
                    scale: [1, 1.8, 2.2],
                    opacity: [0.7, 0.4, 0],
                  }}
                  transition={{
                    duration: 1.0,
                    delay: i * 0.4,
                    ease: "easeOut",
                    repeat: 1,
                  }}
                  style={{
                    border: `2px solid ${badgeConfig.particleColor}`,
                    borderRadius:
                      title.rarity === "common" || title.rarity === "legendary"
                        ? "50%"
                        : "20%",
                    clipPath: badgeConfig.clipPath,
                  }}
                />
              ))}
            </>
          )}
        </motion.div>
      )}

      {/* PHASE 3: Shine Effect - Quality shimmer */}
      {phaseIndex === 3 && (
        <>
          {/* Horizontal shine sweep */}
          <motion.div
            className="absolute"
            style={{
              width: isMobile ? "200px" : "300px",
              height: isMobile ? "100px" : "150px",
              background: `linear-gradient(90deg, transparent 0%, ${badgeConfig.glow} 50%, transparent 100%)`,
              filter: `blur(${isMobile ? "20px" : "30px"})`,
              opacity: config.shineIntensity,
            }}
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "100%", opacity: config.shineIntensity }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}
          />

          {/* Radial flash - intensity scales with rarity */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, config.shineIntensity * 0.8, 0],
              scale: [0.5, 1.5, 2],
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            style={{
              background: `radial-gradient(circle, ${badgeConfig.glow} 0%, transparent 70%)`,
              filter: "blur(40px)",
            }}
          />
        </>
      )}

      {/* PHASE 4: Title Reveal - Smooth text entrance */}
      {phaseIndex >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: isMobile ? 60 : 90, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="absolute flex flex-col items-center gap-2"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`${isMobile ? "text-base" : "text-xl"} font-bold text-white drop-shadow-lg`}
            style={{
              textShadow: `0 0 ${isMobile ? "15px" : "20px"} ${badgeConfig.glow}`,
            }}
          >
            {title.title}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7] }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className={`${isMobile ? "text-xs" : "text-sm"} text-gray-300 uppercase tracking-wider`}
          >
            Equipped
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  );
}
