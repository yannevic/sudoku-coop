import { Copy, Check, Timer, Play, Moon, Sun } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SudokuBoard from '../components/SudokuBoard';
import ChatWindow from '../components/ChatWindow';
import VictoryModal from '../components/VictoryModal';
import LeaderboardModal from '../components/LeaderboardModal';
import { useRoomContext } from '../context/RoomContext';
import useChat from '../hooks/useChat';
import useTimer from '../hooks/useTimer';
import usePresence from '../hooks/usePresence';
import type { CurrentBoard, Notes } from '../utils/sudoku';
import type { LeaderboardMode } from '../utils/leaderboard';

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

function isCellLocked(
  current: CurrentBoard,
  solution: (number | null)[][],
  puzzle: (number | null)[][],
  r: number,
  c: number
): boolean {
  if (puzzle[r][c] !== null) return true;
  const cell = current[r][c];
  return cell !== null && cell.value === solution[r][c];
}

function clearNotesForCorrectCell(notes: Notes, r: number, c: number, num: number): Notes {
  const next: Notes = notes.map((row) => row.map((cell) => new Set(cell)));
  const boxR = Math.floor(r / 3) * 3;
  const boxC = Math.floor(c / 3) * 3;
  for (let i = 0; i < 9; i += 1) {
    next[r][i].delete(num);
    next[i][c].delete(num);
  }
  for (let dr = 0; dr < 3; dr += 1) {
    for (let dc = 0; dc < 3; dc += 1) {
      next[boxR + dr][boxC + dc].delete(num);
    }
  }
  return next;
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

function getPlayerNameColor(p: 'creator' | 'joiner' | 'spectator', extreme: boolean): string {
  if (p === 'creator') return extreme ? 'text-[#f87171]' : 'text-[#f37eb9]';
  if (p === 'spectator') return 'text-gray-400';
  return extreme ? 'text-[#fb923c]' : 'text-[#22a5e0]';
}

function getBg(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'bg-[#0a0a0a]';
  if (isDark) return 'bg-[#1a1a2e]';
  return 'bg-[#fce4f3]';
}

function getBarBg(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'bg-[#111111] border border-[#dc2626]/30';
  if (isDark) return 'bg-[#16213e] border border-[#2a2a4a]';
  return 'bg-white';
}

function getTimerBg(running: boolean, isExtreme: boolean, isDark: boolean): string {
  if (running && isExtreme) return 'bg-[#111111] border border-[#dc2626]/30';
  if (running && isDark) return 'bg-[#16213e] border border-[#2a2a4a]';
  if (running) return 'bg-white';
  if (isExtreme) return 'bg-[#111111] border border-dashed border-[#dc2626]/20';
  if (isDark) return 'bg-[#16213e] border border-dashed border-[#2a2a4a]';
  return 'bg-white border border-dashed border-[#e9b8d9]';
}

function getRoomCodeColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'text-[#f97316]';
  if (isDark) return 'text-[#f37eb9]';
  return 'text-[#9b5fa5]';
}

function getLabelColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'text-[#9a3030]';
  if (isDark) return 'text-[#aaaacc]';
  return 'text-gray-600';
}

function getTimerRunColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'text-[#ef4444]';
  if (isDark) return 'text-[#f37eb9]';
  return 'text-[#9b5fa5]';
}

function getTimerPauseColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'text-[#4a1515]';
  if (isDark) return 'text-[#2a2a4a]';
  return 'text-[#d4a8c7]';
}

function getTimerPauseIconColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'text-[#4a1515]';
  if (isDark) return 'text-[#2a2a4a]';
  return 'text-[#d4a8c7]';
}

function getWaitingColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'text-[#6b2121]';
  if (isDark) return 'text-[#44446a]';
  return 'text-[#c9a0d0]';
}

function getSoloUnlockColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'text-[#ef4444] hover:text-[#dc2626]';
  if (isDark) return 'text-[#f37eb9] hover:text-[#e06aa5]';
  return 'text-[#9b5fa5] hover:text-[#7a4a84]';
}

function getNoteInactiveStyle(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'bg-[#1a1a1a] text-[#ef4444] border border-[#dc2626]/40 hover:bg-[#2a2a2a]';
  if (isDark) return 'bg-[#16213e] text-[#aaaacc] border border-[#2a2a4a] hover:bg-[#1e2a4a]';
  return 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]';
}

function getBarDividerColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'bg-[#dc2626]/30';
  if (isDark) return 'bg-[#2a2a4a]';
  return 'bg-[#e9b8d9]';
}

function getCopyButtonColor(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'text-[#6b2121] hover:text-[#ef4444]';
  if (isDark) return 'text-[#44446a] hover:text-[#f37eb9]';
  return 'text-gray-400 hover:text-[#9b5fa5]';
}

function getMobileNumButtonStyle(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme)
    return 'bg-[#1a1a1a] text-[#ef4444] border border-[#dc2626]/40 active:bg-[#dc2626] active:text-white';
  if (isDark)
    return 'bg-[#16213e] text-[#f37eb9] border border-[#2a2a4a] active:bg-[#f37eb9] active:text-white';
  return 'bg-white text-[#9b5fa5] border border-[#e9b8d9] active:bg-[#f37eb9] active:text-white';
}

function getErrorCountColor(errorCount: number, isExtreme: boolean, isDark: boolean): string {
  if (errorCount > 0 && isExtreme) return 'text-[#ef4444]';
  if (errorCount > 0) return 'text-red-400';
  return getLabelColor(isExtreme, isDark);
}

function getMobileDeleteStyle(isExtreme: boolean, isDark: boolean): string {
  if (isExtreme) return 'bg-[#1a1a1a] text-[#9a3030] border border-[#dc2626]/20';
  if (isDark) return 'bg-[#16213e] text-[#44446a] border border-[#2a2a4a]';
  return 'bg-white text-gray-400 border border-[#e9b8d9]';
}

function getLeaderboardMode(daily: boolean, solo: boolean): LeaderboardMode {
  if (daily) return 'daily';
  if (solo) return 'solo';
  return 'duo';
}

function getTitleColor(extreme: boolean, daily: boolean): string {
  if (extreme) return 'text-[#ef4444]';
  if (daily) return 'text-[#f97316]';
  return 'text-[#f37eb9]';
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
  extreme: '💀 Extremo',
};

function getTitle(
  isExtreme: boolean,
  isSoloLike: boolean,
  isSpectator: boolean,
  isDaily: boolean
): string {
  if (isExtreme) return '💀 Sudoku Extremo';
  if (isDaily) return 'Daily Puzzle ☀️';
  if (isSoloLike) return 'Sudoku Solo 🧍‍♂️';
  if (isSpectator) return 'Sudoku Coop 👁️';
  return 'Sudoku Coop 🌸';
}

export default function Game() {
  const navigate = useNavigate();
  const {
    roomId,
    roomState,
    playerName,
    updateRoom,
    setRoomState,
    leaveRoom,
    isDark,
    toggleDark,
    decrementPlayerCount,
    markRoomFinished,
    gameMode,
  } = useRoomContext();
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [joinerName, setJoinerName] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const [opponentName, setOpponentName] = useState('');
  const [syncedSeconds, setSyncedSeconds] = useState<number | undefined>(undefined);

  const isSolo = gameMode === 'solo';
  const isDaily = gameMode === 'daily';
  const isSpectator = gameMode === 'spectator';
  const isDuo = gameMode === 'duo';
  const isSoloLike = isSolo || isDaily;

  const player = roomState?.player ?? null;
  const playerCount = roomState?.playerCount ?? 1;
  const isExtreme = roomState?.difficulty === 'extreme';

  const { messages, sendMessage, sendSystemMessage, announceJoin, unreadCount, setIsOpen } =
    useChat(roomId, player, playerName, (name) => setJoinerName(name));

  const {
    opponentSelected,
    spectators,
    broadcastSelection,
    broadcastName,
    broadcastTimer,
    announceSpectatorJoin,
    announceSpectatorLeave,
  } = usePresence(
    roomId,
    player,
    playerName,
    (name) => {
      setOpponentName(name);
      if (player === 'creator') setJoinerName(name);
    },
    (seconds) => {
      if (isSpectator) setSyncedSeconds(seconds);
    }
  );

  const {
    seconds,
    formatted,
    isRunning,
    unlockedSolo,
    unlockSolo,
    startManually,
    startedManually,
  } = useTimer(
    isSoloLike ? false : playerCount >= 2,
    showVictory,
    isSpectator ? syncedSeconds : undefined
  );

  useEffect(() => {
    if (isSpectator || !isRunning) return;
    broadcastTimer(seconds);
  }, [seconds, isRunning, isSpectator, broadcastTimer]);

  const displayName = playerName.trim() || 'Anônimo';
  const hasAnnouncedRef = useRef(false);
  const showVictoryRef = useRef(false);
  const particles = useRef(generateParticles()).current;

  useEffect(() => {
    if (!roomId) navigate('/');
  }, [roomId, navigate]);

  useEffect(() => {
    if (!roomState || hasAnnouncedRef.current) return;
    hasAnnouncedRef.current = true;
    if (isSpectator) {
      announceJoin();
      announceSpectatorJoin();
    } else {
      announceJoin();
      broadcastName();
    }
  }, [roomState, announceJoin, broadcastName, isSpectator, announceSpectatorJoin]);

  useEffect(() => {
    if (!isDuo) return;
    if (playerCount >= 2 && player === 'creator') broadcastName();
  }, [playerCount, player, broadcastName, isDuo]);

  useEffect(() => {
    if (!roomState || showVictoryRef.current || isSpectator) return;
    if (isBoardComplete(roomState.current, roomState.solution, roomState.puzzle)) {
      showVictoryRef.current = true;
      setShowVictory(true);
      markRoomFinished();
    }
  }, [roomState, markRoomFinished, isSpectator]);

  const handleSelect = useCallback(
    (row: number, col: number) => {
      if (isSpectator) return;
      setSelected([row, col]);
      broadcastSelection(row, col);
      if (isSoloLike && !startedManually) startManually();
    },
    [broadcastSelection, isSoloLike, isSpectator, startedManually, startManually]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isSpectator) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsNoteMode((prev) => !prev);
        return;
      }
      if (!selected || !roomState) return;
      const [r, c] = selected;
      if (isCellLocked(roomState.current, roomState.solution, roomState.puzzle, r, c)) return;
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
          let nextNotes: Notes = roomState.notes.map((row) => row.map((cell) => new Set(cell)));
          nextNotes[r][c].clear();
          if (num === roomState.solution[r][c]) {
            nextNotes = clearNotesForCorrectCell(nextNotes, r, c, num);
          } else {
            setErrorCount((prev) => prev + 1);
          }
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
    [selected, roomState, isNoteMode, updateRoom, setRoomState, isSpectator]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (!roomId) return undefined;
    const handleBeforeUnload = () => {
      if (isSpectator) {
        sendSystemMessage(`👋 ${displayName} (Espectador) saiu da sala.`);
        announceSpectatorLeave();
      } else {
        sendSystemMessage(`👋 ${displayName} saiu da sala.`);
        decrementPlayerCount();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    roomId,
    displayName,
    sendSystemMessage,
    decrementPlayerCount,
    isSpectator,
    announceSpectatorLeave,
  ]);

  const handleMobileNum = useCallback(
    (num: number) => {
      if (!selected || !roomState || isSpectator) return;
      const [r, c] = selected;
      if (isCellLocked(roomState.current, roomState.solution, roomState.puzzle, r, c)) return;
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
        let nextNotes: Notes = roomState.notes.map((row) => row.map((cell) => new Set(cell)));
        nextNotes[r][c].clear();
        if (num === roomState.solution[r][c]) {
          nextNotes = clearNotesForCorrectCell(nextNotes, r, c, num);
        } else {
          setErrorCount((prev) => prev + 1);
        }
        setRoomState({ ...roomState, current: nextCurrent, notes: nextNotes });
        updateRoom(nextCurrent, nextNotes);
      }
    },
    [selected, roomState, isNoteMode, updateRoom, setRoomState, isSpectator]
  );

  if (!roomState) return null;

  const waitingForPlayer = isDuo && playerCount < 2 && !unlockedSolo;
  const soloWaitingFirstClick = isSoloLike && !startedManually;
  const roomIsSolo = roomState.playerCount === 1 || isSoloLike;

  function getCreatorName(): string {
    if (player === 'creator') return displayName;
    return opponentName || joinerName || '...';
  }

  const creatorName = getCreatorName();
  const joinerDisplayName = player === 'joiner' ? displayName : joinerName || opponentName;

  const leaderboardMode = getLeaderboardMode(isDaily, isSolo);

  const resetAndLeave = () => {
    setShowVictory(false);
    setShowLeaderboard(false);
    showVictoryRef.current = false;
    hasAnnouncedRef.current = false;
    if (!isSpectator) decrementPlayerCount();
    if (isSpectator) {
      sendSystemMessage(`👋 ${displayName} (Espectador) saiu da sala.`);
      announceSpectatorLeave();
    }
    leaveRoom();
    navigate('/');
  };

  const noteActiveStyle = isExtreme ? 'bg-[#dc2626] text-white' : 'bg-[#9b5fa5] text-white';
  const leaveStyle = isExtreme
    ? 'bg-[#7f1d1d] text-white hover:bg-[#991b1b]'
    : 'bg-[#9b5fa5] text-white hover:bg-[#7a4a84]';
  const darkToggleStyle = isDark
    ? 'text-[#f37eb9] hover:text-[#e06aa5]'
    : 'text-gray-400 hover:text-[#9b5fa5]';
  const timerIconColor = isExtreme ? 'text-[#dc2626]' : 'text-[#f37eb9]';
  const titleColor = getTitleColor(isExtreme, isDaily);

  return (
    <div
      className={`min-h-screen ${getBg(isExtreme, isDark)} flex flex-col items-center justify-center gap-4 sm:gap-6 p-3 sm:p-4 relative overflow-hidden transition-colors duration-500`}
    >
      {isExtreme && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <style>{`@keyframes float-up { 0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; } 80% { opacity: 0.7; } 100% { transform: translateY(-100vh) scale(0.5) rotate(15deg); opacity: 0; } }`}</style>
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
        {getTitle(isExtreme, roomIsSolo, isSpectator, isDaily)}
      </h1>

      {/* Info bar */}
      <div
        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl relative z-10 ${getBarBg(isExtreme, isDark)} shadow-sm`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold tracking-widest uppercase ${getLabelColor(isExtreme, isDark)}`}
          >
            {DIFFICULTY_LABEL[roomState.difficulty]}
          </span>
          <div className={`w-px h-3 ${getBarDividerColor(isExtreme, isDark)}`} />
          {roomIsSolo ? (
            <span className={`text-xs font-bold ${getPlayerNameColor('creator', isExtreme)}`}>
              {creatorName}
            </span>
          ) : (
            <>
              <span className={`text-xs font-bold ${getPlayerNameColor('creator', isExtreme)}`}>
                {creatorName}
              </span>
              <span className={`text-xs ${getLabelColor(isExtreme, isDark)}`}>×</span>
              <span className={`text-xs font-bold ${getPlayerNameColor('joiner', isExtreme)}`}>
                {joinerDisplayName || '...'}
              </span>
            </>
          )}
          {!isSpectator && (
            <>
              <div className={`w-px h-3 ${getBarDividerColor(isExtreme, isDark)}`} />
              <span
                className={`text-xs font-bold tabular-nums ${getErrorCountColor(errorCount, isExtreme, isDark)}`}
              >
                {errorCount === 0 ? '0 erros' : `${errorCount} erro${errorCount > 1 ? 's' : ''}`}
              </span>
            </>
          )}
        </div>
        {spectators.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400">👁️ {spectators.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Barra superior */}
      <div
        className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 ${getBarBg(isExtreme, isDark)} rounded-xl px-3 sm:px-4 py-2 shadow-sm w-full sm:w-auto relative z-10`}
      >
        <span className={`text-xs sm:text-sm ${getLabelColor(isExtreme, isDark)}`}>
          {isSpectator ? 'Assistindo como ' : 'Jogando como '}
          <span
            className={`font-bold ${isSpectator ? 'text-gray-400' : getPlayerNameColor(roomState.player, isExtreme)}`}
          >
            {displayName}
            {isSpectator && ' (Espectador)'}
          </span>
        </span>
        <div className={`hidden sm:block w-px h-4 ${getBarDividerColor(isExtreme, isDark)}`} />
        <div className="flex items-center gap-2">
          <span className={`text-xs sm:text-sm font-semibold ${getLabelColor(isExtreme, isDark)}`}>
            Sala:
          </span>
          <span
            className={`font-bold tracking-widest text-base sm:text-lg ${getRoomCodeColor(isExtreme, isDark)}`}
          >
            {roomId}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(roomId ?? '');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`transition-colors ${getCopyButtonColor(isExtreme, isDark)}`}
            title="Copiar código"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
        {!isExtreme && (
          <>
            <div className={`hidden sm:block w-px h-4 ${getBarDividerColor(isExtreme, isDark)}`} />
            <button
              type="button"
              onClick={toggleDark}
              className={`transition-colors ${darkToggleStyle}`}
              title={isDark ? 'Modo claro' : 'Modo escuro'}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </>
        )}
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-1 relative z-10">
        <div
          className={`flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-2xl shadow-sm transition-colors ${getTimerBg(isRunning, isExtreme, isDark)}`}
        >
          <Timer
            size={14}
            className={isRunning ? timerIconColor : getTimerPauseIconColor(isExtreme, isDark)}
          />
          <span
            className={`font-mono text-xl sm:text-2xl font-bold tracking-widest transition-colors ${isRunning ? getTimerRunColor(isExtreme, isDark) : getTimerPauseColor(isExtreme, isDark)}`}
          >
            {formatted}
          </span>
        </div>
        {soloWaitingFirstClick && (
          <span className={`text-[10px] sm:text-[11px] mt-1 ${getWaitingColor(isExtreme, isDark)}`}>
            ⏸️ Clique no tabuleiro para iniciar o timer
          </span>
        )}
        {waitingForPlayer && (
          <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
            <span className={`text-[10px] sm:text-[11px] ${getWaitingColor(isExtreme, isDark)}`}>
              ⏸️ Aguardando segundo jogador...
            </span>
            <button
              type="button"
              onClick={unlockSolo}
              className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors underline underline-offset-2 ${getSoloUnlockColor(isExtreme, isDark)}`}
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
          opponentSelected={isSoloLike ? null : opponentSelected}
          notes={roomState.notes}
          isNoteMode={isNoteMode}
          isExtreme={isExtreme}
          onSelect={handleSelect}
        />
      </div>

      {!isSpectator && (
        <div className="grid grid-cols-9 gap-1 w-full max-w-[288px] sm:hidden relative z-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleMobileNum(num)}
              className={`h-8 rounded text-sm font-bold transition-colors ${getMobileNumButtonStyle(isExtreme, isDark)}`}
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {!isSpectator && (
        <button
          type="button"
          onClick={() => {
            if (!selected || !roomState) return;
            const [r, c] = selected;
            if (isCellLocked(roomState.current, roomState.solution, roomState.puzzle, r, c)) return;
            const nextCurrent: CurrentBoard = roomState.current.map((row) =>
              row.map((cell) => (cell ? { ...cell } : null))
            );
            nextCurrent[r][c] = null;
            const nextNotes: Notes = roomState.notes.map((row) => row.map((cell) => new Set(cell)));
            nextNotes[r][c].clear();
            setRoomState({ ...roomState, current: nextCurrent, notes: nextNotes });
            updateRoom(nextCurrent, nextNotes);
          }}
          className={`sm:hidden w-full max-w-[288px] py-1.5 rounded text-xs font-medium transition-colors relative z-10 ${getMobileDeleteStyle(isExtreme, isDark)}`}
        >
          ⌫ Apagar
        </button>
      )}

      <div className="flex gap-2 sm:gap-3 flex-wrap justify-center relative z-10">
        {import.meta.env.DEV && !isSpectator && (
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
        {!isSpectator && (
          <button
            type="button"
            onClick={() => setIsNoteMode((prev) => !prev)}
            className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 ${isNoteMode ? noteActiveStyle : getNoteInactiveStyle(isExtreme, isDark)}`}
          >
            ✏️ {isNoteMode ? 'Lápis ativado' : 'Lápis'}{' '}
            <span className="text-xs opacity-70 hidden sm:inline">(Tab)</span>
          </button>
        )}
        <button
          type="button"
          onClick={resetAndLeave}
          className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm transition-colors ${leaveStyle}`}
        >
          Sair
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
          joinerName={isSoloLike ? '' : joinerDisplayName}
          errorCount={errorCount}
          isCreator={player === 'creator'}
          mode={leaderboardMode}
          onLeave={resetAndLeave}
          onShowLeaderboard={() => {
            setShowVictory(false);
            setShowLeaderboard(true);
          }}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          initialDifficulty={roomState.difficulty}
          initialMode={leaderboardMode}
          onClose={resetAndLeave}
          onBack={() => {
            setShowLeaderboard(false);
            setShowVictory(true);
          }}
        />
      )}
    </div>
  );
}
