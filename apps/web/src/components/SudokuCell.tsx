interface SudokuCellProps {
  value: number | null;
  notes: Set<number>;
  isFixed: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isError: boolean;
  isNoteMode: boolean;
  row: number;
  col: number;
  onClick: (row: number, col: number) => void;
}

export default function SudokuCell({
  value,
  notes,
  isFixed,
  isSelected,
  isHighlighted,
  isError,
  isNoteMode,
  row,
  col,
  onClick,
}: SudokuCellProps) {
  const borderRight = (col + 1) % 3 === 0 && col !== 8 ? 'border-r-2 border-r-[#9b5fa5]' : '';
  const borderBottom = (row + 1) % 3 === 0 && row !== 8 ? 'border-b-2 border-b-[#9b5fa5]' : '';

  const getBg = () => {
    if (isSelected) return isNoteMode ? 'bg-[#f0b8d9]' : 'bg-[#f37eb9]';
    if (isError) return 'bg-red-200';
    if (isHighlighted) return 'bg-[#fce4f3]';
    return 'bg-white';
  };

  const getText = () => {
    if (isFixed) return 'text-[#2563a8] font-bold';
    if (isError) return 'text-red-500';
    if (isSelected) return 'text-white font-medium';
    return 'text-[#9b5fa5]';
  };

  return (
    <button
      type="button"
      onClick={() => onClick(row, col)}
      className={`
        w-14 h-14 flex items-center justify-center text-xl border border-[#e9b8d9]
        cursor-pointer transition-colors duration-100 relative
        ${borderRight} ${borderBottom} ${getBg()} ${getText()}
      `}
    >
      {value !== null ? (
        <span>{value}</span>
      ) : (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span
              key={n}
              className={`flex items-center justify-center text-[8px] leading-none font-medium ${
                notes.has(n) ? 'text-[#9b5fa5]' : 'text-transparent'
              }`}
            >
              {n}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
