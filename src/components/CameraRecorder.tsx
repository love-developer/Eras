import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Camera, 
  Video, 
  Square, 
  Play, 
  Pause, 
  FlipHorizontal,
  AlertCircle
} from 'lucide-react';

export function CameraRecorder({ 
  isRecording, 
  isPaused, 
  showPreview,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onMediaRecorded,
  recordedMedia,
  isFullscreen
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false); // Always false - always show controls
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionPromptShown, setPermissionPromptShown] = useState(false);
  const [showManualStart, setShowManualStart] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);

  // Auto-hide "Camera Ready" indicator after it shows
  useEffect(() => {
    if (cameraReady) {
      const timer = setTimeout(() => {
        setCameraReady(false);
      }, 3000); // Hide after 3 seconds to show "Permission saved" message
      
      return () => clearTimeout(timer);
    }
  }, [cameraReady]);

  // SIMPLIFIED CAMERA INITIALIZATION - No complex state tracking
  useEffect(() => {
    if (!showPreview) {
      cleanup();
      return;
    }

    let mounted = true;
    let stream = null;
    let initTimeout = null;
    
    // ABSOLUTE FAILSAFE: Force controls to appear after 8 seconds no matter what
    const absoluteFailsafe = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ ABSOLUTE FAILSAFE: Forcing controls to appear after 8 seconds');
        setIsLoadingCamera(false);
        setCameraReady(true);
      }
    }, 8000);
    
    // Detect device and browser
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIPhone16Pro = isIOS && window.screen.height === 2556; // iPhone 16 Pro specific
    const isAndroid = /Android/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !isEdge;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    console.log('🌐 Browser detected:', {
      isEdge,
      isChrome,
      isIOS,
      isAndroid,
      isMobile,
      userAgent: navigator.userAgent
    });

    const startCamera = async () => {
      try {
        console.log('📷 Starting camera...', isFullscreen ? '(Fullscreen Mode)' : '(Normal Mode)');
        console.log(`Device: ${isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}, iPhone 16 Pro: ${isIPhone16Pro}`);
        
        // Log available media devices (for debugging desktop camera issues)
        if (!isMobile) {
          try {
            // Check permission state if available - CRITICAL for Edge
            if (navigator.permissions && navigator.permissions.query) {
              try {
                const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                console.log('🔐 Camera permission state:', permissionStatus.state);
                
                // If permission is explicitly denied, show error immediately
                if (permissionStatus.state === 'denied') {
                  console.error('🚫 CAMERA PERMISSION IS BLOCKED BY BROWSER');
                  console.error('🔧 Edge users: You must reset site permissions');
                  console.error('📍 INSTRUCTIONS: 1) Click lock icon in address bar 2) Reset permissions 3) Refresh 4) Allow');
                  
                  setError('Camera BLOCKED by Edge. RESET REQUIRED: 1) Look at address bar at top 2) Click the lock or camera icon 3) Click "Reset permissions" 4) Refresh page (press F5) 5) Click "Allow" when asked. Still not working? Type edge://settings/content/camera in a new tab → Find this site in the list → Click "Remove" → Come back here and refresh.');
                  setIsLoadingCamera(false);
                  return; // Stop here, don't try to access camera
                }
                
                // If prompt, user needs to allow
                if (permissionStatus.state === 'prompt') {
                  console.log('✅ Permission will be requested from user');
                }
                
                // If granted, should work
                if (permissionStatus.state === 'granted') {
                  console.log('✅ Camera permission already granted');
                }
              } catch (permErr) {
                console.log('⚠️ Could not query permission state:', permErr.message);
              }
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            console.log('🎥 Available video devices:', videoDevices.map(d => ({ 
              label: d.label || 'Unknown camera', 
              id: d.deviceId 
            })));
            console.log(`📊 Total video inputs found: ${videoDevices.length}`);
            
            // If no video devices found after permission check, warn user
            if (videoDevices.length === 0) {
              console.warn('⚠️ No video input devices detected!');
            }
          } catch (enumErr) {
            console.warn('⚠️ Could not enumerate devices (may be before permission):', enumErr.message);
          }
        }
        
        // Don't set isLoadingCamera - keep controls visible
        setCameraReady(false);
        setError(null);
        setPermissionPromptShown(true);
        
        // Mobile-specific: Extra delay before starting camera in fullscreen
        if ((isIOS || isAndroid) && isFullscreen) {
          console.log(`⏱️ Adding ${isIOS ? 'iPhone' : 'Android'} fullscreen initialization delay...`);
          await new Promise(resolve => setTimeout(resolve, isAndroid ? 500 : 300));
        }
        
        // Safety timeout - if camera doesn't load in 4 seconds, show manual start
        initTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('⏱️ Camera initialization taking longer than expected');
            setShowManualStart(true);
            
            // If still loading after 6 seconds, hide loading screen
            setTimeout(() => {
              if (mounted && isLoadingCamera) {
                console.warn('⏱️ Camera initialization timeout - showing manual controls');
                setIsLoadingCamera(false);
              }
            }, 2000);
          }
        }, 4000);
        
        // Request camera permission and stream with device-appropriate constraints
        // Desktop: Use MULTI-TIER fallback - try progressively simpler constraints
        // Android: Use balanced constraints - not too demanding
        const isDesktop = !isMobile;
        
        let stream = null;
        
        if (isDesktop) {
          // Desktop: Try multiple constraint levels with automatic fallback
          console.log('💻 Desktop detected - attempting multi-tier camera initialization');
          
          // Tier 1: Try with basic constraints
          try {
            console.log('📹 Tier 1: Trying basic constraints with audio...');
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true
            });
            console.log('✅ Tier 1 successful');
          } catch (err) {
            console.log('❌ Tier 1 failed:', err.name, err.message);
            
            // Tier 2: Try video only, no audio
            try {
              console.log('📹 Tier 2: Trying video only (no audio)...');
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
              });
              console.log('✅ Tier 2 successful (video only)');
            } catch (err2) {
              console.log('❌ Tier 2 failed:', err2.name, err2.message);
              
              // Tier 3: Try with empty object constraints
              try {
                console.log('📹 Tier 3: Trying with empty video object...');
                stream = await navigator.mediaDevices.getUserMedia({
                  video: {},
                  audio: false
                });
                console.log('✅ Tier 3 successful');
              } catch (err3) {
                console.log('❌ Tier 3 failed:', err3.name, err3.message);
                // If all tiers fail, throw the original error
                throw err;
              }
            }
          }
        } else if (isAndroid) {
          // Android-specific: Use conservative constraints to ensure compatibility
          const videoConstraints = {
            facingMode: facingMode,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          };
          console.log('🤖 Android detected - using conservative camera constraints');
          console.log('📹 Requesting camera with constraints:', videoConstraints);
          
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: true
          });
        } else {
          // iOS and other mobile
          const videoConstraints = {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };
          console.log('📹 Requesting camera with constraints:', videoConstraints);
          
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: true
          });
        }

        // Clear the safety timeout since we got the stream
        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('✅ Camera stream obtained successfully');
        streamRef.current = stream;

        // Attach to video element
        if (videoRef.current) {
          // CRITICAL: Set srcObject on the video element
          const videoElement = videoRef.current;
          
          // Configure video properties BEFORE assigning srcObject
          videoElement.muted = true; // Must be muted for autoplay
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          
          // Android-specific: Set additional attributes to ensure video displays
          if (isAndroid) {
            console.log('🤖 Android detected - applying Android-specific video settings');
            videoElement.setAttribute('playsinline', 'true');
            videoElement.setAttribute('autoplay', 'true');
            videoElement.setAttribute('muted', 'true');
            videoElement.setAttribute('webkit-playsinline', 'true'); // For older Android browsers
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElement.style.display = 'block';
            videoElement.style.transform = 'translateZ(0)'; // Force GPU acceleration
            videoElement.style.webkitTransform = 'translateZ(0)';
          } else if (isDesktop) {
            console.log('💻 Desktop detected - setting explicit video dimensions');
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElement.style.display = 'block';
          }
          
          // Log stream tracks before assignment
          const videoTracks = stream.getVideoTracks();
          console.log('📹 Stream video tracks:', videoTracks.length);
          if (videoTracks.length > 0) {
            const track = videoTracks[0];
            console.log('📹 Video track state:', {
              label: track.label,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted,
              settings: track.getSettings()
            });
          }
          
          // Now assign the stream
          videoElement.srcObject = stream;
          console.log('📹 Video element srcObject set');
          
          // Store diagnostic info
          setDiagnosticInfo({
            hasStream: true,
            trackCount: videoTracks.length,
            trackState: videoTracks[0]?.readyState,
            isDesktop: isDesktop,
            isEdge: isEdge
          });
          
          // Browser-specific: Ensure video element properties are set correctly
          if (isEdge) {
            console.log('🔷 Edge detected - applying Edge-specific video settings');
            videoElement.setAttribute('playsinline', 'true');
            videoElement.setAttribute('autoplay', 'true');
            videoElement.setAttribute('muted', 'true');
            
            // Desktop Edge: Force load() to trigger video processing
            try {
              videoElement.load();
              console.log('🔷 Edge: Forced video load()');
            } catch (loadErr) {
              console.warn('Edge load() error:', loadErr.message);
            }
          }
          
          // Android-specific: Force a layout recalculation to ensure video renders
          if (isAndroid) {
            console.log('🤖 Android: Forcing layout recalculation');
            void videoElement.offsetHeight; // Force reflow
            
            // Android Chrome: Sometimes needs explicit load() call
            if (isChrome) {
              try {
                videoElement.load();
                console.log('🤖 Android Chrome: Forced video load()');
              } catch (loadErr) {
                console.warn('Android Chrome load() error:', loadErr.message);
              }
            }
          }
          
          // Multiple event listeners to ensure we catch when video is ready
          let readyHandled = false;
          
          const markReady = () => {
            if (!readyHandled && mounted) {
              readyHandled = true;
              console.log('✅ Video ready - dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
              
              // Edge-specific: Double-check that video has valid dimensions
              if (isEdge && (videoElement.videoWidth === 0 || videoElement.videoHeight === 0)) {
                console.warn('⚠️ Edge: Video dimensions are 0, waiting for proper load...');
                // Don't mark as ready yet, wait for actual dimensions
                readyHandled = false;
                return;
              }
              
              setIsLoadingCamera(false);
              setCameraReady(true);
            }
          };
          
          // Listen to multiple events
          videoElement.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded');
            markReady();
          };
          videoElement.onloadeddata = () => {
            console.log('📹 Video data loaded');
            markReady();
          };
          videoElement.oncanplay = () => {
            console.log('📹 Video can play');
            markReady();
          };
          videoElement.onplaying = () => {
            console.log('📹 Video is playing!');
            markReady();
          };
          
          // Create promises for different ready states
          const metadataPromise = new Promise((resolve) => {
            videoElement.addEventListener('loadedmetadata', resolve, { once: true });
          });
          
          const canPlayPromise = new Promise((resolve) => {
            videoElement.addEventListener('canplay', resolve, { once: true });
          });
          
          const playingPromise = new Promise((resolve) => {
            videoElement.addEventListener('playing', resolve, { once: true });
          });
          
          // Wait for either event, with appropriate timeout per device
          try {
            const waitTimeout = isAndroid ? 3000 : (isEdge ? 3000 : 2000);
            await Promise.race([
              metadataPromise,
              canPlayPromise,
              playingPromise,
              new Promise((resolve) => setTimeout(resolve, waitTimeout))
            ]);
            console.log('✅ Video metadata/canplay event received');
          } catch (e) {
            console.log('ℹ️ Waiting for video ready timed out, continuing anyway');
          }
          
          // Mark as ready if not already done
          markReady();
          
          // Non-iOS: Ensure video element is rendered and visible
          if (!isIOS) {
            console.log(`${isAndroid ? '🤖 Android' : '💻 Desktop'} detected - ensuring video visibility`);
            videoElement.style.display = 'block';
            videoElement.style.visibility = 'visible';
            videoElement.style.opacity = '1';
          }
          
          // CRITICAL: Try to play the video - this is essential for camera feed display
          // Desktop Edge and Android need very aggressive play attempts
          const attemptPlay = async (attemptNumber = 1) => {
            try {
              console.log(`🎬 Play attempt ${attemptNumber}${isEdge ? ' (Edge)' : isAndroid ? ' (Android)' : ''} - Mobile: ${isMobile}`);
              
              // Desktop Edge and Android: Extra preparation before play
              if ((isDesktop && isEdge) || isAndroid) {
                if (attemptNumber === 1) {
                  console.log(`${isAndroid ? '🤖 Android' : '🔷 Desktop Edge'}: Pre-play preparation`);
                  // Ensure video element is in the DOM and visible
                  videoElement.style.display = 'block';
                  videoElement.style.visibility = 'visible';
                  videoElement.style.opacity = '1';
                  // Force a reflow
                  void videoElement.offsetHeight;
                  
                  // Android-specific: Additional prep
                  if (isAndroid) {
                    videoElement.style.transform = 'translateZ(0)';
                    videoElement.style.webkitTransform = 'translateZ(0)';
                  }
                }
              }
              
              const playPromise = videoElement.play();
              
              if (playPromise !== undefined) {
                await playPromise;
                console.log(`✅ Video playing successfully (attempt ${attemptNumber})`);
                console.log('📹 Video state:', {
                  paused: videoElement.paused,
                  readyState: videoElement.readyState,
                  videoWidth: videoElement.videoWidth,
                  videoHeight: videoElement.videoHeight,
                  currentTime: videoElement.currentTime
                });
                
                // Desktop/Android: Verify video is actually displaying
                if (isDesktop || isAndroid) {
                  setTimeout(() => {
                    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                      console.log(`✅ ${isAndroid ? 'Android' : 'Desktop'}: Video dimensions confirmed:`, videoElement.videoWidth, 'x', videoElement.videoHeight);
                      setIsLoadingCamera(false);
                      setCameraReady(true);
                      setShowManualStart(false);
                      
                      // Update diagnostic info
                      setDiagnosticInfo(prev => ({
                        ...prev,
                        videoWidth: videoElement.videoWidth,
                        videoHeight: videoElement.videoHeight,
                        playing: !videoElement.paused,
                        isAndroid: isAndroid
                      }));
                    } else {
                      console.warn('⚠️ Desktop: Video dimensions still 0, checking stream tracks');
                      
                      // Desktop: Check if stream tracks are active
                      const videoTrack = stream.getVideoTracks()[0];
                      if (videoTrack) {
                        console.log('📹 Video track state:', {
                          readyState: videoTrack.readyState,
                          enabled: videoTrack.enabled,
                          muted: videoTrack.muted,
                          settings: videoTrack.getSettings()
                        });
                        
                        if (videoTrack.readyState === 'live' && videoTrack.enabled && !videoTrack.muted) {
                          console.log('🔷 Stream is live but video not showing - trying nuclear option');
                          
                          // Nuclear option: Complete reset with delays
                          videoElement.pause();
                          videoElement.srcObject = null;
                          videoElement.load();
                          
                          setTimeout(() => {
                            videoElement.srcObject = stream;
                            setTimeout(() => {
                              videoElement.play().then(() => {
                                console.log('✅ Nuclear option worked!');
                                setIsLoadingCamera(false);
                                setCameraReady(true);
                                setShowManualStart(false);
                              }).catch(e => {
                                console.error('❌ Nuclear option failed:', e.message);
                                setShowManualStart(true);
                              });
                            }, 300);
                          }, 100);
                        } else if (videoTrack.muted) {
                          console.warn('⚠️ Video track is MUTED! Trying to unmute...');
                          // This shouldn't happen, but try to fix it
                          videoTrack.enabled = true;
                          setTimeout(() => attemptPlay(attemptNumber + 1), 500);
                        } else {
                          console.error('❌ Stream is not in a playable state');
                          setShowManualStart(true);
                        }
                      }
                    }
                  }, 500);
                }
              }
            } catch (playError) {
              console.log(`⚠️ Play attempt ${attemptNumber} failed:`, playError.name, playError.message);
              
              // Desktop/Android: Try multiple times with increasing delays
              if ((isDesktop || isAndroid) && attemptNumber < 5 && mounted) {
                const delay = attemptNumber * (isAndroid ? 500 : 400);
                console.log(`${isAndroid ? '🤖 Android' : '🔷 Desktop'}: Retrying play in ${delay}ms...`);
                setTimeout(() => {
                  if (mounted) attemptPlay(attemptNumber + 1);
                }, delay);
              } else {
                console.error('❌ All play attempts failed');
                setShowManualStart(true);
                setIsLoadingCamera(false);
              }
            }
          };
          
          await attemptPlay();
        }

        setError(null);
      } catch (err) {
        console.log('📷 Camera initialization failed:', err.name, '-', err.message);
        
        // Only log full error details if it's NOT a permission denial (those are expected)
        if (err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError') {
          console.error('❌ Unexpected camera error:', err);
          console.error('Error stack:', err.stack);
        }
        
        // Desktop-specific: Log detailed diagnostic info
        if (!isMobile) {
          console.error('🖥️ DESKTOP ERROR DETAILS:', {
            errorName: err.name,
            errorMessage: err.message,
            browser: isEdge ? 'Edge' : isChrome ? 'Chrome' : 'Other',
            userAgent: navigator.userAgent,
            mediaDevicesSupported: !!navigator.mediaDevices,
            getUserMediaSupported: !!navigator.mediaDevices?.getUserMedia
          });
        }
        
        // Clear the safety timeout
        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }
        
        // Mobile-specific: If camera fails in fullscreen, try to recover
        if ((isIOS || isAndroid) && isFullscreen && mounted) {
          console.log(`🔄 ${isIOS ? 'iPhone' : 'Android'} fullscreen camera failed, attempting recovery...`);
          setIsLoadingCamera(false);
          setCameraReady(false);
          
          // Wait a moment then try again - Android gets more time
          setTimeout(() => {
            if (mounted) {
              console.log('🔄 Retrying camera initialization...');
              startCamera();
            }
          }, isAndroid ? 1500 : 1000);
          
          return; // Don't show error yet, give recovery a chance
        }
        
        if (err.message === 'Camera access timeout') {
          setError('Camera is not responding. Please check permissions in your browser settings and refresh the page.');
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          // Enhanced error message with browser-specific instructions
          const isEdge = /Edg/.test(navigator.userAgent);
          const isChrome = /Chrome/.test(navigator.userAgent) && !isEdge;
          
          let browserInstructions = '';
          if (isEdge) {
            browserInstructions = ' EDGE: Camera is BLOCKED. 1) Click lock icon in address bar 2) Click "Reset permissions" 3) Refresh page (F5) 4) Click "Allow". OR: Type edge://settings/content/camera → Remove this site → Refresh';
          } else if (isChrome) {
            browserInstructions = ' In Chrome: Click the camera icon 🎥 in the address bar → Allow';
          } else {
            browserInstructions = ' Click the camera/lock icon in your browser\'s address bar and allow camera access.';
          }
          
          setError(`Camera BLOCKED by browser.${browserInstructions}`);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found. Please connect a camera and refresh the page.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is being used by another application. Please close other apps using the camera and refresh.');
        } else {
          setError(err.message || 'Camera access denied. Please check your browser permissions and refresh the page.');
        }
        
        setIsLoadingCamera(false);
        setCameraReady(false);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      if (absoluteFailsafe) {
        clearTimeout(absoluteFailsafe);
      }
      cleanup();
    };
  }, [showPreview, facingMode]); // Only restart when needed - isFullscreen doesn't require camera restart

  // Simple cleanup function
  const cleanup = () => {
    console.log('🧹 Cleaning up camera');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Reset loading states
    setIsLoadingCamera(true);
    setCameraReady(false);
  };

  // Recording management
  useEffect(() => {
    if (isRecording && !isPaused && !recordingStartTime) {
      setRecordingStartTime(Date.now());
      startRecording();
    } else if (!isRecording && recordingStartTime) {
      stopRecording();
      setRecordingStartTime(null);
    } else if (isPaused && mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    } else if (!isPaused && mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  }, [isRecording, isPaused]);

  const startRecording = () => {
    if (!streamRef.current) {
      console.error('No stream available');
      return;
    }

    try {
      recordedChunksRef.current = [];
      
      // Edge/Chrome codec detection
      const getSupportedMimeType = () => {
        const types = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=h264,opus',
          'video/webm',
          'video/mp4'
        ];
        
        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
            console.log('✅ Using MIME type:', type);
            return type;
          }
        }
        
        console.warn('⚠️ No supported MIME type found, using default');
        return '';
      };
      
      const mimeType = getSupportedMimeType();
      const options = mimeType ? {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000
      } : {
        videoBitsPerSecond: 2500000
      };

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('🎥 Video recording stopped, creating blob...');
        const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
        console.log('🎥 Video blob created, size:', blob.size);
        const url = URL.createObjectURL(blob);
        console.log('🎥 Video URL created:', url);
        
        if (onMediaRecorded) {
          console.log('🎥 Calling onMediaRecorded with video data');
          onMediaRecorded({
            type: 'video',
            url: url,
            blob: blob,
            timestamp: Date.now()
          });
        } else {
          console.error('❌ onMediaRecorded callback not provided!');
        }
      };

      mediaRecorderRef.current.start(100);
      console.log('🎥 Recording started with', mimeType || 'default codec');
    } catch (err) {
      console.error('Recording error:', err);
      setError('Recording failed: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('⏹️ Recording stopped');
    }
  };

  const takePhoto = () => {
    console.log('📸 takePhoto called');
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Video or canvas ref not available');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    console.log('📸 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      console.log('📸 Photo blob created, size:', blob.size);
      const url = URL.createObjectURL(blob);
      console.log('📸 Photo URL created:', url);
      
      if (onMediaRecorded) {
        console.log('📸 Calling onMediaRecorded with photo data');
        onMediaRecorded({
          type: 'photo',
          url: url,
          blob: blob,
          timestamp: Date.now()
        });
      } else {
        console.error('❌ onMediaRecorded callback not provided!');
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Don't render camera interface if media has been recorded - let parent handle preview
  if (recordedMedia) {
    console.log('📹 CameraRecorder: Media recorded, hiding camera interface');
    return null;
  }

  if (error) {
    const isPermissionError = error.includes('denied') || error.includes('permission') || error.includes('BLOCKED');
    const isNotFoundError = error.includes('No camera found');
    const isEdgeBlocked = error.includes('EDGE') || error.includes('Edge');
    
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-2xl mx-auto">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${isEdgeBlocked ? 'text-red-600 dark:text-red-400' : ''}`}>Camera Access {isEdgeBlocked ? 'BLOCKED by Browser' : isPermissionError ? 'Denied' : isNotFoundError ? 'Not Available' : 'Error'}</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              
              {isPermissionError && (
                <div className={`${isEdgeBlocked ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'} border rounded-lg p-4 text-left space-y-3`}>
                  <h4 className={`font-semibold text-sm ${isEdgeBlocked ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'} flex items-center gap-2`}>
                    <AlertCircle className="w-4 h-4" />
                    {isEdgeBlocked ? '⚠️ Microsoft Edge - Camera Permission BLOCKED' : 'How to enable camera permissions:'}
                  </h4>
                  {isEdgeBlocked ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">The browser has actively blocked camera access. Follow these steps:</p>
                      <ol className="text-xs text-red-600 dark:text-red-400 space-y-2 list-decimal list-inside ml-2">
                        <li><strong>Look at the top of your browser</strong> - Find the address bar (where the URL is)</li>
                        <li><strong>Find the lock or camera icon</strong> - It is on the left side of the address bar</li>
                        <li><strong>Click the icon</strong> - A menu will appear</li>
                        <li><strong>Click "Reset permissions"</strong> button</li>
                        <li><strong>Click "Refresh Page" below</strong></li>
                        <li><strong>When prompted, click "Allow"</strong></li>
                      </ol>
                      <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs mt-2">
                        <strong>Still blocked?</strong> Type this in a new tab: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">edge://settings/content/camera</code> → Find this site → Remove → Refresh
                      </div>
                    </div>
                  ) : (
                    <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-2 list-decimal list-inside">
                      <li><strong>Chrome/Edge:</strong> Click the camera icon in the address bar, select "Always allow", then click "Try Again" below</li>
                      <li><strong>Firefox:</strong> Click the permissions icon (left of address bar), find Camera, and select "Allow"</li>
                      <li><strong>Safari:</strong> Safari → Settings → Websites → Camera → Allow for this site</li>
                      <li>If you don't see a prompt, you may need to refresh the page after enabling permissions</li>
                    </ol>
                  )}
                </div>
              )}
              
              {isNotFoundError && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-left space-y-2">
                  <h4 className="font-semibold text-sm text-orange-700 dark:text-orange-300">Troubleshooting:</h4>
                  <ul className="text-xs text-orange-600 dark:text-orange-400 space-y-1 list-disc list-inside">
                    <li>Make sure your camera is connected and not in use by another application</li>
                    <li>Try closing other apps that might be using the camera (Zoom, Teams, etc.)</li>
                    <li>Restart your browser if the camera was recently connected</li>
                  </ul>
                </div>
              )}
              
              <div className="flex gap-3 justify-center flex-wrap">
                <Button 
                  onClick={() => {
                    setError(null);
                    cleanup();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className={`w-full flex flex-col bg-gray-900 ${isFullscreen ? 'h-screen absolute inset-0' : 'h-auto'}`}
      data-camera-active="true"
    >
      {/* Camera Preview Section - Full screen in fullscreen mode */}
      <div className={`relative w-full bg-black overflow-hidden ${isFullscreen ? 'h-full w-full absolute inset-0' : 'min-h-[60vh] sm:min-h-[70vh] rounded-lg flex-1'}`}>
        {/* Video Preview - Always visible, positioned behind loading overlay */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full"
          style={{ 
            transform: 'scaleX(1)', // Ensure proper orientation
            backgroundColor: '#000', // Black background while loading
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            maxWidth: '100%', // Force full width
            position: 'absolute', // Ensure it fills container
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onCanPlay={(e) => {
            // Backup: If video starts playing, mark as ready
            console.log('✅ Video can play event - marking as ready');
            setIsLoadingCamera(false);
            setCameraReady(true);
            setShowManualStart(false);
            
            // Edge: Force play if not already playing
            if (e.target.paused) {
              console.log('🔷 Video paused on canPlay - forcing play');
              e.target.play().catch(err => console.log('Force play on canPlay:', err.message));
            }
          }}
          onLoadedMetadata={(e) => {
            console.log('📹 Video metadata loaded event - dimensions:', e.target.videoWidth, 'x', e.target.videoHeight);
            
            // Edge: Explicitly try to play on metadata load
            if (e.target.paused) {
              console.log('🔷 Attempting play on metadata load');
              e.target.play().catch(err => console.log('Play on metadata:', err.message));
            }
            
            // If dimensions are valid, mark as ready
            if (e.target.videoWidth > 0 && e.target.videoHeight > 0) {
              console.log('✅ Valid video dimensions detected');
              setIsLoadingCamera(false);
              setCameraReady(true);
              setShowManualStart(false);
            }
          }}
          onPlaying={() => {
            console.log('✅ Video is playing!');
            setIsLoadingCamera(false);
            setCameraReady(true);
            setShowManualStart(false);
          }}
          onError={(e) => {
            console.error('❌ Video element error:', e);
          }}
        />
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading Indicator - Shows while camera is initializing */}
        {isLoadingCamera && (
          <div 
            className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-20 cursor-pointer"
            onClick={() => {
              // Allow user to dismiss loading screen AND try to play video
              console.log('ℹ️ User clicked loading screen - attempting to play video');
              setIsLoadingCamera(false);
              
              // Try to play video on user interaction (helps with autoplay restrictions)
              if (videoRef.current) {
                videoRef.current.play().then(() => {
                  console.log('✅ Video playing after user click');
                  setCameraReady(true);
                }).catch(err => {
                  console.log('⚠️ Video play failed after click:', err.message);
                });
              }
            }}
          >
            <div className="flex flex-col items-center gap-4 text-center px-4">
              {/* Animated camera icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full">
                  <Camera className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>
              
              {/* Loading text */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Starting Camera...</h3>
                <p className="text-sm text-gray-300">
                  {isFullscreen ? 'Loading fullscreen camera view' : 'Initializing camera'}
                </p>
              </div>
              
              {/* Loading spinner */}
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>

              {/* Helpful tip - Desktop-friendly instructions */}
              <div className="space-y-1 mt-2 max-w-md">
                <p className="text-xs text-gray-300 font-medium mb-2">
                  📹 Camera Permission Required
                </p>
                <p className="text-xs text-gray-400">
                  Your browser will ask for permission to use your camera
                </p>
                <p className="text-xs text-gray-400">
                  Look for a popup near the address bar at the top of your browser
                </p>
                <p className="text-xs text-blue-400 font-medium mt-3">
                  💡 Click "Allow" to start using the camera
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  (Click anywhere to dismiss this screen and try to start camera)
                </p>
              </div>
              
              {/* Manual start button - shows if camera takes too long */}
              {(permissionPromptShown || showManualStart) && (
                <Button
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent triggering the parent onClick
                    console.log('🎬 User clicked manual start button - NUCLEAR OPTION');
                    setIsLoadingCamera(true);
                    setShowManualStart(false);
                    setError(null);
                    
                    // If we don't have a stream yet, try to get one first
                    if (!streamRef.current) {
                      console.log('🔄 No stream found, attempting to initialize camera via manual start...');
                      try {
                        const isAndroid = /Android/.test(navigator.userAgent);
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        const isDesktop = !isMobile;
                        
                        let stream = null;
                        
                        if (isDesktop) {
                          // Desktop: Use multi-tier fallback
                          console.log('💻 Desktop manual start - attempting multi-tier initialization');
                          
                          try {
                            console.log('📹 Manual Tier 1: Video + audio...');
                            stream = await navigator.mediaDevices.getUserMedia({
                              video: true,
                              audio: true
                            });
                            console.log('✅ Manual Tier 1 successful');
                          } catch (err1) {
                            console.log('❌ Manual Tier 1 failed, trying video only...');
                            try {
                              stream = await navigator.mediaDevices.getUserMedia({
                                video: true,
                                audio: false
                              });
                              console.log('✅ Manual Tier 2 successful (video only)');
                            } catch (err2) {
                              console.log('❌ Manual Tier 2 failed, trying empty constraints...');
                              stream = await navigator.mediaDevices.getUserMedia({
                                video: {},
                                audio: false
                              });
                              console.log('✅ Manual Tier 3 successful');
                            }
                          }
                        } else if (isAndroid) {
                          const videoConstraints = {
                            facingMode: facingMode,
                            width: { ideal: 1280, max: 1920 },
                            height: { ideal: 720, max: 1080 }
                          };
                          console.log('📹 Android manual start - requesting camera...');
                          stream = await navigator.mediaDevices.getUserMedia({
                            video: videoConstraints,
                            audio: true
                          });
                        } else {
                          // iOS
                          const videoConstraints = {
                            facingMode: facingMode,
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                          };
                          console.log('📹 iOS manual start - requesting camera...');
                          stream = await navigator.mediaDevices.getUserMedia({
                            video: videoConstraints,
                            audio: true
                          });
                        }
                        
                        console.log('✅ Camera stream obtained via manual start');
                        streamRef.current = stream;
                      } catch (err) {
                        console.error('❌ Failed to get camera stream:', err);
                        setError('Camera access failed. Please ensure camera permissions are granted.');
                        setIsLoadingCamera(false);
                        setShowManualStart(true);
                        return;
                      }
                    }
                    
                    // Nuclear option: Most aggressive recovery for desktop Edge
                    if (videoRef.current && streamRef.current) {
                      const videoElement = videoRef.current;
                      const stream = streamRef.current;
                      const isEdge = /Edg/.test(navigator.userAgent);
                      const isDesktop = !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                      
                      console.log('🎬 Manual start - Desktop:', isDesktop, 'Edge:', isEdge);
                      console.log('📹 Current video state:', {
                        srcObject: !!videoElement.srcObject,
                        paused: videoElement.paused,
                        readyState: videoElement.readyState,
                        videoWidth: videoElement.videoWidth,
                        videoHeight: videoElement.videoHeight,
                        hasStream: !!stream,
                        streamActive: stream?.active
                      });
                      
                      // Check stream tracks
                      const videoTracks = stream?.getVideoTracks() || [];
                      if (videoTracks.length > 0) {
                        const track = videoTracks[0];
                        console.log('📹 Video track:', {
                          label: track.label,
                          enabled: track.enabled,
                          readyState: track.readyState,
                          muted: track.muted,
                          settings: track.getSettings()
                        });
                        
                        // Ensure track is enabled
                        if (!track.enabled) {
                          console.log('🔧 Enabling video track');
                          track.enabled = true;
                        }
                      }
                      
                      // NUCLEAR OPTION: Complete teardown and rebuild
                      console.log('💥 NUCLEAR OPTION: Complete video element reset');
                      
                      // Step 1: Stop everything
                      videoElement.pause();
                      videoElement.srcObject = null;
                      
                      // Step 2: Force properties
                      videoElement.muted = true;
                      videoElement.autoplay = true;
                      videoElement.playsInline = true;
                      videoElement.style.display = 'block';
                      videoElement.style.visibility = 'visible';
                      videoElement.style.opacity = '1';
                      videoElement.style.width = '100%';
                      videoElement.style.height = '100%';
                      videoElement.style.objectFit = 'cover';
                      
                      // Step 3: Force a reflow
                      void videoElement.offsetHeight;
                      
                      // Step 4: Reattach stream with delay
                      setTimeout(() => {
                        console.log('💥 Reattaching stream...');
                        videoElement.srcObject = stream;
                        
                        // Step 5: Force load
                        try {
                          videoElement.load();
                          console.log('💥 Forced load()');
                        } catch (e) {
                          console.log('Load error (non-fatal):', e.message);
                        }
                        
                        // Step 6: Multiple play attempts with delays
                        let playAttempt = 0;
                        const tryPlay = () => {
                          playAttempt++;
                          console.log(`💥 Nuclear play attempt ${playAttempt}`);
                          
                          videoElement.play().then(() => {
                            console.log('✅ NUCLEAR OPTION SUCCESS! Video is playing!');
                            console.log('📹 Final video state:', {
                              paused: videoElement.paused,
                              videoWidth: videoElement.videoWidth,
                              videoHeight: videoElement.videoHeight,
                              currentTime: videoElement.currentTime
                            });
                            setCameraReady(true);
                            setShowManualStart(false);
                          }).catch(playErr => {
                            console.error(`❌ Nuclear play attempt ${playAttempt} failed:`, playErr.message);
                            
                            if (playAttempt < 5) {
                              // Try again with increasing delay
                              const delay = playAttempt * 500;
                              console.log(`🔄 Retrying in ${delay}ms...`);
                              setTimeout(tryPlay, delay);
                            } else {
                              console.error('❌ ALL NUCLEAR OPTIONS EXHAUSTED');
                              setError('Camera stream available but video won\'t display. Try: 1) Closing other apps using camera 2) Restarting browser 3) Checking camera drivers');
                              setShowManualStart(true);
                            }
                          });
                        };
                        
                        // Start first play attempt after short delay
                        setTimeout(tryPlay, 300);
                      }, 200);
                    } else {
                      console.error('❌ No video element or stream available');
                      setError('Camera not initialized. Please refresh the page.');
                    }
                  }}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg animate-pulse"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {showManualStart ? 'Click to Activate Camera' : 'Click Here to Start Camera'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && !isLoadingCamera && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse z-10">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-sm font-medium">Recording</span>
          </div>
        )}

        {/* Camera Ready Indicator - Brief flash when camera starts */}
        {cameraReady && !isLoadingCamera && (
          <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 z-10 shadow-lg"
               style={{ animation: 'fadeInOut 3s ease-in-out' }}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Camera Ready</span>
              <span className="text-xs opacity-90">Permission saved ✓</span>
            </div>
          </div>
        )}

        {/* Top Right Controls - ALWAYS VISIBLE */}
        <div className="absolute top-4 right-4 z-10">
            {/* Flip Camera Button */}
            <Button
              size="icon"
              variant="secondary"
              onClick={toggleCamera}
              className="rounded-full w-10 h-10 bg-white/90 hover:bg-white text-black"
            >
              <FlipHorizontal className="w-5 h-5" />
            </Button>
          </div>

        {/* iPhone-style Camera Controls - Positioned at bottom inside camera view - ALWAYS VISIBLE */}
        <div className={`absolute bottom-0 left-0 right-0 z-10 pb-8 ${isFullscreen ? 'pb-12' : 'pb-6'}`}>
            <div className="flex items-center justify-center gap-8">
              {/* Photo Capture Button - Left side */}
              {!isRecording && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    size="icon"
                    onClick={takePhoto}
                    disabled={isLoadingCamera}
                    className="rounded-full bg-white/90 hover:bg-white border-4 border-purple-500 shadow-2xl transition-all hover:scale-105 active:scale-95 w-16 h-16"
                  >
                    <Camera className="w-7 h-7 text-purple-600" />
                  </Button>
                  <span className="text-xs text-white font-medium drop-shadow-lg">Photo</span>
                </div>
              )}

              {/* Video Record Button - Center (iPhone-style) */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {/* Outer ring */}
                  <div className={`rounded-full bg-white/90 shadow-2xl transition-all ${
                    isRecording ? 'p-1' : 'p-2'
                  } ${isFullscreen ? 'w-20 h-20' : 'w-[75px] h-[75px]'}`}>
                    {/* Inner button */}
                    <Button
                      size="icon"
                      onClick={isRecording ? onStopRecording : onStartRecording}
                      disabled={isLoadingCamera}
                      className={`w-full h-full rounded-full shadow-lg transition-all hover:scale-95 active:scale-90 ${
                        isRecording 
                          ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' 
                          : 'bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                      }`}
                    >
                      {isRecording ? (
                        <Square className="w-6 h-6 fill-current text-white" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-600" />
                      )}
                    </Button>
                  </div>
                </div>
                <span className="text-xs text-white font-medium drop-shadow-lg">
                  {isRecording ? 'Stop' : 'Video'}
                </span>
              </div>

              {/* Pause Button - Right side (during recording) */}
              {isRecording && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    size="icon"
                    onClick={onPauseRecording}
                    className="rounded-full bg-white/90 hover:bg-white shadow-2xl transition-all hover:scale-105 active:scale-95 w-16 h-16"
                  >
                    {isPaused ? (
                      <Play className="w-7 h-7 text-gray-800" />
                    ) : (
                      <Pause className="w-7 h-7 text-gray-800" />
                    )}
                  </Button>
                  <span className="text-xs text-white font-medium drop-shadow-lg">
                    {isPaused ? 'Resume' : 'Pause'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      
      {/* Empty controls section for non-fullscreen mode to maintain layout */}
      {!isFullscreen && (
        <div className="bg-gray-800 rounded-b-lg p-2">
        </div>
      )}
    </div>
  );
}
