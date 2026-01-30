import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Camera, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../hooks/useProfile';
import { ProfileCameraCapture } from './ProfileCameraCapture';
import { ProfileImageCrop } from './ProfileImageCrop';
import { toast } from 'sonner@2.0.3';

interface ProfilePictureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ViewMode = 'options' | 'camera' | 'crop';

/**
 * 📸 PROFILE PICTURE UPLOAD MODAL
 * 
 * Three-step upload process:
 * 1. Choose source (Gallery / Camera / Record Library)
 * 2. Capture/Select image
 * 3. Crop and adjust
 */
export function ProfilePictureUploadModal({ isOpen, onClose, onSuccess }: ProfilePictureUploadModalProps) {
  const { uploadAvatar } = useProfile();
  const [viewMode, setViewMode] = useState<ViewMode>('options');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  const handleClose = () => {
    setViewMode('options');
    setSelectedImage(null);
    onClose();
  };

  // Handle file selection from gallery
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 5MB.');
      return;
    }

    // Read file and show crop view
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setViewMode('crop');
    };
    reader.readAsDataURL(file);
  };

  // Handle camera capture
  const handleCameraCapture = (imageDataUrl: string) => {
    setSelectedImage(imageDataUrl);
    setViewMode('crop');
  };

  // Handle final upload after crop
  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'profile-picture.jpg', { type: 'image/jpeg' });
      
      await uploadAvatar(file);
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl text-slate-900 dark:text-white">
              {viewMode === 'options' && 'Update Profile Picture'}
              {viewMode === 'camera' && 'Take a Photo'}
              {viewMode === 'crop' && 'Adjust Your Photo'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* OPTIONS VIEW */}
            {viewMode === 'options' && (
              <div className="space-y-3">
                {/* Choose from Gallery */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-xl transition-colors group"
                >
                  <div className="lg:flex lg:flex-col lg:items-center">
                    {/* Row 1: Icon + Title */}
                    <div className="flex items-center gap-4 mb-1 text-left">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white leading-snug" style={{ wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>
                        Choose from Gallery
                      </p>
                    </div>
                    {/* Row 2: Subtitle - offset on mobile, centered beneath icon+title on desktop */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug ml-[68px] lg:ml-0 text-left" style={{ wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>
                      Select an existing photo
                    </p>
                  </div>
                </button>

                {/* Take New Photo */}
                <button
                  onClick={() => setViewMode('camera')}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-xl transition-colors group"
                >
                  <div className="lg:flex lg:flex-col lg:items-center">
                    {/* Row 1: Icon + Title */}
                    <div className="flex items-center gap-4 mb-1 text-left">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                        <Camera className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white leading-snug" style={{ wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>
                        Take New Photo
                      </p>
                    </div>
                    {/* Row 2: Subtitle - offset on mobile, centered beneath icon+title on desktop */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug ml-[68px] lg:ml-0 text-left" style={{ wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>
                      Use your camera to capture
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* CAMERA VIEW */}
            {viewMode === 'camera' && (
              <ProfileCameraCapture
                onCapture={handleCameraCapture}
                onCancel={() => setViewMode('options')}
              />
            )}

            {/* CROP VIEW */}
            {viewMode === 'crop' && selectedImage && (
              <ProfileImageCrop
                imageSrc={selectedImage}
                onComplete={handleCropComplete}
                onCancel={() => setViewMode('options')}
              />
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}