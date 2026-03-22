import { Copy, Check } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SudokuBoard from '../components/SudokuBoard';
import ChatWindow from '../components/ChatWindow';
import { useRoomContext } from '../context/RoomContext';
import useChat from '../hooks/useChat';
import type { CurrentBoard, Notes } from '../utils/sudoku';

export default function Game() {
  const navigate = useNavigate();
  const { roomId, roomState, playerName, updateRoom, setRoomState, leaveRoom } = useRoomContext();
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const player = roomState?.player ?? null;
  const { messages, sendMessage, sendSystemMessage, announceJoin, unreadCount, setIsOpen } =
    useChat(roomId, player, playerName);

  const hasAnnouncedRef = useRef(false);

  useEffect(() => {
    if (!roomId) navigate('/');
  }, [roomId, navigate]);

  // Anuncia entrada na sala uma única vez via broadcast (todos recebem, inclusive o creator)
  useEffect(() => {
    if (!roomState || hasAnnouncedRef.current) return;
    hasAnnouncedRef.current = true;
    announceJoin();
  }, [roomState, announceJoin]);

  const handleSelect = (row: number, col: number) => {
    setSelected([row, col]);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsNoteMode((prev) => !prev);
        return;
      }

      if (!selected || !roomState) return;
      const [r, c] = selected;
      if (roomState.puzzle[r][c] !== null) return;

      const num = parseInt(e.key, 10);

      if (num >= 1 && num <= 9) {
        if (isNoteMode) {
          const nextNotes: Notes = roomState.notes.map((row) => row.map((cell) => new Set(cell)));
          if (nextNotes[r][c].has(num)) {
            nextNotes[r][c].delete(num);
          } else {
            nextNotes[r][c].add(num);
          }
          setRoomState({ ...roomState, notes: nextNotes });
          updateRoom(roomState.current, nextNotes);
        } else {
          const nextCurrent: CurrentBoard = roomState.current.map((row) =>
            row.map((cell) => (cell ? { ...cell } : null))
          );
          nextCurrent[r][c] = { value: num, player: roomState.player };
          const nextNotes: Notes = roomState.notes.map((row) => row.map((cell) => new Set(cell)));
          nextNotes[r][c].clear();
          setRoomState({ ...roomState, current: nextCurrent, notes: nextNotes });
          updateRoom(nextCurrent, nextNotes);
        }
      }

      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        const nextCurrent: CurrentBoard = roomState.current.map((row) =>
          row.map((cell) => (cell ? { ...cell } : null))
        );
        nextCurrent[r][c] = null;
        const nextNotes: Notes = roomState.notes.map((row) => row.map((cell) => new Set(cell)));
        nextNotes[r][c].clear();
        setRoomState({ ...roomState, current: nextCurrent, notes: nextNotes });
        updateRoom(nextCurrent, nextNotes);
      }
    },
    [selected, roomState, isNoteMode, updateRoom, setRoomState]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!roomState) return null;

  const displayName = playerName.trim() || 'Anônimo';

  return (
    <div className="min-h-screen bg-[#fce4f3] flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold text-[#f37eb9]">Sudoku Coop 🌸</h1>

      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm">
        <span className="text-gray-500 text-sm">
          Jogando como{' '}
          <span
            className={`font-bold ${
              roomState.player === 'creator' ? 'text-[#f37eb9]' : 'text-[#22a5e0]'
            }`}
          >
            {displayName}
          </span>
        </span>
        <div className="w-px h-4 bg-[#e9b8d9]" />
        <span className="text-gray-600 text-sm font-semibold">Sala:</span>
        <span className="text-[#9b5fa5] font-bold tracking-widest text-lg">{roomId}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(roomId ?? '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-gray-400 hover:text-[#9b5fa5] transition-colors ml-1"
          title="Copiar código"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      <SudokuBoard
        puzzle={roomState.puzzle}
        current={roomState.current}
        solution={roomState.solution}
        selected={selected}
        notes={roomState.notes}
        isNoteMode={isNoteMode}
        onSelect={handleSelect}
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsNoteMode((prev) => !prev)}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
            isNoteMode
              ? 'bg-[#9b5fa5] text-white'
              : 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]'
          }`}
        >
          ✏️ {isNoteMode ? 'Lápis ativado' : 'Lápis'}{' '}
          <span className="text-xs opacity-70">(Tab)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sendSystemMessage(`👋 ${displayName} saiu da sala.`);
            leaveRoom();
            navigate('/');
          }}
          className="px-6 py-2 bg-[#9b5fa5] text-white rounded-xl hover:bg-[#7a4a84] transition-colors"
        >
          Sair da sala
        </button>
      </div>

      <ChatWindow
        messages={messages}
        unreadCount={unreadCount}
        player={roomState.player}
        onSend={sendMessage}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}
