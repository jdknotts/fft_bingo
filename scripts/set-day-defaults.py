#!/usr/bin/env python3
"""Set FFT Bingo host and miscellaneous defaults for a given day."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

VALID_HOSTS = ['Adam', 'Dave', 'Jamey', 'Heath', 'Dan', 'Jacob']
PRESETS_PATH = Path(__file__).resolve().parent.parent / 'presets' / 'daily-defaults.json'


def parse_host_names(raw_hosts: list[str]) -> list[str]:
    names: list[str] = []
    for part in raw_hosts:
        names.extend(piece.strip() for piece in part.split(',') if piece.strip())

    if not names:
        raise ValueError('At least one host name is required.')

    canonical = {host.lower(): host for host in VALID_HOSTS}
    resolved: list[str] = []

    for name in names:
        match = canonical.get(name.lower())
        if match is None:
            valid = ', '.join(VALID_HOSTS)
            raise ValueError(f'Unknown host: {name}. Valid hosts: {valid}')
        if match not in resolved:
            resolved.append(match)

    return resolved


def parse_date(raw_date: str | None) -> str:
    if raw_date is None:
        return date.today().isoformat()

    try:
        return date.fromisoformat(raw_date).isoformat()
    except ValueError as error:
        raise ValueError('Date must be in YYYY-MM-DD format.') from error


def load_presets() -> dict:
    if not PRESETS_PATH.exists():
        return {}

    return json.loads(PRESETS_PATH.read_text(encoding='utf-8'))


def save_presets(presets: dict) -> None:
    PRESETS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PRESETS_PATH.write_text(json.dumps(presets, indent=2) + '\n', encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Set FFT Bingo host and miscellaneous defaults for a day.',
    )
    parser.add_argument(
        '--hosts',
        nargs='+',
        help='Host names to check (case-insensitive; commas allowed, e.g. "adam,dan Heath")',
    )
    parser.add_argument(
        '--mailbag',
        action='store_true',
        help='Check the Mailbag box',
    )
    parser.add_argument(
        '--draft',
        action='store_true',
        help='Check the Mock Draft box',
    )
    parser.add_argument(
        '--date',
        help='Date to configure in YYYY-MM-DD format (default: today)',
    )
    args = parser.parse_args()

    try:
        day = parse_date(args.date)
        hosts = parse_host_names(args.hosts) if args.hosts else ['Adam', 'Dave', 'Jamey', 'Heath']
    except ValueError as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1

    preset = {
        'hosts': hosts,
        'mailbag': args.mailbag,
        'draft': args.draft,
    }

    presets = load_presets()
    presets[day] = preset
    save_presets(presets)

    misc_parts = []
    if preset['mailbag']:
        misc_parts.append('mailbag')
    if preset['draft']:
        misc_parts.append('draft')
    misc_text = ', '.join(misc_parts) if misc_parts else 'none'

    print(f'Saved defaults for {day}')
    print(f'  Hosts: {", ".join(hosts)}')
    print(f'  Miscellaneous: {misc_text}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
