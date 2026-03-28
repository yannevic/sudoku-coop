import supabase from './supabase';

export type LeaderboardMode = 'solo' | 'duo' | 'daily';

export interface LeaderboardEntry {
  id: string;
  duo_name: string;
  time_seconds: number;
  error_count: number;
  difficulty: string;
  mode: LeaderboardMode;
  date: string | null;
  created_at: string;
}

export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function saveToLeaderboard(
  duoName: string,
  timeSeconds: number,
  difficulty: string,
  errorCount: number,
  mode: LeaderboardMode,
  date?: string
): Promise<void> {
  if (!import.meta.env.PROD) return;
  const { error } = await supabase.from('leaderboard').insert({
    duo_name: duoName,
    time_seconds: timeSeconds,
    difficulty,
    error_count: errorCount,
    mode,
    date: date ?? null,
  });
  // eslint-disable-next-line no-console
  if (error) console.error('[leaderboard] erro ao salvar:', error);
  // eslint-disable-next-line no-console
  else
    console.log('[leaderboard] salvo:', {
      duoName,
      timeSeconds,
      difficulty,
      errorCount,
      mode,
      date,
    });
}

export async function fetchLeaderboard(
  difficulty?: string,
  mode: LeaderboardMode = 'duo'
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('leaderboard')
    .select('*')
    .eq('mode', mode)
    .order('time_seconds', { ascending: true })
    .limit(7);
  if (difficulty) query = query.eq('difficulty', difficulty);
  const { data } = await query;
  return data ?? [];
}

export async function fetchDailyLeaderboard(): Promise<LeaderboardEntry[]> {
  const today = getTodayDateString();
  const { data } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('mode', 'daily')
    .eq('date', today)
    .order('time_seconds', { ascending: true })
    .limit(10);
  return data ?? [];
}

export function formatDuoName(nameA: string, nameB: string, date: Date): string {
  const a = nameA.trim() || 'Anônimo';
  const b = nameB.trim();
  const d = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  if (!b) return `${a} · ${d}`;
  return `${a} & ${b} · ${d}`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
