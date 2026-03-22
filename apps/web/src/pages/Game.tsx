import { Copy, Check, Timer, Play } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SudokuBoard from '../components/SudokuBoard';
import ChatWindow from '../components/ChatWindow';
import VictoryModal from '../components/VictoryModal';
import LeaderboardModal from '../components/LeaderboardModal';
import { useRoomContext } from '../context/RoomContext';
import useChat from '../hooks/useChat';
import useTimer from '../hooks/useTimer';
import type { CurrentBoard, Notes } from '../utils/sudoku';

function isBoardComplete(current: CurrentBoard, solution: (number | null)[][]): boolean {
  return current.every((row, r) =>
    row.every((cell, c) => cell !== null && cell.value === solution[r][c])
  );
}

export default function Game() {
  const navigate = useNavigate();
  const { roomId, roomState, playerName, updateRoom, setRoomState, leaveRoom } = useRoomContext();
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [joinerName, setJoinerName] = useState('');

  const player = roomState?.player ?? null;
  const playerCount = roomState?.playerCount ?? 1;

  const { messages, sendMessage, sendSystemMessage, announceJoin, unreadCount, setIsOpen } =
    useChat(roomId, player, playerName);

  const { seconds, formatted, isRunning, unlockedSolo, unlockSolo } = useTimer(playerCount >= 2);

  const hasAnnouncedRef = useRef(false);
  const victoryCheckedRef = useRef(false);

  useEffect(() => {
    if (!roomId) navigate('/');
  }, [roomId, navigate]);

  useEffect(() => {
    if (!roomState || hasAnnouncedRef.current) return;
    hasAnnouncedRef.current = true;
    announceJoin();
  }, [roomState, announceJoin]);

  // Detecta nome do joiner via mensagens de sistema
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.type === 'system' && msg.text.includes('entrou na sala') && player === 'creator') {
        const match = msg.text.match(/🎮 (.+) entrou na sala!/);
        if (match) setJoinerName(match[1]);
      }
    });
  }, [messages, player]);

  // Detecta vitória
  useEffect(() => {
    if (!roomState || showVictory || victoryCheckedRef.current) return;
    if (isBoardComplete(roomState.current, roomState.solution)) {
      victoryCheckedRef.current = true;
      setShowVictory(true);
    }
  }, [roomState, showVictory]);

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
  const waitingForPlayer = playerCount < 2 && !unlockedSolo;

  const creatorName = player === 'creator' ? displayName : joinerName;
  const joinerDisplayName = player === 'joiner' ? displayName : joinerName;

  const handlePlayAgain = () => {
    setShowVictory(false);
    leaveRoom();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#fce4f3] flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold text-[#f37eb9]">Sudoku Coop 🌸</h1>

      {/* Barra superior */}
      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm flex-wrap justify-center">
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
          className="text-gray-400 hover:text-[#9b5fa5] transition-colors"
          title="Copiar código"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={`flex items-center gap-2 px-5 py-2 rounded-2xl shadow-sm transition-colors ${
            isRunning ? 'bg-white' : 'bg-white border border-dashed border-[#e9b8d9]'
          }`}
        >
          <Timer size={16} className={isRunning ? 'text-[#f37eb9]' : 'text-[#d4a8c7]'} />
          <span
            className={`font-mono text-2xl font-bold tracking-widest transition-colors ${
              isRunning ? 'text-[#9b5fa5]' : 'text-[#d4a8c7]'
            }`}
          >
            {formatted}
          </span>
        </div>

        {waitingForPlayer && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-[#c9a0d0]">⏸️ Aguardando segundo jogador...</span>
            <button
              type="button"
              onClick={unlockSolo}
              className="flex items-center gap-1 text-[11px] text-[#9b5fa5] hover:text-[#7a4a84] font-medium transition-colors underline underline-offset-2"
            >
              <Play size={10} />
              jogar sozinho
            </button>
          </div>
        )}
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

      {showVictory && (
        <VictoryModal
          timeSeconds={seconds}
          difficulty={roomState.difficulty}
          creatorName={creatorName}
          joinerName={joinerDisplayName}
          onPlayAgain={handlePlayAgain}
          onShowLeaderboard={() => {
            setShowVictory(false);
            setShowLeaderboard(true);
          }}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          initialDifficulty={roomState.difficulty}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
