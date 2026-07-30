# FFT Bingo

A simple live bingo game for Fantasy Football Today YouTube episodes.

## How it works

1. Check which hosts are on today's episode (Adam is checked by default).
2. Check **Mailbag** or **Mock Draft** if applicable.
3. Click **Generate Grid** to get a random 3×3 board filtered by host, date, and episode type.
4. Click squares as items happen during the show.
5. When you get three in a row, click **CONFIRM BINGO!?** and copy the share message into YouTube chat.

## Bingo items

Items live in `stimuli/bingo_items.csv` with columns:

- **Item** — full text shown on the grid
- **Tags** — filtering rules (hosts, mailbag, draft, season/preseason, day-of-week, etc.)
- **Center** — whether the item can be placed in the free center square
- **Short** — abbreviated text used in the victory share string (edit as needed)

The original source file is kept at `stimuli/FFT Bingo Items - bingo_items.csv`.

## Tag rules

- Multiple tags on one item use **AND** logic (all must pass).
- **Thursday OR Friday** is the exception: today's date must be Thursday or Friday.
- **season** — during NFL regular season (excluding playoffs)
- **preseason** — any time outside regular season
- **Monday**, **Sunday_morning** — based on local date/time
- **mailbag**, **draft** — controlled by Miscellaneous checkboxes

## Local development

GitHub Pages serves static files, but `fetch()` for the CSV requires a local server (browsers block file:// requests).

```bash
cd fft_bingo
python3 -m http.server 8000
```

Open http://localhost:8000

## GitHub Pages

1. Push this repo to GitHub (public).
2. **Settings → Pages → Deploy from branch → main / (root)**.
3. Site URL: `https://YOUR_USERNAME.github.io/fft_bingo/`

## File layout

```
index.html
css/styles.css
js/app.js
js/csv.js
js/filters.js
js/grid.js
stimuli/bingo_items.csv
```
