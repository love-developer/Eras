import React, { useState } from 'react';
import { LogoShowcase } from './LogoShowcase';
import { MemoryVaultDeepDive } from './MemoryVaultDeepDive';
import { Palette, Sparkles } from 'lucide-react';

export function LogoConceptsEntry() {
  const [view, setView] = useState<'menu' | 'showcase' | 'deepdive'>('menu');

  if (view === 'showcase') {
    return <LogoShowcase onBack={() => setView('menu')} />;
  }

  if (view === 'deepdive') {
    return <MemoryVaultDeepDive onBack={() => setView('menu')} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl">Eras Logo Concepts</h1>
          <p className="text-xl text-white/60">
            Explore interactive prototypes and detailed analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* All concepts showcase */}
          <button
            onClick={() => setView('showcase')}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl p-8 text-left transition-all"
          >
            <div className="size-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Palette className="size-8" />
            </div>
            <h2 className="text-2xl mb-2">View All Concepts</h2>
            <p className="text-white/60 mb-4">
              Interactive prototypes for 4 top logo concepts with animated gates
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <span>Explore designs</span>
              <span>→</span>
            </div>
          </button>

          {/* Deep dive */}
          <button
            onClick={() => setView('deepdive')}
            className="group bg-gradient-to-br from-emerald-500/10 to-blue-500/10 hover:from-emerald-500/20 hover:to-blue-500/20 border-2 border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-8 text-left transition-all"
          >
            <div className="size-16 rounded-xl bg-gradient-to-br from-emerald-500/30 to-blue-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="size-8" />
            </div>
            <div className="inline-block px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-400 text-xs mb-3">
              RECOMMENDED
            </div>
            <h2 className="text-2xl mb-2">Memory Vault Deep Dive</h2>
            <p className="text-white/60 mb-4">
              Detailed analysis with color variations, use cases, and specifications
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <span>View recommendation</span>
              <span>→</span>
            </div>
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg mb-3">What's Included:</h3>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">✓</span>
              <span>4 fully interactive animated prototypes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">✓</span>
              <span>Multiple color scheme variations for each concept</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">✓</span>
              <span>Scale testing (32px to 280px+)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">✓</span>
              <span>Context mockups (app icon, web, email, print)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">✓</span>
              <span>Detailed animation specifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">✓</span>
              <span>Comparison matrix and recommendations</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
