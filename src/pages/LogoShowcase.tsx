import React, { useState } from 'react';
import { MemoryVault } from '../components/logo-concepts/MemoryVault';
import { MomentPrism } from '../components/logo-concepts/MomentPrism';
import { Chrysalis } from '../components/logo-concepts/Chrysalis';
import { EclipseReimagined } from '../components/logo-concepts/EclipseReimagined';
import { ArrowLeft, Play, Pause, Download } from 'lucide-react';

interface LogoShowcaseProps {
  onBack?: () => void;
}

export function LogoShowcase({ onBack }: LogoShowcaseProps) {
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<Record<string, boolean>>({});

  const concepts = [
    {
      id: 'memory-vault',
      name: 'Memory Vault',
      tagline: 'Premium Luxury • Aperture Iris Opening',
      description: 'A secure vault opening to reveal treasures. Highest premium feel with Art Deco-inspired geometry. Eight segments rotate outward like a camera iris.',
      component: MemoryVault,
      colorSchemes: ['charcoal', 'navy', 'platinum', 'rose'],
      strengths: ['Highest luxury aesthetic', 'Clear metaphor (vault = precious)', 'Stunning aperture animation', 'Premium brand positioning'],
      useCases: ['App icon excellence', 'Marketing materials', 'Premium packaging'],
    },
    {
      id: 'moment-prism',
      name: 'Moment Prism',
      tagline: 'Unique & Sophisticated • Light Refraction',
      description: 'Geometric crystal blooming open like a flower. Each facet catches light differently, creating mesmerizing refraction. Most unique and ownable design.',
      component: MomentPrism,
      colorSchemes: ['slate', 'ocean', 'twilight', 'aurora'],
      strengths: ['Most unique shape', 'Architectural sophistication', 'Beautiful light metaphor', 'Memorable and distinct'],
      useCases: ['Brand differentiation', 'Tech/creative positioning', 'Scalable icon'],
    },
    {
      id: 'chrysalis',
      name: 'Chrysalis',
      tagline: 'Transformation & Growth • Organic Emergence',
      description: 'A cocoon opening to reveal transformation. Segments peel back like petals or wings. Perfect metaphor for personal growth and becoming.',
      component: Chrysalis,
      colorSchemes: ['forest', 'plum', 'sage', 'midnight'],
      strengths: ['Deepest metaphor (transformation)', 'Organic, living feel', 'Emotional resonance', 'Beautiful emergence animation'],
      useCases: ['Emotional storytelling', 'Personal growth focus', 'Nature-inspired aesthetic'],
    },
    {
      id: 'eclipse-reimagined',
      name: 'Eclipse Reimagined',
      tagline: 'Celestial Alignment • Orbital Mechanics',
      description: 'Three celestial bodies in perfect alignment. Orbital animation with gravitational lens portal. Honors current brand equity but dramatically elevated.',
      component: EclipseReimagined,
      colorSchemes: ['celestial', 'monochrome', 'cosmic', 'bronze'],
      strengths: ['Honors existing brand', 'Astronomical sophistication', 'Timeless celestial theme', 'Advanced visual effects'],
      useCases: ['Brand evolution', 'Maintains recognition', 'Premium upgrade'],
    },
  ];

  const toggleAnimation = (conceptId: string) => {
    setIsAnimating(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId],
    }));
  };

  if (selectedConcept) {
    const concept = concepts.find(c => c.id === selectedConcept);
    if (!concept) return null;

    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white p-8">
        <button
          onClick={() => setSelectedConcept(null)}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="size-5" />
          Back to All Concepts
        </button>

        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl mb-2">{concept.name}</h1>
            <p className="text-xl text-white/60">{concept.tagline}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Main display */}
            <div className="bg-white/5 rounded-2xl p-12 flex items-center justify-center border border-white/10">
              <concept.component
                size={280}
                autoAnimate
                colorScheme={concept.colorSchemes[0] as any}
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-white/40 mb-2">Description</h3>
                <p className="text-white/80 text-lg">{concept.description}</p>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-white/40 mb-3">Key Strengths</h3>
                <ul className="space-y-2">
                  {concept.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/70">
                      <span className="text-emerald-400 mt-1">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-white/40 mb-3">Best Use Cases</h3>
                <div className="flex flex-wrap gap-2">
                  {concept.useCases.map((useCase, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80">
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Color schemes */}
          <div>
            <h3 className="text-2xl mb-6">Color Variations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {concept.colorSchemes.map((scheme) => (
                <div key={scheme} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex justify-center mb-4">
                    <concept.component
                      size={140}
                      autoAnimate
                      colorScheme={scheme as any}
                    />
                  </div>
                  <p className="text-center text-sm text-white/60 capitalize">{scheme}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Size testing */}
          <div className="mt-12">
            <h3 className="text-2xl mb-6">Scale Testing</h3>
            <div className="bg-white/5 rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="text-center">
                  <concept.component size={48} autoAnimate colorScheme={concept.colorSchemes[0] as any} />
                  <p className="text-xs text-white/40 mt-2">48px</p>
                </div>
                <div className="text-center">
                  <concept.component size={64} autoAnimate colorScheme={concept.colorSchemes[0] as any} />
                  <p className="text-xs text-white/40 mt-2">64px</p>
                </div>
                <div className="text-center">
                  <concept.component size={96} autoAnimate colorScheme={concept.colorSchemes[0] as any} />
                  <p className="text-xs text-white/40 mt-2">96px</p>
                </div>
                <div className="text-center">
                  <concept.component size={128} autoAnimate colorScheme={concept.colorSchemes[0] as any} />
                  <p className="text-xs text-white/40 mt-2">128px</p>
                </div>
                <div className="text-center">
                  <concept.component size={200} autoAnimate colorScheme={concept.colorSchemes[0] as any} />
                  <p className="text-xs text-white/40 mt-2">200px</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="size-5" />
          Back
        </button>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl mb-3">Eras Logo Concepts</h1>
          <p className="text-xl text-white/60">
            Interactive prototypes with animated "Eras Gate" effects
          </p>
        </div>

        {/* Concepts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {concepts.map((concept) => {
            const Component = concept.component;
            const isOpen = isAnimating[concept.id] || false;

            return (
              <div
                key={concept.id}
                className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all group"
              >
                {/* Display area */}
                <div className="relative bg-gradient-to-br from-white/5 to-transparent p-12 flex items-center justify-center min-h-[320px]">
                  <Component
                    size={200}
                    isOpen={isOpen}
                    onToggle={() => toggleAnimation(concept.id)}
                    colorScheme={concept.colorSchemes[0] as any}
                  />

                  {/* Animation control */}
                  <button
                    onClick={() => toggleAnimation(concept.id)}
                    className="absolute bottom-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                  >
                    {isOpen ? (
                      <Pause className="size-5" />
                    ) : (
                      <Play className="size-5" />
                    )}
                  </button>
                </div>

                {/* Info area */}
                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="text-2xl mb-1">{concept.name}</h3>
                    <p className="text-sm text-white/50">{concept.tagline}</p>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {concept.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setSelectedConcept(concept.id)}
                      className="flex-1 py-2 px-4 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                    >
                      View Details
                    </button>
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Download className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison matrix */}
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl mb-6">Comparison Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/60">Concept</th>
                  <th className="text-center py-4 px-4 text-white/60">Memorability</th>
                  <th className="text-center py-4 px-4 text-white/60">Animation Impact</th>
                  <th className="text-center py-4 px-4 text-white/60">Scalability</th>
                  <th className="text-center py-4 px-4 text-white/60">Premium Feel</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Memory Vault', scores: [5, 5, 5, 5] },
                  { name: 'Moment Prism', scores: [5, 5, 4, 5] },
                  { name: 'Chrysalis', scores: [5, 5, 3, 5] },
                  { name: 'Eclipse Reimagined', scores: [4, 5, 4, 5] },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">{row.name}</td>
                    {row.scores.map((score, j) => (
                      <td key={j} className="text-center py-4 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: 5 }).map((_, k) => (
                            <div
                              key={k}
                              className={`size-3 rounded-full ${
                                k < score ? 'bg-emerald-400' : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <h3 className="text-lg mb-2 text-emerald-400">🏆 For Immediate Impact</h3>
            <p className="text-sm text-white/70">Memory Vault - Highest luxury, clear metaphor</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg mb-2 text-blue-400">🎨 Most Unique</h3>
            <p className="text-sm text-white/70">Moment Prism - Ownable, sophisticated design</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-lg mb-2 text-purple-400">💫 Deepest Meaning</h3>
            <p className="text-sm text-white/70">Chrysalis - Transformation metaphor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
