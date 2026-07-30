import { loadItems } from './csv.js';
import { buildContext, filterEligibleItems } from './filters.js';
import { findCompletedLines, formatVictoryMessage, generateGrid } from './grid.js';

const hostsGroup = document.getElementById('hosts-group');
const miscGroup = document.getElementById('misc-group');
const generateBtn = document.getElementById('generate-btn');
const statusMsg = document.getElementById('status-msg');
const gameSection = document.getElementById('game-section');
const gridEl = document.getElementById('bingo-grid');
const confirmBtn = document.getElementById('confirm-btn');
const victorySection = document.getElementById('victory-section');
const victoryMessage = document.getElementById('victory-message');
const copyBtn = document.getElementById('copy-btn');
const copyFeedback = document.getElementById('copy-feedback');

let allItems = [];
let currentGrid = [];
let marked = Array(9).fill(false);
let activeLine = null;

init();

async function init() {
  try {
    allItems = await loadItems();
    generateBtn.addEventListener('click', handleGenerate);
    confirmBtn.addEventListener('click', handleConfirm);
    copyBtn.addEventListener('click', handleCopy);
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
  copyFeedback.textContent = '';
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
  } catch (error) {
    statusMsg.textContent = error.message;
    gameSection.hidden = true;
    return;
  }

  renderGrid();
  gameSection.hidden = false;
}

function renderGrid() {
  gridEl.innerHTML = '';

  currentGrid.forEach((item, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.textContent = item.item;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-pressed', 'false');
    cell.addEventListener('click', () => toggleCell(index, cell));
    gridEl.appendChild(cell);
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

function handleConfirm() {
  if (!activeLine) return;

  const winningItems = activeLine.map((index) => currentGrid[index]);
  victoryMessage.textContent = formatVictoryMessage(winningItems);
  victorySection.hidden = false;
  copyFeedback.textContent = '';
}

async function handleCopy() {
  const text = victoryMessage.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyFeedback.textContent = 'Copied!';
  } catch {
    copyFeedback.textContent = 'Copy failed — select and copy manually.';
  }
}
