import React, { useState } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { ProfilePictureUploadModal } from './ProfilePictureUploadModal';
import { toast } from 'sonner@2.0.3';

/**
 * 🖼️ PROFILE PICTURE CARD
 * 
 * Displays current profile picture with options to change or remove
 * - Shows avatar (image or initials)
 * - Opens upload modal when "Change Photo" is clicked
 * - Handles delete with confirmation
 */
export function ProfilePictureCard() {
  const { session } = useAuth();
  const { profile, uploading, deleteAvatar, refetchProfile } = useProfile();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userEmail = session?.user?.email || '';
  const userName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '';

  const handleDelete = async () => {
    try {
      await deleteAvatar();
      toast.success('Profile picture removed!', { icon: '🗑️' });
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete profile picture');
    }
  };

  const handleUploadSuccess = () => {
    toast.success('Profile picture updated!', { icon: '✅' });
    refetchProfile();
    setShowUploadModal(false);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-slate-900 dark:text-white">Profile Picture</h3>
        </div>

        {/* Avatar and Info */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar
            src={profile?.avatar_url}
            name={userName}
            email={userEmail}
            size="xl"
            alt="Your profile picture"
          />
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 dark:text-white font-semibold truncate">
              {userName || 'User'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
              {userEmail}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Change Photo</span>
              </>
            )}
          </button>

          {profile?.avatar_url && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={uploading}
              className="sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Helper Text */}
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Recommended: Square image, at least 400×400px. Max 5MB. JPG, PNG, WEBP, or GIF.
        </p>
      </div>

      {/* Upload Modal */}
      <ProfilePictureUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="text-lg text-slate-900 dark:text-white mb-2">
              Remove Profile Picture?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Your profile will show your initials instead. You can always upload a new picture later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {uploading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
