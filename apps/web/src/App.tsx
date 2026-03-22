import { useState, useEffect, useCallback } from 'react';
import SudokuBoard from './components/SudokuBoard';
import { generatePuzzle, createEmptyNotes } from './utils/sudoku';
import type { Board, Difficulty, Notes } from './utils/sudoku';

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [puzzle, setPuzzle] = useState<Board>([]);
  const [current, setCurrent] = useState<Board>([]);
  const [solution, setSolution] = useState<Board>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [notes, setNotes] = useState<Notes>([]);
  const [isNoteMode, setIsNoteMode] = useState(false);

  const startGame = useCallback((diff: Difficulty) => {
    const { puzzle: p, solution: s } = generatePuzzle(diff);
    setPuzzle(p);
    setCurrent(p.map((row) => [...row]));
    setSolution(s);
    setSelected(null);
    setNotes(createEmptyNotes());
    setIsNoteMode(false);
  }, []);

  useEffect(() => {
    startGame(difficulty);
  }, [startGame, difficulty]);

  const handleSelect = (row: number, col: number) => {
    setSelected([row, col]);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsNoteMode((prev) => !prev);
        return;
      }

      if (!selected) return;
      const [r, c] = selected;
      if (puzzle[r][c] !== null) return;

      const num = parseInt(e.key, 10);

      if (num >= 1 && num <= 9) {
        if (isNoteMode) {
          setNotes((prev) => {
            const next = prev.map((row) => row.map((cell) => new Set(cell)));
            if (next[r][c].has(num)) {
              next[r][c].delete(num);
            } else {
              next[r][c].add(num);
            }
            return next;
          });
        } else {
          setCurrent((prev) => {
            const next = prev.map((row) => [...row]);
            next[r][c] = num;
            return next;
          });
          setNotes((prev) => {
            const next = prev.map((row) => row.map((cell) => new Set(cell)));
            next[r][c].clear();
            return next;
          });
        }
      }

      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setCurrent((prev) => {
          const next = prev.map((row) => [...row]);
          next[r][c] = null;
          return next;
        });
        setNotes((prev) => {
          const next = prev.map((row) => row.map((cell) => new Set(cell)));
          next[r][c].clear();
          return next;
        });
      }
    },
    [selected, puzzle, isNoteMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold text-[#f37eb9]">Sudoku Coop</h1>

      <div className="flex gap-2">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDifficulty(d);
              startGame(d);
            }}
            className={`px-4 py-1 rounded capitalize text-sm font-medium transition-colors ${
              difficulty === d
                ? 'bg-[#f37eb9] text-white'
                : 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {current.length > 0 && (
        <SudokuBoard
          puzzle={puzzle}
          current={current}
          solution={solution}
          selected={selected}
          notes={notes}
          isNoteMode={isNoteMode}
          onSelect={handleSelect}
        />
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsNoteMode((prev) => !prev)}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
            isNoteMode
              ? 'bg-[#9b5fa5] text-white'
              : 'bg-white text-gray-700 border border-[#e9b8d9] hover:bg-[#fce4f3]'
          }`}
        >
          ✏️ {isNoteMode ? 'Lápis ativado' : 'Lápis'}{' '}
          <span className="text-xs opacity-70">(Tab)</span>
        </button>

        <button
          type="button"
          onClick={() => startGame(difficulty)}
          className="px-6 py-2 bg-[#f37eb9] text-white rounded hover:bg-[#e06aa5] transition-colors"
        >
          Novo jogo
        </button>
      </div>
    </div>
  );
}
