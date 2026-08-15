const PRESETS_URL = 'presets/daily-defaults.json';

export const VALID_HOSTS = ['Adam', 'Dave', 'Jamey', 'Heath', 'Dan', 'Jacob'];

export const DEFAULT_PRESET = {
  hosts: ['Adam', 'Dave', 'Jamey', 'Heath'],
  mailbag: false,
  draft: false,
};

export function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function loadDailyPresets() {
  try {
    const response = await fetch(PRESETS_URL);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function getPresetForToday(presets, date = new Date()) {
  if (!presets) return null;
  return presets[getTodayKey(date)] ?? null;
}

export function resolvePreset(preset) {
  if (!preset) return { ...DEFAULT_PRESET };

  const hosts = Array.isArray(preset.hosts)
    ? preset.hosts.filter((host) => VALID_HOSTS.includes(host))
    : DEFAULT_PRESET.hosts;

  return {
    hosts: hosts.length > 0 ? hosts : [...DEFAULT_PRESET.hosts],
    mailbag: Boolean(preset.mailbag),
    draft: Boolean(preset.draft),
  };
}

export function applyPreset(hostsGroup, miscGroup, preset) {
  const resolved = resolvePreset(preset);

  hostsGroup.querySelectorAll('input[name="host"]').forEach((input) => {
    input.checked = resolved.hosts.includes(input.value);
  });

  miscGroup.querySelectorAll('input[name="misc"]').forEach((input) => {
    if (input.value === 'mailbag') input.checked = resolved.mailbag;
    if (input.value === 'draft') input.checked = resolved.draft;
  });
}

export async function applyDailyDefaults(hostsGroup, miscGroup) {
  const presets = await loadDailyPresets();
  const preset = getPresetForToday(presets);
  applyPreset(hostsGroup, miscGroup, preset);
}
