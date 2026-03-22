import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPaste, Trophy, Loader2 } from 'lucide-react';
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

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, loading, error, roomId, setPlayerName, playerName } =
    useRoomContext();
  const [code, setCode] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [pasteHint, setPasteHint] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isExtreme = difficulty === 'extreme';

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
      if (isValidCode(cleaned)) {
        setCode(cleaned);
        setPasteHint(true);
        setTimeout(() => setPasteHint(false), 2000);
      }
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

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center gap-8 p-4 transition-colors duration-500 ${
        isExtreme ? 'bg-[#0a0a0a]' : 'bg-[#fce4f3]'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <h1
          className={`text-4xl font-bold transition-colors duration-500 ${isExtreme ? 'text-[#ef4444]' : 'text-[#f37eb9]'}`}
        >
          {isExtreme ? '💀 Sudoku Extremo' : 'Sudoku Coop 🌸'}
        </h1>
        <button
          type="button"
          onClick={() => setShowLeaderboard(true)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            isExtreme
              ? 'text-[#f97316] hover:text-[#fb923c]'
              : 'text-[#9b5fa5] hover:text-[#7a4a84]'
          }`}
        >
          <Trophy size={14} />
          Ver ranking
        </button>
      </div>

      <div
        className={`rounded-2xl shadow-md p-8 flex flex-col gap-6 w-full max-w-sm transition-all duration-500 ${
          isExtreme ? 'bg-[#111111] border border-[#dc2626]/30 shadow-red-900/20' : 'bg-white'
        }`}
      >
        {/* Campo de nome */}
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label
            className={`text-sm font-medium ${isExtreme ? 'text-[#ef4444]' : 'text-gray-600'}`}
            htmlFor="player-name"
          >
            Seu nome
          </label>
          <input
            id="player-name"
            type="text"
            placeholder="Como você quer ser chamado?"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
            maxLength={20}
            className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors ${
              isExtreme
                ? 'bg-[#1a1a1a] border border-[#dc2626]/40 text-white placeholder-[#6b2121] focus:border-[#dc2626]'
                : 'border border-[#e9b8d9] text-gray-700 placeholder-[#d4a8c7] focus:border-[#f37eb9]'
            }`}
          />
        </div>

        <div className={`h-px ${isExtreme ? 'bg-[#dc2626]/20' : 'bg-[#f0d6eb]'}`} />

        {/* Dificuldade */}
        <div className="flex flex-col gap-2">
          <span className={`text-sm font-medium ${isExtreme ? 'text-[#ef4444]' : 'text-gray-600'}`}>
            Dificuldade
          </span>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-1 rounded text-sm font-medium transition-colors ${
                  difficulty === d ? DIFFICULTY_CONFIG[d].active : DIFFICULTY_CONFIG[d].inactive
                }`}
              >
                {DIFFICULTY_CONFIG[d].label}
              </button>
            ))}
          </div>
          {/* Botão Extremo separado e com destaque */}
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
          className={`w-full py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 ${
            isExtreme
              ? 'bg-[#dc2626] hover:bg-[#b91c1c] shadow-lg shadow-red-900/30'
              : 'bg-[#f37eb9] hover:bg-[#e06aa5]'
          }`}
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
          <div className={`flex-1 h-px ${isExtreme ? 'bg-[#dc2626]/20' : 'bg-[#e9b8d9]'}`} />
          <span className={`text-xs ${isExtreme ? 'text-[#6b2121]' : 'text-gray-400'}`}>ou</span>
          <div className={`flex-1 h-px ${isExtreme ? 'bg-[#dc2626]/20' : 'bg-[#e9b8d9]'}`} />
        </div>

        {/* Entrada na sala */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Código da sala"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              onFocus={tryPasteFromClipboard}
              onClick={tryPasteFromClipboard}
              maxLength={4}
              className={`w-full px-4 py-3 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none transition-colors pr-10 ${
                isExtreme
                  ? 'bg-[#1a1a1a] border border-[#dc2626]/40 text-[#f97316] placeholder-[#6b2121] focus:border-[#dc2626]'
                  : 'border border-[#e9b8d9] text-[#9b5fa5] focus:border-[#f37eb9]'
              }`}
            />
            <button
              type="button"
              onClick={tryPasteFromClipboard}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                isExtreme
                  ? 'text-[#6b2121] hover:text-[#ef4444]'
                  : 'text-[#c9a0d0] hover:text-[#9b5fa5]'
              }`}
              title="Colar código"
            >
              <ClipboardPaste size={16} />
            </button>
            {pasteHint && (
              <span
                className={`absolute -bottom-5 left-0 right-0 text-center text-[10px] font-medium ${isExtreme ? 'text-[#ef4444]' : 'text-[#9b5fa5]'}`}
              >
                Código colado ✓
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={loading || code.length < 4 || !isNameValid}
            className={`w-full py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 mt-2 ${
              isExtreme ? 'bg-[#7f1d1d] hover:bg-[#991b1b]' : 'bg-[#9b5fa5] hover:bg-[#7a4a84]'
            }`}
            title={!isNameValid ? 'Preencha seu nome primeiro' : undefined}
          >
            {getJoinLabel()}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>

      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}
