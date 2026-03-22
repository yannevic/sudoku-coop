import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPaste, Trophy } from 'lucide-react';
import { useRoomContext } from '../context/RoomContext';
import LeaderboardModal from '../components/LeaderboardModal';
import type { Difficulty } from '../utils/sudoku';

const ROOM_CODE_REGEX = /^[A-Z0-9]{4}$/;

function isValidCode(value: string): boolean {
  return ROOM_CODE_REGEX.test(value);
}

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, loading, error, roomId, setPlayerName, playerName } =
    useRoomContext();
  const [code, setCode] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [pasteHint, setPasteHint] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
  };

  return (
    <div className="min-h-screen bg-[#fce4f3] flex flex-col items-center justify-center gap-8 p-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold text-[#f37eb9]">Sudoku Coop 🌸</h1>
        <button
          type="button"
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center gap-1.5 text-[#9b5fa5] text-sm font-medium hover:text-[#7a4a84] transition-colors"
        >
          <Trophy size={14} />
          Ver ranking de duplas
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-6 w-full max-w-sm">
        {/* Campo de nome */}
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="text-sm font-medium text-gray-600" htmlFor="player-name">
            Seu nome
          </label>
          <input
            id="player-name"
            type="text"
            placeholder="Como você quer ser chamado?"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
            maxLength={20}
            className="w-full px-4 py-3 border border-[#e9b8d9] rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#f37eb9] transition-colors placeholder-[#d4a8c7]"
          />
        </div>

        <div className="h-px bg-[#f0d6eb]" />

        {/* Dificuldade */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600">Dificuldade</span>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-1 rounded capitalize text-sm font-medium transition-colors ${
                  difficulty === d
                    ? 'bg-[#f37eb9] text-white'
                    : 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]'
                }`}
              >
                {difficultyLabels[d]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading || !isNameValid}
          className="w-full py-3 bg-[#f37eb9] text-white rounded-xl font-semibold hover:bg-[#e06aa5] transition-colors disabled:opacity-50"
          title={!isNameValid ? 'Preencha seu nome primeiro' : undefined}
        >
          {loading ? 'Criando...' : '✨ Criar nova sala'}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-[#e9b8d9]" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-[#e9b8d9]" />
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
              className="w-full px-4 py-3 border border-[#e9b8d9] rounded-xl text-center text-lg font-bold tracking-widest text-[#9b5fa5] focus:outline-none focus:border-[#f37eb9] transition-colors pr-10"
            />
            <button
              type="button"
              onClick={tryPasteFromClipboard}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c9a0d0] hover:text-[#9b5fa5] transition-colors"
              title="Colar código"
            >
              <ClipboardPaste size={16} />
            </button>
            {pasteHint && (
              <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-[#9b5fa5] font-medium">
                Código colado ✓
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={loading || code.length < 4 || !isNameValid}
            className="w-full py-3 bg-[#9b5fa5] text-white rounded-xl font-semibold hover:bg-[#7a4a84] transition-colors disabled:opacity-50 mt-2"
            title={!isNameValid ? 'Preencha seu nome primeiro' : undefined}
          >
            {loading ? 'Entrando...' : '💙 Entrar na sala'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>

      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}
