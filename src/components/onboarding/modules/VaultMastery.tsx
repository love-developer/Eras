import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, FolderOpen, Lock, Upload, Download, Shield, Clock, Key } from 'lucide-react';
import { Button } from '../../ui/button';
import { OnboardingModuleProps } from '../../../utils/onboarding/registry';
import { logger } from '../../../utils/logger';

// Mock data for vault demo
const MOCK_FOLDERS = [
  { id: '1', name: 'Family', count: 12, color: '#FF6B6B', icon: '📁' },
  { id: '2', name: 'Friends', count: 8, color: '#4ECDC4', icon: '📁' },
  { id: '3', name: 'Work Milestones', count: 3, color: '#FFE66D', icon: '📁' }
];

const LEGACY_EXAMPLES = [
  {
    folder: 'Family Memories',
    beneficiary: 'Sarah',
    access: 'After 10 years',
    icon: '👤'
  },
  {
    folder: 'College Fund Messages',
    beneficiary: 'Your Child',
    access: 'Age 18',
    icon: '👶'
  }
];

export default function VaultMastery({ onComplete, onSkip }: OnboardingModuleProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

  const totalSteps = 4;

  // Safe area handling for mobile
  useEffect(() => {
    // Lock body scroll
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - complete the module
      logger.info('Vault Mastery: Module completed');
      onComplete();
    }
  };

  return (
    <div 
      className="relative w-full h-full min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white overflow-hidden flex flex-col"
      style={{
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
      }}
    >
      {/* Close Button */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        style={{ top: 'max(16px, env(safe-area-inset-top))' }}
        aria-label="Skip vault mastery"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentStep ? 'w-8 bg-amber-400' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <WelcomeScreen key="welcome" onNext={handleNext} />
        )}
        
        {currentStep === 1 && (
          <StorageFoldersScreen 
            key="storage"
            folders={MOCK_FOLDERS}
            expandedFolder={expandedFolder}
            onFolderClick={setExpandedFolder}
            onNext={handleNext}
          />
        )}
        
        {currentStep === 2 && (
          <LegacyScreen 
            key="legacy"
            examples={LEGACY_EXAMPLES}
            onNext={handleNext}
          />
        )}
        
        {currentStep === 3 && (
          <SuccessScreen key="success" onNext={handleNext} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Screen 1: Welcome (10s)
function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-8xl mb-6"
      >
        🏛️
      </motion.div>
      
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl sm:text-4xl font-bold mb-4"
      >
        THE VAULT
      </motion.h1>
      
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-white/80 mb-2 max-w-md"
      >
        Where your memories live,
      </motion.p>
      
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-lg text-white/80 mb-12 max-w-md"
      >
        protected and organized
      </motion.p>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Button
          onClick={onNext}
          size="lg"
          className="min-h-[56px] px-8 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          Enter the Vault
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Screen 2: Storage + Folders (40s)
function StorageFoldersScreen({ folders, expandedFolder, onFolderClick, onNext }: {
  folders: typeof MOCK_FOLDERS;
  expandedFolder: string | null;
  onFolderClick: (id: string | null) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex-1 flex flex-col px-6 pt-16 pb-6 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">The Vault is more than storage</h2>
        <p className="text-white/60 mb-8 text-center text-sm">Demo Mode - You'll create real folders later</p>
        
        {/* Storage Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Secure Storage</h3>
              <p className="text-sm text-white/60">All capsules backed up</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-white/5">
              <Upload className="w-4 h-4 text-green-400" />
              <span className="text-sm">Upload</span>
            </div>
            <div className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-white/5">
              <Download className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Download</span>
            </div>
          </div>
        </motion.div>
        
        {/* Folders Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Smart Organization</h3>
              <p className="text-sm text-white/60">Tap to explore →</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {folders.map((folder, i) => (
              <motion.div
                key={folder.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <button
                  onClick={() => onFolderClick(expandedFolder === folder.id ? null : folder.id)}
                  className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{folder.icon}</span>
                      <div>
                        <div className="font-medium">{folder.name}</div>
                        <div className="text-sm text-white/50">{folder.count} capsules</div>
                      </div>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 transition-transform ${
                        expandedFolder === folder.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedFolder === folder.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-white/5 rounded-xl mt-2 border border-white/10">
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {Array.from({ length: folder.count }).map((_, i) => (
                            <div 
                              key={i}
                              className="aspect-square rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl"
                            >
                              🎁
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-white/50 text-center">
                          Drag capsules between folders
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
            
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/30 transition-all text-center"
            >
              <span className="text-white/60">+ Create New Folder</span>
            </motion.button>
          </div>
        </motion.div>
        
        <div className="flex justify-end">
          <Button
            onClick={onNext}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Screen 3: Legacy & Beneficiaries (40s)
function LegacyScreen({ examples, onNext }: {
  examples: typeof LEGACY_EXAMPLES;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex-1 flex flex-col px-6 pt-16 pb-6 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Plan Your Digital Legacy</h2>
        <p className="text-white/60 mb-8 text-center">What happens to your capsules years from now?</p>
        
        <div className="space-y-4 mb-8">
          {examples.map((example, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.2 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl flex-shrink-0">
                  {example.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1">📁 {example.folder}</div>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">Beneficiary:</span>
                      <span className="font-medium text-white">{example.beneficiary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">Access:</span>
                      <span className="font-medium text-amber-400">{example.access}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {i === 0 && (
                <div className="flex gap-2 text-xs">
                  <div className="flex-1 p-2 rounded-lg bg-white/5 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Timed Release</span>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-white/5 flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    <span>Auto Delivery</span>
                  </div>
                </div>
              )}
              
              {i === 1 && (
                <div className="flex gap-2 text-xs">
                  <div className="flex-1 p-2 rounded-lg bg-white/5 flex items-center gap-2">
                    <Key className="w-3 h-3" />
                    <span>Age-Based</span>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-white/5 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    <span>Secure</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10 text-center mb-6"
        >
          <p className="text-sm text-white/70">
            💡 Different rules per folder - full control over your legacy
          </p>
        </motion.div>
        
        <div className="flex justify-end">
          <Button
            onClick={onNext}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Screen 4: Success (30s)
function SuccessScreen({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="text-8xl mb-6"
      >
        🏛️
      </motion.div>
      
      <h2 className="text-3xl font-bold mb-4">You're now a<br />Vault Guardian</h2>
      
      <div className="space-y-2 mb-8">
        {[
          '✓ Understand secure storage',
          '✓ Know how to organize folders',
          '✓ Can plan your legacy'
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="text-white/80"
          >
            {item}
          </motion.div>
        ))}
      </div>
      
      <p className="text-white/60 mb-8">Your first capsule is already in the vault, waiting.</p>
      
      <Button
        onClick={onNext}
        size="lg"
        className="min-h-[56px] px-8 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
      >
        Complete Tutorial
        <ChevronRight className="ml-2 w-5 h-5" />
      </Button>
    </motion.div>
  );
}