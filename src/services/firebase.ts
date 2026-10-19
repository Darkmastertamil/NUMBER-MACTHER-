import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PlayerData, RoomData, GameMode, BotDifficulty } from '../types/game';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || localStorage.getItem('nmp_player_uid') || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous ?? true,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch {
    return true;
  }
}

// Generate or retrieve persistent guest UID
export function getPersistentUserId(): string {
  let uid = localStorage.getItem('nmp_player_uid');
  if (!uid) {
    uid = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    localStorage.setItem('nmp_player_uid', uid);
  }
  return uid;
}

// Ensure auth session (Google auth if signed in, or anonymous if enabled, or persistent guest UID)
export async function ensureAuth(): Promise<{ uid: string; displayName?: string | null }> {
  if (auth.currentUser) {
    return { uid: auth.currentUser.uid, displayName: auth.currentUser.displayName };
  }

  // Attempt anonymous sign in, but handle admin-restricted-operation gracefully
  try {
    const cred = await signInAnonymously(auth);
    if (cred.user) {
      return { uid: cred.user.uid, displayName: cred.user.displayName };
    }
  } catch {
    // Expected when Anonymous Auth is not enabled in Firebase Console.
    // Persistent guest session identifier is used smoothly.
  }

  return { uid: getPersistentUserId(), displayName: null };
}

// Optional Google Sign-In with popup
export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    if (res.user) {
      localStorage.setItem('nmp_player_uid', res.user.uid);
      return res.user;
    }
    return null;
  } catch (err) {
    console.warn('Google sign-in error:', err);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch {}
}

// Generate 5-character alphanumeric room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 5; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// Create a Room
export async function createRoom(
  hostName: string,
  hostAvatar: string,
  mode: GameMode = 'race'
): Promise<{ room: RoomData; player: PlayerData }> {
  const user = await ensureAuth();
  const roomCode = generateRoomCode();
  const roomRef = doc(db, 'rooms', roomCode);

  const roomData: RoomData = {
    id: roomCode,
    code: roomCode,
    hostId: user.uid,
    mode,
    status: 'lobby',
    round: 1,
    maxRounds: mode === 'race' ? 3 : 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const playerData: PlayerData = {
    id: user.uid,
    name: hostName || 'Player 1',
    avatar: hostAvatar || '🐰',
    isBot: false,
    botDifficulty: 'none',
    score: 0,
    clearedCount: 0,
    roundsWon: 0,
    isHost: true,
    active: true,
    lastActive: Date.now(),
  };

  try {
    await setDoc(roomRef, roomData);
    const playerRef = doc(db, 'rooms', roomCode, 'players', user.uid);
    await setDoc(playerRef, playerData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rooms/${roomCode}`);
  }

  return { room: roomData, player: playerData };
}

// Join a Room
export async function joinRoom(
  code: string,
  playerName: string,
  playerAvatar: string
): Promise<{ room: RoomData; player: PlayerData }> {
  const user = await ensureAuth();
  const roomCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', roomCode);

  let roomSnap;
  try {
    roomSnap = await getDoc(roomRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `rooms/${roomCode}`);
  }

  if (!roomSnap || !roomSnap.exists()) {
    throw new Error('Room not found. Check the 5-character code and try again.');
  }

  const roomData = roomSnap.data() as RoomData;
  if (roomData.status !== 'lobby') {
    throw new Error('This match has already started! You can join the next one.');
  }

  const playersCol = collection(db, 'rooms', roomCode, 'players');
  let playersSnap;
  try {
    playersSnap = await getDocs(playersCol);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `rooms/${roomCode}/players`);
  }

  if (playersSnap && playersSnap.size >= 6) {
    throw new Error('This room is full (max 6 players).');
  }

  const playerData: PlayerData = {
    id: user.uid,
    name: playerName || `Player ${playersSnap ? playersSnap.size + 1 : 2}`,
    avatar: playerAvatar || '🐱',
    isBot: false,
    botDifficulty: 'none',
    score: 0,
    clearedCount: 0,
    roundsWon: 0,
    isHost: user.uid === roomData.hostId,
    active: true,
    lastActive: Date.now(),
  };

  try {
    const playerRef = doc(db, 'rooms', roomCode, 'players', user.uid);
    await setDoc(playerRef, playerData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rooms/${roomCode}/players/${user.uid}`);
  }

  return { room: roomData, player: playerData };
}

// Add Bot to Room
export async function addBotToRoom(roomCode: string, difficulty: BotDifficulty = 'medium'): Promise<void> {
  const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const botNames: Record<BotDifficulty, string[]> = {
    easy: ['Pip', 'Beep', 'Tink', 'Boba'],
    medium: ['Gizmo', 'Pixel', 'Sprout', 'Echo'],
    hard: ['Turbo', 'Apex', 'Nova', 'Titan'],
    none: ['Bot'],
  };
  const names = botNames[difficulty] || botNames.medium;
  const name = `${names[Math.floor(Math.random() * names.length)]}`;

  const botPlayer: PlayerData = {
    id: botId,
    name: `${name} (Bot)`,
    avatar: '🤖',
    isBot: true,
    botDifficulty: difficulty,
    score: 0,
    clearedCount: 0,
    roundsWon: 0,
    isHost: false,
    active: true,
    lastActive: Date.now(),
  };

  try {
    const playerRef = doc(db, 'rooms', roomCode, 'players', botId);
    await setDoc(playerRef, botPlayer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rooms/${roomCode}/players/${botId}`);
  }
}

// Remove Bot or Player
export async function removePlayerFromRoom(roomCode: string, playerId: string): Promise<void> {
  try {
    const playerRef = doc(db, 'rooms', roomCode, 'players', playerId);
    await deleteDoc(playerRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `rooms/${roomCode}/players/${playerId}`);
  }
}

// Update Room Settings (Mode, Status, Round, etc.)
export async function updateRoomState(roomCode: string, updates: Partial<RoomData>): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomCode);
    await updateDoc(roomRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}`);
  }
}

// Update Player State (Progress, Score, Rounds won, etc.)
export async function updatePlayerState(
  roomCode: string,
  playerId: string,
  updates: Partial<PlayerData>
): Promise<void> {
  try {
    const playerRef = doc(db, 'rooms', roomCode, 'players', playerId);
    await updateDoc(playerRef, {
      ...updates,
      lastActive: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}/players/${playerId}`);
  }
}

// Replace Human Player with Bot (if human disconnects mid-game)
export async function replaceWithBot(roomCode: string, player: PlayerData): Promise<void> {
  try {
    const playerRef = doc(db, 'rooms', roomCode, 'players', player.id);
    await updateDoc(playerRef, {
      name: `${player.name} (Bot)`,
      avatar: '🤖',
      isBot: true,
      botDifficulty: 'medium',
      lastActive: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomCode}/players/${player.id}`);
  }
}

// Subscribe to Room Document
export function subscribeToRoom(roomCode: string, onUpdate: (room: RoomData | null) => void): () => void {
  const roomRef = doc(db, 'rooms', roomCode);
  return onSnapshot(
    roomRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as RoomData);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomCode}`);
    }
  );
}

// Subscribe to Room Players
export function subscribeToPlayers(roomCode: string, onUpdate: (players: PlayerData[]) => void): () => void {
  const playersCol = collection(db, 'rooms', roomCode, 'players');
  return onSnapshot(
    playersCol,
    (snap) => {
      const players: PlayerData[] = [];
      snap.forEach((docSnap) => {
        players.push(docSnap.data() as PlayerData);
      });
      onUpdate(players);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `rooms/${roomCode}/players`);
    }
  );
}
