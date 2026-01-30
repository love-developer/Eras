import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { PlusCircle, Inbox, Search, Filter, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CosmicEmptyStateProps {
  activeTab?: string;
  searchTerm?: string;
  filterMediaType?: string;
  selectedDate?: Date | null;
  onCreateCapsule?: () => void;
  onClearFilters?: () => void;
}

export const CosmicEmptyState: React.FC<CosmicEmptyStateProps> = ({
  activeTab,
  searchTerm,
  filterMediaType,
  selectedDate,
  onCreateCapsule,
  onClearFilters
}) => {
  // Determine if filters are active
  const hasFilters = !!searchTerm || (filterMediaType && filterMediaType !== 'all') || !!selectedDate;
  
  const getContent = () => {
    // If there are active filters, show "no results" message
    if (hasFilters) {
      return {
        icon: Search,
        title: 'No Capsules Found',
        description: 'No capsules match your search or filter criteria. Try adjusting your filters.',
        action: onClearFilters && (
          <Button 
            onClick={onClearFilters}
            variant="outline"
            size="lg"
            className="border-slate-600 text-slate-200 hover:bg-slate-800/50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Clear All Filters
          </Button>
        ),
        gradient: 'from-amber-500/20 to-orange-500/20'
      };
    }
    
    // Otherwise, show status-specific empty state
    switch (activeTab) {
      case 'all':
        return {
          icon: Inbox,
          title: 'No Time Capsules Yet',
          description: 'Create your first time capsule to get started on your journey through time.',
          action: onCreateCapsule && (
            <Button 
              onClick={onCreateCapsule}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create Capsule
            </Button>
          ),
          gradient: 'from-blue-500/20 to-violet-500/20'
        };
      
      case 'scheduled':
        return {
          icon: Sparkles,
          title: 'No Scheduled Capsules',
          description: 'You don\'t have any scheduled capsules yet.',
          action: onCreateCapsule && (
            <Button 
              onClick={onCreateCapsule}
              size="lg"
              className="bg-white hover:bg-gray-100 text-black font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create Capsule
            </Button>
          ),
          gradient: 'from-blue-500/20 to-violet-500/20'
        };
      
      case 'delivered':
        return {
          icon: Sparkles,
          title: 'No Delivered Capsules',
          description: 'You don\'t have any delivered capsules yet.',
          action: null,
          gradient: 'from-emerald-500/20 to-teal-500/20'
        };
      
      case 'received':
        return {
          icon: Inbox,
          title: 'No Received Capsules',
          description: 'You haven\'t received any capsules yet. Capsules from others will appear here.',
          action: null,
          gradient: 'from-amber-500/20 to-orange-500/20'
        };
      
      case 'draft':
        return {
          icon: Sparkles,
          title: 'No Draft Capsules',
          description: 'You don\'t have any draft capsules yet.',
          action: onCreateCapsule && (
            <Button 
              onClick={onCreateCapsule}
              variant="outline"
              size="lg"
              className="border-slate-600 text-slate-200 hover:bg-slate-800/50"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create Capsule
            </Button>
          ),
          gradient: 'from-purple-500/20 to-violet-500/20'
        };
      
      default:
        return {
          icon: Inbox,
          title: 'Nothing Here',
          description: 'No capsules to display.',
          action: null,
          gradient: 'from-slate-500/20 to-slate-600/20'
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[400px] p-4"
    >
      <Card className="relative overflow-hidden bg-slate-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl max-w-lg w-full">
        {/* Cosmic Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${content.gradient} opacity-30 pointer-events-none`} />
        
        {/* Animated Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <CardContent className="relative p-12 text-center space-y-6">
          {/* Icon with gradient background */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${content.gradient} flex items-center justify-center mx-auto shadow-lg`}
          >
            <Icon className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold text-slate-100"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {content.title}
          </motion.h3>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-base leading-relaxed max-w-md mx-auto"
          >
            {content.description}
          </motion.p>

          {/* Action Button */}
          {content.action && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {content.action}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};