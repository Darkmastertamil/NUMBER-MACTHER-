import React, { useState } from 'react';
import { Sparkles, Users, Play, HelpCircle, Volume2, VolumeX, Home as HomeIcon } from 'lucide-react';
import { sound } from '../services/sound';

interface HomeScreenProps {
  playerName: string;
  playerAvatar: string;
  onUpdateProfile: (name: string, avatar: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  isCreating: boolean;
  isJoining: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenRules: () => void;
}

export const AVATAR_OPTIONS = [
  { emoji: '🐰', name: 'Bunny', bg: 'bg-pink-100 border-pink-300' },
  { emoji: '🐱', name: 'Kitty', bg: 'bg-emerald-100 border-emerald-300' },
  { emoji: '🐶', name: 'Puppy', bg: 'bg-orange-100 border-orange-300' },
  { emoji: '🐻', name: 'Bear', bg: 'bg-amber-100 border-amber-300' },
  { emoji: '🦊', name: 'Fox', bg: 'bg-sky-100 border-sky-300' },
  { emoji: '🐼', name: 'Panda', bg: 'bg-purple-100 border-purple-300' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  playerName,
  playerAvatar,
  onUpdateProfile,
  onCreateRoom,
  onJoinRoom,
  isCreating,
  isJoining,
  errorMessage,
  onClearError,
  isMuted,
  onToggleMute,
  onOpenRules,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [isHouseBuilding, setIsHouseBuilding] = useState(false);

  const handleCreateClick = () => {
    sound.unlockAudio();
    sound.playClick();
    // Trigger cutscene: floating numbers fly together and assemble a house/room
    setIsHouseBuilding(true);
    setTimeout(() => {
      onCreateRoom();
    }, 1200);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.unlockAudio();
    sound.playClick();
    if (joinCode.trim().length === 5) {
      onJoinRoom(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 relative z-10 select-none">
      {/* Top Header: Mute & Rules icons */}
      <div className="flex items-center justify-between shrink-0 pt-1">
        <button
          onClick={() => {
            sound.unlockAudio();
            sound.playClick();
            onOpenRules();
          }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-amber-200 transition-transform"
          title="Game Rules"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <span className="text-[11px] font-bold tracking-widest uppercase text-pink-300/80 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-400/20">
          Party Edition
        </span>

        <button
          onClick={() => {
            sound.unlockAudio();
            sound.playClick();
            onToggleMute();
          }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-slate-200 transition-transform"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-slate-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-pink-300" />
          )}
        </button>
      </div>

      {/* Hero Banner & Logo */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        <div className="relative mb-2">
          {/* Animated cute logo icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-400 via-purple-400 to-sky-400 p-1 shadow-lg shadow-pink-500/20 animate-bounce">
            <div className="w-full h-full rounded-[22px] bg-[#231d38] flex items-center justify-center relative overflow-hidden">
              <span className="text-3xl font-black text-amber-300">10</span>
              <Sparkles className="w-4 h-4 text-pink-300 absolute top-2 right-2 animate-spin" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-sky-300 drop-shadow-sm">
          Number Match
        </h1>
        <p className="text-sm font-bold text-pink-200/90 tracking-wide mt-0.5 flex items-center gap-1.5">
          <span>✨</span>
          <span>Find Pairs & Sums to 10</span>
          <span>🎉</span>
        </p>

        {/* Profile Card: Avatar + Name */}
        <div className="w-full max-w-xs mt-3.5 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
            Your Party Profile
          </div>

          {/* Avatar selector */}
          <div className="flex items-center justify-center gap-2 mb-2.5">
            {AVATAR_OPTIONS.map((opt) => (
              <button
                key={opt.emoji}
                type="button"
                onClick={() => {
                  sound.unlockAudio();
                  sound.playTap();
                  onUpdateProfile(playerName, opt.emoji);
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform active:scale-90 ${
                  playerAvatar === opt.emoji
                    ? 'ring-3 ring-pink-400 ring-offset-2 ring-offset-[#201b33] scale-110 shadow-md bg-white/30'
                    : 'bg-white/10 hover:bg-white/20 opacity-70 hover:opacity-100'
                }`}
              >
                {opt.emoji}
              </button>
            ))}
          </div>

          {/* Player Name Input */}
          <div className="relative">
            <input
              type="text"
              value={playerName}
              maxLength={16}
              onChange={(e) => onUpdateProfile(e.target.value, playerAvatar)}
              placeholder="Enter your name"
              className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm text-center placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
            />
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 max-w-xs animate-shake">
            <span>{errorMessage}</span>
            <button onClick={onClearError} className="text-white font-bold text-sm px-1">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="w-full max-w-xs mx-auto flex flex-col gap-2.5 shrink-0 pb-2">
        {/* Create Room Button */}
        <button
          onClick={handleCreateClick}
          disabled={isCreating || isJoining || isHouseBuilding}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 hover:brightness-105 active:scale-98 text-white font-black text-base shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 border-b-4 border-rose-600 active:border-b-0 active:translate-y-1 transition-all"
        >
          {isCreating || isHouseBuilding ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Building Party Room...</span>
            </div>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white" />
              <span>Create Room</span>
            </>
          )}
        </button>

        {/* Join Room Button / Drawer */}
        {!showJoinInput ? (
          <button
            onClick={() => {
              sound.unlockAudio();
              sound.playClick();
              setShowJoinInput(true);
            }}
            className="w-full h-11 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-98 text-white font-bold text-sm border border-white/20 flex items-center justify-center gap-2 transition-all"
          >
            <Users className="w-4 h-4 text-sky-300" />
            <span>Join with Code</span>
          </button>
        ) : (
          <form onSubmit={handleJoinSubmit} className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              maxLength={5}
              autoFocus
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              className="flex-1 h-11 px-3 rounded-2xl bg-white/15 border border-white/30 text-white font-black text-center tracking-widest placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 uppercase text-lg"
            />
            <button
              type="submit"
              disabled={joinCode.trim().length !== 5 || isJoining}
              className={`h-11 px-5 rounded-2xl font-bold text-sm shadow transition-all active:scale-95 ${
                joinCode.trim().length === 5 && !isJoining
                  ? 'bg-sky-400 hover:bg-sky-300 text-sky-950 font-black'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
            <button
              type="button"
              onClick={() => setShowJoinInput(false)}
              className="h-11 px-3 rounded-2xl bg-white/10 text-slate-300 text-xs"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* House building cutscene animation */}
      {isHouseBuilding && (
        <div className="fixed inset-0 z-50 bg-[#1e1b2e]/90 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Flying numbers assembling */}
            <span className="absolute text-3xl font-black text-pink-300 animate-ping">1</span>
            <span className="absolute text-2xl font-black text-sky-300 animate-spin -top-2 -left-2">9</span>
            <span className="absolute text-2xl font-black text-amber-300 animate-spin -bottom-2 -right-2">5</span>
            <div className="w-20 h-20 rounded-2xl bg-pink-500/30 border-2 border-pink-300 flex items-center justify-center shadow-2xl scale-125 transition-transform duration-700">
              <HomeIcon className="w-10 h-10 text-pink-200 animate-bounce" />
            </div>
          </div>
          <p className="mt-4 text-base font-black text-pink-200 animate-pulse">
            Assembling your party room...
          </p>
        </div>
      )}
    </div>
  );
};
