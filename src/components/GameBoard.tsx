import React from 'react';
import { CellData } from '../types/game';

interface GameBoardProps {
  cells: CellData[];
  selectedIndices: number[];
  shakingIndices: number[];
  hintIndices: number[];
  wavingRow: number | null;
  onCellClick: (index: number) => void;
}

// Pastel color palette for digits 1-9
export const DIGIT_THEMES: Record<
  number,
  { bg: string; text: string; border: string; shadow: string }
> = {
  1: { bg: 'bg-[#E8D7FF]', text: 'text-[#4C1D95]', border: 'border-[#C4B5FD]', shadow: '#C4B5FD' },
  2: { bg: 'bg-[#BAE6FD]', text: 'text-[#0369A1]', border: 'border-[#7DD3FC]', shadow: '#7DD3FC' },
  3: { bg: 'bg-[#A7F3D0]', text: 'text-[#065F46]', border: 'border-[#6EE7B7]', shadow: '#6EE7B7' },
  4: { bg: 'bg-[#BBF7D0]', text: 'text-[#166534]', border: 'border-[#86EFAC]', shadow: '#86EFAC' },
  5: { bg: 'bg-[#FEF08A]', text: 'text-[#854D0E]', border: 'border-[#FDE047]', shadow: '#FDE047' },
  6: { bg: 'bg-[#FED7AA]', text: 'text-[#9A3412]', border: 'border-[#FDBA74]', shadow: '#FDBA74' },
  7: { bg: 'bg-[#FECDD3]', text: 'text-[#9F1239]', border: 'border-[#FDA4AF]', shadow: '#FDA4AF' },
  8: { bg: 'bg-[#FBCFE8]', text: 'text-[#831843]', border: 'border-[#F472B6]', shadow: '#F472B6' },
  9: { bg: 'bg-[#DDD6FE]', text: 'text-[#5B21B6]', border: 'border-[#A78BFA]', shadow: '#A78BFA' },
};

export const GameBoard: React.FC<GameBoardProps> = ({
  cells,
  selectedIndices,
  shakingIndices,
  hintIndices,
  wavingRow,
  onCellClick,
}) => {
  return (
    <div className="h-[55%] w-full flex items-center justify-center p-2 shrink-0">
      {/* Sized to fit neatly inside the vertical budget and width */}
      <div className="relative aspect-square w-full max-w-[min(94vw,50dvh)] max-h-[min(94vw,50dvh)] bg-white/5 rounded-2xl p-1.5 border border-white/10 shadow-inner grid grid-cols-8 grid-rows-8 gap-1.5">
        {cells.map((cell) => {
          const isSelected = selectedIndices.includes(cell.id);
          const isShaking = shakingIndices.includes(cell.id);
          const isHinted = hintIndices.includes(cell.id);
          const isWaving = wavingRow !== null && cell.row === wavingRow;
          const theme = DIGIT_THEMES[cell.value] || DIGIT_THEMES[1];

          if (cell.cleared) {
            return (
              <div
                key={cell.id}
                className="w-full h-full rounded-xl bg-white/[0.03] border border-white/[0.04] transition-all duration-300"
              />
            );
          }

          return (
            <button
              key={cell.id}
              onClick={() => onCellClick(cell.id)}
              className={`relative w-full h-full rounded-xl flex items-center justify-center font-black select-none transition-all duration-150 active:scale-95 border-b-[3px] ${
                theme.bg
              } ${theme.text} ${theme.border} ${
                isSelected
                  ? 'ring-4 ring-pink-400 ring-offset-2 ring-offset-[#201b33] scale-105 z-10 shadow-lg animate-pulse'
                  : ''
              } ${
                isShaking
                  ? 'animate-shake ring-4 ring-rose-500 bg-rose-200 text-rose-900 z-10'
                  : ''
              } ${
                isHinted && !isSelected
                  ? 'ring-4 ring-amber-300 ring-offset-1 ring-offset-[#201b33] scale-105 animate-bounce z-10'
                  : ''
              } ${isWaving ? 'animate-pulse scale-110 z-10' : ''}`}
              style={{
                fontSize: 'clamp(1rem, 4.2vw, 1.45rem)',
                boxShadow: isSelected
                  ? '0 6px 16px rgba(244, 114, 182, 0.5)'
                  : '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              {cell.value}
            </button>
          );
        })}
      </div>
    </div>
  );
};
