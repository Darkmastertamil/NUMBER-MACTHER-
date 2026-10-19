import React from 'react';
import { X, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { sound } from '../services/sound';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#151221]/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs bg-gradient-to-b from-[#2a223f] to-[#1c172d] border border-white/20 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[85dvh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-300" />
            <h3 className="text-base font-black text-pink-200">How to Play</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll-free content designed to fit screen */}
        <div className="flex-1 flex flex-col justify-between py-2 text-xs leading-relaxed space-y-2">
          {/* Rule 1: Matching */}
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-amber-300 flex items-center gap-1 mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tap ANY Two Matching Cells</span>
            </div>
            <p className="text-[11px] text-slate-300">
              No adjacency needed! Tap any 2 cells that are <b>identical</b> (e.g. 4 & 4) or <b>sum to 10</b> (e.g. 3 & 7, 2 & 8, 1 & 9).
            </p>
          </div>

          {/* Rule 2: Combos & Bonuses */}
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-orange-300 flex items-center gap-1 mb-0.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Scoring & Speed Combos</span>
            </div>
            <ul className="text-[10px] text-slate-300 space-y-0.5">
              <li>• Valid match: <b>+10 pts</b> (Wrong: <b>-2 pts</b>)</li>
              <li>• Match within 3s: combo streak up to <b>+10 bonus</b></li>
              <li>• Clear a row: <b>+25 pts</b> | Clear full sheet: <b>+100 pts</b></li>
            </ul>
          </div>

          {/* Rule 3: Modes */}
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-sky-300 mb-0.5">🏁 Race vs ⏱️ Timed</div>
            <p className="text-[10px] text-slate-300">
              <b>Race:</b> First to clear their 64 cells wins the round. First to 3 rounds wins the match.<br />
              <b>Timed:</b> 4-minute frenzy with continuous fresh sheets!
            </p>
          </div>

          {/* Tools */}
          <div className="text-[10px] text-slate-400 text-center">
            💡 <b>Hint</b> (3 uses) highlights a pair • 🔀 <b>Shuffle</b> (2 uses) rearranges numbers.
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full h-10 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-black text-xs shrink-0 shadow-md active:scale-95"
        >
          Got it, let's play!
        </button>
      </div>
    </div>
  );
};
