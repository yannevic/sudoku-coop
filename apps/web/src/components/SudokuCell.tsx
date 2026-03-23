import type { Player } from '../utils/sudoku';

interface SudokuCellProps {
  value: number | null;
  player: Player | null;
  notes: Set<number>;
  isFixed: boolean;
  isSelected: boolean;
  isOpponentSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  isError: boolean;
  isNoteMode: boolean;
  isExtreme: boolean;
  row: number;
  col: number;
  onClick: (row: number, col: number) => void;
}

function getBg(
  isSelected: boolean,
  isOpponentSelected: boolean,
  isError: boolean,
  isSameNumber: boolean,
  isHighlighted: boolean,
  isNoteMode: boolean,
  isExtreme: boolean
): string {
  if (isExtreme) {
    if (isSelected) return isNoteMode ? 'bg-[#7f1d1d]' : 'bg-[#dc2626]';
    if (isOpponentSelected) return 'bg-[#1a3a1a]';
    if (isError) return 'bg-[#450a0a]';
    if (isSameNumber) return 'bg-[#431407]';
    if (isHighlighted) return 'bg-[#1c1c1c]';
    return 'bg-[#111111]';
  }
  if (isSelected) return isNoteMode ? 'bg-[#f0b8d9]' : 'bg-[#f37eb9]';
  if (isOpponentSelected) return 'bg-[#d1fae5]';
  if (isError) return 'bg-red-200';
  if (isSameNumber) return 'bg-[#bae6fd]';
  if (isHighlighted) return 'bg-[#fce4f3]';
  return 'bg-white';
}

function getTextColor(
  isFixed: boolean,
  isError: boolean,
  isSelected: boolean,
  isOpponentSelected: boolean,
  player: Player | null,
  isExtreme: boolean
): string {
  if (isExtreme) {
    if (isFixed) return 'text-[#f97316]';
    if (isError) return 'text-[#ff4444]';
    if (isSelected) return 'text-white';
    if (isOpponentSelected) return 'text-[#4ade80]';
    if (player === 'creator') return 'text-[#ff6b6b]';
    if (player === 'joiner') return 'text-[#ffd93d]';
    return 'text-[#ef4444]';
  }
  if (isFixed) return 'text-[#2563a8]';
  if (isError) return 'text-red-500';
  if (isSelected) return 'text-white';
  if (isOpponentSelected) return 'text-[#059669]';
  if (player === 'creator') return 'text-[#f37eb9]';
  if (player === 'joiner') return 'text-[#22a5e0]';
  return 'text-[#9b5fa5]';
}

function getTextWeight(isFixed: boolean, isSelected: boolean, player: Player | null): string {
  if (isFixed) return 'font-bold';
  if (isSelected) return 'font-medium';
  if (player !== null) return 'font-medium';
  return 'font-normal';
}

function getNoteColor(visible: boolean, extreme: boolean): string {
  if (!visible) return 'text-transparent';
  return extreme ? 'text-[#f97316]' : 'text-[#9b5fa5]';
}

export default function SudokuCell({
  value,
  player,
  notes,
  isFixed,
  isSelected,
  isOpponentSelected,
  isHighlighted,
  isSameNumber,
  isError,
  isNoteMode,
  isExtreme,
  row,
  col,
  onClick,
}: SudokuCellProps) {
  const borderRight =
    (col + 1) % 3 === 0 && col !== 8
      ? `border-r-2 ${isExtreme ? 'border-r-[#dc2626]' : 'border-r-[#9b5fa5]'}`
      : '';
  const borderBottom =
    (row + 1) % 3 === 0 && row !== 8
      ? `border-b-2 ${isExtreme ? 'border-b-[#dc2626]' : 'border-b-[#9b5fa5]'}`
      : '';

  const borderColor = isExtreme ? 'border-[#2a2a2a]' : 'border-[#e9b8d9]';
  const bg = getBg(
    isSelected,
    isOpponentSelected,
    isError,
    isSameNumber,
    isHighlighted,
    isNoteMode,
    isExtreme
  );
  const textColor = getTextColor(
    isFixed,
    isError,
    isSelected,
    isOpponentSelected,
    player,
    isExtreme
  );
  const textWeight = getTextWeight(isFixed, isSelected, player);

  return (
    <button
      type="button"
      onClick={() => onClick(row, col)}
      className={`
        w-8 h-8 sm:w-14 sm:h-14
        flex items-center justify-center
        text-sm sm:text-xl
        border cursor-pointer transition-colors duration-100 relative
        ${borderColor} ${borderRight} ${borderBottom} ${bg} ${textColor} ${textWeight}
      `}
    >
      {value !== null ? (
        <span>{value}</span>
      ) : (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span
              key={n}
              className={`flex items-center justify-center text-[6px] sm:text-[8px] leading-none font-medium ${getNoteColor(notes.has(n), isExtreme)}`}
            >
              {n}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
