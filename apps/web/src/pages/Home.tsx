import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPaste, Trophy, Loader2, Moon, Sun } from 'lucide-react';
import { useRoomContext } from '../context/RoomContext';
import LeaderboardModal from '../components/LeaderboardModal';
import type { Difficulty } from '../utils/sudoku';

const ROOM_CODE_REGEX = /^[A-Z0-9]{4}$/;

function isValidCode(value: string): boolean {
  return ROOM_CODE_REGEX.test(value);
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; active: string; inactive: string }> = {
  easy: {
    label: 'Fácil',
    active: 'bg-[#f37eb9] text-white',
    inactive: 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]',
  },
  medium: {
    label: 'Médio',
    active: 'bg-[#f37eb9] text-white',
    inactive: 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]',
  },
  hard: {
    label: 'Difícil',
    active: 'bg-[#f37eb9] text-white',
    inactive: 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]',
  },
  extreme: {
    label: '💀 EXTREMO',
    active: 'bg-[#dc2626] text-white shadow-lg shadow-red-900/50',
    inactive: 'bg-[#1a1a1a] text-[#ef4444] border border-[#dc2626]/50 hover:bg-[#2a2a2a]',
  },
};

const DIFFICULTY_CONFIG_DARK: Record<
  Difficulty,
  { label: string; active: string; inactive: string }
> = {
  easy: {
    label: 'Fácil',
    active: 'bg-[#f37eb9] text-white',
    inactive: 'bg-[#2a2a2a] text-[#aaaaaa] border border-[#444] hover:bg-[#333]',
  },
  medium: {
    label: 'Médio',
    active: 'bg-[#f37eb9] text-white',
    inactive: 'bg-[#2a2a2a] text-[#aaaaaa] border border-[#444] hover:bg-[#333]',
  },
  hard: {
    label: 'Difícil',
    active: 'bg-[#f37eb9] text-white',
    inactive: 'bg-[#2a2a2a] text-[#aaaaaa] border border-[#444] hover:bg-[#333]',
  },
  extreme: {
    label: '💀 EXTREMO',
    active: 'bg-[#dc2626] text-white shadow-lg shadow-red-900/50',
    inactive: 'bg-[#1a1a1a] text-[#ef4444] border border-[#dc2626]/50 hover:bg-[#2a2a2a]',
  },
};

const TITLE_LETTERS = [
  { id: 'S', char: 'S', offset: 2, rotation: -2, size: 40 },
  { id: 'u', char: 'u', offset: -3, rotation: 2, size: 38 },
  { id: 'd', char: 'd', offset: 1, rotation: -1, size: 42 },
  { id: 'o', char: 'o', offset: -2, rotation: 3, size: 37 },
  { id: 'k', char: 'k', offset: 3, rotation: -2, size: 41 },
  { id: 'u2', char: 'u', offset: -1, rotation: 1, size: 39 },
  { id: 'sp', char: ' ', offset: 0, rotation: 0, size: 0 },
  { id: 'C', char: 'C', offset: 2, rotation: -3, size: 43 },
  { id: 'o2', char: 'o', offset: -3, rotation: 2, size: 38 },
  { id: 'o3', char: 'o', offset: 1, rotation: -1, size: 40 },
  { id: 'p', char: 'p', offset: -2, rotation: 3, size: 37 },
];

export default function Home() {
  const navigate = useNavigate();
  const {
    createRoom,
    joinRoom,
    loading,
    error,
    roomId,
    setPlayerName,
    playerName,
    isDark,
    toggleDark,
  } = useRoomContext();
  const [code, setCode] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [pasteHint, setPasteHint] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isExtreme = difficulty === 'extreme';
  const diffConfig = isDark ? DIFFICULTY_CONFIG_DARK : DIFFICULTY_CONFIG;

  useEffect(() => {
    if (roomId) navigate('/game');
  }, [roomId, navigate]);

  const handleCreate = async () => {
    await createRoom(difficulty);
    navigate('/game');
  };

  const handleJoin = async () => {
    await joinRoom(code);
  };

  const tryPasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4);
      if (!isValidCode(cleaned)) return;
      setCode(cleaned);
      setPasteHint(true);
      setTimeout(() => setPasteHint(false), 2000);
    } catch {
      // Permissão negada ou clipboard vazio — não faz nada
    }
  }, []);

  const isNameValid = playerName.trim().length > 0;

  function getCreateLabel(): string {
    if (loading) return 'Criando...';
    if (isExtreme) return '💀 Criar sala extrema';
    return '✨ Criar nova sala';
  }

  function getJoinLabel(): string {
    if (loading) return 'Entrando...';
    if (isExtreme) return '💀 Entrar na sala';
    return '💙 Entrar na sala';
  }

  // ─── Tema ───────────────────────────────────────────────────────────────
  function getBg(): string {
    if (isExtreme) return 'bg-[#0a0a0a]';
    if (isDark) return 'bg-[#1a1a2e]';
    return 'bg-[#fce4f3]';
  }

  function getTitleColor(): string {
    if (isExtreme) return 'text-[#ef4444]';
    if (isDark) return 'text-[#f37eb9]';
    return 'text-[#f37eb9]';
  }

  function getCardBg(): string {
    if (isExtreme) return 'bg-[#111111] border border-[#dc2626]/30 shadow-red-900/20';
    if (isDark) return 'bg-[#16213e] border border-[#2a2a4a]';
    return 'bg-white';
  }

  function getLabelColor(): string {
    if (isExtreme) return 'text-[#ef4444]';
    if (isDark) return 'text-[#aaaacc]';
    return 'text-gray-600';
  }

  function getDividerColor(): string {
    if (isExtreme) return 'bg-[#dc2626]/20';
    if (isDark) return 'bg-[#2a2a4a]';
    return 'bg-[#f0d6eb]';
  }

  function getInputStyle(): string {
    if (isExtreme)
      return 'bg-[#1a1a1a] border border-[#dc2626]/40 text-white placeholder-[#6b2121] focus:border-[#dc2626]';
    if (isDark)
      return 'bg-[#0f0f23] border border-[#2a2a4a] text-white placeholder-[#44446a] focus:border-[#f37eb9]';
    return 'border border-[#e9b8d9] text-gray-700 placeholder-[#d4a8c7] focus:border-[#f37eb9]';
  }

  function getCodeInputStyle(): string {
    if (isExtreme)
      return 'bg-[#1a1a1a] border border-[#dc2626]/40 text-[#f97316] placeholder-[#6b2121] focus:border-[#dc2626]';
    if (isDark)
      return 'bg-[#0f0f23] border border-[#2a2a4a] text-[#f37eb9] placeholder-[#44446a] focus:border-[#f37eb9]';
    return 'border border-[#e9b8d9] text-[#9b5fa5] focus:border-[#f37eb9]';
  }

  function getOrDividerColor(): string {
    if (isExtreme) return 'bg-[#dc2626]/20';
    if (isDark) return 'bg-[#2a2a4a]';
    return 'bg-[#e9b8d9]';
  }

  function getOrTextColor(): string {
    if (isExtreme) return 'text-[#6b2121]';
    if (isDark) return 'text-[#44446a]';
    return 'text-gray-400';
  }

  function getPasteButtonColor(): string {
    if (isExtreme) return 'text-[#6b2121] hover:text-[#ef4444]';
    if (isDark) return 'text-[#44446a] hover:text-[#f37eb9]';
    return 'text-[#c9a0d0] hover:text-[#9b5fa5]';
  }

  function getPasteHintColor(): string {
    if (isExtreme) return 'text-[#ef4444]';
    if (isDark) return 'text-[#f37eb9]';
    return 'text-[#9b5fa5]';
  }

  function getCreateButtonStyle(): string {
    if (isExtreme) return 'bg-[#dc2626] hover:bg-[#b91c1c] shadow-lg shadow-red-900/30';
    return 'bg-[#f37eb9] hover:bg-[#e06aa5]';
  }

  function getJoinButtonStyle(): string {
    if (isExtreme) return 'bg-[#7f1d1d] hover:bg-[#991b1b]';
    if (isDark) return 'bg-[#7a4a84] hover:bg-[#9b5fa5]';
    return 'bg-[#9b5fa5] hover:bg-[#7a4a84]';
  }

  function getFooterColor(): string {
    if (isExtreme) return 'text-[#4a1515]';
    if (isDark) return 'text-[#2a2a4a]';
    return 'text-[#e9b8d9]';
  }

  function getRankingButtonStyle(): string {
    if (isExtreme) return 'text-[#f97316] hover:text-[#fb923c]';
    if (isDark) return 'text-[#f37eb9] hover:text-[#e06aa5]';
    return 'text-[#9b5fa5] hover:text-[#7a4a84]';
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center gap-8 p-4 transition-colors duration-500 ${getBg()}`}
    >
      <div className="flex flex-col items-center gap-2">
        {isExtreme ? (
          <h1 className="text-4xl font-bold text-[#ef4444]">💀 Sudoku Extremo</h1>
        ) : (
          <h1
            className={`font-bold transition-colors duration-500 ${getTitleColor()} flex items-end gap-0.5`}
          >
            {TITLE_LETTERS.map(({ id, char, offset, rotation, size }) => {
              if (char === ' ') return <span key={id} className="w-2" />;
              return (
                <span
                  key={id}
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${offset}px) rotate(${rotation}deg)`,
                    fontSize: size,
                  }}
                >
                  {char}
                </span>
              );
            })}
            <span
              style={{
                display: 'inline-block',
                transform: 'translateY(-4px) rotate(8deg)',
                fontSize: 36,
                marginLeft: 4,
              }}
            >
              🌸
            </span>
          </h1>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${getRankingButtonStyle()}`}
          >
            <Trophy size={14} />
            Ver ranking
          </button>
          {!isExtreme && (
            <button
              type="button"
              onClick={toggleDark}
              title={isDark ? 'Modo claro' : 'Modo escuro'}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 ${
                isDark
                  ? 'bg-[#16213e] border border-[#2a2a4a] text-[#f37eb9]'
                  : 'bg-white border border-[#e9b8d9] text-[#9b5fa5]'
              }`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}
        </div>
      </div>

      <div
        className={`rounded-2xl shadow-md p-8 flex flex-col gap-6 w-full max-w-sm transition-all duration-500 ${getCardBg()}`}
      >
        {/* Campo de nome */}
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className={`text-sm font-medium ${getLabelColor()}`} htmlFor="player-name">
            Seu nome
          </label>
          <input
            id="player-name"
            type="text"
            placeholder="Como você quer ser chamado?"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
            maxLength={20}
            className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors ${getInputStyle()}`}
          />
        </div>

        <div className={`h-px ${getDividerColor()}`} />

        {/* Dificuldade */}
        <div className="flex flex-col gap-2">
          <span className={`text-sm font-medium ${getLabelColor()}`}>Dificuldade</span>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-1 rounded text-sm font-medium transition-colors ${
                  difficulty === d ? diffConfig[d].active : diffConfig[d].inactive
                }`}
              >
                {diffConfig[d].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDifficulty('extreme')}
            className={`w-full py-2 rounded text-sm font-bold transition-all duration-200 tracking-widest ${
              difficulty === 'extreme'
                ? DIFFICULTY_CONFIG.extreme.active
                : DIFFICULTY_CONFIG.extreme.inactive
            }`}
          >
            {DIFFICULTY_CONFIG.extreme.label}
          </button>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading || !isNameValid}
          className={`w-full py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 ${getCreateButtonStyle()}`}
          title={!isNameValid ? 'Preencha seu nome primeiro' : undefined}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {getCreateLabel()}
            </span>
          ) : (
            getCreateLabel()
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className={`flex-1 h-px ${getOrDividerColor()}`} />
          <span className={`text-xs ${getOrTextColor()}`}>ou</span>
          <div className={`flex-1 h-px ${getOrDividerColor()}`} />
        </div>

        {/* Entrada na sala */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Código da sala"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              maxLength={4}
              className={`w-full px-4 py-3 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none transition-colors pr-10 ${getCodeInputStyle()}`}
            />
            <button
              type="button"
              onClick={tryPasteFromClipboard}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${getPasteButtonColor()}`}
              title="Colar código"
            >
              <ClipboardPaste size={16} />
            </button>
            {pasteHint && (
              <span
                className={`absolute -bottom-5 left-0 right-0 text-center text-[10px] font-medium ${getPasteHintColor()}`}
              >
                Código colado ✓
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={loading || code.length < 4 || !isNameValid}
            className={`w-full py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 mt-2 ${getJoinButtonStyle()}`}
            title={!isNameValid ? 'Preencha seu nome primeiro' : undefined}
          >
            {getJoinLabel()}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>

      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}

      <p className={`text-[10px] font-medium transition-colors duration-500 ${getFooterColor()}`}>
        Made by Nana 🌸
      </p>
    </div>
  );
}
