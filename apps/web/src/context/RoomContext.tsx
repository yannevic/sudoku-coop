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
  createRoom: (difficulty: Difficulty) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  updateRoom: (current: CurrentBoard, notes: Notes) => Promise<void>;
  setRoomState: (state: RoomState) => void;
  setPlayerName: (name: string) => void;
  leaveRoom: () => void;
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

  const createRoom = useCallback(async (difficulty: Difficulty) => {
    setLoading(true);
    setError(null);

    const { puzzle, solution } = generatePuzzle(difficulty);
    const current = createEmptyCurrentBoard();
    const notes = createEmptyNotes();
    const id = generateRoomCode();

    const { error: err } = await supabase.from('rooms').insert({
      id,
      puzzle,
      solution,
      current,
      notes: notes.map((row) => row.map((cell) => Array.from(cell))),
      difficulty,
      player_count: 1,
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
      playerCount: 1,
    });
    setLoading(false);
  }, []);

  const joinRoom = useCallback(async (code: string) => {
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

    const notes: Notes = (data.notes as number[][][]).map((row) =>
      row.map((cell) => new Set(cell))
    );

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
  }, []);

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
      createRoom,
      joinRoom,
      updateRoom,
      setRoomState,
      setPlayerName,
      leaveRoom,
    }),
    [roomId, roomState, playerName, loading, error, createRoom, joinRoom, updateRoom, leaveRoom]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoomContext deve ser usado dentro do RoomProvider');
  return context;
}
