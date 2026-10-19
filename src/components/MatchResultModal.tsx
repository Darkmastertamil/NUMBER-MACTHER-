import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Sparkles, RotateCcw } from 'lucide-react';
import { PlayerData, RoomData } from '../types/game';
import { sound } from '../services/sound';

interface MatchResultModalProps {
  room: RoomData;
  players: PlayerData[];
  currentUserId: string;
  isHost: boolean;
  onPlayAgain: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  room,
  players,
  currentUserId,
  isHost,
  onPlayAgain,
}) => {
  useEffect(() => {
    sound.playMatchWin();

    // Trigger dual confetti cannons
    const end = Date.now() + 1500;
    const interval: NodeJS.Timeout = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ['#FFB5C2', '#A3E4D7', '#A9D6E5', '#FFEAA7', '#D8B4F8', '#FFD1BA'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Determine ranking
  const sortedPlayers = [...players].sort((a, b) => {
    if (room.mode === 'race') {
      if ((b.roundsWon || 0) !== (a.roundsWon || 0)) {
        return (b.roundsWon || 0) - (a.roundsWon || 0);
      }
    }
    return (b.score || 0) - (a.score || 0);
  });

  const grandWinner = sortedPlayers[0];

  return (
    <div className="absolute inset-0 z-40 bg-[#151221]/90 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-xs bg-gradient-to-b from-[#31254d] via-[#231a38] to-[#1a142b] border-2 border-amber-400/50 rounded-3xl p-4 shadow-2xl flex flex-col items-center text-center animate-pulse-glow">
        {/* Crown & Medal */}
        <div className="relative mb-1">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-orange-400 p-1 shadow-lg shadow-amber-500/30 flex items-center justify-center animate-bounce">
            <span className="text-3xl select-none">{grandWinner?.avatar || '👑'}</span>
          </div>
          <Crown className="w-6 h-6 text-amber-300 absolute -top-3 -right-2 fill-amber-300 animate-spin" />
        </div>

        <span className="text-[11px] uppercase font-black tracking-widest text-amber-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Party Champion</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </span>

        <h2 className="text-2xl font-black text-white mt-0.5">
          {grandWinner?.name || 'Winner!'}
        </h2>
        <p className="text-[11px] text-pink-200/90 mb-3">
          {room.mode === 'race'
            ? `Won ${grandWinner?.roundsWon || 0} rounds with ${grandWinner?.score || 0} pts!`
            : `Scored highest with ${grandWinner?.score || 0} points!`}
        </p>

        {/* Compact Final Standings Table (up to 6 players) */}
        <div className="w-full flex flex-col gap-1.5 mb-4">
          {sortedPlayers.slice(0, 6).map((player, idx) => {
            const isMe = player.id === currentUserId;
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[idx] || `#${idx + 1}`;

            return (
              <div
                key={player.id}
                className={`h-9 px-2.5 rounded-xl flex items-center justify-between text-xs border ${
                  idx === 0
                    ? 'bg-amber-400/25 border-amber-300/60 text-amber-100 font-bold'
                    : isMe
                    ? 'bg-pink-500/20 border-pink-400/40 text-pink-200 font-semibold'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs shrink-0">{medal}</span>
                  <span className="text-sm shrink-0">{player.avatar}</span>
                  <span className="truncate font-semibold">{player.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  {room.mode === 'race' && (
                    <span className="text-amber-300 font-bold">
                      {player.roundsWon || 0}W
                    </span>
                  )}
                  <span className="px-1.5 py-0.2 rounded bg-white/10 font-bold text-white">
                    {player.score || 0} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Play Again Button */}
        {isHost ? (
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 hover:brightness-105 active:scale-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg border-b-3 border-emerald-600"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again (Lobby)</span>
          </button>
        ) : (
          <div className="w-full h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center gap-2 text-pink-200 font-bold text-xs animate-pulse">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            <span>Waiting for host to start new party...</span>
          </div>
        )}
      </div>
    </div>
  );
};
