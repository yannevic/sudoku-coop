import { useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { saveToLeaderboard, formatDuoName, formatTime } from '../utils/leaderboard';
import type { Difficulty } from '../utils/sudoku';

interface VictoryModalProps {
  timeSeconds: number;
  difficulty: Difficulty;
  creatorName: string;
  joinerName: string;
  isCreator: boolean;
  onLeave: () => void;
  onShowLeaderboard: () => void;
}

export default function VictoryModal({
  timeSeconds,
  difficulty,
  creatorName,
  joinerName,
  isCreator,
  onLeave,
  onShowLeaderboard,
}: VictoryModalProps) {
  const savedRef = useRef(false);
  const duoName = useRef(formatDuoName(creatorName, joinerName, new Date())).current;

  useEffect(() => {
    if (!isCreator || savedRef.current) return;
    savedRef.current = true;
    saveToLeaderboard(duoName, timeSeconds, difficulty);
  }, [duoName, timeSeconds, difficulty, isCreator]);

  const difficultyLabel: Record<Difficulty, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    extreme: '💀 Extremo',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-hidden">
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0.7); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{ animation: 'pop-in 0.4s ease forwards' }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header roxo */}
        <div className="bg-[#9b5fa5] px-6 py-6 flex flex-col items-center gap-2">
          <Trophy size={36} className="text-yellow-300" />
          <h2 className="text-white font-bold text-2xl">Puzzle resolvido!</h2>
          <p className="text-[#e9c4f5] text-sm text-center">Parabéns à dupla incrível 🌸</p>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-6 flex flex-col gap-4">
          {/* Nome da dupla */}
          <div className="bg-[#fdf6fb] rounded-2xl px-4 py-3 text-center">
            <p className="text-[10px] text-[#c9a0d0] uppercase font-semibold tracking-widest mb-1">
              Dupla
            </p>
            <p className="text-[#7a4a84] font-bold text-base leading-snug">{duoName}</p>
          </div>

          {/* Tempo e dificuldade */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#fdf6fb] rounded-2xl px-4 py-3 text-center">
              <p className="text-[10px] text-[#c9a0d0] uppercase font-semibold tracking-widest mb-1">
                Tempo
              </p>
              <p className="font-mono font-bold text-[#9b5fa5] text-2xl">
                {formatTime(timeSeconds)}
              </p>
            </div>
            <div className="flex-1 bg-[#fdf6fb] rounded-2xl px-4 py-3 text-center">
              <p className="text-[10px] text-[#c9a0d0] uppercase font-semibold tracking-widest mb-1">
                Nível
              </p>
              <p className="font-bold text-[#9b5fa5] text-xl">{difficultyLabel[difficulty]}</p>
            </div>
          </div>

          {/* Botões */}
          <button
            type="button"
            onClick={onShowLeaderboard}
            className="w-full py-2.5 bg-[#fce4f3] text-[#9b5fa5] font-semibold rounded-xl hover:bg-[#f0d6eb] transition-colors flex items-center justify-center gap-2"
          >
            <Trophy size={16} />
            Ver ranking
          </button>

          <button
            type="button"
            onClick={onLeave}
            className="w-full py-2.5 bg-white text-[#9b5fa5] font-semibold rounded-xl border border-[#e9b8d9] hover:bg-[#fdf6fb] transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
