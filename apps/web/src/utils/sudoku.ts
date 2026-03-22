// apps/web/src/utils/sudoku.ts

export type Board = (number | null)[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Utilitários internos ───────────────────────────────────────────────

function isValid(board: Board, row: number, col: number, num: number): boolean {
  if (board[row].includes(num)) return false;

  if (board.some((r) => r[col] === num)) return false;

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  const box = board.slice(startRow, startRow + 3);
  if (box.some((r) => r.slice(startCol, startCol + 3).includes(num))) return false;

  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  a.reduce((_, __, i) => {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
    return null;
  }, null);
  return a;
}

function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

// ─── Geração do tabuleiro completo ─────────────────────────────────────

function fillBoard(board: Board): boolean {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] === null) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const found = nums.some((num) => {
          if (isValid(board, row, col, num)) {
            // eslint-disable-next-line no-param-reassign
            board[row][col] = num;
            if (fillBoard(board)) return true;
            // eslint-disable-next-line no-param-reassign
            board[row][col] = null;
          }
          return false;
        });
        if (!found) return false;
      }
    }
  }
  return true;
}

// ─── Remoção de células conforme dificuldade ────────────────────────────

const CELLS_TO_REMOVE: Record<Difficulty, number> = {
  easy: 36,
  medium: 46,
  hard: 54,
};

function removeNumbers(board: Board, difficulty: Difficulty): Board {
  const puzzle = board.map((row) => [...row]);
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  positions.slice(0, CELLS_TO_REMOVE[difficulty]).forEach(([r, c]) => {
    puzzle[r][c] = null;
  });

  return puzzle;
}

// ─── API pública ────────────────────────────────────────────────────────

export interface SudokuPuzzle {
  /** Tabuleiro com buracos (null = célula vazia) */
  puzzle: Board;
  /** Solução completa */
  solution: Board;
}

/** Gera um novo puzzle de sudoku */
export function generatePuzzle(difficulty: Difficulty = 'medium'): SudokuPuzzle {
  const solution = createEmptyBoard();
  fillBoard(solution);
  const puzzle = removeNumbers(solution, difficulty);
  return { puzzle, solution };
}

/** Verifica se um valor inserido pelo jogador é correto */
export function checkMove(solution: Board, row: number, col: number, value: number): boolean {
  return solution[row][col] === value;
}

/** Verifica se o puzzle está completamente resolvido */
export function isSolved(current: Board, solution: Board): boolean {
  return current.every((row, r) => row.every((cell, c) => cell === solution[r][c]));
}

export type Notes = Set<number>[][];

export function createEmptyNotes(): Notes {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()));
}

export type Player = 'creator' | 'joiner';

export interface CellState {
  value: number;
  player: Player;
}

export type CurrentBoard = (CellState | null)[][];

export function createEmptyCurrentBoard(): CurrentBoard {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}
