import React, { useState } from 'react';
import { CapsuleLaunchEffect } from './components/onboarding/effects/CapsuleLaunchEffect';

/**
 * Test page for the spectacular Capsule Launch Effect
 * Navigate to /test-launch to see it!
 */
export default function TestLaunchPage() {
  const [showLaunch, setShowLaunch] = useState(false);
  const [launchCount, setLaunchCount] = useState(0);

  const handleLaunch = () => {
    setShowLaunch(true);
    setLaunchCount(prev => prev + 1);
  };

  const handleComplete = () => {
    console.log('🚀 Launch complete!');
    setShowLaunch(false);
  };

  const testCapsule = {
    message: "Hello future me! This is a test capsule.",
    deliveryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 opacity-50">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Control panel */}
      {!showLaunch && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-6 px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4">
              🚀 Capsule Launch Test
            </h1>
            <p className="text-white/70 mb-2">
              Test the spectacular 6-phase launch animation
            </p>
            {launchCount > 0 && (
              <p className="text-purple-300 text-sm">
                Launches: {launchCount}
              </p>
            )}
          </div>

          <div className="max-w-md w-full space-y-4">
            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <h3 className="text-white font-medium mb-3">Test Capsule:</h3>
              <div className="space-y-2 text-white/80 text-sm">
                <p>📝 Message: "{testCapsule.message}"</p>
                <p>📅 Delivery: {testCapsule.deliveryDate.toLocaleDateString()}</p>
              </div>
            </div>

            <button
              onClick={handleLaunch}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full text-xl font-bold transition-all shadow-2xl shadow-purple-500/50"
            >
              Launch Capsule! 🚀
            </button>

            <div className="text-center text-white/50 text-sm">
              <p>Duration: ~8.5 seconds</p>
              <p className="mt-2">6 phases: Ready → Countdown → Ignition → Launch → Portal → Complete</p>
            </div>
          </div>

          <div className="mt-8 text-center max-w-lg">
            <h3 className="text-purple-300 font-medium mb-2">What You'll See:</h3>
            <div className="grid grid-cols-2 gap-3 text-white/70 text-sm">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-2xl mb-1">3️⃣</div>
                <div>Countdown</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-2xl mb-1">🔥</div>
                <div>Rocket Flames</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-2xl mb-1">🌀</div>
                <div>Time Portal</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-2xl mb-1">🎊</div>
                <div>Confetti</div>
              </div>
            </div>
          </div>

          <a
            href="/"
            className="text-purple-300 hover:text-purple-200 transition-colors text-sm"
          >
            ← Back to App
          </a>
        </div>
      )}

      {/* Launch effect */}
      {showLaunch && (
        <CapsuleLaunchEffect
          onComplete={handleComplete}
          capsuleMessage={testCapsule.message}
          deliveryDate={testCapsule.deliveryDate}
        />
      )}
    </div>
  );
}
