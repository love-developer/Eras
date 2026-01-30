import React, { useState } from 'react';
import { ErasOdyssey } from './components/onboarding/ErasOdyssey';

export default function TestOdysseyPage() {
  const [showOdyssey, setShowOdyssey] = useState(true);

  const handleComplete = () => {
    console.log('🎉 Odyssey completed!');
    setShowOdyssey(false);
  };

  const handleSkip = () => {
    console.log('⏭️ Odyssey skipped');
    setShowOdyssey(false);
  };

  if (!showOdyssey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Eras!
          </h1>
          <p className="text-white/70 mb-8">
            Tutorial completed or skipped
          </p>
          <button
            onClick={() => setShowOdyssey(true)}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            Replay Tutorial
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErasOdyssey 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
