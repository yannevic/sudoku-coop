import { useState, useEffect, useCallback } from 'react';
import { X, Trophy, Loader2 } from 'lucide-react';
import { fetchLeaderboard, formatTime } from '../utils/leaderboard';
import type { LeaderboardEntry } from '../utils/leaderboard';
import type { Difficulty } from '../utils/sudoku';

interface LeaderboardModalProps {
  onClose: () => void;
  onBack?: () => void;
  initialDifficulty?: Difficulty;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Médio' },
  { value: 'hard', label: 'Difícil' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

function getMedal(index: number): string {
  if (index < 3) return MEDALS[index];
  return `${index + 1}º`;
}

export default function LeaderboardModal({
  onClose,
  onBack,
  initialDifficulty = 'medium',
}: LeaderboardModalProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard(difficulty);
    setEntries(data);
    setLoading(false);
  }, [difficulty]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#9b5fa5] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-white opacity-70 hover:opacity-100 transition-opacity mr-1"
                title="Voltar"
              >
                ←
              </button>
            )}
            <Trophy size={20} className="text-yellow-300" />
            <span className="text-white font-bold text-lg">Ranking de Duplas</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filtro de dificuldade */}
        <div className="flex gap-2 px-6 pt-4">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                difficulty === d.value
                  ? 'bg-[#f37eb9] text-white'
                  : 'bg-[#fce4f3] text-[#9b5fa5] hover:bg-[#f0d6eb]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="px-6 py-4 min-h-70 flex flex-col gap-2">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="text-[#f37eb9] animate-spin" />
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
              <span className="text-4xl">🌸</span>
              <p className="text-[#c9a0d0] text-sm">
                Nenhuma dupla completou ainda.
                <br />
                Seja a primeira!
              </p>
            </div>
          )}

          {!loading &&
            entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                  i === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-[#fdf6fb]'
                }`}
              >
                <span className="text-xl w-7 text-center shrink-0">{getMedal(i)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#7a4a84] truncate">{entry.duo_name}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="font-mono font-bold text-[#9b5fa5] text-sm shrink-0">
                  {formatTime(entry.time_seconds)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
