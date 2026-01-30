import React from 'react';
import { OnboardingModuleProps } from '../../../utils/onboarding/registry';
import { Button } from '../../ui/button';

// Placeholder - to be built in Phase 2
export default function ThemeExplorer({ onComplete, onSkip }: OnboardingModuleProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-900 to-purple-900 text-white p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🎨 Theme Explorer</h1>
        <p className="text-white/70 mb-8">Coming soon...</p>
        <Button onClick={onComplete}>Continue</Button>
      </div>
    </div>
  );
}
