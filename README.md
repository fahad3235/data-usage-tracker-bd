# Data Usage Tracker BD

Offline, bilingual (English / বাংলা) tracker for mobile and broadband data packs in Bangladesh. Set up a pack, log how much data you use each day, and see at a glance whether you are on pace — before the pack runs out.

No account, no server, no network requests: everything is stored in your browser's localStorage.

## Features

1. **Data-pack setup** — pack name, allowance (MB or GB), start date, validity 1–365 days.
2. **Dashboard** — used / remaining, % used, days left, daily average, per-day budget for the days remaining, projected total, and a projected run-out date, with an on-track / over-pace / exhausted status.
3. **Daily usage log** — one entry per date (date, MB used, optional note), with validation: no future dates, no dates outside the pack window, no duplicates, no zero/negative amounts.
4. **30-day chart** — SVG bar chart of daily usage over the last 30 days.
5. **History + data tools** — newest-first history table with delete, JSON export/import with strict validation (malformed imports are rejected with existing data intact), and typed-DELETE erase-all.
6. **Bilingual UI** — EN / বাংলা toggle, persisted, with Bengali digits in Bengali mode; responsive down to 390 px.

## How the pace math works

- **Daily average** = total used ÷ days elapsed (start date through today, inclusive).
- **Per-day budget** = remaining data ÷ days remaining *after* today.
- **Projected total** = daily average × total validity days.
- **Projected run-out date** = start date + ⌈allowance ÷ daily average⌉ − 1 day. If that date falls before the pack end date, the status is "over pace". If remaining data is 0, the status is "exhausted".
- All volumes are stored in MB (1 GB = 1024 MB) and rounded to 2 decimals; day math uses UTC dates so daylight-saving shifts cannot skew counts.

## Stack

Vanilla HTML + CSS + JavaScript. No build step, no dependencies, no CDN calls. `js/logic.js` is DOM-free so the same code runs in the browser and under Node tests.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server 8000
```

## Testing

```sh
node tests/logic.test.js   # 40 unit tests for the pace math, validation, chart series, import rules
node tests/smoke.js        # 20 headless-Chrome checks (raw CDP, system Chromium): pack setup,
                           # dashboard math, entry validation, duplicate rejection, reload
                           # persistence, EN/BN toggle + Bengali digits, delete, 390 px layout,
                           # zero console/page errors
```

## Limitations

- Usage figures are entered by hand; the app cannot read usage from your operator, SIM, or router. If your logged figures differ from your operator's meter, the operator's meter wins.
- One active pack at a time. To track a new pack, save over the current pack (export the old data first if you want to keep it).
- Data lives only in this browser's localStorage; clearing site data erases it. Use Export JSON for backups.

## Status

MVP, complete and tested (see `TEST_RESULTS.md`). Demo/personal tool — not affiliated with any mobile operator.
