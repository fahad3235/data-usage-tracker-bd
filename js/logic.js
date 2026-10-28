// Data Usage Tracker BD — pure, DOM-free logic (shared by app + node tests).
// All money-like quantities are data volumes in MB (1 GB = 1024 MB).
// Dates are ISO strings (YYYY-MM-DD); day math uses UTC to avoid DST drift.
(function (root) {
  const L = {};

  L.MB_PER_GB = 1024;

  L.toMB = function (value, unit) {
    const v = Number(value);
    if (!isFinite(v)) return NaN;
    return unit === 'GB' ? v * L.MB_PER_GB : v;
  };

  L.fromMB = function (mb, unit) {
    return unit === 'GB' ? mb / L.MB_PER_GB : mb;
  };

  L.round2 = function (n) { return Math.round(n * 100) / 100; };

  L.isValidDate = function (s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  };

  L.parseDate = function (s) { return new Date(s + 'T00:00:00Z'); };

  L.fmtDate = function (d) { return d.toISOString().slice(0, 10); };

  L.addDays = function (iso, n) {
    const d = L.parseDate(iso);
    d.setUTCDate(d.getUTCDate() + n);
    return L.fmtDate(d);
  };

  // Inclusive day count between two ISO dates (a <= b assumed; else 0).
  L.daysBetweenInclusive = function (a, b) {
    if (!L.isValidDate(a) || !L.isValidDate(b)) return 0;
    const ms = L.parseDate(b) - L.parseDate(a);
    const days = Math.floor(ms / 86400000) + 1;
    return days > 0 ? days : 0;
  };

  L.packEndDate = function (pack) {
    return L.addDays(pack.startDate, pack.validityDays - 1);
  };

  // Returns an array of error strings (empty = valid).
  L.validatePack = function (pack) {
    const errs = [];
    if (!pack || typeof pack.name !== 'string' || pack.name.trim() === '') errs.push('packNameRequired');
    const allow = Number(pack.allowanceMB);
    if (!isFinite(allow) || allow <= 0) errs.push('allowancePositive');
    if (allow > 1024 * 1024) errs.push('allowanceTooLarge'); // > 1 TB
    if (!L.isValidDate(pack.startDate)) errs.push('startDateInvalid');
    const v = Number(pack.validityDays);
    if (!Number.isInteger(v) || v < 1 || v > 365) errs.push('validityRange');
    return errs;
  };

  // entries: [{date, mb, note}]. today: ISO string used as "now" (injectable for tests).
  L.validateEntry = function (entry, entries, pack, today) {
    const errs = [];
    if (!L.isValidDate(entry.date)) errs.push('dateInvalid');
    else {
      if (entry.date > today) errs.push('dateFuture');
      if (pack && L.isValidDate(pack.startDate) && Number.isInteger(Number(pack.validityDays))) {
        if (entry.date < pack.startDate) errs.push('dateBeforePack');
        if (entry.date > L.packEndDate(pack)) errs.push('dateAfterPack');
      }
    }
    const mb = Number(entry.mb);
    if (!isFinite(mb) || mb <= 0) errs.push('mbPositive');
    if (mb > 1024 * 1024) errs.push('mbTooLarge');
    if (entries.some(function (e) { return e.date === entry.date; })) errs.push('dateDuplicate');
    if (entry.note !== undefined && typeof entry.note !== 'string') errs.push('noteString');
    if (typeof entry.note === 'string' && entry.note.length > 100) errs.push('noteTooLong');
    return errs;
  };

  // entries within the pack window only; asOf clamped into [start, end].
  L.summarize = function (pack, entries, asOf) {
    const end = L.packEndDate(pack);
    const start = pack.startDate;
    const inWindow = entries.filter(function (e) { return e.date >= start && e.date <= end; });
    const used = L.round2(inWindow.reduce(function (s, e) { return s + Number(e.mb); }, 0));
    const remaining = L.round2(Math.max(0, pack.allowanceMB - used));
    const pct = pack.allowanceMB > 0 ? L.round2((used / pack.allowanceMB) * 100) : 0;
    const daysTotal = pack.validityDays;
    const clampedAsOf = asOf < start ? start : (asOf > end ? end : asOf);
    const daysElapsed = L.daysBetweenInclusive(start, clampedAsOf);
    // Days remaining AFTER asOf (excluding today), for the daily-budget figure.
    const daysRemainingAfterToday = asOf >= start && asOf <= end
      ? L.daysBetweenInclusive(L.addDays(clampedAsOf, 1), end)
      : (asOf < start ? daysTotal : 0);
    const dailyAvg = daysElapsed > 0 ? L.round2(used / daysElapsed) : 0;
    const dailyBudget = daysRemainingAfterToday > 0 ? L.round2(remaining / daysRemainingAfterToday) : remaining;
    const projectedTotal = L.round2(dailyAvg * daysTotal);
    let runOutDate = null;
    if (dailyAvg > 0 && used < pack.allowanceMB) {
      const daysToExhaust = Math.ceil(pack.allowanceMB / dailyAvg);
      runOutDate = L.addDays(start, daysToExhaust - 1);
    }
    let status = 'on-track';
    if (remaining <= 0) status = 'exhausted';
    else if (runOutDate && runOutDate < end) status = 'over-pace';
    else if (asOf < start) status = 'not-started';
    return {
      used: used, remaining: remaining, pct: pct,
      daysTotal: daysTotal, daysElapsed: daysElapsed,
      daysLeft: daysRemainingAfterToday, dailyAvg: dailyAvg,
      dailyBudget: dailyBudget, projectedTotal: projectedTotal,
      runOutDate: runOutDate, endDate: end, status: status,
      entriesCount: inWindow.length
    };
  };

  // Last N days ending at asOf (inclusive), each {date, mb} aggregated.
  L.chartSeries = function (entries, asOf, n) {
    const days = n || 30;
    const byDate = {};
    entries.forEach(function (e) { byDate[e.date] = (byDate[e.date] || 0) + Number(e.mb); });
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = L.addDays(asOf, -i);
      out.push({ date: d, mb: L.round2(byDate[d] || 0) });
    }
    return out;
  };

  // Strict import validation: returns {ok, data} or {ok:false, errors}.
  L.validateImport = function (data) {
    const errs = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, errors: ['notObject'] };
    if (data.app !== 'data-usage-tracker-bd' || typeof data.version !== 'number') errs.push('badHeader');
    const packErrs = L.validatePack(data.pack || {});
    if (packErrs.length) errs.push('badPack');
    if (!Array.isArray(data.entries)) errs.push('entriesNotArray');
    else {
      const seen = {};
      data.entries.forEach(function (e) {
        if (!e || typeof e !== 'object') { errs.push('badEntry'); return; }
        const v = L.validateEntry(e, [], null, '2999-12-31');
        // validateEntry's future check is bypassed via far-future today; re-check shape only:
        const shapeErrs = v.filter(function (x) { return x !== 'dateFuture' && x !== 'dateBeforePack' && x !== 'dateAfterPack'; });
        if (shapeErrs.length) errs.push('badEntry');
        if (seen[e.date]) errs.push('dupEntry');
        seen[e.date] = true;
      });
    }
    if (errs.length) return { ok: false, errors: errs };
    return {
      ok: true,
      data: {
        app: 'data-usage-tracker-bd', version: data.version,
        pack: { name: String(data.pack.name).trim(), allowanceMB: Number(data.pack.allowanceMB), startDate: data.pack.startDate, validityDays: Number(data.pack.validityDays) },
        entries: data.entries.map(function (e) { return { date: e.date, mb: L.round2(Number(e.mb)), note: typeof e.note === 'string' ? e.note.slice(0, 100) : '' }; })
          .sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      }
    };
  };

  L.exportData = function (pack, entries) {
    return { app: 'data-usage-tracker-bd', version: 1, pack: pack, entries: entries };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  else root.DataUsageLogic = L;
})(typeof window !== 'undefined' ? window : globalThis);
