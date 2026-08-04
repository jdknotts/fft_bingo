const BINGO_ITEMS_URL = 'stimuli/FFT Bingo Items - bingo_items.csv';
const INSTANT_WIN_URL = 'stimuli/FFT Bingo Items - instant_win.csv';

export async function loadItems(url = BINGO_ITEMS_URL) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load bingo items (${response.status}).`);
  }

  const text = await response.text();
  return parseBingoCsv(text);
}

export async function loadInstantWinItems(url = INSTANT_WIN_URL) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load instant win items (${response.status}).`);
  }

  const text = await response.text();
  return parseSingleColumnCsv(text);
}

function parseBingoCsv(text) {
  const rows = parseCsvRows(text);
  const [header, ...dataRows] = rows;
  const columns = header.map((name) => name.trim());

  return dataRows.map((cells) => {
    const record = {};
    columns.forEach((name, index) => {
      record[name.toLowerCase()] = (cells[index] ?? '').trim();
    });

    return {
      item: record.item ?? '',
      tags: record.tags ?? '',
      center: (record.center ?? '').toUpperCase() === 'TRUE',
      short: record.short ?? record.item ?? '',
    };
  });
}

function parseSingleColumnCsv(text) {
  return parseCsvRows(text)
    .map((row) => (row[0] ?? '').trim())
    .filter(Boolean);
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || (char === '\r' && next === '\n')) {
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = '';
      if (char === '\r') i += 1;
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
