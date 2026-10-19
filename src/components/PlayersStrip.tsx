import React from 'react';
import { PlayerData, GameMode } from '../types/game';

interface PlayersStripProps {
  players: PlayerData[];
  currentUserId: string;
  mode: GameMode;
}

export const PlayersStrip: React.FC<PlayersStripProps> = ({
  players,
  currentUserId,
  mode,
}) => {
  // Filter out current user so we show opponents
  const opponents = players.filter((p) => p.id !== currentUserId);

  // SVG circular progress helpers
  const radius = 14;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="h-[10%] w-full px-2 flex items-center justify-start gap-2 overflow-x-hidden shrink-0 border-b border-white/5 bg-black/15">
      {opponents.length === 0 ? (
        <div className="w-full flex items-center justify-center text-xs text-slate-400 italic">
          Solo practice mode (Invite friends in lobby!)
        </div>
      ) : (
        opponents.slice(0, 5).map((player) => {
          const clearedRatio = Math.min(1, Math.max(0, (player.clearedCount || 0) / 64));
          const strokeDashoffset = circumference - clearedRatio * circumference;

          return (
            <div
              key={player.id}
              className="flex-1 min-w-0 max-w-[85px] h-[85%] rounded-xl bg-white/10 border border-white/10 px-1 py-0.5 flex items-center gap-1.5 shadow-sm relative overflow-hidden"
            >
              {/* Circular progress avatar */}
              <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                <svg className="w-7 h-7 -rotate-90">
                  <circle
                    cx="14"
                    cy="14"
                    r={radius}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                  <circle
                    cx="14"
                    cy="14"
                    r={radius}
                    stroke="#A3E4D7"
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs select-none">
                  {player.avatar}
                </span>
              </div>

              {/* Player info */}
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-0.5 truncate">
                  <span className="text-[10px] font-semibold text-slate-200 truncate">
                    {player.name}
                  </span>
                  {player.isBot && (
                    <span className="text-[8px] bg-sky-500/30 text-sky-200 px-0.5 rounded uppercase font-bold shrink-0">
                      BOT
                    </span>
                  )}
                </div>
                <div className="text-[9px] font-mono text-pink-300 font-bold truncate">
                  {mode === 'race' ? (
                    <span>{player.clearedCount || 0}/64</span>
                  ) : (
                    <span>{player.score || 0} pts</span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
