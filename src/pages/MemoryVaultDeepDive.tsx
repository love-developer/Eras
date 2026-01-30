import React, { useState } from 'react';
import { MemoryVault } from '../components/logo-concepts/MemoryVault';
import { ArrowLeft, Smartphone, Monitor, Mail, Package } from 'lucide-react';

interface MemoryVaultDeepDiveProps {
  onBack?: () => void;
}

export function MemoryVaultDeepDive({ onBack }: MemoryVaultDeepDiveProps) {
  const [selectedColorScheme, setSelectedColorScheme] = useState<'charcoal' | 'navy' | 'platinum' | 'rose'>('charcoal');
  const [selectedContext, setSelectedContext] = useState<'icon' | 'web' | 'email' | 'print'>('icon');

  const colorSchemes = [
    {
      id: 'charcoal' as const,
      name: 'Charcoal Rose',
      description: 'Premium, luxurious, feminine elegance',
      primary: '#18181B',
      accent: '#F9A8D4',
      personality: 'Sophisticated • Emotional • Premium',
      bestFor: ['Consumer app', 'Emotional branding', 'Female-forward positioning'],
      mood: '💎 Jewelry box, precious moments, intimate treasures',
    },
    {
      id: 'navy' as const,
      name: 'Deep Navy Pearl',
      description: 'Timeless, trustworthy, elegant simplicity',
      primary: '#0C4A6E',
      accent: '#F8FAFC',
      personality: 'Classic • Reliable • Sophisticated',
      bestFor: ['Corporate/enterprise', 'Trust-focused branding', 'Professional context'],
      mood: '🏛️ Bank vault, Swiss watch, heirloom quality',
    },
    {
      id: 'platinum' as const,
      name: 'Platinum Gold',
      description: 'Warm, aspirational, celebratory',
      primary: '#475569',
      accent: '#FCD34D',
      personality: 'Optimistic • Warm • Celebratory',
      bestFor: ['Gifting focus', 'Milestone celebrations', 'Positive memories'],
      mood: '🎁 Gift box, celebration, golden moments',
    },
    {
      id: 'rose' as const,
      name: 'Midnight Rose',
      description: 'Bold, modern, passionate',
      primary: '#27272A',
      accent: '#FB7185',
      personality: 'Bold • Passionate • Contemporary',
      bestFor: ['Youth market', 'Bold brand positioning', 'Modern aesthetic'],
      mood: '❤️ Love letters, heartfelt messages, passionate memories',
    },
  ];

  const selectedScheme = colorSchemes.find(s => s.id === selectedColorScheme)!;

  const contextBackgrounds = {
    icon: '#000000',
    web: '#FFFFFF',
    email: '#F9FAFB',
    print: '#FFFFFF',
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {onBack && (
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto p-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-5" />
              Back
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-8 space-y-16">
        {/* Hero section */}
        <div className="text-center space-y-6">
          <div className="inline-block px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-sm mb-4">
            🏆 TOP RECOMMENDATION
          </div>
          <h1 className="text-6xl mb-4">Memory Vault</h1>
          <p className="text-2xl text-white/60 max-w-3xl mx-auto">
            Premium luxury aesthetic with stunning aperture iris animation. The highest-impact design for instant brand recognition.
          </p>
        </div>

        {/* Main showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Live preview */}
          <div>
            <div 
              className="rounded-2xl p-16 flex items-center justify-center border-2 transition-colors"
              style={{
                backgroundColor: contextBackgrounds[selectedContext],
                borderColor: selectedContext === 'icon' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}
            >
              <MemoryVault
                size={280}
                autoAnimate
                colorScheme={selectedColorScheme}
              />
            </div>

            {/* Context selector */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setSelectedContext('icon')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                  selectedContext === 'icon'
                    ? 'bg-white text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Smartphone className="size-5 mx-auto mb-1" />
                <span className="text-xs">App Icon</span>
              </button>
              <button
                onClick={() => setSelectedContext('web')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                  selectedContext === 'web'
                    ? 'bg-white text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Monitor className="size-5 mx-auto mb-1" />
                <span className="text-xs">Website</span>
              </button>
              <button
                onClick={() => setSelectedContext('email')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                  selectedContext === 'email'
                    ? 'bg-white text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Mail className="size-5 mx-auto mb-1" />
                <span className="text-xs">Email</span>
              </button>
              <button
                onClick={() => setSelectedContext('print')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                  selectedContext === 'print'
                    ? 'bg-white text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Package className="size-5 mx-auto mb-1" />
                <span className="text-xs">Print</span>
              </button>
            </div>
          </div>

          {/* Design rationale */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl mb-4">Why Memory Vault Wins</h2>
              <p className="text-white/70 text-lg leading-relaxed">
                The Memory Vault concept delivers the highest premium aesthetic while maintaining crystal-clear metaphorical meaning. 
                The iris/aperture animation creates an unforgettable "reveal" moment that perfectly captures the emotion of receiving a time capsule.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
              <h3 className="text-xl">Core Strengths</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 text-xl">✓</span>
                  <div>
                    <div className="text-white">Instant Luxury Recognition</div>
                    <div className="text-white/60 text-sm">Art Deco geometry signals premium quality immediately</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 text-xl">✓</span>
                  <div>
                    <div className="text-white">Clear Metaphor</div>
                    <div className="text-white/60 text-sm">Vault = security, precious, protected treasures</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 text-xl">✓</span>
                  <div>
                    <div className="text-white">Mesmerizing Animation</div>
                    <div className="text-white/60 text-sm">Iris opening creates anticipation and delight</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 text-xl">✓</span>
                  <div>
                    <div className="text-white">Perfect Scalability</div>
                    <div className="text-white/60 text-sm">Works beautifully from 32px to billboard size</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 text-xl">✓</span>
                  <div>
                    <div className="text-white">Emotional Depth</div>
                    <div className="text-white/60 text-sm">Evokes feelings of treasure, security, and revelation</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-lg mb-2 text-blue-400">💡 Animation Psychology</h3>
              <p className="text-sm text-white/70">
                The iris animation mimics the eye's pupil dilating with interest and excitement. This subconscious connection 
                triggers anticipation and curiosity—perfect for the moment a capsule is revealed.
              </p>
            </div>
          </div>
        </div>

        {/* Color scheme selector */}
        <div>
          <h2 className="text-3xl mb-6">Color Personalities</h2>
          <p className="text-white/60 mb-8 text-lg">
            Each color scheme creates a distinct brand personality. Choose based on your target audience and emotional positioning.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {colorSchemes.map((scheme) => (
              <div
                key={scheme.id}
                onClick={() => setSelectedColorScheme(scheme.id)}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all ${
                  selectedColorScheme === scheme.id
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-6">
                  {/* Color preview */}
                  <div className="flex-shrink-0">
                    <MemoryVault
                      size={120}
                      autoAnimate
                      colorScheme={scheme.id}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl mb-1">{scheme.name}</h3>
                      <p className="text-sm text-white/60">{scheme.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg" style={{ backgroundColor: scheme.primary }} />
                      <div className="size-8 rounded-lg" style={{ backgroundColor: scheme.accent }} />
                    </div>

                    <div className="text-sm text-white/50 italic">
                      {scheme.personality}
                    </div>

                    <div className="pt-2">
                      <div className="text-xs text-white/40 mb-1">BEST FOR:</div>
                      <div className="flex flex-wrap gap-2">
                        {scheme.bestFor.map((use, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white/10 rounded">
                            {use}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-white/60 pt-2">
                      {scheme.mood}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size testing */}
        <div>
          <h2 className="text-3xl mb-6">Scale Performance</h2>
          <div className="bg-white/5 rounded-2xl p-12 border border-white/10">
            <div className="flex items-end justify-center gap-8 flex-wrap">
              {[32, 48, 64, 96, 128, 200, 280].map((size) => (
                <div key={size} className="text-center">
                  <MemoryVault
                    size={size}
                    autoAnimate
                    colorScheme={selectedColorScheme}
                  />
                  <p className="text-xs text-white/40 mt-3">{size}px</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/60 text-center mt-4">
            Notice how the design remains crisp and recognizable at all sizes—from tiny favicons to large marketing displays.
          </p>
        </div>

        {/* Animation specifications */}
        <div>
          <h2 className="text-3xl mb-6">Animation Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg mb-4 text-emerald-400">Gate Opening Sequence</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Duration:</span>
                  <span className="text-white">1000ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Easing:</span>
                  <span className="text-white">Spring (elastic)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Segments:</span>
                  <span className="text-white">8 (iris petals)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Cascade Delay:</span>
                  <span className="text-white">30ms per segment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Rotation:</span>
                  <span className="text-white">15° outward</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Translation:</span>
                  <span className="text-white">40% radius outward</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg mb-4 text-blue-400">Visual Effects</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Center Glow:</span>
                  <span className="text-white">Fades in 0-20% opacity</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">"E" Keyhole:</span>
                  <span className="text-white">Fades out + scales 50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Segment Lines:</span>
                  <span className="text-white">Accent color highlights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Outer Ring:</span>
                  <span className="text-white">Static frame</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Performance:</span>
                  <span className="text-white">60fps guaranteed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Mobile:</span>
                  <span className="text-white">Solid colors only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use case mockups */}
        <div>
          <h2 className="text-3xl mb-6">Real-World Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* App Icon */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="aspect-square bg-[#000000] rounded-2xl p-8 mb-4 flex items-center justify-center">
                <MemoryVault size={120} colorScheme={selectedColorScheme} />
              </div>
              <h3 className="text-lg mb-1">iOS/Android Icon</h3>
              <p className="text-sm text-white/60">Stands out on home screen</p>
            </div>

            {/* Website Header */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="aspect-square bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
                <MemoryVault size={80} colorScheme={selectedColorScheme} />
              </div>
              <h3 className="text-lg mb-1">Website Logo</h3>
              <p className="text-sm text-white/60">Clean on light backgrounds</p>
            </div>

            {/* Email */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="aspect-square bg-[#F9FAFB] rounded-xl p-6 mb-4 flex items-center justify-center">
                <MemoryVault size={64} colorScheme={selectedColorScheme} />
              </div>
              <h3 className="text-lg mb-1">Email Header</h3>
              <p className="text-sm text-white/60">Recognizable in inbox</p>
            </div>

            {/* Print */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="aspect-square bg-white rounded-xl p-8 mb-4 flex items-center justify-center border-2 border-gray-200">
                <MemoryVault size={100} colorScheme={selectedColorScheme} />
              </div>
              <h3 className="text-lg mb-1">Print Materials</h3>
              <p className="text-sm text-white/60">Professional on business cards</p>
            </div>
          </div>
        </div>

        {/* Final recommendation */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-4xl mb-4">Final Verdict</h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-6">
            Memory Vault delivers the perfect balance of <strong>instant luxury recognition</strong>, 
            <strong> clear metaphorical meaning</strong>, and <strong>stunning animation impact</strong>. 
            It's the design that will make opening a time capsule feel truly special.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="px-6 py-3 bg-white/10 rounded-lg">
              <div className="text-2xl mb-1">⭐⭐⭐⭐⭐</div>
              <div className="text-sm text-white/60">Premium Feel</div>
            </div>
            <div className="px-6 py-3 bg-white/10 rounded-lg">
              <div className="text-2xl mb-1">⭐⭐⭐⭐⭐</div>
              <div className="text-sm text-white/60">Memorability</div>
            </div>
            <div className="px-6 py-3 bg-white/10 rounded-lg">
              <div className="text-2xl mb-1">⭐⭐⭐⭐⭐</div>
              <div className="text-sm text-white/60">Animation</div>
            </div>
            <div className="px-6 py-3 bg-white/10 rounded-lg">
              <div className="text-2xl mb-1">⭐⭐⭐⭐⭐</div>
              <div className="text-sm text-white/60">Scalability</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
