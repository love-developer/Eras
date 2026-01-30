import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RefreshCw, AlertTriangle, Undo2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { formatDistanceToNow } from 'date-fns@4.1.0';
import { logger } from '../utils/logger';

/**
 * 🗑️ TRASH MANAGER - PHASE 0: PRODUCTION STABILIZATION
 * 
 * Implements 30-day trash bin for deleted capsules with:
 * - Soft delete (moves to trash, not permanent deletion)
 * - 5-second undo window with toast
 * - 30-day automatic cleanup
 * - Restore functionality
 * - Permanent delete option
 * 
 * Database Schema Required:
 * - Add `deleted_at` column to capsules table (timestamp, nullable)
 * - Add `trashed_by` column to capsules table (uuid, nullable)
 * - Add index on deleted_at for performance
 */

interface TrashedCapsule {
  id: string;
  title: string;
  message: string;
  delivery_date: string;
  deleted_at: string;
  created_at: string;
  recipient_email?: string;
  recipient_name?: string;
}

interface TrashManagerProps {
  userId: string;
  accessToken: string;
}

export function TrashManager({ userId, accessToken }: TrashManagerProps) {
  const [trashedCapsules, setTrashedCapsules] = useState<TrashedCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [permanentDeleting, setPermanentDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTrashedCapsules();
  }, [userId]);

  const loadTrashedCapsules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('capsules')
        .select('*')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) {
        logger.error('Failed to load trashed capsules:', error);
        toast.error('Failed to load trash');
        return;
      }

      setTrashedCapsules(data || []);
    } catch (error) {
      logger.error('Error loading trashed capsules:', error);
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  const restoreCapsule = async (capsuleId: string) => {
    try {
      setRestoring(capsuleId);
      
      const { error } = await supabase
        .from('capsules')
        .update({ 
          deleted_at: null,
          trashed_by: null 
        })
        .eq('id', capsuleId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to restore capsule:', error);
        toast.error('Failed to restore capsule');
        return;
      }

      logger.userAction('restore_capsule', { capsuleId });
      toast.success('Capsule restored successfully');
      
      // Remove from local state
      setTrashedCapsules(prev => prev.filter(c => c.id !== capsuleId));
    } catch (error) {
      logger.error('Error restoring capsule:', error);
      toast.error('Failed to restore capsule');
    } finally {
      setRestoring(null);
    }
  };

  const permanentDelete = async (capsuleId: string) => {
    try {
      setPermanentDeleting(capsuleId);
      
      // First, delete associated media from storage
      const { data: capsule } = await supabase
        .from('capsules')
        .select('media')
        .eq('id', capsuleId)
        .single();

      if (capsule?.media && Array.isArray(capsule.media)) {
        for (const media of capsule.media) {
          if (media.url) {
            const path = media.url.split('/').pop();
            if (path) {
              await supabase.storage
                .from('capsule-media')
                .remove([path])
                .catch(err => logger.warn('Failed to delete media file:', err));
            }
          }
        }
      }

      // Permanently delete the capsule
      const { error } = await supabase
        .from('capsules')
        .delete()
        .eq('id', capsuleId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to permanently delete capsule:', error);
        toast.error('Failed to delete capsule');
        return;
      }

      logger.userAction('permanent_delete_capsule', { capsuleId });
      toast.success('Capsule permanently deleted');
      
      // Remove from local state
      setTrashedCapsules(prev => prev.filter(c => c.id !== capsuleId));
    } catch (error) {
      logger.error('Error permanently deleting capsule:', error);
      toast.error('Failed to delete capsule');
    } finally {
      setPermanentDeleting(null);
    }
  };

  const emptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all items in trash? This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      for (const capsule of trashedCapsules) {
        await permanentDelete(capsule.id);
      }

      logger.userAction('empty_trash', { count: trashedCapsules.length });
      toast.success('Trash emptied successfully');
      setTrashedCapsules([]);
    } catch (error) {
      logger.error('Error emptying trash:', error);
      toast.error('Failed to empty trash');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilAutoDelete = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const autoDeleteDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const now = new Date();
    const daysRemaining = Math.ceil((autoDeleteDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return daysRemaining;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (trashedCapsules.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <Trash2 className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-gray-500">Trash is empty</p>
            <p className="text-sm text-gray-400">
              Deleted capsules will appear here and be automatically removed after 30 days
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trash</h3>
          <p className="text-sm text-gray-500">
            {trashedCapsules.length} {trashedCapsules.length === 1 ? 'item' : 'items'} in trash
          </p>
        </div>
        {trashedCapsules.length > 0 && (
          <Button
            onClick={emptyTrash}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Empty Trash
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {trashedCapsules.map((capsule) => {
            const daysRemaining = getDaysUntilAutoDelete(capsule.deleted_at);
            const isExpiringSoon = daysRemaining <= 7;

            return (
              <motion.div
                key={capsule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{capsule.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {capsule.message}
                        </CardDescription>
                      </div>
                      {isExpiringSoon && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        Deleted {formatDistanceToNow(new Date(capsule.deleted_at), { addSuffix: true })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => restoreCapsule(capsule.id)}
                          disabled={restoring === capsule.id}
                          size="sm"
                          variant="outline"
                        >
                          {restoring === capsule.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Undo2 className="w-4 h-4 mr-1" />
                              Restore
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm('Permanently delete this capsule? This cannot be undone.')) {
                              permanentDelete(capsule.id);
                            }
                          }}
                          disabled={permanentDeleting === capsule.id}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {permanentDeleting === capsule.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete Forever
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * 🔄 SOFT DELETE HELPER FUNCTION
 * 
 * Use this instead of direct deletion to move capsules to trash
 */
export async function softDeleteCapsule(
  capsuleId: string, 
  userId: string
): Promise<{ success: boolean; undoAction?: () => Promise<void> }> {
  try {
    const { error } = await supabase
      .from('capsules')
      .update({
        deleted_at: new Date().toISOString(),
        trashed_by: userId
      })
      .eq('id', capsuleId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to soft delete capsule:', error);
      toast.error('Failed to delete capsule');
      return { success: false };
    }

    logger.userAction('soft_delete_capsule', { capsuleId });

    // Create undo action
    const undoAction = async () => {
      const { error: undoError } = await supabase
        .from('capsules')
        .update({
          deleted_at: null,
          trashed_by: null
        })
        .eq('id', capsuleId)
        .eq('user_id', userId);

      if (undoError) {
        logger.error('Failed to undo deletion:', undoError);
        toast.error('Failed to undo');
      } else {
        logger.userAction('undo_delete_capsule', { capsuleId });
        toast.success('Deletion undone');
      }
    };

    // Show undo toast
    toast.success('Capsule moved to trash', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: undoAction
      }
    });

    return { success: true, undoAction };
  } catch (error) {
    logger.error('Error soft deleting capsule:', error);
    toast.error('Failed to delete capsule');
    return { success: false };
  }
}
