import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import supabase from '../utils/supabase';
import { generatePuzzle, createEmptyNotes, createEmptyCurrentBoard } from '../utils/sudoku';
import type { Board, Difficulty, Notes, Player, CurrentBoard } from '../utils/sudoku';

export type GameMode = 'solo' | 'duo' | 'spectator';

interface RoomState {
  puzzle: Board;
  solution: Board;
  current: CurrentBoard;
  notes: Notes;
  difficulty: Difficulty;
  player: Player;
  playerCount: number;
}

interface RoomContextType {
  roomId: string | null;
  roomState: RoomState | null;
  playerName: string;
  loading: boolean;
  error: string | null;
  isDark: boolean;
  gameMode: GameMode;
  toggleDark: () => void;
  setGameMode: (mode: GameMode) => void;
  createRoom: (difficulty: Difficulty) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  updateRoom: (current: CurrentBoard, notes: Notes) => Promise<void>;
  setRoomState: (state: RoomState) => void;
  setPlayerName: (name: string) => void;
  leaveRoom: () => void;
  decrementPlayerCount: () => Promise<void>;
  markRoomFinished: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | null>(null);

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('duo');

  const toggleDark = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const createRoom = useCallback(
    async (difficulty: Difficulty) => {
      setLoading(true);
      setError(null);

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const { puzzle, solution } = generatePuzzle(difficulty);
      const current = createEmptyCurrentBoard();
      const notes = createEmptyNotes();
      const id = generateRoomCode();

      // Solo e duo criam sala no Supabase normalmente
      // Solo usa player_count: 1 mas aceita espectadores via realtime
      const { error: err } = await supabase.from('rooms').insert({
        id,
        puzzle,
        solution,
        current,
        notes: notes.map((row) => row.map((cell) => Array.from(cell))),
        difficulty,
        player_count: 1,
        finished: false,
      });

      if (err) {
        setError('Erro ao criar sala. Tente novamente.');
        setLoading(false);
        return;
      }

      setRoomId(id);
      setRoomState({
        puzzle,
        solution,
        current,
        notes,
        difficulty,
        player: 'creator',
        // Solo começa com playerCount 1 — timer inicia no primeiro clique, não ao atingir 2
        playerCount: gameMode === 'solo' ? 1 : 1,
      });
      setLoading(false);
    },
    [gameMode]
  );

  const joinRoom = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', code.toUpperCase())
        .single();

      if (err || !data) {
        setError('Sala não encontrada. Verifique o código.');
        setLoading(false);
        return;
      }

      if (data.finished) {
        setError('Esta sala já terminou. Crie uma nova!');
        setLoading(false);
        return;
      }

      const notes: Notes = (data.notes as number[][][]).map((row) =>
        row.map((cell) => new Set(cell))
      );

      if (gameMode === 'spectator') {
        // Espectador não incrementa player_count
        setRoomId(data.id);
        setRoomState({
          puzzle: data.puzzle,
          solution: data.solution,
          current: data.current,
          notes,
          difficulty: data.difficulty,
          player: 'spectator',
          playerCount: data.player_count,
        });
        setLoading(false);
        return;
      }

      if (data.player_count >= 2) {
        setError('Esta sala já está cheia. Crie uma nova!');
        setLoading(false);
        return;
      }

      await supabase.from('rooms').update({ player_count: 2 }).eq('id', code.toUpperCase());

      setRoomId(data.id);
      setRoomState({
        puzzle: data.puzzle,
        solution: data.solution,
        current: data.current,
        notes,
        difficulty: data.difficulty,
        player: 'joiner',
        playerCount: 2,
      });
      setLoading(false);
    },
    [gameMode]
  );

  const updateRoom = useCallback(
    async (current: CurrentBoard, notes: Notes) => {
      if (!roomId) return;
      await supabase
        .from('rooms')
        .update({
          current,
          notes: notes.map((row) => row.map((cell) => Array.from(cell))),
        })
        .eq('id', roomId);
    },
    [roomId]
  );

  const decrementPlayerCount = useCallback(async () => {
    if (!roomId || !roomState) return;
    if (roomState.player === 'spectator') return;
    const next = Math.max(0, roomState.playerCount - 1);
    await supabase.from('rooms').update({ player_count: next }).eq('id', roomId);
  }, [roomId, roomState]);

  const markRoomFinished = useCallback(async () => {
    if (!roomId) return;
    await supabase.from('rooms').update({ finished: true }).eq('id', roomId);
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    setRoomId(null);
    setRoomState(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const data = payload.new;
          const updatedNotes: Notes = (data.notes as number[][][]).map((row) =>
            row.map((cell) => new Set(cell))
          );
          setRoomState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              current: data.current,
              notes: updatedNotes,
              playerCount: data.player_count,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const value = useMemo(
    () => ({
      roomId,
      roomState,
      playerName,
      loading,
      error,
      isDark,
      gameMode,
      toggleDark,
      setGameMode,
      createRoom,
      joinRoom,
      updateRoom,
      setRoomState,
      setPlayerName,
      leaveRoom,
      decrementPlayerCount,
      markRoomFinished,
    }),
    [
      roomId,
      roomState,
      playerName,
      loading,
      error,
      isDark,
      gameMode,
      toggleDark,
      setGameMode,
      createRoom,
      joinRoom,
      updateRoom,
      leaveRoom,
      decrementPlayerCount,
      markRoomFinished,
    ]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoomContext deve ser usado dentro do RoomProvider');
  return context;
}
