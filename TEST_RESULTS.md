# Test results — data-usage-tracker-bd (run #165, 2026-10-28)

## Unit tests: 40/40 pass — `node tests/logic.test.js`

Hand-verified scenario (pack 30 GB = 30720 MB, start 2026-10-01, 30 days → end 2026-10-30;
10 entries of 1000 MB, 2026-10-01…10; as-of 2026-10-10):
used 10000, remaining 20720, pct 32.55, daysElapsed 10, daysLeft-after-today 20,
dailyAvg 1000, dailyBudget 1036 (= 20720/20), projected 30000, run-out 2026-10-31
(after pack end) → status on-track.
Over-pace variant (2000 MB/day): projected 60000, run-out 2026-10-16 → over-pace.
Exhausted variant (30720 MB on day 1): remaining 0 → exhausted.
Also covered: pack validation (name/allowance/validity/date bounds), entry validation
(future, duplicate, before/after pack window, zero MB), entries outside the pack window
ignored, not-started status, 30-point chart series (Sep 11 → Oct 10), import round-trip
plus bad-header / duplicate-entry / bad-entry rejection. 0 repairs needed.

## Headless-Chrome smoke: 20/20 pass — `node tests/smoke.js`

Raw CDP against /opt/meta-chromium/chrome, file:// page. Covered: title/heading,
empty-state dashboard before a pack, pack save (30 GB from today), dashboard 0 MB →
500 MB after a 500 MB entry, remaining 29.51 GB (= (30720−500)/1024), 30 chart bars,
0 MB entry rejected inline, duplicate date rejected, reload persistence, EN→BN toggle
(Bengali tagline + Bengali digits) and back, history delete, 390 px no horizontal
overflow, 0 console/page errors. One harness-only fix during setup: the first smoke
draft accidentally included the donor project's checks; rebuilt from the harness header
only — no app bugs found.
