import React, { useRef, useState, useEffect } from 'react';
import { Camera, FlipHorizontal, X, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ProfileCameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

/**
 * 📷 PROFILE CAMERA CAPTURE
 * 
 * Lightweight camera component for profile pictures
 * - Defaults to front-facing camera (selfie mode)
 * - Shows live preview
 * - Flip camera button
 * - Capture and preview before confirming
 */
export function ProfileCameraCapture({ onCapture, onCancel }: ProfileCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // 'user' = front camera
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start camera
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        
        // Stop existing stream if any
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 1280 }
          }
        });

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        // Permission denial is expected user behavior, not an error
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.log('📷 Camera permission denied by user');
        } else {
          console.error('❌ Camera error:', error);
        }
        setCameraError('Unable to access camera. Please check permissions.');
        toast.error('Camera access denied');
      }
    };

    startCamera();

    // Cleanup on unmount
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Flip camera
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Capture photo
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
  };

  // Confirm captured image
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
  };

  // Cancel and cleanup
  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  if (cameraError) {
    return (
      <div className="text-center py-12">
        <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 mb-4">{cameraError}</p>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera Preview / Captured Image */}
      <div className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden">
        {capturedImage ? (
          // Show captured image
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          // Show live camera feed
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Circular crop guide overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/50"
                style={{ width: '80%', paddingTop: '80%' }}
              />
            </div>

            {/* Flip Camera Button */}
            <button
              onClick={handleFlipCamera}
              className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-white rounded-full transition-colors shadow-lg"
            >
              <FlipHorizontal className="w-5 h-5 text-slate-900" />
            </button>
          </>
        )}
      </div>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Action Buttons */}
      <div className="flex gap-3">
        {capturedImage ? (
          // After capture: Retake or Confirm
          <>
            <button
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Retake</span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-5 h-5" />
              <span>Use Photo</span>
            </button>
          </>
        ) : (
          // Before capture: Cancel or Capture
          <>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>Capture</span>
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-center text-slate-500 dark:text-slate-400">
        Position your face in the circle for best results
      </p>
    </div>
  );
}