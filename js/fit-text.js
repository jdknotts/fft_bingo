export function fitTextToCell(cell, text, { minPx = 7, maxPx = 15 } = {}) {
  cell.textContent = text;
  cell.style.fontSize = `${maxPx}px`;

  const fits = () =>
    cell.scrollHeight <= cell.clientHeight + 1
    && cell.scrollWidth <= cell.clientWidth + 1;

  if (fits()) {
    return;
  }

  let low = minPx;
  let high = maxPx;
  let best = minPx;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    cell.style.fontSize = `${mid}px`;
    if (fits()) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  cell.style.fontSize = `${best}px`;
}

export function fitCells(cells, options) {
  requestAnimationFrame(() => {
    cells.forEach((cell) => fitTextToCell(cell, cell.dataset.text ?? cell.textContent, options));
  });
}
