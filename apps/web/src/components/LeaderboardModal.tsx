import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trophy, Loader2, Skull, Sun } from 'lucide-react';
import {
  fetchLeaderboard,
  fetchDailyLeaderboard,
  formatTime,
  getTodayDateString,
} from '../utils/leaderboard';
import type { LeaderboardEntry, LeaderboardMode } from '../utils/leaderboard';
import type { Difficulty } from '../utils/sudoku';

interface LeaderboardModalProps {
  onClose: () => void;
  onBack?: () => void;
  initialDifficulty?: Difficulty;
  initialMode?: LeaderboardMode;
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

function getEmptyText(difficulty: Difficulty, mode: LeaderboardMode): string {
  if (mode === 'daily') return 'Ninguém jogou o Daily hoje.\nSeja o primeiro!';
  if (difficulty === 'extreme') return 'Nenhum sobrevivente ainda.\nSeja o primeiro!';
  if (mode === 'solo') return 'Nenhum solitário ainda.\nSeja o primeiro!';
  return 'Nenhum registro ainda.\nSeja o primeiro!';
}

function getDifficultyBtnStyle(isSelected: boolean, isExtreme: boolean): string {
  if (isSelected) return 'bg-[#f37eb9] text-white';
  if (isExtreme) return 'bg-[#1a1a1a] text-[#666] border border-[#333] hover:bg-[#222]';
  return 'bg-[#fce4f3] text-[#9b5fa5] hover:bg-[#f0d6eb]';
}

function getModeBtnStyle(isSelected: boolean, mode: LeaderboardMode): string {
  if (mode === 'daily' && isSelected) return 'bg-[#f97316] text-white';
  if (isSelected) return 'bg-[#9b5fa5] text-white';
  return 'bg-[#fce4f3] text-[#9b5fa5] hover:bg-[#f0d6eb]';
}

function getEntryBg(isFirst: boolean, isExtreme: boolean): string {
  if (isFirst && isExtreme) return 'bg-[#2a0000] border border-[#dc2626]/40';
  if (isFirst) return 'bg-yellow-50 border border-yellow-200';
  if (isExtreme) return 'bg-[#1a1a1a]';
  return 'bg-[#fdf6fb]';
}

function getErrorColor(errorCount: number, isExtreme: boolean): string {
  if (errorCount === 0) return isExtreme ? 'text-[#f97316]' : 'text-[#9b5fa5]';
  return 'text-red-400';
}

function getHeaderBg(isExtreme: boolean, isDaily: boolean): string {
  if (isDaily) return 'bg-[#f97316]';
  if (isExtreme) return 'bg-[#1a0000]';
  return 'bg-[#9b5fa5]';
}

function getHeaderIcon(isExtreme: boolean, isDaily: boolean): React.ReactElement {
  if (isDaily) return <Sun size={20} className="text-white" />;
  if (isExtreme) return <Skull size={20} className="text-[#f97316]" />;
  return <Trophy size={20} className="text-yellow-300" />;
}

function getHeaderTitle(isExtreme: boolean, isDaily: boolean): string {
  if (isDaily) return '☀️ Ranking Daily';
  if (isExtreme) return '💀 Ranking Extremo';
  return 'Ranking';
}

function getModalBg(isExtreme: boolean, isDaily: boolean): string {
  if (isExtreme && !isDaily) return 'bg-[#0f0f0f] border border-[#dc2626]/30';
  return 'bg-white';
}

function getSpinnerColor(isExtreme: boolean, isDaily: boolean): string {
  if (isDaily) return 'text-[#f97316]';
  if (isExtreme) return 'text-[#dc2626]';
  return 'text-[#f37eb9]';
}

function getEmptyIcon(isExtreme: boolean, isDaily: boolean): string {
  if (isDaily) return '☀️';
  if (isExtreme) return '💀';
  return '🌸';
}

function getEmptyTextColor(isExtreme: boolean, isDaily: boolean): string {
  if (isExtreme && !isDaily) return 'text-[#6b2121]';
  return 'text-[#c9a0d0]';
}

function getModeLabel(m: LeaderboardMode): string {
  if (m === 'duo') return '👫 Dupla';
  if (m === 'solo') return '🧍‍♂️ Solo';
  return '☀️ Daily';
}

type CacheKey = string;

export default function LeaderboardModal({
  onClose,
  onBack,
  initialDifficulty = 'medium',
  initialMode = 'duo',
}: LeaderboardModalProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [mode, setMode] = useState<LeaderboardMode>(initialMode);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = useRef<Partial<Record<CacheKey, LeaderboardEntry[]>>>({});

  const isExtreme = difficulty === 'extreme';
  const isDaily = mode === 'daily';
  const today = getTodayDateString();

  const load = useCallback(async () => {
    const key: CacheKey = isDaily ? `daily-${today}` : `${mode}-${difficulty}`;
    if (cache.current[key]) {
      setEntries(cache.current[key]!);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = isDaily ? await fetchDailyLeaderboard() : await fetchLeaderboard(difficulty, mode);
    cache.current[key] = data;
    setEntries(data);
    setLoading(false);
  }, [difficulty, mode, isDaily, today]);

  useEffect(() => {
    load();
  }, [load]);

  const emptyLines = getEmptyText(difficulty, mode).split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-colors duration-300 ${getModalBg(isExtreme, isDaily)}`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between transition-colors duration-300 ${getHeaderBg(isExtreme, isDaily)}`}
        >
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
            {getHeaderIcon(isExtreme, isDaily)}
            <span className="text-white font-bold text-lg">
              {getHeaderTitle(isExtreme, isDaily)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas Solo / Dupla / Daily */}
        <div className="flex gap-2 px-6 pt-4">
          {(['duo', 'solo', 'daily'] as LeaderboardMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-xl text-sm font-semibold transition-colors ${getModeBtnStyle(mode === m, m)}`}
            >
              {getModeLabel(m)}
            </button>
          ))}
        </div>

        {/* Filtro dificuldade — só para solo e duo */}
        {!isDaily && (
          <div className="flex flex-col gap-2 px-6 pt-3">
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-colors ${getDifficultyBtnStyle(difficulty === d.value, isExtreme)}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDifficulty('extreme')}
              className={`w-full py-1.5 rounded-xl text-sm font-bold tracking-widest transition-all ${
                isExtreme
                  ? 'bg-[#dc2626] text-white shadow-lg shadow-red-900/40'
                  : 'bg-[#1a1a1a] text-[#ef4444] border border-[#dc2626]/40 hover:bg-[#2a2a2a]'
              }`}
            >
              💀 EXTREMO
            </button>
          </div>
        )}

        {/* Info daily */}
        {isDaily && (
          <p className="text-xs text-center text-[#c9a0d0] px-6 pt-3">
            Puzzle de hoje ·{' '}
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </p>
        )}

        {/* Lista */}
        <div className="px-6 py-4 min-h-64 flex flex-col gap-2">
          {loading && (
            <div className="flex-1 flex items-center justify-center py-8">
              <Loader2
                size={24}
                className={`animate-spin ${getSpinnerColor(isExtreme, isDaily)}`}
              />
            </div>
          )}
          {!loading && entries.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
              <span className="text-4xl">{getEmptyIcon(isExtreme, isDaily)}</span>
              <p className={`text-sm ${getEmptyTextColor(isExtreme, isDaily)}`}>
                {emptyLines[0]}
                <br />
                {emptyLines[1]}
              </p>
            </div>
          )}
          {!loading &&
            entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${getEntryBg(i === 0, isExtreme && !isDaily)}`}
              >
                <span className="text-xl w-7 text-center shrink-0">{getMedal(i)}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${isExtreme && !isDaily ? 'text-[#f97316]' : 'text-[#7a4a84]'}`}
                  >
                    {entry.duo_name}
                  </p>
                  <p
                    className={`text-[10px] ${isExtreme && !isDaily ? 'text-[#6b2121]' : 'text-gray-400'}`}
                  >
                    {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span
                    className={`font-mono font-bold text-sm ${isExtreme && !isDaily ? 'text-[#dc2626]' : 'text-[#9b5fa5]'}`}
                  >
                    {formatTime(entry.time_seconds)}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${getErrorColor(entry.error_count, isExtreme && !isDaily)}`}
                  >
                    {entry.error_count === 0
                      ? '0 erros ✓'
                      : `${entry.error_count} erro${entry.error_count > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
