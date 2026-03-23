import supabase from './supabase';

export interface LeaderboardEntry {
  id: string;
  duo_name: string;
  time_seconds: number;
  error_count: number;
  difficulty: string;
  created_at: string;
}

export async function saveToLeaderboard(
  duoName: string,
  timeSeconds: number,
  difficulty: string,
  errorCount: number
): Promise<void> {
  if (!import.meta.env.PROD) return;

  const { error } = await supabase
    .from('leaderboard')
    .insert({ duo_name: duoName, time_seconds: timeSeconds, difficulty, error_count: errorCount });
  // eslint-disable-next-line no-console
  if (error) console.error('[leaderboard] erro ao salvar:', error);
  // eslint-disable-next-line no-console
  else console.log('[leaderboard] salvo:', { duoName, timeSeconds, difficulty, errorCount });
}

export async function fetchLeaderboard(difficulty?: string): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('leaderboard')
    .select('*')
    .order('time_seconds', { ascending: true })
    .limit(7);

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  const { data } = await query;
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
