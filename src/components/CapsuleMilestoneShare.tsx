/**
 * 🎉 CAPSULE MILESTONE SHARING
 * 
 * Celebrates capsule creation milestones with social sharing
 * Triggers at: 1st, 10th, 25th, 50th, 100th, 250th, 500th capsule
 * 
 * Features:
 * - Beautiful modal celebration
 * - Comprehensive social media sharing
 * - Milestone-specific messaging
 * - Confetti animation
 * - Stats display (photos, videos, memories)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Share2, Facebook, Twitter, Linkedin, MessageCircle, Send, Copy, 
  PartyPopper, Camera, Video, FileText, Calendar, Mail
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import confetti from 'canvas-confetti';

interface MilestoneData {
  capsuleCount: number;
  photoCount?: number;
  videoCount?: number;
  audioCount?: number;
  textCount?: number;
  totalMediaSize?: number; // in MB
}

interface CapsuleMilestoneShareProps {
  milestone: MilestoneData;
  isOpen: boolean;
  onClose: () => void;
}

// Milestone configuration
const MILESTONE_CONFIG: { [key: number]: { emoji: string; title: string; description: string; color: string } } = {
  1: {
    emoji: '🌱',
    title: 'First Step',
    description: 'You\'ve created your first time capsule!',
    color: '#4DD4A3'
  },
  10: {
    emoji: '🎯',
    title: 'Getting Started',
    description: '10 capsules preserved for the future!',
    color: '#B084F4'
  },
  25: {
    emoji: '⭐',
    title: 'Memory Keeper',
    description: '25 moments captured across time!',
    color: '#FFD44D'
  },
  50: {
    emoji: '💎',
    title: 'Chronicle Builder',
    description: '50 capsules! You\'re building a legacy!',
    color: '#FF8E4D'
  },
  100: {
    emoji: '👑',
    title: 'Century Milestone',
    description: '100 time capsules! A true master of memories!',
    color: '#FF4DD8'
  },
  250: {
    emoji: '🏆',
    title: 'Legacy Creator',
    description: '250 capsules! Your legacy spans generations!',
    color: '#4DFFEA'
  },
  500: {
    emoji: '🌟',
    title: 'Time Lord',
    description: '500 capsules! An extraordinary journey through time!',
    color: '#9B59B6'
  }
};

export function CapsuleMilestoneShare({ milestone, isOpen, onClose }: CapsuleMilestoneShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  const config = MILESTONE_CONFIG[milestone.capsuleCount] || {
    emoji: '🎉',
    title: `${milestone.capsuleCount} Capsules`,
    description: `Amazing! You've created ${milestone.capsuleCount} time capsules!`,
    color: '#B084F4'
  };

  // Trigger confetti on open
  useEffect(() => {
    if (isOpen && !confettiTriggered) {
      // Delay slightly for modal animation
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [config.color, '#ffffff', '#ffd700']
        });
      }, 300);
      setConfettiTriggered(true);
    }
    
    if (!isOpen) {
      setConfettiTriggered(false);
      setShowShareMenu(false);
    }
  }, [isOpen, confettiTriggered, config.color]);

  const getMilestoneShareText = () => {
    const { emoji, title } = config;
    const { capsuleCount, photoCount = 0, videoCount = 0, audioCount = 0 } = milestone;
    const totalMedia = photoCount + videoCount + audioCount;

    let shareText = `${emoji} ${title}! I just created my ${getOrdinal(capsuleCount)} time capsule in Eras!\n\n`;
    
    if (totalMedia > 0) {
      shareText += `📊 My journey so far:\n`;
      if (photoCount > 0) shareText += `📷 ${photoCount} photos\n`;
      if (videoCount > 0) shareText += `🎥 ${videoCount} videos\n`;
      if (audioCount > 0) shareText += `🎵 ${audioCount} audio recordings\n`;
      shareText += `\n`;
    }
    
    shareText += `Capture today, unlock tomorrow ⏳`;
    
    return shareText;
  };

  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const shareToSocial = (platform: string) => {
    const shareText = getMilestoneShareText();
    const shareUrl = 'https://www.erastimecapsule.com';
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=ErasApp,TimeCapsule,DigitalLegacy`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'email':
        const subject = encodeURIComponent(`${config.emoji} ${config.title}!`);
        const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setShowShareMenu(false);
        return;
      case 'copy':
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        toast.success('Milestone details copied!', { icon: '📋', duration: 2000 });
        setShowShareMenu(false);
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
      setShowShareMenu(false);
    }
  };

  if (!isOpen) return null;

  const { emoji, title, description, color } = config;
  const { capsuleCount, photoCount = 0, videoCount = 0, audioCount = 0, textCount = 0 } = milestone;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                borderColor: `${color}30`,
                backdropFilter: 'blur(12px)'
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all group z-10"
              >
                <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Animated emoji */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                  className="text-7xl mb-4"
                  style={{
                    filter: `drop-shadow(0 0 20px ${color}80)`
                  }}
                >
                  {emoji}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-white mb-2"
                  style={{ textShadow: `0 0 20px ${color}60` }}
                >
                  {title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/80 mb-6"
                >
                  {description}
                </motion.p>

                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-3 mb-6"
                >
                  <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-white/70" />
                      <span className="text-2xl font-bold text-white">{capsuleCount}</span>
                    </div>
                    <p className="text-xs text-white/60">Capsules</p>
                  </div>

                  {photoCount > 0 && (
                    <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Camera className="w-4 h-4 text-white/70" />
                        <span className="text-2xl font-bold text-white">{photoCount}</span>
                      </div>
                      <p className="text-xs text-white/60">Photos</p>
                    </div>
                  )}

                  {videoCount > 0 && (
                    <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-white/70" />
                        <span className="text-2xl font-bold text-white">{videoCount}</span>
                      </div>
                      <p className="text-xs text-white/60">Videos</p>
                    </div>
                  )}

                  {textCount > 0 && (
                    <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-white/70" />
                        <span className="text-2xl font-bold text-white">{textCount}</span>
                      </div>
                      <p className="text-xs text-white/60">Messages</p>
                    </div>
                  )}
                </motion.div>

                {/* Share Menu */}
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
                    >
                      <p className="text-xs text-white/80 mb-3 text-center">Share your milestone:</p>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          onClick={() => shareToSocial('facebook')}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all group"
                        >
                          <Facebook className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white/80">Facebook</span>
                        </button>
                        
                        <button
                          onClick={() => shareToSocial('twitter')}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all group"
                        >
                          <Twitter className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white/80">X</span>
                        </button>
                        
                        <button
                          onClick={() => shareToSocial('linkedin')}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all group"
                        >
                          <Linkedin className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white/80">LinkedIn</span>
                        </button>
                        
                        <button
                          onClick={() => shareToSocial('whatsapp')}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all group"
                        >
                          <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white/80">WhatsApp</span>
                        </button>
                        
                        <button
                          onClick={() => shareToSocial('telegram')}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all group"
                        >
                          <Send className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white/80">Telegram</span>
                        </button>

                        <button
                          onClick={() => shareToSocial('email')}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all group"
                        >
                          <Mail className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white/80">Email</span>
                        </button>
                        
                        <button
                          onClick={() => shareToSocial('copy')}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all group col-span-3"
                        >
                          <Copy className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white/80">Copy to Clipboard</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex-1 px-6 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-full text-white font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                      boxShadow: `0 4px 20px ${color}40`
                    }}
                  >
                    <PartyPopper className="w-4 h-4" />
                    Continue
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}