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

function isBoardComplete(
  current: CurrentBoard,
  solution: (number | null)[][],
  puzzle: (number | null)[][]
): boolean {
  return current.every((row, r) =>
    row.every((cell, c) => {
      if (puzzle[r][c] !== null) return true;
      return cell !== null && cell.value === solution[r][c];
    })
  );
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 4,
    size: 20 + Math.random() * 20,
  }));
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
  const isExtreme = roomState?.difficulty === 'extreme';

  const { messages, sendMessage, sendSystemMessage, announceJoin, unreadCount, setIsOpen } =
    useChat(roomId, player, playerName, (name) => setJoinerName(name));

  const { seconds, formatted, isRunning, unlockedSolo, unlockSolo } = useTimer(
    playerCount >= 2,
    showVictory
  );

  const hasAnnouncedRef = useRef(false);
  const showVictoryRef = useRef(false);
  const particles = useRef(generateParticles()).current;

  useEffect(() => {
    if (!roomId) navigate('/');
  }, [roomId, navigate]);

  useEffect(() => {
    if (!roomState || hasAnnouncedRef.current) return;
    hasAnnouncedRef.current = true;
    announceJoin();
  }, [roomState, announceJoin]);

  useEffect(() => {
    if (!roomState || showVictoryRef.current) return;
    if (isBoardComplete(roomState.current, roomState.solution, roomState.puzzle)) {
      showVictoryRef.current = true;
      setShowVictory(true);
    }
  }, [roomState]);

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
  const creatorName = player === 'creator' ? displayName : joinerName || 'Anônimo';
  const joinerDisplayName = player === 'joiner' ? displayName : joinerName;

  const resetAndLeave = () => {
    setShowVictory(false);
    setShowLeaderboard(false);
    showVictoryRef.current = false;
    hasAnnouncedRef.current = false;
    leaveRoom();
    navigate('/');
  };

  const handleLeave = resetAndLeave;

  function getPlayerNameColor(p: 'creator' | 'joiner', extreme: boolean): string {
    if (p === 'creator') return extreme ? 'text-[#f87171]' : 'text-[#f37eb9]';
    return extreme ? 'text-[#fb923c]' : 'text-[#22a5e0]';
  }

  function getTimerBg(running: boolean, extreme: boolean): string {
    if (running && extreme) return 'bg-[#111111] border border-[#dc2626]/30';
    if (running) return 'bg-white';
    if (extreme) return 'bg-[#111111] border border-dashed border-[#dc2626]/20';
    return 'bg-white border border-dashed border-[#e9b8d9]';
  }

  // ─── Tema ──────────────────────────────────────────────────────────────
  const bg = isExtreme ? 'bg-[#0a0a0a]' : 'bg-[#fce4f3]';
  const titleColor = isExtreme ? 'text-[#ef4444]' : 'text-[#f37eb9]';
  const barBg = isExtreme ? 'bg-[#111111] border border-[#dc2626]/30' : 'bg-white';
  const roomCodeColor = isExtreme ? 'text-[#f97316]' : 'text-[#9b5fa5]';
  const labelColor = isExtreme ? 'text-[#9a3030]' : 'text-gray-600';
  const timerRunColor = isExtreme ? 'text-[#ef4444]' : 'text-[#9b5fa5]';
  const timerPauseColor = isExtreme ? 'text-[#4a1515]' : 'text-[#d4a8c7]';
  const timerIconColor = isExtreme ? 'text-[#dc2626]' : 'text-[#f37eb9]';
  const timerPauseIconColor = isExtreme ? 'text-[#4a1515]' : 'text-[#d4a8c7]';
  const waitingColor = isExtreme ? 'text-[#6b2121]' : 'text-[#c9a0d0]';
  const soloColor = isExtreme
    ? 'text-[#ef4444] hover:text-[#dc2626]'
    : 'text-[#9b5fa5] hover:text-[#7a4a84]';
  const noteActiveStyle = isExtreme ? 'bg-[#dc2626] text-white' : 'bg-[#9b5fa5] text-white';
  const noteInactiveStyle = isExtreme
    ? 'bg-[#1a1a1a] text-[#ef4444] border border-[#dc2626]/40 hover:bg-[#2a2a2a]'
    : 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]';
  const leaveStyle = isExtreme
    ? 'bg-[#7f1d1d] text-white hover:bg-[#991b1b]'
    : 'bg-[#9b5fa5] text-white hover:bg-[#7a4a84]';

  return (
    <div
      className={`min-h-screen ${bg} flex flex-col items-center justify-center gap-4 sm:gap-6 p-3 sm:p-4 relative overflow-hidden transition-colors duration-500`}
    >
      {/* Partículas de chama no modo extremo */}
      {isExtreme && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <style>{`
            @keyframes float-up {
              0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
              80%  { opacity: 0.7; }
              100% { transform: translateY(-100vh) scale(0.5) rotate(15deg); opacity: 0; }
            }
          `}</style>
          {particles.map((p) => (
            <span
              key={p.id}
              style={{
                position: 'fixed',
                left: `${p.left}%`,
                bottom: '0px',
                fontSize: p.size,
                animation: `float-up ${p.duration}s ${p.delay}s ease-out infinite`,
                pointerEvents: 'none',
                zIndex: 1,
                willChange: 'transform',
              }}
            >
              🔥
            </span>
          ))}
        </div>
      )}

      <h1 className={`text-2xl sm:text-3xl font-bold ${titleColor} relative z-10`}>
        {isExtreme ? '💀 Sudoku Extremo' : 'Sudoku Coop 🌸'}
      </h1>

      {/* Barra superior */}
      <div
        className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 ${barBg} rounded-xl px-3 sm:px-4 py-2 shadow-sm w-full sm:w-auto relative z-10`}
      >
        <span className={`text-xs sm:text-sm ${labelColor}`}>
          Jogando como{' '}
          <span className={`font-bold ${getPlayerNameColor(roomState.player, isExtreme)}`}>
            {displayName}
          </span>
        </span>
        <div
          className={`hidden sm:block w-px h-4 ${isExtreme ? 'bg-[#dc2626]/30' : 'bg-[#e9b8d9]'}`}
        />
        <div className="flex items-center gap-2">
          <span className={`text-xs sm:text-sm font-semibold ${labelColor}`}>Sala:</span>
          <span className={`font-bold tracking-widest text-base sm:text-lg ${roomCodeColor}`}>
            {roomId}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(roomId ?? '');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`transition-colors ${isExtreme ? 'text-[#6b2121] hover:text-[#ef4444]' : 'text-gray-400 hover:text-[#9b5fa5]'}`}
            title="Copiar código"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-1 relative z-10">
        <div
          className={`flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-2xl shadow-sm transition-colors ${getTimerBg(isRunning, isExtreme)}`}
        >
          <Timer size={14} className={isRunning ? timerIconColor : timerPauseIconColor} />
          <span
            className={`font-mono text-xl sm:text-2xl font-bold tracking-widest transition-colors ${
              isRunning ? timerRunColor : timerPauseColor
            }`}
          >
            {formatted}
          </span>
        </div>

        {waitingForPlayer && (
          <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
            <span className={`text-[10px] sm:text-[11px] ${waitingColor}`}>
              ⏸️ Aguardando segundo jogador...
            </span>
            <button
              type="button"
              onClick={unlockSolo}
              className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors underline underline-offset-2 ${soloColor}`}
            >
              <Play size={10} />
              jogar sozinho
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <SudokuBoard
          puzzle={roomState.puzzle}
          current={roomState.current}
          solution={roomState.solution}
          selected={selected}
          notes={roomState.notes}
          isNoteMode={isNoteMode}
          isExtreme={isExtreme}
          onSelect={handleSelect}
        />
      </div>

      {/* Teclado numérico mobile */}
      <div className="grid grid-cols-9 gap-1 w-full max-w-[288px] sm:hidden relative z-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => {
              if (!selected || !roomState) return;
              const [r, c] = selected;
              if (roomState.puzzle[r][c] !== null) return;
              if (isNoteMode) {
                const nextNotes: Notes = roomState.notes.map((row) =>
                  row.map((cell) => new Set(cell))
                );
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
                const nextNotes: Notes = roomState.notes.map((row) =>
                  row.map((cell) => new Set(cell))
                );
                nextNotes[r][c].clear();
                setRoomState({ ...roomState, current: nextCurrent, notes: nextNotes });
                updateRoom(nextCurrent, nextNotes);
              }
            }}
            className={`h-8 rounded text-sm font-bold transition-colors ${
              isExtreme
                ? 'bg-[#1a1a1a] text-[#ef4444] border border-[#dc2626]/40 active:bg-[#dc2626] active:text-white'
                : 'bg-white text-[#9b5fa5] border border-[#e9b8d9] active:bg-[#f37eb9] active:text-white'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Botão apagar mobile */}
      <button
        type="button"
        onClick={() => {
          if (!selected || !roomState) return;
          const [r, c] = selected;
          if (roomState.puzzle[r][c] !== null) return;
          const nextCurrent: CurrentBoard = roomState.current.map((row) =>
            row.map((cell) => (cell ? { ...cell } : null))
          );
          nextCurrent[r][c] = null;
          const nextNotes: Notes = roomState.notes.map((row) => row.map((cell) => new Set(cell)));
          nextNotes[r][c].clear();
          setRoomState({ ...roomState, current: nextCurrent, notes: nextNotes });
          updateRoom(nextCurrent, nextNotes);
        }}
        className={`sm:hidden w-full max-w-[288px] py-1.5 rounded text-xs font-medium transition-colors relative z-10 ${
          isExtreme
            ? 'bg-[#1a1a1a] text-[#9a3030] border border-[#dc2626]/20'
            : 'bg-white text-gray-400 border border-[#e9b8d9]'
        }`}
      >
        ⌫ Apagar
      </button>

      <div className="flex gap-2 sm:gap-3 flex-wrap justify-center relative z-10">
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => {
              const completedCurrent: CurrentBoard = roomState.solution.map((row, r) =>
                row.map((cell, c) => {
                  if (roomState.puzzle[r][c] !== null) return null;
                  return { value: cell as number, player: roomState.player };
                })
              );
              setRoomState({ ...roomState, current: completedCurrent });
              updateRoom(completedCurrent, roomState.notes);
            }}
            className="px-3 sm:px-4 py-2 rounded text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200 transition-colors"
          >
            🧪 Completar
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsNoteMode((prev) => !prev)}
          className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 ${
            isNoteMode ? noteActiveStyle : noteInactiveStyle
          }`}
        >
          ✏️ {isNoteMode ? 'Lápis ativado' : 'Lápis'}{' '}
          <span className="text-xs opacity-70 hidden sm:inline">(Tab)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sendSystemMessage(`👋 ${displayName} saiu da sala.`);
            handleLeave();
          }}
          className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm transition-colors ${leaveStyle}`}
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
          isCreator={player === 'creator'}
          onLeave={handleLeave}
          onShowLeaderboard={() => {
            setShowVictory(false);
            setShowLeaderboard(true);
          }}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          initialDifficulty={roomState.difficulty}
          onClose={handleLeave}
          onBack={() => {
            setShowLeaderboard(false);
            setShowVictory(true);
          }}
        />
      )}
    </div>
  );
}
