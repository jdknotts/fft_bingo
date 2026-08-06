import { initSuggest } from './suggest.js';
import { applyDailyDefaults } from './daily-presets.js';
import { loadInstantWinItems, loadItems } from './csv.js';
import { clearInstantWinLayout, fitCells, fitTextToCell, layoutInstantWin } from './fit-text.js';
import { buildContext, filterEligibleItems } from './filters.js';
import { findCompletedLines, formatInstantWinMessage, formatTurboVictoryMessage, formatVictoryMessage, generateGrid, isTurboBingo } from './grid.js';

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
const victoryList = document.getElementById('victory-list');
const instantWinSection = document.getElementById('instant-win-section');
const instantWinMessage = document.getElementById('instant-win-message');
const instantWinCopyBtn = document.getElementById('instant-win-copy-btn');
const instantWinCopyFeedback = document.getElementById('instant-win-copy-feedback');
const displayDateEl = document.getElementById('display-date');

let allItems = [];
let instantWinItems = [];
let currentGrid = [];
let currentInstantWin = '';
let marked = Array(9).fill(false);

const COPY_PROMPT = '⧉ Copy victory text to share in YouTube chat.';

init();

function formatDisplayDate(date = new Date()) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${weekdays[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function syncPanelWidth() {
  const appStack = document.querySelector('.app-stack');
  const controlRow = document.querySelector('.control-row');
  if (!appStack || !controlRow) return;

  appStack.style.width = 'fit-content';
  appStack.style.width = `${Math.ceil(controlRow.getBoundingClientRect().width)}px`;
}

async function init() {
  try {
    await applyDailyDefaults(hostsGroup, miscGroup);
    [allItems, instantWinItems] = await Promise.all([
      loadItems(),
      loadInstantWinItems(),
    ]);
    if (displayDateEl) {
      displayDateEl.textContent = formatDisplayDate();
    }
    syncPanelWidth();
    generateBtn.addEventListener('click', handleGenerate);
    confirmBtn.addEventListener('click', handleConfirm);
    instantWinCopyBtn.addEventListener('click', () => handleCopy(instantWinMessage, instantWinCopyFeedback));
    instantWinMessage.addEventListener('click', () => handleCopy(instantWinMessage, instantWinCopyFeedback));
    instantWinCell.addEventListener('click', handleInstantWinClick);
    window.addEventListener('resize', handleResize);
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

function clearVictoryList() {
  victoryList.innerHTML = '';
}

function clearVictoryDisplay() {
  setShareBlockVisible(victorySection, false);
  clearVictoryList();
  updateShareAreaVisibility();
}

function renderVictoryEntries(messages) {
  clearVictoryList();

  messages.forEach((text) => {
    const entry = document.createElement('div');
    entry.className = 'victory-entry';

    const message = document.createElement('p');
    message.className = 'share-message';
    message.textContent = text;

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'secondary-btn copy-btn';
    copyButton.textContent = COPY_PROMPT;

    const feedback = document.createElement('span');
    feedback.className = 'copy-feedback';
    feedback.setAttribute('aria-live', 'polite');

    message.addEventListener('click', () => handleCopy(message, feedback));
    copyButton.addEventListener('click', () => handleCopy(message, feedback));

    entry.append(message, copyButton, feedback);
    victoryList.appendChild(entry);
  });
}

function handleGenerate() {
  statusMsg.textContent = '';
  setShareBlockVisible(victorySection, false);
  setShareBlockVisible(instantWinSection, false);
  updateShareAreaVisibility();
  clearVictoryList();
  instantWinCopyFeedback.textContent = '';
  marked = Array(9).fill(false);
  resetConfirmButton();

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
  syncPanelWidth();
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
      syncPanelWidth();
      fitCells(cells, { minPx: 8, maxPx: 22, fontScale: 0.75 });
      layoutInstantWin(gridEl, instantWinLabel, instantWinCell);
      fitTextToCell(instantWinCell, currentInstantWin, { minPx: 8, maxPx: 20, fontScale: 0.75 });
    });
  });
}

function handleResize() {
  syncPanelWidth();
  if (gameSection.hidden || gridEl.children.length === 0) return;
  const cells = [...gridEl.querySelectorAll('.cell')];
  fitCells(cells, { minPx: 8, maxPx: 22, fontScale: 0.75 });
  layoutInstantWin(gridEl, instantWinLabel, instantWinCell);
  fitTextToCell(instantWinCell, currentInstantWin, { minPx: 8, maxPx: 20, fontScale: 0.75 });
}

function resetConfirmButton() {
  confirmBtn.textContent = 'CONFIRM BINGO!?';
  confirmBtn.classList.remove('turbo-bingo');
  confirmBtn.disabled = true;
}

function updateConfirmButton() {
  const completedLines = findCompletedLines(marked);
  if (isTurboBingo(marked)) {
    confirmBtn.textContent = 'CONFIRM TURBO BINGO!?!?!?!?';
    confirmBtn.classList.add('turbo-bingo');
    confirmBtn.disabled = false;
    return;
  }

  confirmBtn.textContent = 'CONFIRM BINGO!?';
  confirmBtn.classList.remove('turbo-bingo');
  if (completedLines.length > 0) {
    confirmBtn.disabled = false;
  } else {
    confirmBtn.disabled = true;
    clearVictoryDisplay();
  }
}

function toggleCell(index, cell) {
  if (victorySection.classList.contains('is-visible')) {
    clearVictoryDisplay();
  }

  marked[index] = !marked[index];
  cell.classList.toggle('marked', marked[index]);
  cell.setAttribute('aria-pressed', String(marked[index]));
  updateConfirmButton();
}

function handleInstantWinClick() {
  const isMarked = instantWinCell.classList.toggle('instant-win-marked');
  instantWinCell.setAttribute('aria-pressed', String(isMarked));

  if (isMarked) {
    instantWinMessage.textContent = formatInstantWinMessage(currentInstantWin);
    setShareBlockVisible(instantWinSection, true);
    instantWinCopyFeedback.textContent = '';
  } else {
    setShareBlockVisible(instantWinSection, false);
  }

  updateShareAreaVisibility();
}

function handleConfirm() {
  if (isTurboBingo(marked)) {
    renderVictoryEntries([formatTurboVictoryMessage(currentGrid)]);
  } else {
    const completedLines = findCompletedLines(marked);
    if (completedLines.length === 0) return;

    const messages = completedLines.map((line) => {
      const winningItems = line.map((index) => currentGrid[index]);
      return formatVictoryMessage(winningItems);
    });
    renderVictoryEntries(messages);
  }

  setShareBlockVisible(victorySection, true);
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
