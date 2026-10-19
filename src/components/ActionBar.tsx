import React from 'react';
import { Lightbulb, Shuffle } from 'lucide-react';
import { sound } from '../services/sound';

interface ActionBarProps {
  hintsRemaining: number;
  shufflesRemaining: number;
  onUseHint: () => void;
  onUseShuffle: () => void;
  disabled?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  hintsRemaining,
  shufflesRemaining,
  onUseHint,
  onUseShuffle,
  disabled = false,
}) => {
  return (
    <div className="h-[8%] w-full px-4 py-1 flex items-center justify-center gap-3 shrink-0">
      {/* Hint Button */}
      <button
        disabled={disabled || hintsRemaining <= 0}
        onClick={() => {
          if (hintsRemaining > 0 && !disabled) {
            sound.playHint();
            onUseHint();
          }
        }}
        className={`flex-1 h-full rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all duration-150 active:scale-95 border-b-[3px] ${
          hintsRemaining > 0 && !disabled
            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 border-amber-500 hover:brightness-105 active:border-b-0 active:translate-y-0.5'
            : 'bg-white/10 text-white/40 border-transparent cursor-not-allowed'
        }`}
      >
        <Lightbulb className={`w-4 h-4 ${hintsRemaining > 0 ? 'text-amber-900 fill-amber-300' : ''}`} />
        <span>Hint</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-xs font-black ${
            hintsRemaining > 0 ? 'bg-amber-950/20 text-amber-950' : 'bg-white/10 text-white/30'
          }`}
        >
          {hintsRemaining}
        </span>
      </button>

      {/* Shuffle Button */}
      <button
        disabled={disabled || shufflesRemaining <= 0}
        onClick={() => {
          if (shufflesRemaining > 0 && !disabled) {
            sound.playShuffle();
            onUseShuffle();
          }
        }}
        className={`flex-1 h-full rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all duration-150 active:scale-95 border-b-[3px] ${
          shufflesRemaining > 0 && !disabled
            ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-purple-950 border-purple-500 hover:brightness-105 active:border-b-0 active:translate-y-0.5'
            : 'bg-white/10 text-white/40 border-transparent cursor-not-allowed'
        }`}
      >
        <Shuffle className="w-4 h-4" />
        <span>Shuffle</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-xs font-black ${
            shufflesRemaining > 0 ? 'bg-purple-950/20 text-purple-950' : 'bg-white/10 text-white/30'
          }`}
        >
          {shufflesRemaining}
        </span>
      </button>
    </div>
  );
};
