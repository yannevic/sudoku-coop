import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../context/RoomContext';
import type { Difficulty } from '../utils/sudoku';

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, loading, error, roomId } = useRoomContext();
  const [code, setCode] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

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

  return (
    <div className="min-h-screen bg-[#fce4f3] flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-4xl font-bold text-[#f37eb9]">Sudoku Coop 🌸</h1>

      <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-6 w-full max-w-sm">
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
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 bg-[#f37eb9] text-white rounded-xl font-semibold hover:bg-[#e06aa5] transition-colors disabled:opacity-50"
        >
          {loading ? 'Criando...' : '✨ Criar nova sala'}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-[#e9b8d9]" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-[#e9b8d9]" />
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Código da sala"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            maxLength={4}
            className="w-full px-4 py-3 border border-[#e9b8d9] rounded-xl text-center text-lg font-bold tracking-widest text-[#9b5fa5] focus:outline-none focus:border-[#f37eb9]"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={loading || code.length < 4}
            className="w-full py-3 bg-[#9b5fa5] text-white rounded-xl font-semibold hover:bg-[#7a4a84] transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : '💙 Entrar na sala'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
