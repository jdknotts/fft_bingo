export function fitTextToCell(cell, text, { minPx = 8, maxPx = 28, fontScale = 1 } = {}) {
  let textEl = cell.querySelector('.cell-text');
  if (!textEl) {
    textEl = document.createElement('span');
    textEl.className = 'cell-text';
    cell.appendChild(textEl);
  }

  textEl.textContent = text;

  const fits = (sizePx) => {
    textEl.style.fontSize = `${sizePx}px`;
    return (
      textEl.scrollHeight <= cell.clientHeight
      && textEl.scrollWidth <= cell.clientWidth
    );
  };

  let low = minPx;
  let high = maxPx;
  let best = minPx;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (fits(mid)) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const scaled = Math.max(minPx, Math.round(best * fontScale));
  textEl.style.fontSize = `${scaled}px`;
}

export function fitCells(cells, options) {
  cells.forEach((cell) => {
    fitTextToCell(cell, cell.dataset.text ?? cell.textContent, options);
  });
}
