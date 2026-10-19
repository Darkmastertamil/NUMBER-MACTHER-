import React, { useState } from 'react';
import { Send, Plus, Trash2, Crown, Bot, ArrowLeft, Play, Sparkles } from 'lucide-react';
import { PlayerData, RoomData, GameMode, BotDifficulty } from '../types/game';
import { sound } from '../services/sound';

interface LobbyScreenProps {
  room: RoomData;
  players: PlayerData[];
  currentUserId: string;
  isHost: boolean;
  onUpdateMode: (mode: GameMode) => void;
  onAddBot: (difficulty: BotDifficulty) => void;
  onRemovePlayer: (playerId: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  players,
  currentUserId,
  isHost,
  onUpdateMode,
  onAddBot,
  onRemovePlayer,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedBotDiff, setSelectedBotDiff] = useState<BotDifficulty>('medium');
  const [planeFlying, setPlaneFlying] = useState(false);

  const handleInvite = () => {
    sound.unlockAudio();
    sound.playClick();
    setPlaneFlying(true);
    const inviteUrl = window.location.href.split('?')[0];
    const textToCopy = `Join my Number Match Party! Room Code: ${room.code}\n${inviteUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }

    setTimeout(() => {
      setCopied(true);
      setPlaneFlying(false);
      setTimeout(() => setCopied(false), 2500);
    }, 600);
  };

  const canStart = players.length >= 2;

  return (
    <div className="w-full h-full flex flex-col justify-between p-3.5 select-none relative z-10">
      {/* Top Header: Room Code & Invite Button */}
      <div className="shrink-0 flex items-center justify-between">
        <button
          onClick={() => {
            sound.unlockAudio();
            sound.playClick();
            onLeaveRoom();
          }}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-slate-200 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Room Code Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
          <span className="text-[11px] font-bold text-slate-300">ROOM:</span>
          <span className="text-base font-black tracking-widest text-amber-300 font-mono">
            {room.code}
          </span>
        </div>

        {/* Invite Button with Paper Plane Animation */}
        <button
          onClick={handleInvite}
          className={`h-8 px-3 rounded-2xl flex items-center gap-1.5 font-bold text-xs shadow-md transition-all active:scale-95 relative overflow-hidden ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-sky-400 to-teal-400 text-slate-900'
          }`}
        >
          <Send
            className={`w-3.5 h-3.5 transition-transform duration-500 ${
              planeFlying ? 'translate-x-8 -translate-y-8 opacity-0' : ''
            }`}
          />
          <span>{copied ? 'Copied!' : 'Invite'}</span>
        </button>
      </div>

      {/* Middle Section 1: Mode Selector (Host only can toggle, other players view) */}
      <div className="mt-1 px-1 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Game Mode
          </span>
          <span className="text-[10px] text-pink-300 font-semibold">
            {room.mode === 'race' ? 'First to 3 round clears' : '4-Minute frenzy'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!isHost}
            onClick={() => {
              sound.playClick();
              onUpdateMode('race');
            }}
            className={`h-11 rounded-2xl flex flex-col items-center justify-center border transition-all ${
              room.mode === 'race'
                ? 'bg-pink-500/25 border-pink-400 text-pink-200 font-black shadow-md'
                : 'bg-white/5 border-white/10 text-slate-400 font-medium'
            } ${!isHost ? 'cursor-default' : 'active:scale-98'}`}
          >
            <span className="text-xs">🏁 Race Mode</span>
            <span className="text-[9px] opacity-80">Best of 3 Rounds</span>
          </button>

          <button
            disabled={!isHost}
            onClick={() => {
              sound.playClick();
              onUpdateMode('timed');
            }}
            className={`h-11 rounded-2xl flex flex-col items-center justify-center border transition-all ${
              room.mode === 'timed'
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-black shadow-md'
                : 'bg-white/5 border-white/10 text-slate-400 font-medium'
            } ${!isHost ? 'cursor-default' : 'active:scale-98'}`}
          >
            <span className="text-xs">⏱️ Timed Mode</span>
            <span className="text-[9px] opacity-80">4 Mins Non-Stop</span>
          </button>
        </div>
      </div>

      {/* Middle Section 2: 6 Player Slots in 2x3 Grid */}
      <div className="my-auto py-1">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
            <span>Players</span>
            <span className="text-pink-300">({players.length}/6)</span>
          </span>
          {isHost && players.length < 6 && (
            <div className="flex items-center gap-1">
              <select
                value={selectedBotDiff}
                onChange={(e) => setSelectedBotDiff(e.target.value as BotDifficulty)}
                className="bg-white/15 text-white font-bold text-[10px] rounded-lg px-1.5 py-0.5 outline-none border border-white/20"
              >
                <option value="easy" className="bg-[#2a243e] text-white">Easy Bot</option>
                <option value="medium" className="bg-[#2a243e] text-white">Med Bot</option>
                <option value="hard" className="bg-[#2a243e] text-white">Hard Bot</option>
              </select>
              <button
                onClick={() => {
                  sound.playClick();
                  onAddBot(selectedBotDiff);
                }}
                className="px-2 py-0.5 rounded-lg bg-pink-500/30 hover:bg-pink-500/50 text-pink-200 text-[10px] font-bold border border-pink-400/30 flex items-center gap-0.5 active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>

        {/* 2x3 Grid */}
        <div className="grid grid-cols-2 grid-rows-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
            const player = players[slotIdx];
            if (player) {
              const isMe = player.id === currentUserId;
              return (
                <div
                  key={player.id}
                  className={`h-14 rounded-2xl p-2 flex items-center justify-between border backdrop-blur-sm relative overflow-hidden transition-all ${
                    isMe
                      ? 'bg-pink-500/20 border-pink-400/50 ring-1 ring-pink-400/30'
                      : 'bg-white/10 border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0 shadow-sm relative">
                      {player.avatar}
                      {player.isHost && (
                        <Crown className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 fill-amber-300" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-xs font-bold text-white truncate">
                          {player.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-slate-300 font-medium">
                        {isMe && <span className="text-pink-300 font-bold">You</span>}
                        {player.isBot && (
                          <span className="flex items-center gap-0.5 text-sky-300">
                            <Bot className="w-2.5 h-2.5" />
                            <span className="capitalize">{player.botDifficulty}</span>
                          </span>
                        )}
                        {!isMe && !player.isBot && <span>Ready</span>}
                      </div>
                    </div>
                  </div>

                  {/* Host kick / bot remove button */}
                  {isHost && (!isMe || player.isBot) && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onRemovePlayer(player.id);
                      }}
                      className="w-6 h-6 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 flex items-center justify-center transition-colors active:scale-90"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div
                key={`empty_${slotIdx}`}
                className="h-14 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center text-slate-500 text-xs font-medium"
              >
                <span>Slot {slotIdx + 1} Empty</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Start Section */}
      <div className="shrink-0 flex flex-col gap-1.5 pt-1">
        {isHost ? (
          <>
            <button
              disabled={!canStart}
              onClick={() => {
                sound.unlockAudio();
                sound.playMatchWin();
                onStartGame();
              }}
              className={`w-full h-12 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                canStart
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 text-slate-950 border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 hover:brightness-105'
                  : 'bg-white/10 text-white/30 cursor-not-allowed border-transparent'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Match</span>
              <Sparkles className="w-4 h-4" />
            </button>
            {!canStart && (
              <p className="text-center text-[11px] text-amber-200/90 font-medium">
                Add at least 1 more player or bot to start!
              </p>
            )}
          </>
        ) : (
          <div className="w-full h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center gap-2 text-pink-200 font-bold text-xs animate-pulse">
            <div className="w-3.5 h-3.5 border-2 border-pink-300 border-t-transparent rounded-full animate-spin" />
            <span>Waiting for host to start the game...</span>
          </div>
        )}
      </div>
    </div>
  );
};
