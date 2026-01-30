import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { RotateCw, Check, X } from 'lucide-react';

interface ProfileImageCropProps {
  imageSrc: string;
  onComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CroppedAreaPixels extends Area {}

/**
 * ✂️ PROFILE IMAGE CROP
 * 
 * Allows user to crop and adjust their profile picture
 * - Circular crop shape
 * - Zoom in/out
 * - Drag to reposition
 * - Rotate option
 */
export function ProfileImageCrop({ imageSrc, onComplete, onCancel }: ProfileImageCropProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image
  const createCroppedImage = async (): Promise<Blob> => {
    if (!croppedAreaPixels) {
      throw new Error('No crop area defined');
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set canvas size to crop area
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Apply rotation if needed
        if (rotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        // Draw the cropped image
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.9
        );
      };

      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleSave = async () => {
    try {
      setProcessing(true);
      const croppedBlob = await createCroppedImage();
      onComplete(croppedBlob);
    } catch (error) {
      console.error('Crop error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="space-y-4">
      {/* Cropper Area */}
      <div className="relative h-80 bg-slate-900 rounded-xl overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Zoom Slider */}
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Rotate Button */}
        <button
          onClick={handleRotate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          <span>Rotate 90°</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
          <span>Cancel</span>
        </button>
        <button
          onClick={handleSave}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-center text-slate-500 dark:text-slate-400">
        Pinch or drag the slider to zoom • Drag to reposition
      </p>
    </div>
  );
}
