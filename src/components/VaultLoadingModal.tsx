import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, FileVideo, FileImage, FileAudio, File } from 'lucide-react';
import { createPortal } from 'react-dom';

interface VaultLoadingModalProps {
  isOpen: boolean;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'unknown';
  fileSize: number;
  progress: number;
  receivedBytes: number;
  status: 'downloading' | 'converting' | 'complete';
  timeRemaining?: number;
}

export function VaultLoadingModal({
  isOpen,
  fileName,
  fileType,
  fileSize,
  progress,
  receivedBytes,
  status,
  timeRemaining
}: VaultLoadingModalProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '';
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'video':
        return <FileVideo className="h-12 w-12 text-purple-400" />;
      case 'image':
        return <FileImage className="h-12 w-12 text-blue-400" />;
      case 'audio':
        return <FileAudio className="h-12 w-12 text-green-400" />;
      default:
        return <File className="h-12 w-12 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    // 🚀 TIER 2: If fileSize is 0 and status is downloading, it's a server-side copy
    const isServerCopy = fileSize === 0 && status === 'downloading';
    
    switch (status) {
      case 'downloading':
        return isServerCopy ? 'Copying in cloud...' : 'Downloading from Vault';
      case 'converting':
        return 'Processing file';
      case 'complete':
        return 'Complete!';
      default:
        return 'Loading';
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 9999 }}
          />

          {/* Modal - Mobile-First Design */}
          <div 
            className="fixed inset-0 flex items-center justify-center"
            style={{ 
              zIndex: 10000,
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", duration: 0.5 }}
              style={{
                width: '100%',
                maxWidth: '448px',
                margin: '0 auto'
              }}
            >
              <div 
                style={{
                  background: 'linear-gradient(to bottom right, rgb(30, 41, 59), rgb(15, 23, 42))',
                  border: '2px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flexShrink: 0 }}>
                    {getFileIcon()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 600, 
                      color: 'white',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {getStatusText()}
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: 'rgb(156, 163, 175)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {fileName}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {fileSize > 0 ? (
                    // Client-side download: Show real progress
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'rgb(209, 213, 219)' }}>Progress</span>
                        <span style={{ color: 'rgb(168, 85, 247)', fontWeight: 600 }}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      
                      {/* Progress Bar Track */}
                      <div style={{ 
                        height: '0.75rem', 
                        backgroundColor: 'rgb(51, 65, 85)', 
                        borderRadius: '9999px',
                        overflow: 'hidden'
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          style={{
                            height: '100%',
                            background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))',
                            borderRadius: '9999px',
                            position: 'relative'
                          }}
                        >
                          {/* Shimmer effect */}
                          <div 
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
                              animation: 'shimmer 2s infinite'
                            }}
                          />
                        </motion.div>
                      </div>
                    </>
                  ) : (
                    // Server-side copy: Show indeterminate progress
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'rgb(209, 213, 219)' }}>Status</span>
                        <span style={{ color: 'rgb(34, 197, 94)', fontWeight: 600, fontSize: '0.875rem' }}>
                          In Progress...
                        </span>
                      </div>
                      
                      {/* Indeterminate progress bar */}
                      <div style={{ 
                        height: '0.75rem', 
                        backgroundColor: 'rgb(51, 65, 85)', 
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <motion.div
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                          }}
                          style={{
                            position: 'absolute',
                            height: '100%',
                            width: '33.333%',
                            background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Stats - Only show for client-side downloads (when fileSize > 0) */}
                {fileSize > 0 && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '1rem' 
                  }}>
                    <div style={{ 
                      backgroundColor: 'rgba(51, 65, 85, 0.5)', 
                      borderRadius: '0.5rem', 
                      padding: '0.75rem' 
                    }}>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'rgb(156, 163, 175)', 
                        marginBottom: '0.25rem' 
                      }}>
                        Downloaded
                      </p>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: 'white' 
                      }}>
                        {formatBytes(receivedBytes)}
                      </p>
                    </div>
                    <div style={{ 
                      backgroundColor: 'rgba(51, 65, 85, 0.5)', 
                      borderRadius: '0.5rem', 
                      padding: '0.75rem' 
                    }}>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'rgb(156, 163, 175)', 
                        marginBottom: '0.25rem' 
                      }}>
                        Total Size
                      </p>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: 'white' 
                      }}>
                        {formatBytes(fileSize)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Server-side copy indicator */}
                {fileSize === 0 && status === 'downloading' && (
                  <div style={{
                    background: 'linear-gradient(to right, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <Loader2 className="h-5 w-5 animate-spin text-purple-400" style={{ flexShrink: 0 }} />
                      <div>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          color: 'white',
                          marginBottom: '0.25rem'
                        }}>
                          Lightning-fast cloud copy
                        </p>
                        <p style={{ 
                          fontSize: '0.6875rem', 
                          color: 'rgb(156, 163, 175)',
                          lineHeight: 1.4
                        }}>
                          No mobile data used • Server handles everything
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Remaining - Only for client-side downloads */}
                {status === 'downloading' && fileSize > 0 && timeRemaining !== undefined && timeRemaining > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'rgb(209, 213, 219)'
                  }}>
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    <span>
                      {timeRemaining > 1 
                        ? `About ${formatTime(timeRemaining)} remaining`
                        : 'Almost done...'
                      }
                    </span>
                  </div>
                )}

                {status === 'converting' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'rgb(209, 213, 219)'
                  }}>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span>Converting file format...</span>
                  </div>
                )}

                {/* Warning */}
                <div style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem'
                }}>
                  <p style={{ 
                    fontSize: '0.6875rem', 
                    color: 'rgb(253, 224, 71)',
                    textAlign: 'center',
                    lineHeight: 1.4
                  }}>
                    Please don't close this page or navigate away
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal at document body level using portal
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}

// Add shimmer animation to globals.css if not already present
