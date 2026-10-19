import React from 'react';
import { Volume2, VolumeX, LogOut, Flame } from 'lucide-react';
import { sound } from '../services/sound';
import { GameMode } from '../types/game';

interface TopBarProps {
  mode: GameMode;
  round: number;
  maxRounds: number;
  timeRemaining: number; // in seconds
  score: number;
  comboStreak: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onLeaveRoom: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  round,
  maxRounds,
  timeRemaining,
  score,
  comboStreak,
  isMuted,
  onToggleMute,
  onLeaveRoom,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="h-[8%] w-full px-3.5 flex items-center justify-between shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-sm z-20">
      {/* Left: Mode / Round or Timer */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            sound.playClick();
            if (window.confirm('Leave this game?')) {
              onLeaveRoom();
            }
          }}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-rose-300 transition-transform"
          title="Leave Room"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>

        {mode === 'race' ? (
          <div className="px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-xs font-semibold tracking-wide flex items-center gap-1">
            <span>🏁 Round</span>
            <span className="text-white font-bold">
              {round}/{maxRounds}
            </span>
          </div>
        ) : (
          <div
            className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold tracking-wider flex items-center gap-1 ${
              timeRemaining < 30
                ? 'bg-red-500/30 border-red-400 text-red-200 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
            }`}
          >
            <span>⏱️</span>
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Middle: Combo Streak */}
      {comboStreak > 1 && (
        <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1 animate-pulse shadow-sm">
          <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
          <span>x{comboStreak}</span>
          <span className="text-[10px] text-amber-200 font-normal">
            (+{Math.min(10, comboStreak * 2)})
          </span>
        </div>
      )}

      {/* Right: Score & Mute Toggle */}
      <div className="flex items-center gap-2">
        <div className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-bold flex items-center gap-1">
          <span>⭐</span>
          <span className="text-white font-black">{score}</span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onToggleMute();
          }}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-slate-200 transition-transform"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-pink-300" />
          )}
        </button>
      </div>
    </header>
  );
};
