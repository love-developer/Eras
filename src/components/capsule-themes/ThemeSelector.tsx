import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Info } from 'lucide-react';
import { THEMES, ThemeId, ThemeConfig } from './ThemeRegistry';
import { Card } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useIsMobile } from '../ui/use-mobile';

interface ThemeSelectorProps {
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export function ThemeSelector({ selectedThemeId, onSelectTheme }: ThemeSelectorProps) {
  const isMobile = useIsMobile();
  const [justSelected, setJustSelected] = React.useState<string | null>(null);

  const handleSelect = (themeId: string) => {
    setJustSelected(themeId);
    onSelectTheme(themeId);
    
    // Clear animation state after animation completes
    setTimeout(() => {
      setJustSelected(null);
    }, 600);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.values(THEMES).map((theme, index) => {
        const isSelected = selectedThemeId === theme.id;
        const Icon = theme.icon;

        return (
          <motion.div
            key={theme.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(theme.id)}
            className={`cursor-pointer h-full ${
              isMobile && index === 0 ? 'col-span-2' : ''
            }`}
            // Pulse animation when just selected
            animate={justSelected === theme.id ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{
              duration: 0.4,
              ease: 'easeOut'
            }}
          >
            <Card 
              className={`h-full relative overflow-hidden transition-all duration-300 border-2 ${
                isSelected 
                  ? 'border-white ring-2 ring-white/20 shadow-xl' 
                  : 'border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
              style={{
                background: isSelected 
                  ? (isMobile ? theme.primaryColor : theme.bgGradient)
                  : 'rgba(255, 255, 255, 0.03)'
              }}
            >
              {/* Animated Glow Effect on Selection */}
              {justSelected === theme.id && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}40, ${theme.secondaryColor || theme.primaryColor}40)`,
                    filter: 'blur(8px)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
              )}
              
              {/* Selected Indicator with Animation */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div 
                    className="absolute top-3 right-3 bg-white text-black rounded-full p-1 shadow-lg z-10"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 400,
                      damping: 20 
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-3 md:p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div 
                    className={`p-2 md:p-2.5 rounded-xl ${isSelected ? 'bg-white/20 backdrop-blur-md' : 'bg-white/10'}`}
                  >
                    <Icon 
                      className={`w-5 h-5 md:w-6 md:h-6 ${isSelected ? 'text-white' : ''}`} 
                      style={!isSelected ? { color: theme.primaryColor } : undefined}
                    />
                  </div>
                  <div>
                    <h3 className={`font-normal md:font-bold text-[8px] md:text-lg leading-tight ${isSelected ? 'text-white' : 'text-white/90'}`}>
                      {theme.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className={`text-xs md:text-sm mb-2 md:mb-4 leading-relaxed ${isSelected ? 'text-white/90' : 'text-white/60'}`}>
                  {theme.description}
                </p>

                {/* Preview Badge */}
                <div className="mt-auto pt-2 border-t border-white/10 flex items-center justify-between text-[10px] md:text-xs">
                  <span className={isSelected ? 'text-white/80' : 'text-white/40'}>
                    Unboxing: {theme.interactionPrompt}
                  </span>
                  
                  {theme.id !== 'standard' && (
                     <div className="flex -space-x-1">
                        {theme.particleColors.slice(0,3).map((color, i) => (
                          <div 
                            key={i} 
                            className="w-3 h-3 rounded-full ring-1 ring-black/20" 
                            style={{ backgroundColor: color }}
                          />
                        ))}
                     </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}