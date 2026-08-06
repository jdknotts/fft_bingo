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

const BOARD_GAP_PX = 6;
const LABEL_GAP_PX = 4;

export function layoutInstantWin(gridEl, instantWinLabel, instantWinCell) {
  const sampleCell = gridEl.querySelector('.cell');
  const row2LeftCell = gridEl.children[3];

  if (!sampleCell || !row2LeftCell) return;

  const cellW = sampleCell.offsetWidth;
  const cellH = sampleCell.offsetHeight;
  const left = gridEl.offsetWidth + BOARD_GAP_PX;
  const cellTop = row2LeftCell.offsetTop;

  instantWinCell.style.width = `${cellW}px`;
  instantWinCell.style.height = `${cellH}px`;
  instantWinCell.style.left = `${left}px`;
  instantWinCell.style.top = `${cellTop}px`;

  instantWinLabel.style.width = `${cellW}px`;
  instantWinLabel.style.left = `${left}px`;
  instantWinLabel.style.top = `${cellTop - instantWinLabel.offsetHeight - LABEL_GAP_PX}px`;
}

export function clearInstantWinLayout(instantWinLabel, instantWinCell) {
  [instantWinLabel, instantWinCell].forEach((el) => {
    el.style.width = '';
    el.style.height = '';
    el.style.left = '';
    el.style.top = '';
  });
}
