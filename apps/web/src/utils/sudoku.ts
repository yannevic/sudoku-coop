export type Board = (number | null)[][];
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

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

// LCG seeded — sem operadores bitwise
function createSeededRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleSeeded<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

const DAILY_DIFFICULTIES: Difficulty[] = [
  'medium',
  'easy',
  'medium',
  'hard',
  'medium',
  'hard',
  'easy',
];

export function getDailyDifficulty(): Difficulty {
  return DAILY_DIFFICULTIES[new Date().getDay()];
}

function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

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

function fillBoardSeeded(board: Board, rng: () => number): boolean {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] === null) {
        const nums = shuffleSeeded([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
        const found = nums.some((num) => {
          if (isValid(board, row, col, num)) {
            // eslint-disable-next-line no-param-reassign
            board[row][col] = num;
            if (fillBoardSeeded(board, rng)) return true;
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

function countSolutions(board: Board, limit: number): number {
  let count = 0;
  function solve(b: Board): void {
    if (count >= limit) return;
    let found = false;
    for (let row = 0; row < 9 && !found; row += 1) {
      for (let col = 0; col < 9 && !found; col += 1) {
        if (b[row][col] === null) {
          found = true;
          for (let num = 1; num <= 9; num += 1) {
            if (count >= limit) return;
            if (isValid(b, row, col, num)) {
              const copy = b.map((r) => [...r]);
              // eslint-disable-next-line no-param-reassign
              copy[row][col] = num;
              solve(copy);
            }
          }
        }
      }
    }
    if (!found) count += 1;
  }
  solve(board);
  return count;
}

function hasUniqueSolution(board: Board): boolean {
  return countSolutions(board, 2) === 1;
}

const CELLS_TO_REMOVE: Record<Difficulty, number> = {
  easy: 32,
  medium: 46,
  hard: 52,
  extreme: 58,
};

function getCellsByQuadrant(rng?: () => number): [number, number][][] {
  return Array.from({ length: 9 }, (_, q) => {
    const startRow = Math.floor(q / 3) * 3;
    const startCol = (q % 3) * 3;
    const cells: [number, number][] = [];
    for (let r = startRow; r < startRow + 3; r += 1) {
      for (let c = startCol; c < startCol + 3; c += 1) {
        cells.push([r, c]);
      }
    }
    return rng ? shuffleSeeded(cells, rng) : shuffle(cells);
  });
}

function removeNumbers(board: Board, difficulty: Difficulty, rng?: () => number): Board {
  const puzzle = board.map((row) => [...row]);
  const target = CELLS_TO_REMOVE[difficulty];
  const perQuadrant = Math.floor(target / 9);
  const extra = target % 9;
  const quadrants = getCellsByQuadrant(rng);
  let removed = 0;

  quadrants.forEach((cells, qi) => {
    const quota = perQuadrant + (qi < extra ? 1 : 0);
    let removedInQuadrant = 0;
    cells.some(([r, c]) => {
      if (removedInQuadrant >= quota) return true;
      const backup = puzzle[r][c];
      puzzle[r][c] = null;
      if (hasUniqueSolution(puzzle)) {
        removed += 1;
        removedInQuadrant += 1;
      } else {
        puzzle[r][c] = backup;
      }
      return false;
    });
  });

  if (removed < target) {
    const allCells = Array.from(
      { length: 81 },
      (_, i) => [Math.floor(i / 9), i % 9] as [number, number]
    );
    const remaining = (rng ? shuffleSeeded(allCells, rng) : shuffle(allCells)).filter(
      ([r, c]) => puzzle[r][c] !== null
    );
    remaining.some(([r, c]) => {
      if (removed >= target) return true;
      const backup = puzzle[r][c];
      puzzle[r][c] = null;
      if (hasUniqueSolution(puzzle)) {
        removed += 1;
      } else {
        puzzle[r][c] = backup;
      }
      return false;
    });
  }
  return puzzle;
}

export interface SudokuPuzzle {
  puzzle: Board;
  solution: Board;
}

export function generatePuzzle(difficulty: Difficulty = 'medium'): SudokuPuzzle {
  const solution = createEmptyBoard();
  fillBoard(solution);
  const puzzle = removeNumbers(solution, difficulty);
  return { puzzle, solution };
}

export function generateDailyPuzzle(seed: number, difficulty: Difficulty): SudokuPuzzle {
  const rng = createSeededRng(seed);
  const solution = createEmptyBoard();
  fillBoardSeeded(solution, rng);
  const puzzle = removeNumbers(solution, difficulty, rng);
  return { puzzle, solution };
}

export function checkMove(solution: Board, row: number, col: number, value: number): boolean {
  return solution[row][col] === value;
}

export function isSolved(current: Board, solution: Board): boolean {
  return current.every((row, r) => row.every((cell, c) => cell === solution[r][c]));
}

export type Notes = Set<number>[][];

export function createEmptyNotes(): Notes {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()));
}

export type Player = 'creator' | 'joiner' | 'spectator';

export interface CellState {
  value: number;
  player: Player;
}

export type CurrentBoard = (CellState | null)[][];

export function createEmptyCurrentBoard(): CurrentBoard {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}
