import React from 'react';
import { X } from 'lucide-react';

interface FolderHeaderProps {
  folderType: 'all' | 'scheduled' | 'delivered' | 'received' | 'draft';
  count: number;
  onClose: () => void;
}

export const FolderHeader: React.FC<FolderHeaderProps> = ({ folderType, count, onClose }) => {
  // Return different header for each folder type
  switch (folderType) {
    case 'all':
      return <AllCapsulesHeader count={count} onClose={onClose} />;
    case 'scheduled':
      return <ScheduledHeader count={count} onClose={onClose} />;
    case 'delivered':
      return <DeliveredHeader count={count} onClose={onClose} />;
    case 'received':
      return <ReceivedHeader count={count} onClose={onClose} />;
    case 'draft':
      return <DraftHeader count={count} onClose={onClose} />;
    default:
      return null;
  }
};

// ALL CAPSULES HEADER - Clean cosmic theme
const AllCapsulesHeader: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => {
  return (
    <div className="sticky top-0 z-50 flex-none">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
              🌌
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium">All Capsules</h2>
              <p className="text-xs text-slate-400">{count} total</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-3xl">
            🌌
          </div>
          <div>
            <h2 className="text-xl text-white font-semibold">All Capsules</h2>
            <p className="text-sm text-slate-400">{count} capsules in total</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-slate-300" />
        </button>
      </div>
    </div>
  );
};

// SCHEDULED HEADER - Blue theme
const ScheduledHeader: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => {
  return (
    <div className="sticky top-0 z-50 flex-none">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-blue-900/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-950/50 border border-blue-800/50 flex items-center justify-center text-2xl">
              ⏰
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium">Scheduled</h2>
              <p className="text-xs text-blue-400">{count} waiting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-blue-900/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-950/50 border border-blue-800/50 flex items-center justify-center text-3xl">
            ⏰
          </div>
          <div>
            <h2 className="text-xl text-white font-semibold">Scheduled Capsules</h2>
            <p className="text-sm text-blue-400">{count} capsules waiting to be delivered</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-slate-300" />
        </button>
      </div>
    </div>
  );
};

// DELIVERED HEADER - Green theme
const DeliveredHeader: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => {
  return (
    <div className="sticky top-0 z-50 flex-none">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-emerald-900/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center text-2xl">
              📬
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium">Delivered</h2>
              <p className="text-xs text-emerald-400">{count} sent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-emerald-900/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center text-3xl">
            📬
          </div>
          <div>
            <h2 className="text-xl text-white font-semibold">Delivered Capsules</h2>
            <p className="text-sm text-emerald-400">{count} capsules successfully delivered</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-slate-300" />
        </button>
      </div>
    </div>
  );
};

// RECEIVED HEADER - Yellow/Gold theme
const ReceivedHeader: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => {
  return (
    <div className="sticky top-0 z-50 flex-none">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-amber-900/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-2xl">
              🎁
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium">Received</h2>
              <p className="text-xs text-amber-400">{count} received</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-amber-900/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-3xl">
            🎁
          </div>
          <div>
            <h2 className="text-xl text-white font-semibold">Received Capsules</h2>
            <p className="text-sm text-amber-400">{count} capsules received</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-slate-300" />
        </button>
      </div>
    </div>
  );
};

// DRAFT HEADER - Purple theme
const DraftHeader: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => {
  return (
    <div className="sticky top-0 z-50 flex-none">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-violet-900/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-violet-950/50 border border-violet-800/50 flex items-center justify-center text-2xl">
              🖊️
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium">Drafts</h2>
              <p className="text-xs text-violet-400">{count} unfinished</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-violet-900/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-950/50 border border-violet-800/50 flex items-center justify-center text-3xl">
            🖊️
          </div>
          <div>
            <h2 className="text-xl text-white font-semibold">Draft Capsules</h2>
            <p className="text-sm text-violet-400">{count} drafts waiting to be completed</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-slate-300" />
        </button>
      </div>
    </div>
  );
};