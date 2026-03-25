import type { Board, CurrentBoard, Notes } from '../utils/sudoku';
import SudokuCell from './SudokuCell';

interface SudokuBoardProps {
  puzzle: Board;
  current: CurrentBoard;
  solution: Board;
  selected: [number, number] | null;
  opponentSelected: [number, number] | null;
  notes: Notes;
  isNoteMode: boolean;
  isExtreme: boolean;
  onSelect: (row: number, col: number) => void;
}

function getBadgeStyle(done: boolean, isExtreme: boolean): string {
  if (done && isExtreme) return 'bg-[#1a0505] text-[#3a1010] border border-[#2a0808]';
  if (done) return 'bg-[#ddb8ea] text-[#b088ba] border border-[#c9a0d0]';
  if (isExtreme)
    return 'bg-[#1a1a1a] text-[#ef4444] border border-[#2a2a2a] hover:bg-[#2a2a2a] cursor-pointer';
  return 'bg-[#fce4f3] text-[#9b5fa5] border border-[#e9b8d9] hover:bg-[#f0d6eb] cursor-pointer';
}

function getCompletedNumbers(puzzle: Board, current: CurrentBoard, solution: Board): Set<number> {
  const completed = new Set<number>();
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((num) => {
    let count = 0;
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        const value = puzzle[r][c] !== null ? puzzle[r][c] : (current[r][c]?.value ?? null);
        if (value === num && value === solution[r][c]) {
          count += 1;
        }
      }
    }
    if (count === 9) completed.add(num);
  });
  return completed;
}

function findFirstCellWithNumber(
  num: number,
  puzzle: Board,
  current: CurrentBoard
): [number, number] | null {
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const value = puzzle[r][c] !== null ? puzzle[r][c] : (current[r][c]?.value ?? null);
      if (value === num) return [r, c];
    }
  }
  return null;
}

export default function SudokuBoard({
  puzzle,
  current,
  solution,
  selected,
  opponentSelected,
  notes,
  isNoteMode,
  isExtreme,
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
    const cell = current[row][col];
    if (!cell) return false;
    return cell.value !== solution[row][col];
  };

  const getValue = (row: number, col: number) => {
    if (puzzle[row][col] !== null) return puzzle[row][col];
    return current[row][col]?.value ?? null;
  };

  const getSelectedValue = () => {
    if (!selected) return null;
    const [sr, sc] = selected;
    return getValue(sr, sc);
  };

  const isSameNumber = (row: number, col: number) => {
    const selectedValue = getSelectedValue();
    if (selectedValue === null) return false;
    if (selected?.[0] === row && selected?.[1] === col) return false;
    return getValue(row, col) === selectedValue;
  };

  const handleBadgeClick = (num: number, done: boolean) => {
    if (done) return;
    const cell = findFirstCellWithNumber(num, puzzle, current);
    if (cell) {
      onSelect(cell[0], cell[1]);
    }
  };

  const completedNumbers = getCompletedNumbers(puzzle, current, solution);
  const boardBorder = isExtreme ? 'border-[#dc2626]' : 'border-[#9b5fa5]';

  return (
    <div className="flex items-stretch gap-2">
      <div className={`inline-grid grid-cols-9 border-2 ${boardBorder}`}>
        {current.flatMap((row, r) =>
          row.map((cell, c) => (
            <SudokuCell
              key={`cell-${r * 9 + c}`}
              value={getValue(r, c)}
              player={cell?.player ?? null}
              notes={notes[r][c]}
              isFixed={puzzle[r][c] !== null}
              isSelected={selected?.[0] === r && selected?.[1] === c}
              isOpponentSelected={opponentSelected?.[0] === r && opponentSelected?.[1] === c}
              isHighlighted={isHighlighted(r, c)}
              isSameNumber={isSameNumber(r, c)}
              isError={isError(r, c)}
              isNoteMode={isNoteMode}
              isExtreme={isExtreme}
              row={r}
              col={c}
              onClick={onSelect}
            />
          ))
        )}
      </div>

      {/* Badges de números completos */}
      <div className="flex flex-col justify-between py-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const done = completedNumbers.has(num);
          return (
            <button
              key={num}
              type="button"
              title={done ? `${num} completo!` : `Destacar ${num}`}
              onClick={() => handleBadgeClick(num, done)}
              disabled={done}
              className={`
                w-5 h-5 sm:w-6 sm:h-6
                flex items-center justify-center
                rounded-full text-[10px] sm:text-xs font-bold
                transition-all duration-300
                ${getBadgeStyle(done, isExtreme)}
              `}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
