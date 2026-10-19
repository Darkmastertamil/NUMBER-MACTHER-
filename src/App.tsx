import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BackgroundFloatingNumbers } from './components/BackgroundFloatingNumbers';
import { LandscapeGuard } from './components/LandscapeGuard';
import { PhoneContainer } from './components/PhoneContainer';
import { TopBar } from './components/TopBar';
import { PlayersStrip } from './components/PlayersStrip';
import { GameBoard } from './components/GameBoard';
import { CollectionBox } from './components/CollectionBox';
import { ActionBar } from './components/ActionBar';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { RoundResultModal } from './components/RoundResultModal';
import { MatchResultModal } from './components/MatchResultModal';
import { RulesModal } from './components/RulesModal';
import { CellData, MatchedPairRecord, PlayerData, RoomData, GameMode, BotDifficulty } from './types/game';
import {
  testConnection,
  ensureAuth,
  createRoom,
  joinRoom,
  subscribeToRoom,
  subscribeToPlayers,
  updateRoomState,
  updatePlayerState,
  addBotToRoom,
  removePlayerFromRoom,
  replaceWithBot,
} from './services/firebase';
import {
  generate8x8Sheet,
  findValidPair,
  shuffleUncleared,
  isMatch,
  isRowCleared,
} from './utils/sheetGenerator';
import { sound } from './services/sound';

export default function App() {
  // Profile state
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('nmp_player_name') || 'Lucky Bunny';
  });
  const [playerAvatar, setPlayerAvatar] = useState<string>(() => {
    return localStorage.getItem('nmp_player_avatar') || '🐰';
  });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [showRules, setShowRules] = useState<boolean>(false);

  // Room & Players state
  const [room, setRoom] = useState<RoomData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local Game Board state
  const [cells, setCells] = useState<CellData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [shakingIndices, setShakingIndices] = useState<number[]>([]);
  const [hintIndices, setHintIndices] = useState<number[]>([]);
  const [wavingRow, setWavingRow] = useState<number | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState<number>(3);
  const [shufflesRemaining, setShufflesRemaining] = useState<number>(2);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPairRecord[]>([]);
  const [isBoxBouncing, setIsBoxBouncing] = useState<boolean>(false);

  // Scoring & Combos
  const [score, setScore] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const lastMatchTimeRef = useRef<number>(0);
  const roundStartTimeRef = useRef<number>(0);

  // Timed Mode Timer
  const [timeRemaining, setTimeRemaining] = useState<number>(240); // 4 minutes

  // Refs for real-time tracking
  const roomRef = useRef<RoomData | null>(null);
  const playersRef = useRef<PlayerData[]>([]);
  const currentUserIdRef = useRef<string>('');
  const cellsRef = useRef<CellData[]>([]);

  roomRef.current = room;
  playersRef.current = players;
  currentUserIdRef.current = currentUserId;
  cellsRef.current = cells;

  // Track bots state for host-side simulation
  const botSheetsRef = useRef<Record<string, { cells: CellData[]; score: number }>>({});

  // 1. Initialize Auth and Connection test
  useEffect(() => {
    testConnection();
    ensureAuth().then((user) => {
      setCurrentUserId(user.uid);
    });
  }, []);

  // Update profile
  const handleUpdateProfile = (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    localStorage.setItem('nmp_player_name', name);
    localStorage.setItem('nmp_player_avatar', avatar);

    if (room && currentUserId) {
      updatePlayerState(room.code, currentUserId, {
        name,
        avatar,
      }).catch(() => {});
    }
  };

  const handleToggleMute = () => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
  };

  // 2. Initialize or reset sheet for a new round
  const initSheet = useCallback(() => {
    const newCells = generate8x8Sheet();
    setCells(newCells);
    setSelectedIndices([]);
    setShakingIndices([]);
    setHintIndices([]);
    setWavingRow(null);
    setHintsRemaining(3);
    setShufflesRemaining(2);
    setMatchedPairs([]);
    setComboStreak(0);
    lastMatchTimeRef.current = 0;
    roundStartTimeRef.current = Date.now();
  }, []);

  // 3. Subscribe to room and players
  useEffect(() => {
    if (!room?.code) return;

    const unsubRoom = subscribeToRoom(room.code, (updatedRoom) => {
      if (!updatedRoom) {
        setRoom(null);
        setErrorMessage('Room was closed.');
        return;
      }

      const prevStatus = roomRef.current?.status;
      const prevRound = roomRef.current?.round;

      setRoom(updatedRoom);

      // Handle transition to playing
      if (updatedRoom.status === 'playing') {
        if (prevStatus !== 'playing' || prevRound !== updatedRoom.round) {
          initSheet();
          if (updatedRoom.mode === 'timed') {
            setTimeRemaining(240);
          }
        }
      }
    });

    const unsubPlayers = subscribeToPlayers(room.code, (updatedPlayers) => {
      setPlayers(updatedPlayers);

      // Host migration check: if current host is gone, promote earliest human
      const currentHost = updatedPlayers.find((p) => p.isHost);
      const isMe = currentUserIdRef.current;
      if (!currentHost && updatedPlayers.length > 0) {
        const firstHuman = updatedPlayers.find((p) => !p.isBot);
        if (firstHuman && firstHuman.id === isMe) {
          updateRoomState(room.code, { hostId: isMe }).catch(() => {});
          updatePlayerState(room.code, isMe, { isHost: true }).catch(() => {});
        }
      }
    });

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [room?.code, initSheet]);

  // 4. Timed Mode countdown loop
  useEffect(() => {
    if (room?.status !== 'playing' || room?.mode !== 'timed') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Timed match ended!
          const isHost = room.hostId === currentUserIdRef.current;
          if (isHost) {
            updateRoomState(room.code, {
              status: 'match_over',
              endTime: Date.now(),
            }).catch(() => {});
          }
          return 0;
        }
        if (prev <= 5) {
          sound.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [room?.status, room?.mode, room?.hostId, room?.code]);

  // 5. Host-side Bot simulation loop
  useEffect(() => {
    const isHost = room?.hostId === currentUserId;
    if (!isHost || room?.status !== 'playing') return;

    // Initialize bot sheets if needed
    players.forEach((p) => {
      if (p.isBot && !botSheetsRef.current[p.id]) {
        botSheetsRef.current[p.id] = {
          cells: generate8x8Sheet(),
          score: 0,
        };
      }
    });

    const botInterval = setInterval(() => {
      const currentRoom = roomRef.current;
      if (currentRoom?.status !== 'playing') return;

      playersRef.current.forEach((bot) => {
        if (!bot.isBot) return;

        const botData = botSheetsRef.current[bot.id];
        if (!botData) return;

        // Bot speed & mistake rate based on difficulty
        // Easy: 3.8s step, 20% mistake
        // Medium: 2.3s step, 8% mistake
        // Hard: 1.3s step, 0% mistake
        const mistakeChance = bot.botDifficulty === 'easy' ? 0.2 : bot.botDifficulty === 'medium' ? 0.08 : 0.0;
        const willMistake = Math.random() < mistakeChance;

        if (willMistake) {
          // Bot made a mistake
          botData.score = Math.max(0, botData.score - 2);
          updatePlayerState(currentRoom.code, bot.id, {
            score: botData.score,
          }).catch(() => {});
          return;
        }

        // Find a valid pair for the bot
        const pair = findValidPair(botData.cells);
        if (pair) {
          botData.cells[pair[0]].cleared = true;
          botData.cells[pair[1]].cleared = true;
          botData.score += 10;

          const clearedCount = botData.cells.filter((c) => c.cleared).length;

          // Check if bot cleared sheet!
          if (clearedCount >= 64) {
            botData.score += 100;
            if (currentRoom.mode === 'race') {
              // Bot won the round!
              const newRoundsWon = (bot.roundsWon || 0) + 1;
              const isMatchWon = newRoundsWon >= currentRoom.maxRounds;

              updatePlayerState(currentRoom.code, bot.id, {
                clearedCount: 64,
                score: botData.score,
                roundsWon: newRoundsWon,
              }).catch(() => {});

              updateRoomState(currentRoom.code, {
                status: isMatchWon ? 'match_over' : 'round_over',
                winnerId: bot.id,
                winnerName: bot.name,
              }).catch(() => {});
              return;
            } else {
              // Timed mode: bot gets a fresh sheet!
              botData.cells = generate8x8Sheet();
            }
          }

          updatePlayerState(currentRoom.code, bot.id, {
            clearedCount,
            score: botData.score,
          }).catch(() => {});
        }
      });
    }, 2200);

    return () => clearInterval(botInterval);
  }, [room?.status, room?.hostId, room?.code, currentUserId, players]);

  // 6. Heartbeat loop: disconnect detection and replacement with Medium Bot
  useEffect(() => {
    if (!room?.code || room?.status !== 'playing') return;

    // Update current user heartbeat every 6 seconds
    const heartbeat = setInterval(() => {
      if (currentUserIdRef.current && roomRef.current) {
        updatePlayerState(roomRef.current.code, currentUserIdRef.current, {
          lastActive: Date.now(),
        }).catch(() => {});
      }
    }, 6000);

    // Host checks for disconnected human players (> 20s inactive)
    const disconnectCheck = setInterval(() => {
      const isHost = roomRef.current?.hostId === currentUserIdRef.current;
      if (!isHost || !roomRef.current) return;

      const now = Date.now();
      playersRef.current.forEach((player) => {
        if (!player.isBot && player.id !== currentUserIdRef.current) {
          if (player.lastActive && now - player.lastActive > 22000) {
            // Human disconnected mid-game: Medium Bot takes over!
            replaceWithBot(roomRef.current!.code, player).catch(() => {});
          }
        }
      });
    }, 8000);

    return () => {
      clearInterval(heartbeat);
      clearInterval(disconnectCheck);
    };
  }, [room?.code, room?.status]);

  // 7. Handle Player Cell Tap
  const handleCellClick = (index: number) => {
    sound.unlockAudio();
    const cell = cells[index];
    if (!cell || cell.cleared || room?.status !== 'playing') return;

    // If already selected, deselect
    if (selectedIndices.includes(index)) {
      sound.playTap();
      setSelectedIndices([]);
      return;
    }

    // First pick
    if (selectedIndices.length === 0) {
      sound.playTap();
      setSelectedIndices([index]);
      setHintIndices([]);
      return;
    }

    // Second pick
    const firstIndex = selectedIndices[0];
    const firstCell = cells[firstIndex];

    // Test match
    if (isMatch(firstCell.value, cell.value)) {
      // SUCCESSFUL MATCH!
      sound.playMatch();
      sound.playFuse();

      // Trigger collection box bounce
      setIsBoxBouncing(true);
      setTimeout(() => setIsBoxBouncing(false), 450);

      const now = Date.now();
      const isCombo = lastMatchTimeRef.current > 0 && now - lastMatchTimeRef.current <= 3000;
      const nextStreak = isCombo ? comboStreak + 1 : 1;
      const streakBonus = Math.min(10, (nextStreak - 1) * 2);
      setComboStreak(nextStreak);
      lastMatchTimeRef.current = now;

      // Base pair points
      let pointsEarned = 10 + streakBonus;

      // Mark cells cleared
      const updatedCells = cells.map((c) =>
        c.id === firstIndex || c.id === index ? { ...c, cleared: true } : c
      );

      // Check if row 1 or row 2 was fully cleared
      const row1Cleared = isRowCleared(updatedCells, firstCell.row);
      const row2Cleared = isRowCleared(updatedCells, cell.row);

      if (row1Cleared) {
        pointsEarned += 25;
        sound.playRowCleared();
        setWavingRow(firstCell.row);
        setTimeout(() => setWavingRow(null), 800);
      }
      if (row2Cleared && cell.row !== firstCell.row) {
        pointsEarned += 25;
        sound.playRowCleared();
        setWavingRow(cell.row);
        setTimeout(() => setWavingRow(null), 800);
      }

      // Add to collection box
      setMatchedPairs((prev) => [
        ...prev,
        {
          id: `${firstIndex}_${index}_${now}`,
          num1: firstCell.value,
          num2: cell.value,
          timestamp: now,
        },
      ]);

      const clearedCount = updatedCells.filter((c) => c.cleared).length;
      const newScore = score + pointsEarned;
      setScore(newScore);
      setCells(updatedCells);
      setSelectedIndices([]);

      // Sync progress to Firebase
      if (room && currentUserId) {
        updatePlayerState(room.code, currentUserId, {
          clearedCount,
          score: newScore,
        }).catch(() => {});
      }

      // Check if entire sheet cleared!
      if (clearedCount >= 64) {
        sound.playSheetCleared();
        const timeElapsedSec = Math.floor((Date.now() - roundStartTimeRef.current) / 1000);
        const speedBonus = Math.max(0, 120 - timeElapsedSec) * 2;
        const finalScore = newScore + 100 + speedBonus;
        setScore(finalScore);

        if (room?.mode === 'race') {
          // Player won the round!
          const myPlayer = players.find((p) => p.id === currentUserId);
          const newRoundsWon = (myPlayer?.roundsWon || 0) + 1;
          const isMatchWon = newRoundsWon >= room.maxRounds;

          if (currentUserId && room) {
            updatePlayerState(room.code, currentUserId, {
              clearedCount: 64,
              score: finalScore,
              roundsWon: newRoundsWon,
            }).catch(() => {});

            updateRoomState(room.code, {
              status: isMatchWon ? 'match_over' : 'round_over',
              winnerId: currentUserId,
              winnerName: playerName,
            }).catch(() => {});
          }
        } else {
          // Timed Mode: Immediately receive a fresh new sheet!
          if (room && currentUserId) {
            updatePlayerState(room.code, currentUserId, {
              clearedCount: 64,
              score: finalScore,
            }).catch(() => {});
          }
          // Flash celebration then give new sheet
          setTimeout(() => {
            initSheet();
          }, 600);
        }
      }
    } else {
      // WRONG PAIR!
      sound.playWrong();
      setShakingIndices([firstIndex, index]);
      setComboStreak(0);
      const penalizedScore = Math.max(0, score - 2);
      setScore(penalizedScore);

      if (room && currentUserId) {
        updatePlayerState(room.code, currentUserId, {
          score: penalizedScore,
        }).catch(() => {});
      }

      setTimeout(() => {
        setShakingIndices([]);
        setSelectedIndices([]);
      }, 400);
    }
  };

  // 8. Hint Button Action
  const handleUseHint = () => {
    if (hintsRemaining <= 0) return;
    const pair = findValidPair(cells);
    if (pair) {
      setHintIndices([pair[0], pair[1]]);
      setHintsRemaining((prev) => prev - 1);
      setTimeout(() => {
        setHintIndices([]);
      }, 3000);
    }
  };

  // 9. Shuffle Button Action
  const handleUseShuffle = () => {
    if (shufflesRemaining <= 0) return;
    const shuffled = shuffleUncleared(cells);
    setCells(shuffled);
    setSelectedIndices([]);
    setHintIndices([]);
    setShufflesRemaining((prev) => prev - 1);
  };

  // 10. Room Lifecycle Actions
  const handleCreateRoom = async () => {
    setErrorMessage(null);
    setIsCreatingRoom(true);
    try {
      const { room: newRoom } = await createRoom(playerName, playerAvatar, 'race');
      setRoom(newRoom);
      sound.playPlayerJoined();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not create room.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (code: string) => {
    setErrorMessage(null);
    setIsJoiningRoom(true);
    try {
      const { room: joinedRoom } = await joinRoom(code, playerName, playerAvatar);
      setRoom(joinedRoom);
      sound.playPlayerJoined();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not join room.');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleLeaveRoom = () => {
    if (room && currentUserId) {
      removePlayerFromRoom(room.code, currentUserId).catch(() => {});
    }
    setRoom(null);
    setPlayers([]);
    setCells([]);
  };

  const handleStartGame = () => {
    if (!room) return;
    updateRoomState(room.code, {
      status: 'playing',
      round: 1,
      startTime: Date.now(),
    }).catch(() => {});
  };

  const handleNextRound = () => {
    if (!room) return;
    // Reset players' cleared counts for new round
    players.forEach((p) => {
      updatePlayerState(room.code, p.id, {
        clearedCount: 0,
      }).catch(() => {});
    });

    // Reset bot sheets
    botSheetsRef.current = {};

    updateRoomState(room.code, {
      status: 'playing',
      round: room.round + 1,
      winnerId: '',
      winnerName: '',
      startTime: Date.now(),
    }).catch(() => {});
  };

  const handlePlayAgain = () => {
    if (!room) return;
    // Reset scores & rounds won
    players.forEach((p) => {
      updatePlayerState(room.code, p.id, {
        score: 0,
        clearedCount: 0,
        roundsWon: 0,
      }).catch(() => {});
    });

    botSheetsRef.current = {};

    updateRoomState(room.code, {
      status: 'lobby',
      round: 1,
      winnerId: '',
      winnerName: '',
    }).catch(() => {});
  };

  const isHost = room?.hostId === currentUserId;

  return (
    <PhoneContainer>
      {/* Background Animated Floating Numbers */}
      <BackgroundFloatingNumbers />

      {/* Landscape Orientation Guard */}
      <LandscapeGuard />

      {/* Top Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Screen 1: Home View (No active room) */}
      {!room ? (
        <HomeScreen
          playerName={playerName}
          playerAvatar={playerAvatar}
          onUpdateProfile={handleUpdateProfile}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isCreating={isCreatingRoom}
          isJoining={isJoiningRoom}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenRules={() => setShowRules(true)}
        />
      ) : room.status === 'lobby' ? (
        /* Screen 2: Lobby View */
        <LobbyScreen
          room={room}
          players={players}
          currentUserId={currentUserId}
          isHost={isHost}
          onUpdateMode={(mode: GameMode) => {
            updateRoomState(room.code, {
              mode,
              maxRounds: mode === 'race' ? 3 : 1,
            }).catch(() => {});
          }}
          onAddBot={(difficulty: BotDifficulty) => {
            addBotToRoom(room.code, difficulty).catch(() => {});
          }}
          onRemovePlayer={(playerId: string) => {
            removePlayerFromRoom(room.code, playerId).catch(() => {});
          }}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        /* Screen 3: Live Game View (100dvh vertical stack) */
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative z-10">
          {/* 1. Top Bar (~8%) */}
          <TopBar
            mode={room.mode}
            round={room.round}
            maxRounds={room.maxRounds}
            timeRemaining={timeRemaining}
            score={score}
            comboStreak={comboStreak}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* 2. Players Strip (~10%) */}
          <PlayersStrip
            players={players}
            currentUserId={currentUserId}
            mode={room.mode}
          />

          {/* 3. My 8x8 Sheet (~55%) */}
          <GameBoard
            cells={cells}
            selectedIndices={selectedIndices}
            shakingIndices={shakingIndices}
            hintIndices={hintIndices}
            wavingRow={wavingRow}
            onCellClick={handleCellClick}
          />

          {/* 4. Collection Box (~12%) */}
          <CollectionBox
            matchedPairs={matchedPairs}
            isBouncing={isBoxBouncing}
          />

          {/* 5. Action Bar (~8%) */}
          <ActionBar
            hintsRemaining={hintsRemaining}
            shufflesRemaining={shufflesRemaining}
            onUseHint={handleUseHint}
            onUseShuffle={handleUseShuffle}
            disabled={room.status !== 'playing'}
          />

          {/* Overlay: Round Result */}
          {room.status === 'round_over' && (
            <RoundResultModal
              room={room}
              players={players}
              currentUserId={currentUserId}
              isHost={isHost}
              onNextRound={handleNextRound}
            />
          )}

          {/* Overlay: Match Result / Final Leaderboard */}
          {room.status === 'match_over' && (
            <MatchResultModal
              room={room}
              players={players}
              currentUserId={currentUserId}
              isHost={isHost}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
      )}
    </PhoneContainer>
  );
}
