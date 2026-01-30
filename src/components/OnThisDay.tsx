import React from 'react';
import { Calendar, Sparkles, Clock, Image as ImageIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Capsule {
  id: string;
  title?: string;
  message?: string;
  deliveryDate: string;
  media?: any[];
  recipient?: string;
  sender?: string;
}

interface OnThisDayProps {
  capsules: Capsule[];
  onCapsuleClick: (capsule: Capsule) => void;
}

export const OnThisDay: React.FC<OnThisDayProps> = ({
  capsules,
  onCapsuleClick,
}) => {
  if (capsules.length === 0) {
    return null;
  }

  // Group capsules by years ago
  const groupedByYears = capsules.reduce((acc, capsule) => {
    const deliveryDate = new Date(capsule.deliveryDate);
    const today = new Date();
    const yearsAgo = today.getFullYear() - deliveryDate.getFullYear();
    
    if (yearsAgo > 0) {
      if (!acc[yearsAgo]) {
        acc[yearsAgo] = [];
      }
      acc[yearsAgo].push(capsule);
    }
    
    return acc;
  }, {} as Record<number, Capsule[]>);

  return (
    <div className="space-y-4 mb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
            On This Day
            <Calendar className="w-4 h-4 text-slate-400" />
          </h2>
          <p className="text-sm text-slate-400">
            Memories from {Object.keys(groupedByYears).length} {Object.keys(groupedByYears).length === 1 ? 'year' : 'years'} ago
          </p>
        </div>
      </div>

      {/* Memory Cards */}
      <div className="space-y-6">
        {Object.entries(groupedByYears)
          .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Most recent first
          .map(([yearsAgo, yearCapsules]) => (
            <div key={yearsAgo} className="space-y-3">
              {/* Year Badge */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="bg-amber-500/10 border-amber-500/30 text-amber-400"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {yearsAgo} {yearsAgo === 1 ? 'year' : 'years'} ago
                </Badge>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
              </div>

              {/* Capsules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {yearCapsules.map((capsule) => (
                  <Card
                    key={capsule.id}
                    onClick={() => onCapsuleClick(capsule)}
                    className="group cursor-pointer bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 overflow-hidden"
                  >
                    {/* Media Preview */}
                    {capsule.media && capsule.media.length > 0 ? (
                      <div className="aspect-video w-full bg-slate-900/50 relative overflow-hidden">
                        {capsule.media[0].type?.startsWith('image') ? (
                          <ImageWithFallback
                            src={capsule.media[0].url}
                            alt={capsule.title || 'Memory'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : capsule.media[0].type?.startsWith('video') ? (
                          <video
                            src={capsule.media[0].url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-slate-600" />
                          </div>
                        )}
                        {/* Media Count Badge */}
                        {capsule.media.length > 1 && (
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs text-white flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {capsule.media.length}
                          </div>
                        )}
                        {/* Sparkle Effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-slate-700" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-slate-200 line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {capsule.title || 'Untitled Memory'}
                      </h3>
                      {capsule.message && (
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {capsule.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(capsule.deliveryDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {capsule.sender && (
                        <div className="text-xs text-slate-500">
                          From {capsule.sender}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
