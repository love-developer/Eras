import { useState, useCallback, useMemo } from 'react';

export function useWorkflow() {
  const [workflowMedia, setWorkflowMedia] = useState(null);
  const [workflowStep, setWorkflowStep] = useState('record'); // record -> enhance -> create
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingMediaUpload, setPendingMediaUpload] = useState(null);
  const [importedVaultMediaIds, setImportedVaultMediaIds] = useState<Set<string>>(new Set());
  // 🎨 ADD: Theme preservation across workflows
  const [workflowTheme, setWorkflowTheme] = useState<string | null>(null);
  const [workflowThemeMetadata, setWorkflowThemeMetadata] = useState<any>(null);
  // 🔄 ADD: Track media IDs that should be replaced by enhanced media
  const [mediaReplacementMap, setMediaReplacementMap] = useState<string[]>([]);

  const handleQuickRecordedMedia = useCallback(async (recordedMedia) => {
    console.log('🎬 useWorkflow.handleQuickRecordedMedia called with:', recordedMedia);
    console.log('🎬 Media type:', recordedMedia ? (Array.isArray(recordedMedia) ? `array (${recordedMedia.length} items)` : 'object') : 'null');
    console.log('🎬 Sample media item:', Array.isArray(recordedMedia) ? recordedMedia[0] : recordedMedia);
    
    // Set media and step immediately - no delay needed
    setWorkflowMedia(recordedMedia);
    setWorkflowStep('create');
    
    console.log('✅ workflowMedia and workflowStep updated immediately');
  }, []);

  const handleEnhancementComplete = useCallback((enhancedMedia) => {
    setWorkflowMedia(enhancedMedia);
    setWorkflowStep('create');
  }, []);

  const resetWorkflow = useCallback(() => {
    console.log('🧹 Resetting workflow - clearing workflowMedia and resetting workflowStep');
    setWorkflowMedia(null);
    setWorkflowStep('record');
    setPendingMediaUpload(null);
    setImportedVaultMediaIds(new Set());
    setWorkflowTheme(null);
    setWorkflowThemeMetadata(null);
    setMediaReplacementMap([]);
  }, []);

  // CRITICAL FIX: Memoize the workflow object to prevent causing parent component remounts
  // We DO need to memoize this because returning a new object on every render causes 
  // MainAppContent to remount unnecessarily. The state values will still trigger re-renders
  // when they change because they're in the dependency array.
  return useMemo(() => ({
    workflowMedia,
    workflowStep,
    isTransitioning,
    pendingMediaUpload,
    importedVaultMediaIds,
    workflowTheme,
    workflowThemeMetadata,
    mediaReplacementMap,
    setWorkflowMedia,
    setWorkflowStep,
    setIsTransitioning,
    setPendingMediaUpload,
    setImportedVaultMediaIds,
    setWorkflowTheme,
    setWorkflowThemeMetadata,
    setMediaReplacementMap,
    handleQuickRecordedMedia,
    handleEnhancementComplete,
    resetWorkflow
  }), [
    workflowMedia,
    workflowStep,
    isTransitioning,
    pendingMediaUpload,
    importedVaultMediaIds,
    workflowTheme,
    workflowThemeMetadata,
    mediaReplacementMap,
    handleQuickRecordedMedia,
    handleEnhancementComplete,
    resetWorkflow
  ]);
}