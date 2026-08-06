import { initSuggest } from './suggest.js';
import { loadInstantWinItems, loadItems } from './csv.js';
import { clearInstantWinLayout, fitCells, fitTextToCell, layoutInstantWin } from './fit-text.js';
import { buildContext, filterEligibleItems } from './filters.js';
import { findCompletedLines, formatVictoryMessage, generateGrid } from './grid.js';

const hostsGroup = document.getElementById('hosts-group');
const miscGroup = document.getElementById('misc-group');
const generateBtn = document.getElementById('generate-btn');
const statusMsg = document.getElementById('status-msg');
const gameSection = document.getElementById('game-section');
const gridEl = document.getElementById('bingo-grid');
const instantWinCell = document.getElementById('instant-win-cell');
const instantWinLabel = document.getElementById('instant-win-label');
const confirmBtn = document.getElementById('confirm-btn');
const shareArea = document.getElementById('share-area');
const victorySection = document.getElementById('victory-section');
const victoryMessage = document.getElementById('victory-message');
const copyBtn = document.getElementById('copy-btn');
const copyFeedback = document.getElementById('copy-feedback');
const instantWinSection = document.getElementById('instant-win-section');
const instantWinMessage = document.getElementById('instant-win-message');
const instantWinCopyBtn = document.getElementById('instant-win-copy-btn');
const instantWinCopyFeedback = document.getElementById('instant-win-copy-feedback');

let allItems = [];
let instantWinItems = [];
let currentGrid = [];
let currentInstantWin = '';
let marked = Array(9).fill(false);
let activeLine = null;

init();

async function init() {
  try {
    [allItems, instantWinItems] = await Promise.all([
      loadItems(),
      loadInstantWinItems(),
    ]);
    generateBtn.addEventListener('click', handleGenerate);
    confirmBtn.addEventListener('click', handleConfirm);
    copyBtn.addEventListener('click', () => handleCopy(victoryMessage, copyFeedback));
    instantWinCopyBtn.addEventListener('click', () => handleCopy(instantWinMessage, instantWinCopyFeedback));
    victoryMessage.addEventListener('click', () => handleCopy(victoryMessage, copyFeedback));
    instantWinMessage.addEventListener('click', () => handleCopy(instantWinMessage, instantWinCopyFeedback));
    instantWinCell.addEventListener('click', handleInstantWinClick);
    window.addEventListener('resize', handleBoardResize);
    initSuggest();
  } catch (error) {
    statusMsg.textContent = error.message;
    generateBtn.disabled = true;
  }
}

function getSelectedHosts() {
  return [...hostsGroup.querySelectorAll('input:checked')].map((input) => input.value);
}

function getMiscFlags() {
  const checked = [...miscGroup.querySelectorAll('input:checked')].map((input) => input.value);
  return {
    mailbag: checked.includes('mailbag'),
    mockDraft: checked.includes('draft'),
  };
}

function setShareBlockVisible(section, visible) {
  section.classList.toggle('is-visible', visible);
}

function updateShareAreaVisibility() {
  const anyVisible = victorySection.classList.contains('is-visible')
    || instantWinSection.classList.contains('is-visible');
  shareArea.classList.toggle('is-visible', anyVisible);
}

function handleGenerate() {
  statusMsg.textContent = '';
  setShareBlockVisible(victorySection, false);
  setShareBlockVisible(instantWinSection, false);
  updateShareAreaVisibility();
  copyFeedback.textContent = '';
  instantWinCopyFeedback.textContent = '';
  activeLine = null;
  marked = Array(9).fill(false);
  confirmBtn.disabled = true;

  const context = buildContext({
    hosts: getSelectedHosts(),
    ...getMiscFlags(),
  });

  const eligible = filterEligibleItems(allItems, context);

  try {
    currentGrid = generateGrid(eligible);
    currentInstantWin = pickInstantWin(context);
  } catch (error) {
    statusMsg.textContent = error.message;
    gameSection.hidden = true;
    return;
  }

  renderBoard();
  gameSection.hidden = false;
}

function pickInstantWin(context) {
  const eligible = filterEligibleItems(instantWinItems, context);
  if (eligible.length === 0) {
    throw new Error('No instant win items match the current filters.');
  }
  return eligible[Math.floor(Math.random() * eligible.length)].item;
}

function renderBoard() {
  gridEl.innerHTML = '';
  const cells = [];

  currentGrid.forEach((item, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.text = item.item;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-pressed', 'false');
    cell.addEventListener('click', () => toggleCell(index, cell));
    gridEl.appendChild(cell);
    cells.push(cell);
  });

  instantWinCell.classList.remove('instant-win-marked');
  instantWinCell.setAttribute('aria-pressed', 'false');
  instantWinCell.dataset.text = currentInstantWin;
  clearInstantWinLayout(instantWinLabel, instantWinCell);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fitCells(cells, { minPx: 8, maxPx: 26, fontScale: 0.75 });
      layoutInstantWin(gridEl, instantWinLabel, instantWinCell);
      fitTextToCell(instantWinCell, currentInstantWin, { minPx: 8, maxPx: 22, fontScale: 0.75 });
    });
  });
}

function handleBoardResize() {
  if (gameSection.hidden || gridEl.children.length === 0) return;
  layoutInstantWin(gridEl, instantWinLabel, instantWinCell);
  fitTextToCell(instantWinCell, currentInstantWin, { minPx: 8, maxPx: 22, fontScale: 0.75 });
}

function toggleCell(index, cell) {
  marked[index] = !marked[index];
  cell.classList.toggle('marked', marked[index]);
  cell.setAttribute('aria-pressed', String(marked[index]));

  const completedLines = findCompletedLines(marked);
  if (completedLines.length > 0) {
    activeLine = completedLines[0];
    confirmBtn.disabled = false;
  } else {
    activeLine = null;
    confirmBtn.disabled = true;
    setShareBlockVisible(victorySection, false);
    updateShareAreaVisibility();
  }
}

function handleInstantWinClick() {
  const isMarked = instantWinCell.classList.toggle('instant-win-marked');
  instantWinCell.setAttribute('aria-pressed', String(isMarked));

  if (isMarked) {
    instantWinMessage.textContent = `INSTANT WIN!!: ${currentInstantWin}`;
    setShareBlockVisible(instantWinSection, true);
    instantWinCopyFeedback.textContent = '';
  } else {
    setShareBlockVisible(instantWinSection, false);
  }

  updateShareAreaVisibility();
}

function handleConfirm() {
  if (!activeLine) return;

  const winningItems = activeLine.map((index) => currentGrid[index]);
  victoryMessage.textContent = formatVictoryMessage(winningItems);
  setShareBlockVisible(victorySection, true);
  copyFeedback.textContent = '';
  updateShareAreaVisibility();
}

async function handleCopy(messageEl, feedbackEl) {
  const text = messageEl.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    feedbackEl.textContent = 'Copied!';
  } catch {
    feedbackEl.textContent = 'Copy failed — select and copy manually.';
  }
}
