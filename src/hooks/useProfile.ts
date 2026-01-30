import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface UserProfile {
  avatar_url?: string | null;
  avatar_storage_path?: string | null;
  avatar_uploaded_at?: number | null;
  // Add other profile fields as needed
}

/**
 * 🧑 USE PROFILE HOOK
 * 
 * Manages user profile data including avatar
 * - Fetches profile on mount
 * - Provides upload/delete functions
 * - Handles loading and error states
 */
export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!session?.access_token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/profile`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/profile/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload avatar');
      }

      const data = await response.json();
      
      // Update profile with new avatar
      setProfile(prev => ({
        ...prev,
        avatar_url: data.avatar_url,
        avatar_storage_path: data.avatar_storage_path,
        avatar_uploaded_at: Date.now()
      }));

      return data;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [session?.access_token]);

  // Delete avatar
  const deleteAvatar = useCallback(async () => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    try {
      setUploading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/profile/avatar`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete avatar');
      }

      // Clear avatar from profile
      setProfile(prev => ({
        ...prev,
        avatar_url: null,
        avatar_storage_path: null,
        avatar_uploaded_at: null
      }));

    } catch (err) {
      console.error('Error deleting avatar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete avatar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [session?.access_token]);

  // Fetch profile on mount and when session changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    uploading,
    error,
    uploadAvatar,
    deleteAvatar,
    refetchProfile: fetchProfile
  };
}
