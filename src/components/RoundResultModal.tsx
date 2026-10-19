import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, Play } from 'lucide-react';
import { PlayerData, RoomData } from '../types/game';
import { sound } from '../services/sound';

interface RoundResultModalProps {
  room: RoomData;
  players: PlayerData[];
  currentUserId: string;
  isHost: boolean;
  onNextRound: () => void;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  room,
  players,
  currentUserId,
  isHost,
  onNextRound,
}) => {
  useEffect(() => {
    sound.playRoundWin();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FFB5C2', '#A3E4D7', '#A9D6E5', '#FFEAA7', '#D8B4F8'],
    });
  }, []);

  const winner = players.find((p) => p.id === room.winnerId) || players[0];
  const sortedPlayers = [...players].sort((a, b) => (b.clearedCount || 0) - (a.clearedCount || 0));

  return (
    <div className="absolute inset-0 z-40 bg-[#151221]/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs bg-gradient-to-b from-[#2e2647] to-[#1f1933] border-2 border-pink-400/40 rounded-3xl p-4 shadow-2xl flex flex-col items-center text-center animate-pulse-glow">
        {/* Trophy icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 mb-2">
          <Trophy className="w-8 h-8 animate-bounce fill-amber-300" />
        </div>

        <span className="text-[11px] uppercase font-bold tracking-widest text-pink-300">
          Round {room.round} Finished!
        </span>
        <h2 className="text-xl font-black text-white mt-0.5">
          {winner ? `${winner.name} Won!` : 'Round Complete!'}
        </h2>
        <p className="text-xs text-slate-300 mb-3">
          First to completely clear the 8x8 sheet!
        </p>

        {/* Compact leaderboard rows (up to 6) */}
        <div className="w-full flex flex-col gap-1.5 mb-4">
          {sortedPlayers.slice(0, 6).map((player, idx) => {
            const isMe = player.id === currentUserId;
            const isRoundWinner = player.id === room.winnerId;

            return (
              <div
                key={player.id}
                className={`h-9 px-2.5 rounded-xl flex items-center justify-between text-xs border ${
                  isRoundWinner
                    ? 'bg-amber-400/20 border-amber-300/50 text-amber-200 font-bold'
                    : isMe
                    ? 'bg-pink-500/20 border-pink-400/40 text-pink-200'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-4 font-black text-[11px] text-slate-400">
                    #{idx + 1}
                  </span>
                  <span className="text-sm shrink-0">{player.avatar}</span>
                  <span className="truncate font-semibold">{player.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span>{player.clearedCount}/64</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-white/10 font-bold text-white">
                    🏆 {player.roundsWon || 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Round Button */}
        {isHost ? (
          <button
            onClick={() => {
              sound.playClick();
              onNextRound();
            }}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 hover:brightness-105 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 border-b-3 border-rose-600"
          >
            <span>Start Round {room.round + 1}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-full h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center gap-2 text-pink-200 font-bold text-xs animate-pulse">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Waiting for host to begin next round...</span>
          </div>
        )}
      </div>
    </div>
  );
};
