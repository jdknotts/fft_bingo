const HOSTS = ['Adam', 'Dan', 'Heath', 'Jamey', 'Dave', 'Jacob'];

// Approximate NFL regular season windows (excludes playoffs).
const REGULAR_SEASONS = [
  { start: '2025-09-04', end: '2026-01-04' },
  { start: '2026-09-10', end: '2027-01-03' },
  { start: '2027-09-09', end: '2028-01-07' },
  { start: '2028-09-07', end: '2029-01-06' },
];

export function isInRegularSeason(date = new Date()) {
  const iso = formatIsoDate(date);
  return REGULAR_SEASONS.some(({ start, end }) => iso >= start && iso <= end);
}

function formatIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseTags(tagString) {
  if (!tagString?.trim()) return [];

  const tags = [];
  let remainder = tagString.trim();

  const orPattern = /Thursday OR Friday/g;
  let match;
  while ((match = orPattern.exec(remainder)) !== null) {
    tags.push('Thursday OR Friday');
  }
  remainder = remainder.replace(/Thursday OR Friday/g, '');

  remainder.split(',').forEach((part) => {
    const tag = part.trim();
    if (tag) tags.push(tag);
  });

  return tags;
}

export function itemMatchesTags(item, context) {
  const tags = parseTags(item.tags);
  if (tags.length === 0) return true;
  return tags.every((tag) => evaluateTag(tag, context));
}

function evaluateTag(tag, context) {
  const { hosts, mailbag, mockDraft, now } = context;
  const day = now.getDay();
  const hour = now.getHours();
  const inSeason = isInRegularSeason(now);

  switch (tag) {
    case 'Thursday OR Friday':
      return day === 4 || day === 5;
    case 'Monday':
      return day === 1;
    case 'Sunday_morning':
      return day === 0 && hour < 12;
    case 'season':
      return inSeason;
    case 'preseason':
      return !inSeason;
    case 'mailbag':
      return mailbag;
    case 'draft':
      return mockDraft;
    default:
      if (HOSTS.includes(tag)) return hosts.includes(tag);
      return false;
  }
}

export function filterEligibleItems(items, context) {
  return items.filter((item) => itemMatchesTags(item, context));
}

export function buildContext({ hosts, mailbag, mockDraft, now = new Date() }) {
  return { hosts, mailbag, mockDraft, now };
}
