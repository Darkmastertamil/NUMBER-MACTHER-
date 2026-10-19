import { CellData } from '../types/game';

export function isMatch(a: number, b: number): boolean {
  return a === b || a + b === 10;
}

export function generate8x8Sheet(): CellData[] {
  const sum10Pairs = [
    [1, 9],
    [2, 8],
    [3, 7],
    [4, 6],
    [5, 5],
  ];

  const numbers: number[] = [];

  // Generate 32 pairs (total 64 numbers)
  for (let i = 0; i < 32; i++) {
    const useSum10 = Math.random() > 0.45;
    if (useSum10) {
      const pair = sum10Pairs[Math.floor(Math.random() * sum10Pairs.length)];
      numbers.push(pair[0], pair[1]);
    } else {
      const val = Math.floor(Math.random() * 9) + 1; // 1-9
      numbers.push(val, val);
    }
  }

  // Fisher-Yates shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  return numbers.map((val, idx) => ({
    id: idx,
    value: val,
    cleared: false,
    row: Math.floor(idx / 8),
    col: idx % 8,
  }));
}

/**
 * Finds any valid pair among uncleared cells
 */
export function findValidPair(cells: CellData[]): [number, number] | null {
  const uncleared = cells.filter((c) => !c.cleared);
  for (let i = 0; i < uncleared.length; i++) {
    for (let j = i + 1; j < uncleared.length; j++) {
      if (isMatch(uncleared[i].value, uncleared[j].value)) {
        return [uncleared[i].id, uncleared[j].id];
      }
    }
  }
  return null;
}

/**
 * Rearranges uncleared numbers among the uncleared cell spots
 */
export function shuffleUncleared(cells: CellData[]): CellData[] {
  const unclearedIndices: number[] = [];
  const unclearedValues: number[] = [];

  cells.forEach((cell, idx) => {
    if (!cell.cleared) {
      unclearedIndices.push(idx);
      unclearedValues.push(cell.value);
    }
  });

  // Shuffle remaining values
  for (let i = unclearedValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unclearedValues[i], unclearedValues[j]] = [unclearedValues[j], unclearedValues[i]];
  }

  const newCells = cells.map((c) => ({ ...c }));
  unclearedIndices.forEach((pos, i) => {
    newCells[pos].value = unclearedValues[i];
  });

  return newCells;
}

/**
 * Checks if a row (0-7) is fully cleared
 */
export function isRowCleared(cells: CellData[], row: number): boolean {
  for (let col = 0; col < 8; col++) {
    const idx = row * 8 + col;
    if (!cells[idx].cleared) return false;
  }
  return true;
}
