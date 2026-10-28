// Node unit tests for js/logic.js — exits non-zero on any failure.
const L = require('../js/logic.js');
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('ok - ' + name); }
  else { fail++; console.log('FAIL - ' + name + (extra !== undefined ? ' :: ' + JSON.stringify(extra) : '')); }
}
function close(a, b, tol) { return Math.abs(a - b) <= (tol || 1e-9); }

const pack = { name: 'Test 30 GB', allowanceMB: 30720, startDate: '2026-10-01', validityDays: 30 };
const tenDays = [];
for (let i = 1; i <= 10; i++) tenDays.push({ date: '2026-10-' + String(i).padStart(2, '0'), mb: 1000, note: '' });

check('pack end date 30 days from Oct 1 = Oct 30', L.packEndDate(pack) === '2026-10-30');
check('days inclusive Oct 1..10 = 10', L.daysBetweenInclusive('2026-10-01', '2026-10-10') === 10);
check('addDays crosses month', L.addDays('2026-10-30', 1) === '2026-10-31');
check('toMB 30 GB = 30720', L.toMB(30, 'GB') === 30720);
check('toMB 500 MB = 500', L.toMB(500, 'MB') === 500);
check('valid pack has no errors', L.validatePack(pack).length === 0);
check('empty pack name rejected', L.validatePack({ ...pack, name: '  ' }).includes('packNameRequired'));
check('zero allowance rejected', L.validatePack({ ...pack, allowanceMB: 0 }).includes('allowancePositive'));
check('validity 0 rejected', L.validatePack({ ...pack, validityDays: 0 }).includes('validityRange'));
check('validity 366 rejected', L.validatePack({ ...pack, validityDays: 366 }).includes('validityRange'));
check('bad start date rejected', L.validatePack({ ...pack, startDate: '2026-02-30' }).includes('startDateInvalid'));

const s = L.summarize(pack, tenDays, '2026-10-10');
check('used 10000', s.used === 10000, s);
check('remaining 20720', s.remaining === 20720, s);
check('pct 32.55', close(s.pct, 32.55, 0.01), s);
check('daysElapsed 10', s.daysElapsed === 10, s);
check('daysLeft after today = 20', s.daysLeft === 20, s);
check('dailyAvg 1000', s.dailyAvg === 1000, s);
check('dailyBudget 1036', s.dailyBudget === 1036, s);
check('projected 30000', s.projectedTotal === 30000, s);
check('run-out Oct 31 (after pack end)', s.runOutDate === '2026-10-31', s);
check('status on-track', s.status === 'on-track', s);

const fast = tenDays.map(function (e) { return { ...e, mb: 2000 }; });
const s2 = L.summarize(pack, fast, '2026-10-10');
check('over-pace projected 60000', s2.projectedTotal === 60000, s2);
check('over-pace run-out Oct 16', s2.runOutDate === '2026-10-16', s2);
check('status over-pace', s2.status === 'over-pace', s2);

const s3 = L.summarize(pack, [{ date: '2026-10-01', mb: 30720 }], '2026-10-05');
check('exhausted remaining 0', s3.remaining === 0 && s3.status === 'exhausted', s3);
check('entries outside window ignored', L.summarize(pack, [{ date: '2026-11-02', mb: 5000 }], '2026-10-10').used === 0);
check('not-started before pack', L.summarize(pack, [], '2026-09-20').status === 'not-started');

check('future entry rejected', L.validateEntry({ date: '2026-10-11', mb: 100 }, tenDays, pack, '2026-10-10').includes('dateFuture'));
check('duplicate date rejected', L.validateEntry({ date: '2026-10-05', mb: 100 }, tenDays, pack, '2026-10-10').includes('dateDuplicate'));
check('before-pack entry rejected', L.validateEntry({ date: '2026-09-30', mb: 100 }, [], pack, '2026-10-10').includes('dateBeforePack'));
check('after-pack entry rejected', L.validateEntry({ date: '2026-10-31', mb: 100 }, [], pack, '2026-10-10').includes('dateAfterPack'));
check('zero MB rejected', L.validateEntry({ date: '2026-10-11', mb: 0 }, [], pack, '2026-10-11').includes('mbPositive'));
check('valid entry passes', L.validateEntry({ date: '2026-10-11', mb: 250, note: 'x' }, tenDays, pack, '2026-10-11').length === 0);

const series = L.chartSeries(tenDays, '2026-10-10', 30);
check('chart has 30 points', series.length === 30);
check('chart first point Sep 11 = 0', series[0].date === '2026-09-11' && series[0].mb === 0);
check('chart last point Oct 10 = 1000', series[29].date === '2026-10-10' && series[29].mb === 1000);

const exported = L.exportData(pack, tenDays);
check('import round-trip ok', L.validateImport(exported).ok === true);
check('import bad header rejected', L.validateImport({ app: 'other', version: 1, pack: pack, entries: [] }).ok === false);
check('import dup entry rejected', L.validateImport({ app: 'data-usage-tracker-bd', version: 1, pack: pack, entries: [{ date: '2026-10-01', mb: 1 }, { date: '2026-10-01', mb: 2 }] }).ok === false);
check('import bad entry rejected', L.validateImport({ app: 'data-usage-tracker-bd', version: 1, pack: pack, entries: [{ date: '2026-10-01', mb: -5 }] }).ok === false);

console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
