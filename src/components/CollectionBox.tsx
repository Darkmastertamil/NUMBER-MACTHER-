import React from 'react';
import { Sparkles, Package } from 'lucide-react';
import { MatchedPairRecord } from '../types/game';
import { DIGIT_THEMES } from './GameBoard';

interface CollectionBoxProps {
  matchedPairs: MatchedPairRecord[];
  isBouncing: boolean;
}

export const CollectionBox: React.FC<CollectionBoxProps> = ({
  matchedPairs,
  isBouncing,
}) => {
  // Show the last 5 collected pairs stacking inside
  const recentPairs = matchedPairs.slice(-5);
  const pairCount = matchedPairs.length;

  return (
    <div className="h-[12%] w-full px-3 py-1 flex flex-col justify-center shrink-0">
      <div
        className={`w-full h-full rounded-2xl bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-sky-500/15 border border-white/15 px-3 py-1.5 flex items-center justify-between shadow-inner backdrop-blur-sm transition-transform ${
          isBouncing ? 'animate-box-thud ring-2 ring-pink-400/50' : ''
        }`}
      >
        {/* Left: Box Label and Count */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-pink-500/25 border border-pink-400/30 flex items-center justify-center text-pink-200">
            <Package className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-pink-200/80 flex items-center gap-1">
              Collection Box
              {pairCount > 0 && <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" />}
            </span>
            <span className="text-xs font-black text-white">
              {pairCount} / 32 <span className="font-normal text-slate-300 text-[10px]">pairs</span>
            </span>
          </div>
        </div>

        {/* Right: Stack of mini matched pair tiles */}
        <div className="flex items-center gap-1 overflow-hidden justify-end">
          {recentPairs.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic">Match pairs to fill!</span>
          ) : (
            recentPairs.map((pair, idx) => {
              const theme1 = DIGIT_THEMES[pair.num1] || DIGIT_THEMES[1];
              const theme2 = DIGIT_THEMES[pair.num2] || DIGIT_THEMES[1];
              return (
                <div
                  key={pair.id}
                  className="flex items-center bg-white/20 p-0.5 rounded-lg border border-white/20 shadow-sm transition-all animate-bounce"
                  style={{
                    animationDelay: `${idx * 0.05}s`,
                    animationDuration: '1s',
                  }}
                >
                  <span
                    className={`w-4 h-5 rounded flex items-center justify-center font-bold text-[10px] ${theme1.bg} ${theme1.text}`}
                  >
                    {pair.num1}
                  </span>
                  <span className="text-[9px] text-white/50 px-0.5">+</span>
                  <span
                    className={`w-4 h-5 rounded flex items-center justify-center font-bold text-[10px] ${theme2.bg} ${theme2.text}`}
                  >
                    {pair.num2}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
