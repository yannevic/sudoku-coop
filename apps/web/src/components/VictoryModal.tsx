import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { saveToLeaderboard, formatDuoName, formatTime } from '../utils/leaderboard';
import type { Difficulty } from '../utils/sudoku';

interface VictoryModalProps {
  timeSeconds: number;
  difficulty: Difficulty;
  creatorName: string;
  joinerName: string;
  onPlayAgain: () => void;
  onShowLeaderboard: () => void;
}

const CONFETTI = ['🌸', '✨', '🎉', '💜', '🥳', '⭐', '🎊', '💖'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface Particle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    emoji: CONFETTI[i % CONFETTI.length],
    x: randomBetween(5, 95),
    delay: randomBetween(0, 1.2),
    duration: randomBetween(1.8, 3.2),
    size: randomBetween(16, 28),
  }));
}

export default function VictoryModal({
  timeSeconds,
  difficulty,
  creatorName,
  joinerName,
  onPlayAgain,
  onShowLeaderboard,
}: VictoryModalProps) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const particles = useRef(generateParticles()).current;
  const duoName = formatDuoName(creatorName, joinerName, new Date());

  useEffect(() => {
    if (saved) return;
    setSaved(true);
    saveToLeaderboard(duoName, timeSeconds, difficulty);
  }, [duoName, timeSeconds, difficulty, saved]);

  const difficultyLabel: Record<Difficulty, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-hidden">
      {/* Partículas de confete */}
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}%`,
            top: '-40px',
            fontSize: p.size,
            animation: `fall ${p.duration}s ${p.delay}s ease-in forwards`,
            pointerEvents: 'none',
          }}
        >
          {p.emoji}
        </span>
      ))}

      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0.3; }
        }
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
            onClick={onPlayAgain}
            className="w-full py-2.5 bg-[#f37eb9] text-white font-semibold rounded-xl hover:bg-[#e06aa5] transition-colors"
          >
            🎮 Jogar novamente
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-white text-[#9b5fa5] font-semibold rounded-xl border border-[#e9b8d9] hover:bg-[#fdf6fb] transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
