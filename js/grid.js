const BINGO_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateGrid(eligibleItems) {
  if (eligibleItems.length < 9) {
    throw new Error(`Need at least 9 eligible items, found ${eligibleItems.length}.`);
  }

  const selected = shuffle(eligibleItems).slice(0, 9);
  const centerEligible = selected.filter((item) => item.center);

  if (centerEligible.length === 0) {
    return shuffle(selected);
  }

  const centerItem = centerEligible[Math.floor(Math.random() * centerEligible.length)];
  const rest = shuffle(selected.filter((item) => item !== centerItem));

  return [
    rest[0], rest[1], rest[2],
    rest[3], centerItem, rest[4],
    rest[5], rest[6], rest[7],
  ];
}

export function findCompletedLines(marked) {
  return BINGO_LINES.filter((line) => line.every((index) => marked[index]));
}

export function formatVictoryMessage(items) {
  const parts = items.map((item, index) => `${index + 1}. ${item.short}`);
  return `FFT BINGO!! ${parts.join(' ')}`;
}

export function isTurboBingo(marked) {
  return marked.length === 9 && marked.every(Boolean);
}

export function formatTurboVictoryMessage(items) {
  const parts = items.map((item, index) => `${index + 1}. ${item.short}`);
  return `FFT TURBO BINGO!!!! ${parts.join(' ')}`;
}

export function formatInstantWinMessage(itemText) {
  return `FFT BINGO INSTANT WIN!!: ${itemText}`;
}

export { BINGO_LINES };
