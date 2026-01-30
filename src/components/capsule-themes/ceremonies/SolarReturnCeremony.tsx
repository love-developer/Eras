import React, { useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { Gift, Scissors } from 'lucide-react';

interface SolarReturnCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
  themeConfig: any;
}

export function SolarReturnCeremony({ onComplete, isVisible, themeConfig }: SolarReturnCeremonyProps) {
  const [ripState, setRipState] = useState(0); // 0-100%

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x > 50) {
        const newRip = Math.min(100, (info.offset.x / 200) * 100);
        setRipState(newRip);
        if (newRip >= 100) {
            onComplete();
        }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
         <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <h2 className="text-3xl font-bold text-yellow-300 drop-shadow-md">Solar Return</h2>
            <p className="text-white/80 font-medium mt-2">Swipe to tear open</p>
        </motion.div>

        <div className="relative w-64 h-64 bg-red-600 rounded-lg shadow-2xl overflow-hidden border-4 border-yellow-400">
             {/* Pattern */}
             <div className="absolute inset-0 opacity-20" 
                  style={{ backgroundImage: 'radial-gradient(#FDBA74 20%, transparent 20%)', backgroundSize: '20px 20px' }} />
            
             {/* Tear Strip */}
             <div className="absolute top-1/2 left-0 right-0 h-16 -translate-y-1/2 bg-yellow-400/20 border-y-2 border-dashed border-yellow-300 flex items-center px-4">
                 <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 250 }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={handleDrag}
                    className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
                 >
                     <Scissors className="w-6 h-6 text-red-500" />
                 </motion.div>
                 
                 {/* Ripped Trail */}
                 <div className="absolute left-0 top-0 bottom-0 bg-slate-900/50 z-10" style={{ width: `${ripState}%` }} />
                 
                 <div className="ml-16 text-yellow-200 text-xs font-bold uppercase tracking-widest opacity-50">
                    Tear Here &rarr;
                 </div>
             </div>

             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <Gift className="w-32 h-32 text-red-800 opacity-20" />
             </div>
        </div>
    </div>
  );
}
