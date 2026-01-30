import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Camera, 
  Mic, 
  Play, 
  Pause, 
  Square,
  Maximize,
  Timer,
  Smartphone,
  Laptop,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';
import { CameraRecorder } from './CameraRecorder';
import { AudioRecorder } from './AudioRecorder';
import { QuickEditTools } from './QuickEditTools';

const RECORDING_MODES = [
  { 
    id: 'video', 
    name: 'Camera', 
    icon: Camera, 
    description: 'Video & photos',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    descColor: 'text-blue-600 dark:text-blue-400'
  },
  { 
    id: 'audio', 
    name: 'Audio', 
    icon: Mic, 
    description: 'Voice messages',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-700 dark:text-purple-300',
    descColor: 'text-purple-600 dark:text-purple-400'
  }
];



export function MobileRecorder({ onMediaRecorded, onClose, workflowStep = 'record', onFullscreenChange }) {
  const [recordingMode, setRecordingMode] = useState('video');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedMedia, setRecordedMedia] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenFallback, setFullscreenFallback] = useState(false);
  const [deviceType, setDeviceType] = useState('mobile');
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  
  // Recording states
  const [showPreview, setShowPreview] = useState(true);
  
  // Permission states
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'unknown',
    microphone: 'unknown'
  });
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  
  // Timer for recording duration
  const recordingTimerRef = useRef(null);
  
  // Ref for fullscreen container
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
    
    // Check initial permissions
    checkPermissions();
    
    // Cleanup timer on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const checkPermissions = async () => {
    setIsCheckingPermissions(true);
    
    try {
      const permissionPromises = [];
      
      // Check if navigator.permissions is available
      if (navigator.permissions) {
        // Check camera permission
        try {
          permissionPromises.push(
            navigator.permissions.query({ name: 'camera' }).then(result => ({
              type: 'camera',
              state: result.state
            })).catch(() => ({ type: 'camera', state: 'prompt' }))
          );
        } catch (error) {
          console.warn('Camera permission query failed:', error);
          permissionPromises.push(Promise.resolve({ type: 'camera', state: 'prompt' }));
        }
        
        // Check microphone permission
        try {
          permissionPromises.push(
            navigator.permissions.query({ name: 'microphone' }).then(result => ({
              type: 'microphone',
              state: result.state
            })).catch(() => ({ type: 'microphone', state: 'prompt' }))
          );
        } catch (error) {
          console.warn('Microphone permission query failed:', error);
          permissionPromises.push(Promise.resolve({ type: 'microphone', state: 'prompt' }));
        }
      } else {
        // Browser doesn't support permissions API
        console.warn('Permissions API not supported by this browser');
        permissionPromises.push(
          Promise.resolve({ type: 'camera', state: 'prompt' }),
          Promise.resolve({ type: 'microphone', state: 'prompt' })
        );
      }
      
      const results = await Promise.all(permissionPromises);
      const newPermissionStatus = {};
      
      results.forEach(result => {
        newPermissionStatus[result.type] = result.state;
      });
      
      setPermissionStatus(newPermissionStatus);
    } catch (error) {
      console.warn('Error checking permissions:', error);
      // Default to 'prompt' state so user can still try to access camera
      setPermissionStatus({
        camera: 'prompt',
        microphone: 'prompt'
      });
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const startRecordingTimer = () => {
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    startRecordingTimer();
  };

  const handleStopRecording = () => {
    // In fullscreen mode, PAUSE instead of STOP to allow resuming
    if (isFullscreen && isRecording) {
      setIsPaused(true);
      stopRecordingTimer();
      setShowFinishDialog(true);
    } else {
      // Normal stop behavior when not in fullscreen
      setIsRecording(false);
      setIsPaused(false);
      stopRecordingTimer();
    }
  };
  
  const handleFinishRecording = () => {
    setShowFinishDialog(false);
    // Actually stop the recording
    setIsRecording(false);
    setIsPaused(false);
    // Exit fullscreen and the recorded media will show edit tools
    if (isFullscreen) {
      toggleFullscreen();
    }
  };
  
  const handleContinueRecording = () => {
    setShowFinishDialog(false);
    // Resume recording - unpause
    setIsPaused(false);
    // Restart the timer from where we left off
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      // Resume
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      // Pause
      stopRecordingTimer();
    }
  };

  const handleMediaRecorded = (mediaData) => {
    console.log('📸 MobileRecorder: Media recorded:', mediaData.type);
    console.log('📸 MobileRecorder: Current fullscreen state:', isFullscreen);
    
    setRecordedMedia(mediaData);
    setIsRecording(false);
    stopRecordingTimer();
    
    // Exit fullscreen mode so QuickEditTools can appear
    if (isFullscreen) {
      console.log('📱 MobileRecorder: Auto-exiting fullscreen to show edit controls');
      setIsFullscreen(false);
      if (onFullscreenChange) {
        onFullscreenChange(false);
      }
    }
    
    console.log('📸 MobileRecorder: State updates queued, QuickEditTools should appear on next render');
  };

  const handleSaveMedia = (editedMedia) => {
    if (onMediaRecorded) {
      onMediaRecorded(editedMedia || recordedMedia);
    }
    resetRecorder();
  };

  const resetRecorder = () => {
    setRecordedMedia(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    stopRecordingTimer();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    console.log(`📱 Toggling fullscreen: ${isFullscreen} → ${!isFullscreen}`);
    
    const newFullscreenState = !isFullscreen;
    
    // Update local state
    setIsFullscreen(newFullscreenState);
    
    // Notify parent component to adjust modal wrapper
    if (onFullscreenChange) {
      onFullscreenChange(newFullscreenState);
    }
    
    console.log(`✅ Fullscreen toggle complete: ${newFullscreenState}`);
  };

  // Skip permission checks and disclaimers - proceed directly to recording interface
  // This reduces form space and streamlines the mobile recording experience

  return (
    <div ref={containerRef} className={`flex flex-col ${isFullscreen ? 'h-screen w-screen fixed inset-0 z-50' : 'h-full w-full'}`}>
      <Card className={`flex flex-col ${isFullscreen ? 'h-full border-none rounded-none bg-black text-white' : 'h-auto'} w-full ${isFullscreen ? '' : 'max-w-4xl mx-auto'}`}>
        {/* Hide entire header in fullscreen mode */}
        {!isFullscreen && (
          <CardHeader className="pb-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              {/* Hide device badge and fullscreen toggle when in fullscreen mode */}
              {!isFullscreen && (
                <>
                  <Badge variant="outline" className={`gap-1 px-2 py-1 ${
                    deviceType === 'mobile' 
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' 
                      : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                  }`}>
                    {deviceType === 'mobile' ? (
                      <Smartphone className="w-3 h-3" />
                    ) : (
                      <Laptop className="w-3 h-3" />
                    )}
                    <span className="text-xs font-semibold capitalize">{deviceType}</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="min-h-[36px] px-3 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950"
                  >
                    <div className="flex items-center gap-1">
                      <Maximize className="w-4 h-4" />
                      <span className="text-xs font-medium hidden sm:inline">Full</span>
                    </div>
                  </Button>
                </>
              )}
              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // If in fullscreen mode, exit fullscreen first
                    if (isFullscreen) {
                      toggleFullscreen();
                    }
                    // Then close the modal
                    onClose();
                  }}
                  className={`min-h-[36px] min-w-[36px] transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isFullscreen 
                      ? 'text-white border-white hover:bg-white/10 bg-white/5' 
                      : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950'
                  }`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        )}

        <CardContent className={`${isFullscreen ? 'p-0 h-full w-full relative overflow-hidden' : 'space-y-6'}`}>
          {/* Recording Mode Selector - Hide in fullscreen */}
          {!isFullscreen && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {RECORDING_MODES.map((mode) => (
              <Button
                key={mode.id}
                onClick={() => setRecordingMode(mode.id)}
                disabled={isRecording}
                variant="outline"
                className={`h-auto min-h-[120px] sm:min-h-[130px] p-2 sm:p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 flex-1 relative overflow-hidden ${
                  recordingMode === mode.id
                    ? `${mode.borderColor} bg-gradient-to-br ${mode.bgGradient} shadow-2xl`
                    : `border-opacity-30 ${mode.borderColor} bg-gradient-to-br ${mode.bgGradient} opacity-60 hover:opacity-80`
                } ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 w-full h-full relative z-10">
                  {/* Enhanced icon container with multi-layer design */}
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    {/* Outer glow ring for selected state */}
                    {recordingMode === mode.id && (
                      <div 
                        className="absolute -inset-2 rounded-full animate-pulse"
                        style={{
                          background: mode.id === 'video' 
                            ? 'linear-gradient(135deg, #3b82f6, #6366f1)' 
                            : mode.id === 'audio'
                            ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                            : 'linear-gradient(135deg, #f97316, #dc2626)',
                          opacity: 0.3,
                          filter: 'blur(8px)',
                        }}
                      ></div>
                    )}
                    
                    {/* Main icon container with solid brand colors */}
                    <div 
                      className="p-2.5 sm:p-3 rounded-full transition-all duration-300 relative flex items-center justify-center"
                      style={{
                        background: mode.id === 'video'
                          ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                          : mode.id === 'audio'
                          ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                          : 'linear-gradient(135deg, #f97316, #dc2626)',
                        boxShadow: recordingMode === mode.id
                          ? mode.id === 'video'
                            ? '0 10px 25px rgba(59, 130, 246, 0.4)'
                            : mode.id === 'audio'
                            ? '0 10px 25px rgba(168, 85, 247, 0.4)'
                            : '0 10px 25px rgba(249, 115, 22, 0.4)'
                          : '0 4px 10px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {/* Icon with animation - perfectly centered */}
                      <mode.icon 
                        className={`w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-300 block ${
                          recordingMode === mode.id ? 'scale-110' : ''
                        }`} 
                      />
                    </div>
                  </div>
                  
                  <div className="text-center w-full px-0.5 flex flex-col items-center justify-center min-h-0 flex-1">
                    <div className={`text-xs sm:text-sm font-semibold leading-tight mb-0.5 transition-all duration-300 w-full ${
                      recordingMode === mode.id 
                        ? mode.textColor
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {mode.name}
                    </div>
                    <div className={`text-[0.625rem] sm:text-xs leading-tight w-full transition-all duration-300 line-clamp-2 ${
                      recordingMode === mode.id 
                        ? mode.descColor
                        : 'text-muted-foreground'
                    }`}>
                      {mode.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          )}

          {/* Fullscreen Fallback Notification - Hide in fullscreen */}
          {!isFullscreen && fullscreenFallback && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Using maximized view (browser fullscreen unavailable)
              </span>
            </div>
          )}

          {/* Recording Status - Hide in fullscreen */}
          {!isFullscreen && (isRecording || recordedMedia) && (
            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              isRecording 
                ? 'bg-gradient-to-r from-red-50 via-orange-50 to-pink-50 dark:from-red-950 dark:via-orange-950 dark:to-pink-950 border-red-200 dark:border-red-800 shadow-lg shadow-red-100 dark:shadow-red-900/50 animate-pulse-glow'
                : 'bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border-green-200 dark:border-green-800 shadow-lg shadow-green-100 dark:shadow-green-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                        <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="font-semibold text-red-700 dark:text-red-300 tracking-wide">
                        {isPaused ? (
                          <div className="flex items-center gap-1">
                            <Pause className="w-4 h-4" />
                            <span>PAUSED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span>RECORDING</span>
                          </div>
                        )}
                      </span>
                    </div>
                  )}
                  {recordedMedia && (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
                        <div className="absolute inset-1 w-2 h-2 bg-green-300 rounded-full"></div>
                      </div>
                      <span className="font-semibold text-green-700 dark:text-green-300 tracking-wide flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>CAPTURED</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    isRecording 
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  }`}>
                    <Timer className="w-4 h-4" />
                    <span className="font-mono font-bold text-lg tabular-nums">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                  {isRecording && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePauseRecording}
                        className="px-3 py-2 min-h-[36px] bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border-2 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <div className="flex items-center gap-1">
                          {isPaused ? (
                            <>
                              <Play className="w-4 h-4" />
                              <span className="text-xs font-medium hidden sm:inline">Resume</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4" />
                              <span className="text-xs font-medium hidden sm:inline">Pause</span>
                            </>
                          )}
                        </div>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleStopRecording}
                        className="px-3 py-2 min-h-[36px] bg-red-500 hover:bg-red-600 border-2 border-red-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                      >
                        <div className="flex items-center gap-1">
                          <Square className="w-4 h-4 fill-current" />
                          <span className="text-xs font-medium hidden sm:inline">Stop</span>
                        </div>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Recording Interface */}
          <div className={isFullscreen ? 'h-full w-full relative' : 'space-y-4'}>
            {/* Fullscreen Recording Controls Overlay - ALWAYS ON TOP */}
            {isFullscreen && (
              <div className="absolute inset-0 z-[200] pointer-events-none">
                {/* X Button - top right */}
                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Exit fullscreen first
                      toggleFullscreen();
                      // Then close the modal
                      onClose();
                    }}
                    className="absolute top-4 right-4 pointer-events-auto min-h-[44px] min-w-[44px] rounded-full bg-black/60 hover:bg-black/80 text-white border-2 border-white/40 hover:border-white/60 backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
                
                {/* Record/Pause Button - bottom center - HUGE and VISIBLE */}
                {recordingMode !== 'photo' && (
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                    <Button
                      size="icon"
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`w-24 h-24 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-all duration-200 hover:scale-110 active:scale-95 border-4 ${
                        isRecording 
                          ? 'bg-red-600 hover:bg-red-700 border-white animate-pulse shadow-[0_10px_40px_rgba(239,68,68,0.8)]' 
                          : 'bg-white hover:bg-gray-100 border-white shadow-[0_10px_40px_rgba(255,255,255,0.5)]'
                      }`}
                    >
                      {isRecording ? (
                        <Pause className="w-10 h-10 fill-current text-white" />
                      ) : (
                        <div className="w-16 h-16 bg-red-600 rounded-full" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {recordingMode === 'video' && (
              <CameraRecorder
                isRecording={isRecording}
                isPaused={isPaused}
                showPreview={showPreview}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onPauseRecording={handlePauseRecording}
                onMediaRecorded={handleMediaRecorded}
                recordedMedia={recordedMedia}
                isFullscreen={isFullscreen}
              />
            )}

            {recordingMode === 'audio' && (
              <AudioRecorder
                isRecording={isRecording}
                isPaused={isPaused}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onPauseRecording={handlePauseRecording}
                onMediaRecorded={handleMediaRecorded}
                recordedMedia={recordedMedia}
                recordingTime={recordingTime}
              />
            )}
          </div>

          {/* Media Completion Status - Hide in fullscreen */}
          {!isFullscreen && recordedMedia && (
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800/50 shadow-lg shadow-green-100 dark:shadow-green-900/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-green-700 dark:text-green-300">
                    Content Captured Successfully!
                  </h3>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Add to capsule or enhance before delivery
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(recordingTime)}
                </Badge>
              </div>
            </div>
          )}

          {/* Quick Edit Tools - Hide in fullscreen */}
          {(() => {
            const shouldShow = !isFullscreen && recordedMedia;
            console.log('🎨 QuickEditTools render decision:', { 
              isFullscreen, 
              hasRecordedMedia: !!recordedMedia,
              shouldShow,
              recordingMode 
            });
            return shouldShow ? (
              <QuickEditTools
                media={recordedMedia}
                mediaType={recordingMode}
                onSave={handleSaveMedia}
                onRetake={resetRecorder}
                isFullscreen={isFullscreen}
              />
            ) : null;
          })()}
        </CardContent>
      </Card>
      
      {/* Finish/Continue Recording Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Recording Paused</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your recording is paused. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleContinueRecording}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-base"
            >
              <Play className="w-5 h-5 mr-2" />
              Resume Recording
            </Button>
            <p className="text-xs text-center text-muted-foreground -mt-1 mb-2">
              Continue recording from where you paused
            </p>
            
            <Button
              onClick={handleFinishRecording}
              variant="outline"
              className="w-full h-14 border-2 font-semibold text-base hover:bg-green-50 hover:border-green-300"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Finish & Edit
            </Button>
            <p className="text-xs text-center text-muted-foreground -mt-1">
              Stop recording and edit your video
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}