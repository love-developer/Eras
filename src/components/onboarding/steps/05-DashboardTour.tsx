import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, List, Clock, ChevronRight } from 'lucide-react';

interface DashboardTourProps {
  onContinue: () => void;
  onBack: () => void;
  updateProgress?: (progress: any) => void;
}

type ViewMode = 'calendar' | 'classic' | 'timeline';

const viewModes = [
  {
    id: 'calendar' as ViewMode,
    name: 'Calendar View',
    icon: CalendarIcon,
    description: 'See when capsules open',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'classic' as ViewMode,
    name: 'Classic View',
    icon: List,
    description: 'Browse all capsules as cards',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'timeline' as ViewMode,
    name: 'Timeline View',
    icon: Clock,
    description: 'Journey through time',
    color: 'from-orange-500 to-red-500'
  }
];

export function DashboardTour({ onContinue }: DashboardTourProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('calendar');
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-rotate through views
  useEffect(() => {
    if (!autoRotate) return;

    const timer = setTimeout(() => {
      const currentIndex = viewModes.findIndex(v => v.id === currentView);
      const nextIndex = (currentIndex + 1) % viewModes.length;
      setCurrentView(viewModes[nextIndex].id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentView, autoRotate]);

  const handleViewClick = (viewId: ViewMode) => {
    setAutoRotate(false);
    setCurrentView(viewId);
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-full px-6 md:px-12 py-8 pb-24 md:pb-8 overflow-y-auto">
      {/* Continue button - Top Right */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        onClick={onContinue}
        className="fixed top-4 right-4 z-50 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 text-sm font-medium shadow-xl"
        style={{ top: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
      >
        Continue
      </motion.button>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 md:mb-12"
      >
        <h2 className="text-3xl md:text-4xl text-white mb-3">
          Your Dashboard
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-md">
          Three ways to explore your capsules
        </p>
      </motion.div>

      {/* View mode visualizations */}
      <div className="relative w-full max-w-2xl h-80 md:h-96 mb-8">
        <AnimatePresence mode="wait">
          {/* Calendar View */}
          {currentView === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-medium text-lg">December 2025</h3>
                  <CalendarIcon className="w-5 h-5 text-blue-400" />
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-white/40 text-xs text-center pb-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }).map((_, i) => {
                    const hasCapsule = [5, 12, 18, 25].includes(i + 1);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center text-sm
                          ${hasCapsule 
                            ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30' 
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }
                          transition-colors cursor-pointer relative
                        `}
                      >
                        {i + 1}
                        {hasCapsule && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [1, 0.5, 1]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity
                            }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 flex items-center gap-2 text-sm text-white/60"
                >
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                  <span>4 capsules this month</span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Classic View */}
          {currentView === 'classic' && (
            <motion.div
              key="classic"
              initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/10 hover:border-purple-400/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`
                        w-12 h-12 rounded-lg bg-gradient-to-br ${
                          i === 0 ? 'from-purple-500 to-pink-500' :
                          i === 1 ? 'from-blue-500 to-cyan-500' :
                          i === 2 ? 'from-orange-500 to-red-500' :
                          'from-green-500 to-emerald-500'
                        }
                        flex items-center justify-center flex-shrink-0
                      `}>
                        <span className="text-white text-xl">
                          {['🎂', '💝', '🎯', '✈️'][i]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm md:text-base truncate">
                          {['Birthday 2026', 'Anniversary', 'Goals Check-in', 'Travel Memory'][i]}
                        </h4>
                        <p className="text-white/50 text-xs md:text-sm">
                          Opens in {[14, 92, 180, 365][i]} days
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: [1, 2, 3, 1][i] }).map((_, j) => (
                        <div key={j} className="w-2 h-2 rounded-full bg-purple-400/30" />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Timeline View */}
          {currentView === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center px-4"
            >
              <div className="w-full max-w-2xl">
                {/* Horizontal timeline */}
                <div className="relative">
                  {/* Timeline line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 origin-left"
                  />

                  {/* Timeline events */}
                  <div className="relative flex justify-between pt-4">
                    {['Now', '6mo', '1yr', '5yr'].map((label, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.15 }}
                        className="flex flex-col items-center"
                      >
                        {/* Node */}
                        <motion.div
                          className={`
                            w-4 h-4 rounded-full mb-2
                            ${i === 0 
                              ? 'bg-orange-500 ring-4 ring-orange-500/30' 
                              : 'bg-white/20 hover:bg-red-500 transition-colors cursor-pointer'
                            }
                          `}
                          whileHover={{ scale: 1.3 }}
                        />

                        {/* Label */}
                        <div className="text-white/60 text-xs">{label}</div>

                        {/* Capsule count */}
                        {i > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="mt-3 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium"
                          >
                            {[3, 5, 2][i - 1]}
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-12 text-center text-white/60 text-sm"
                >
                  10 capsules across time
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View mode selector */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full max-w-2xl px-4">
        {viewModes.map((view) => (
          <motion.button
            key={view.id}
            onClick={() => handleViewClick(view.id)}
            className={`
              flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all
              ${currentView === view.id
                ? 'bg-white/10 border-white/30 shadow-lg'
                : 'bg-white/5 border-white/10 hover:border-white/20'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`
              w-10 h-10 rounded-lg bg-gradient-to-br ${view.color}
              flex items-center justify-center flex-shrink-0
            `}>
              <view.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-white text-sm font-medium">{view.name}</div>
              <div className="text-white/50 text-xs">{view.description}</div>
            </div>
            {currentView === view.id && (
              <ChevronRight className="w-5 h-5 text-white/60" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}