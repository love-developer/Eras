import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Settings,
  Waveform,
  Radio,
  Gauge,
  Headphones,
  MicOff
} from 'lucide-react';

const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
    channelCount: 2
  }
};

export function AudioRecorder({ 
  isRecording, 
  isPaused,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onMediaRecorded,
  recordedMedia,
  autoEnhance,
  recordingTime
}) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [maxAudioLevel, setMaxAudioLevel] = useState(0);
  const [audioSettings, setAudioSettings] = useState({
    gain: [50],
    noiseReduction: [80],
    monitoring: false
  });
  const [waveformData, setWaveformData] = useState(new Array(128).fill(0));
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackAudio, setPlaybackAudio] = useState(null);

  useEffect(() => {
    initializeAudio();
    
    return () => {
      cleanup();
    };
  }, []);

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

  const checkAudioPermissions = async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' });
      return permissions.state;
    } catch (error) {
      console.warn('Permission API not supported, will request directly');
      return 'prompt';
    }
  };

  const initializeAudio = async () => {
    setIsInitializing(true);
    setPermissionError(null);
    
    try {
      // Check permission status first
      const permissionStatus = await checkAudioPermissions();
      
      if (permissionStatus === 'denied') {
        throw new Error('Microphone access has been denied. Please enable microphone permissions in your browser settings and refresh the page.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      streamRef.current = stream;
      
      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      
      setHasPermission(true);
      startVisualization();
    } catch (error) {
      console.error('Audio initialization error:', error);
      
      let errorMessage = error.message;
      
      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is busy or unavailable. Please close other apps using the microphone and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone settings not supported. Trying with basic settings...';
        // Try with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = basicStream;
          
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          
          const source = audioContextRef.current.createMediaStreamSource(basicStream);
          source.connect(analyserRef.current);
          
          analyserRef.current.fftSize = 256;
          
          setHasPermission(true);
          startVisualization();
          setIsInitializing(false);
          return;
        } catch (basicError) {
          errorMessage = 'Microphone not accessible. Please check your device settings.';
        }
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked by security settings. Please ensure you\'re using HTTPS.';
      }
      
      setPermissionError(errorMessage);
      setHasPermission(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const startVisualization = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVisualization = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate audio level (RMS)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        const level = (rms / 255) * 100;
        
        setAudioLevel(level);
        setMaxAudioLevel(prev => Math.max(prev, level));
        
        // Update waveform data (downsample to 128 points)
        const downsampledData = [];
        const step = Math.floor(bufferLength / 128);
        for (let i = 0; i < 128; i++) {
          downsampledData.push(dataArray[i * step] || 0);
        }
        setWaveformData(downsampledData);
        
        drawWaveform(downsampledData);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };
    
    updateVisualization();
  };

  const drawWaveform = (data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = isRecording && !isPaused ? '#ef4444' : '#6366f1';
    ctx.lineWidth = 2;
    
    const sliceWidth = width / data.length;
    let x = 0;
    
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 255;
      const y = (v * height) / 2;
      
      if (i === 0) {
        ctx.moveTo(x, height - y);
      } else {
        ctx.lineTo(x, height - y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    
    // Draw center line
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw level indicator
    if (isRecording && !isPaused) {
      const levelHeight = (audioLevel / 100) * height;
      ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(audioLevel / 50, 1)})`;
      ctx.fillRect(0, height - levelHeight, 4, levelHeight);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    recordedChunksRef.current = [];
    setMaxAudioLevel(0);
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        
        onMediaRecorded({
          type: 'audio',
          url: audioUrl,
          blob: blob,
          duration: Date.now() - recordingStartTime,
          settings: audioSettings,
          enhanced: autoEnhance,
          maxLevel: maxAudioLevel
        });
      };
      
      mediaRecorder.start(100);
    } catch (error) {
      console.error('Recording error:', error);
      // Fallback
      try {
        const mediaRecorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);
          
          onMediaRecorded({
            type: 'audio',
            url: audioUrl,
            blob: blob,
            duration: Date.now() - recordingStartTime,
            settings: audioSettings,
            enhanced: autoEnhance,
            maxLevel: maxAudioLevel
          });
        };
        
        mediaRecorder.start(100);
      } catch (fallbackError) {
        console.error('Fallback recording error:', fallbackError);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const playRecordedAudio = () => {
    if (!recordedMedia?.url) return;
    
    if (isPlaying) {
      if (playbackAudio) {
        playbackAudio.pause();
        playbackAudio.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }
    
    const audio = new Audio(recordedMedia.url);
    setPlaybackAudio(audio);
    
    audio.onended = () => {
      setIsPlaying(false);
      setPlaybackAudio(null);
    };
    
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      setPlaybackAudio(null);
    };
    
    audio.play().catch(err => {
      console.error('Failed to play audio:', err);
      setIsPlaying(false);
      setPlaybackAudio(null);
    });
    setIsPlaying(true);
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (playbackAudio) {
      playbackAudio.pause();
      playbackAudio.src = '';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    return formatTime(seconds);
  };

  if (recordedMedia) {
    // Ensure maxLevel is a valid number between 0-100
    const safeMaxLevel = Math.min(Math.max(recordedMedia.maxLevel || 0, 0), 100);
    
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Headphones className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium">Audio Recorded</h3>
                <p className="text-sm text-muted-foreground">
                  Duration: {formatDuration(recordedMedia.duration)}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
              <audio
                src={recordedMedia.url}
                controls
                className="w-full"
                style={{ maxHeight: '54px' }}
              />
            </div>
            
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={playRecordedAudio}
                size="sm"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            </div>
            
            {safeMaxLevel > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recording Quality</span>
                  <span>{safeMaxLevel > 70 ? 'Excellent' : safeMaxLevel > 40 ? 'Good' : 'Low'}</span>
                </div>
                <Progress value={safeMaxLevel} className="h-2" />
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Audio Visualization */}
      <Card className="p-6">
        {isInitializing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Initializing microphone...</p>
          </div>
        )}
        
        {permissionError && (
          <div className="text-center py-8">
            <MicOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="mb-2">Microphone access required</p>
            <p className="text-sm text-muted-foreground mb-4">{permissionError}</p>
            <Button variant="outline" onClick={initializeAudio}>
              Try Again
            </Button>
          </div>
        )}
        
        {hasPermission && (
          <div className="space-y-4">
            {/* Waveform Visualization */}
            <div className="relative bg-black rounded-xl p-4">
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="w-full h-24 rounded"
              />
              
              {/* Recording Status Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                  <span className="text-white font-medium">
                    {isPaused ? 'PAUSED' : 'RECORDING'}
                  </span>
                </div>
              )}
              
              {/* Time Display */}
              <div className="absolute top-4 right-4 text-white font-mono">
                {formatTime(recordingTime)}
              </div>
            </div>
            
            {/* Audio Level Meter */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Audio Level</span>
                <span>{Math.round(audioLevel)}%</span>
              </div>
              <div className="relative">
                <Progress value={audioLevel} className="h-3" />
                <div 
                  className="absolute top-0 h-3 w-1 bg-red-500 rounded-full transition-all"
                  style={{ left: `${Math.min(maxAudioLevel, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quiet</span>
                <span>Too Loud</span>
              </div>
            </div>
            
            {/* Recording Controls */}
            <div className="flex justify-center items-center gap-4">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={onStartRecording}
                  className="rounded-full bg-red-500 hover:bg-red-600 text-white w-16 h-16 p-0"
                >
                  <Mic className="w-8 h-8" />
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onPauseRecording}
                    className="rounded-full w-12 h-12 p-0"
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={onStopRecording}
                    className="rounded-full bg-red-500 hover:bg-red-600 text-white w-16 h-16 p-0"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
      
      {/* Audio Settings */}
      {!isRecording && hasPermission && (
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="font-medium">Audio Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Gain</label>
                <Slider
                  value={audioSettings.gain}
                  onValueChange={(value) => setAudioSettings(prev => ({
                    ...prev,
                    gain: value
                  }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Noise Reduction</label>
                <Slider
                  value={audioSettings.noiseReduction}
                  onValueChange={(value) => setAudioSettings(prev => ({
                    ...prev,
                    noiseReduction: value
                  }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
