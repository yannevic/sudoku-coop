import type { Board, Notes } from '../utils/sudoku';
import SudokuCell from './SudokuCell';

interface SudokuBoardProps {
  puzzle: Board;
  current: Board;
  solution: Board;
  selected: [number, number] | null;
  notes: Notes;
  isNoteMode: boolean;
  onSelect: (row: number, col: number) => void;
}

export default function SudokuBoard({
  puzzle,
  current,
  solution,
  selected,
  notes,
  isNoteMode,
  onSelect,
}: SudokuBoardProps) {
  const isHighlighted = (row: number, col: number) => {
    if (!selected) return false;
    const [sr, sc] = selected;
    return (
      row === sr ||
      col === sc ||
      (Math.floor(row / 3) === Math.floor(sr / 3) && Math.floor(col / 3) === Math.floor(sc / 3))
    );
  };

  const isError = (row: number, col: number) => {
    const val = current[row][col];
    if (!val) return false;
    return val !== solution[row][col];
  };

  return (
    <div className="inline-grid grid-cols-9 border-2 border-[#9b5fa5]">
      {current.flatMap((row, r) =>
        row.map((cell, c) => (
          <SudokuCell
            key={`cell-${r * 9 + c}`}
            value={cell}
            notes={notes[r][c]}
            isFixed={puzzle[r][c] !== null}
            isSelected={selected?.[0] === r && selected?.[1] === c}
            isHighlighted={isHighlighted(r, c)}
            isError={isError(r, c)}
            isNoteMode={isNoteMode}
            row={r}
            col={c}
            onClick={onSelect}
          />
        ))
      )}
    </div>
  );
}
