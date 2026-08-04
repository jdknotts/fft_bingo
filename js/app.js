import { initSuggest } from './suggest.js';
import { loadInstantWinItems, loadItems } from './csv.js';
import { fitCells, fitTextToCell, sizeInstantWinCell } from './fit-text.js';
import { buildContext, filterEligibleItems } from './filters.js';
import { findCompletedLines, formatVictoryMessage, generateGrid } from './grid.js';

const hostsGroup = document.getElementById('hosts-group');
const miscGroup = document.getElementById('misc-group');
const generateBtn = document.getElementById('generate-btn');
const statusMsg = document.getElementById('status-msg');
const gameSection = document.getElementById('game-section');
const gridEl = document.getElementById('bingo-grid');
const instantWinCell = document.getElementById('instant-win-cell');
const confirmBtn = document.getElementById('confirm-btn');
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

function handleGenerate() {
  statusMsg.textContent = '';
  victorySection.hidden = true;
  instantWinSection.hidden = true;
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
    currentInstantWin = pickInstantWin();
  } catch (error) {
    statusMsg.textContent = error.message;
    gameSection.hidden = true;
    return;
  }

  renderBoard();
  gameSection.hidden = false;
}

function pickInstantWin() {
  if (instantWinItems.length === 0) {
    throw new Error('No instant win items available.');
  }
  return instantWinItems[Math.floor(Math.random() * instantWinItems.length)];
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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fitCells(cells, { minPx: 8, maxPx: 26 });
      sizeInstantWinCell(instantWinCell, gridEl);
      fitTextToCell(instantWinCell, currentInstantWin, { minPx: 7, maxPx: 16 });
    });
  });
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
    victorySection.hidden = true;
  }
}

function handleInstantWinClick() {
  const isMarked = instantWinCell.classList.toggle('instant-win-marked');
  instantWinCell.setAttribute('aria-pressed', String(isMarked));

  if (isMarked) {
    instantWinMessage.textContent = `INSTANT WIN: ${currentInstantWin}`;
    instantWinSection.hidden = false;
    instantWinCopyFeedback.textContent = '';
  } else {
    instantWinSection.hidden = true;
  }
}

function handleConfirm() {
  if (!activeLine) return;

  const winningItems = activeLine.map((index) => currentGrid[index]);
  victoryMessage.textContent = formatVictoryMessage(winningItems);
  victorySection.hidden = false;
  copyFeedback.textContent = '';
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
