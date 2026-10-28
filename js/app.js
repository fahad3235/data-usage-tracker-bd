// Data Usage Tracker BD — UI layer. Depends on js/logic.js (window.DataUsageLogic).
(function () {
  'use strict';
  const L = window.DataUsageLogic;
  const LS_KEY = 'data-usage-tracker-bd-v1';
  const LANG_KEY = 'data-usage-tracker-bd-lang';

  const I18N = {
    en: {
      tagline: 'Track your mobile / broadband data pack — know before it runs out.',
      packTitle: 'Your data pack', packName: 'Pack name', packNamePh: 'e.g. Grameenphone 30 GB',
      allowance: 'Allowance', unit: 'Unit', startDate: 'Start date', validity: 'Validity (days)',
      savePack: 'Save pack', packSaved: 'Pack saved.',
      dashTitle: 'Dashboard', used: 'Used', remaining: 'Remaining', of: 'of',
      daysLeft: 'days left', dailyAvg: 'Daily average', dailyBudget: 'You can use per day',
      projected: 'Projected total', runOut: 'Projected run-out', entries: 'logged days',
      statusOnTrack: 'On track — at this pace your pack lasts till the end.',
      statusOverPace: 'Over pace — at this pace you will run out early.',
      statusExhausted: 'Pack exhausted — no data remaining.',
      statusNotStarted: 'Pack has not started yet.',
      noPack: 'Set up your data pack above to start tracking.',
      addTitle: 'Log usage', date: 'Date', usedMB: 'Used (MB)', note: 'Note (optional)',
      addBtn: 'Add entry', entryAdded: 'Entry added.', entryDeleted: 'Entry deleted.',
      chartTitle: 'Last 30 days (MB per day)', historyTitle: 'History',
      emptyHistory: 'No usage logged yet. Add your first entry above.',
      dataTitle: 'Data', exportBtn: 'Export JSON', importBtn: 'Import JSON',
      clearBtn: 'Erase all data', clearConfirm: 'Type DELETE to erase everything.',
      clearDone: 'All data erased.', importOk: 'Import successful.',
      errPackNameRequired: 'Enter a pack name.', errAllowancePositive: 'Allowance must be greater than 0.',
      errAllowanceTooLarge: 'Allowance is too large (max 1 TB).', errStartDateInvalid: 'Enter a valid start date.',
      errValidityRange: 'Validity must be 1–365 days.',
      errDateInvalid: 'Enter a valid date.', errDateFuture: 'Date cannot be in the future.',
      errDateBeforePack: 'Date is before the pack starts.', errDateAfterPack: 'Date is after the pack ends.',
      errMbPositive: 'Usage must be greater than 0 MB.', errMbTooLarge: 'Usage is too large (max 1 TB).',
      errDateDuplicate: 'An entry for this date already exists — delete it first to re-enter.',
      errNoteTooLong: 'Note must be 100 characters or fewer.',
      errImport: 'Import failed: file is not a valid Data Usage Tracker export.',
      delete: 'Delete', footer: 'Offline personal tracker. Your data never leaves this device — everything is stored in this browser only. Usage figures are what you enter; they are not read from your operator.'
    },
    bn: {
      tagline: 'আপনার মোবাইল / ব্রডব্যান্ড ডাটা প্যাক ট্র্যাক করুন — শেষ হওয়ার আগেই জানুন।',
      packTitle: 'আপনার ডাটা প্যাক', packName: 'প্যাকের নাম', packNamePh: 'যেমন: গ্রামীণফোন ৩০ জিবি',
      allowance: 'পরিমাণ', unit: 'একক', startDate: 'শুরুর তারিখ', validity: 'মেয়াদ (দিন)',
      savePack: 'প্যাক সংরক্ষণ করুন', packSaved: 'প্যাক সংরক্ষিত হয়েছে।',
      dashTitle: 'ড্যাশবোর্ড', used: 'ব্যবহৃত', remaining: 'বাকি আছে', of: 'এর মধ্যে',
      daysLeft: 'দিন বাকি', dailyAvg: 'দৈনিক গড়', dailyBudget: 'প্রতিদিন ব্যবহার করতে পারবেন',
      projected: 'সম্ভাব্য মোট', runOut: 'সম্ভাব্য শেষের তারিখ', entries: 'দিন লগ করা হয়েছে',
      statusOnTrack: 'ঠিক পথে আছেন — এই গতিতে প্যাক মেয়াদ শেষ পর্যন্ত চলবে।',
      statusOverPace: 'গতি বেশি — এই গতিতে প্যাক আগেই শেষ হয়ে যাবে।',
      statusExhausted: 'প্যাক শেষ — আর ডাটা বাকি নেই।',
      statusNotStarted: 'প্যাক এখনো শুরু হয়নি।',
      noPack: 'ট্র্যাকিং শুরু করতে উপরে আপনার ডাটা প্যাক সেট করুন।',
      addTitle: 'ব্যবহার লগ করুন', date: 'তারিখ', usedMB: 'ব্যবহৃত (এমবি)', note: 'নোট (ঐচ্ছিক)',
      addBtn: 'এন্ট্রি যোগ করুন', entryAdded: 'এন্ট্রি যোগ হয়েছে।', entryDeleted: 'এন্ট্রি মুছে ফেলা হয়েছে।',
      chartTitle: 'শেষ ৩০ দিন (প্রতিদিন এমবি)', historyTitle: 'ইতিহাস',
      emptyHistory: 'এখনো কোনো ব্যবহার লগ করা হয়নি। উপরে প্রথম এন্ট্রি যোগ করুন।',
      dataTitle: 'ডাটা', exportBtn: 'JSON এক্সপোর্ট', importBtn: 'JSON ইমপোর্ট',
      clearBtn: 'সব ডাটা মুছুন', clearConfirm: 'সবকিছু মুছতে DELETE লিখুন।',
      clearDone: 'সব ডাটা মুছে ফেলা হয়েছে।', importOk: 'ইমপোর্ট সফল হয়েছে।',
      errPackNameRequired: 'প্যাকের নাম দিন।', errAllowancePositive: 'পরিমাণ ০-এর বেশি হতে হবে।',
      errAllowanceTooLarge: 'পরিমাণ অনেক বেশি (সর্বোচ্চ ১ টিবি)।', errStartDateInvalid: 'সঠিক শুরুর তারিখ দিন।',
      errValidityRange: 'মেয়াদ ১–৩৬৫ দিনের মধ্যে হতে হবে।',
      errDateInvalid: 'সঠিক তারিখ দিন।', errDateFuture: 'ভবিষ্যতের তারিখ দেওয়া যাবে না।',
      errDateBeforePack: 'তারিখটি প্যাক শুরুর আগের।', errDateAfterPack: 'তারিখটি প্যাক শেষের পরের।',
      errMbPositive: 'ব্যবহার ০ এমবির বেশি হতে হবে।', errMbTooLarge: 'ব্যবহার অনেক বেশি (সর্বোচ্চ ১ টিবি)।',
      errDateDuplicate: 'এই তারিখের এন্ট্রি ইতিমধ্যে আছে — আবার দিতে হলে আগেরটি মুছুন।',
      errNoteTooLong: 'নোট সর্বোচ্চ ১০০ অক্ষরের হতে হবে।',
      errImport: 'ইমপোর্ট ব্যর্থ: ফাইলটি সঠিক ডাটা ইউসেজ ট্র্যাকার এক্সপোর্ট নয়।',
      delete: 'মুছুন', footer: 'অফলাইন ব্যক্তিগত ট্র্যাকার। আপনার ডাটা এই ডিভাইসের বাইরে যায় না — সবকিছু শুধু এই ব্রাউজারে সংরক্ষিত হয়। ব্যবহারের পরিমাণ আপনিই লিখবেন; এটি অপারেটর থেকে পড়া হয় না।'
    }
  };

  const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  function digits(n, lang) {
    const s = String(n);
    if (lang !== 'bn') return s;
    return s.replace(/[0-9]/g, function (d) { return BN_DIGITS[Number(d)]; });
  }
  function fmtMB(mb, lang) {
    if (mb >= 1024) return digits((mb / 1024).toFixed(2).replace(/\.00$/, '')) + ' GB';
    return digits(L.round2(mb)) + ' MB';
  }
  function fmtNum(n, lang) {
    return digits(Number(n).toLocaleString('en-US'), lang);
  }

  let lang = localStorage.getItem(LANG_KEY) || 'en';
  if (lang !== 'bn') lang = 'en';
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { pack: null, entries: [] };
      const parsed = JSON.parse(raw);
      const v = L.validateImport(parsed);
      if (!v.ok) return { pack: null, entries: [] };
      return { pack: v.data.pack, entries: v.data.entries };
    } catch (e) { return { pack: null, entries: [] }; }
  }
  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(L.exportData(state.pack, state.entries)));
  }
  function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key; }
  function el(id) { return document.getElementById(id); }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function showMsg(id, text, isErr) {
    const m = el(id);
    m.textContent = text || '';
    m.className = 'msg' + (isErr ? ' err' : ' ok');
  }
  function errText(code) { return t('err' + code.charAt(0).toUpperCase() + code.slice(1)); }

  function renderLang() {
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = t(n.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (n) {
      n.placeholder = t(n.getAttribute('data-i18n-ph'));
    });
    el('langBtn').textContent = lang === 'en' ? 'বাংলা' : 'English';
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  }

  function renderPackForm() {
    if (state.pack) {
      el('packName').value = state.pack.name;
      el('packAllowance').value = state.pack.allowanceMB >= 1024 && state.pack.allowanceMB % 1024 === 0
        ? state.pack.allowanceMB / 1024 : state.pack.allowanceMB;
      el('packUnit').value = state.pack.allowanceMB >= 1024 && state.pack.allowanceMB % 1024 === 0 ? 'GB' : 'MB';
      el('packStart').value = state.pack.startDate;
      el('packValidity').value = state.pack.validityDays;
    }
    el('entryDate').value = todayISO();
  }

  function renderDashboard() {
    const box = el('dashboard');
    if (!state.pack) {
      box.innerHTML = '<p class="empty">' + t('noPack') + '</p>';
      el('chart').innerHTML = '';
      return;
    }
    const s = L.summarize(state.pack, state.entries, todayISO());
    const statusKey = { 'on-track': 'statusOnTrack', 'over-pace': 'statusOverPace', 'exhausted': 'statusExhausted', 'not-started': 'statusNotStarted' }[s.status];
    box.innerHTML =
      '<div class="statgrid">' +
      '<div class="stat"><span class="stat-label">' + t('used') + '</span><strong>' + fmtMB(s.used, lang) + '</strong><span class="stat-sub">' + t('of') + ' ' + fmtMB(state.pack.allowanceMB, lang) + '</span></div>' +
      '<div class="stat"><span class="stat-label">' + t('remaining') + '</span><strong>' + fmtMB(s.remaining, lang) + '</strong><span class="stat-sub">' + digits(s.pct, lang) + '% ' + t('used') + '</span></div>' +
      '<div class="stat"><span class="stat-label">' + t('daysLeft') + '</span><strong>' + digits(s.daysLeft, lang) + '</strong><span class="stat-sub">' + t('entries') + ': ' + digits(s.entriesCount, lang) + '</span></div>' +
      '<div class="stat"><span class="stat-label">' + t('dailyAvg') + '</span><strong>' + fmtMB(s.dailyAvg, lang) + '</strong><span class="stat-sub">' + t('dailyBudget') + ': ' + fmtMB(s.dailyBudget, lang) + '</span></div>' +
      '</div>' +
      '<div class="bar"><div class="bar-fill ' + (s.status === 'over-pace' || s.status === 'exhausted' ? 'warn' : '') + '" style="width:' + Math.min(100, s.pct) + '%"></div></div>' +
      '<p class="pace ' + s.status + '">' + t(statusKey) + '</p>' +
      '<p class="meta">' + t('projected') + ': ' + fmtMB(s.projectedTotal, lang) +
      (s.runOutDate ? ' · ' + t('runOut') + ': ' + digits(s.runOutDate, lang) : '') +
      ' · ' + t('entries') + ': ' + digits(s.entriesCount, lang) + '</p>';
    renderChart();
  }

  function renderChart() {
    const series = L.chartSeries(state.entries, todayISO(), 30);
    const max = Math.max.apply(null, series.map(function (d) { return d.mb; }).concat([1]));
    const W = 600, H = 160, pad = 8;
    const bw = (W - pad * 2) / series.length;
    let bars = '';
    series.forEach(function (d, i) {
      const h = (d.mb / max) * (H - 30);
      const x = pad + i * bw + 1;
      bars += '<rect x="' + x.toFixed(1) + '" y="' + (H - 20 - h).toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="#0f766e"><title>' + d.date + ': ' + d.mb + ' MB</title></rect>';
    });
    el('chart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + t('chartTitle') + '">' + bars + '</svg>' +
      '<p class="meta">' + digits(series[0].date, lang) + ' → ' + digits(series[series.length - 1].date, lang) + ' · ' + t('chartTitle') + '</p>';
  }

  function renderHistory() {
    const box = el('history');
    if (!state.entries.length) { box.innerHTML = '<p class="empty">' + t('emptyHistory') + '</p>'; return; }
    const rows = state.entries.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (e) {
      const esc = e.note.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<tr><td>' + digits(e.date, lang) + '</td><td>' + fmtMB(e.mb, lang) + '</td><td>' + esc + '</td>' +
        '<td><button class="btn small danger" data-del="' + e.date + '">' + t('delete') + '</button></td></tr>';
    }).join('');
    box.innerHTML = '<table><thead><tr><th>' + t('date') + '</th><th>' + t('usedMB') + '</th><th>' + t('note') + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    box.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.entries = state.entries.filter(function (e) { return e.date !== b.getAttribute('data-del'); });
        save(); renderAll(); showMsg('entryMsg', t('entryDeleted'), false);
      });
    });
  }

  function renderAll() { renderLang(); renderPackForm(); renderDashboard(); renderHistory(); }

  document.addEventListener('DOMContentLoaded', function () {
    el('langBtn').addEventListener('click', function () {
      lang = lang === 'en' ? 'bn' : 'en';
      localStorage.setItem(LANG_KEY, lang);
      renderAll();
    });

    el('packForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      const pack = {
        name: el('packName').value.trim(),
        allowanceMB: L.round2(L.toMB(el('packAllowance').value, el('packUnit').value)),
        startDate: el('packStart').value,
        validityDays: Number(el('packValidity').value)
      };
      const errs = L.validatePack(pack);
      if (errs.length) { showMsg('packMsg', errText(errs[0]), true); return; }
      state.pack = pack; save(); renderAll();
      showMsg('packMsg', t('packSaved'), false);
    });

    el('entryForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!state.pack) { showMsg('entryMsg', t('noPack'), true); return; }
      const entry = { date: el('entryDate').value, mb: L.round2(Number(el('entryMB').value)), note: el('entryNote').value.trim() };
      const errs = L.validateEntry(entry, state.entries, state.pack, todayISO());
      if (errs.length) { showMsg('entryMsg', errText(errs[0]), true); return; }
      state.entries.push(entry);
      state.entries.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      save(); renderAll();
      showMsg('entryMsg', t('entryAdded'), false);
      el('entryMB').value = ''; el('entryNote').value = '';
    });

    el('exportBtn').addEventListener('click', function () {
      const blob = new Blob([JSON.stringify(L.exportData(state.pack, state.entries), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'data-usage-tracker-bd.json'; a.click();
      URL.revokeObjectURL(a.href);
    });

    el('importFile').addEventListener('change', function () {
      const f = el('importFile').files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = function () {
        try {
          const v = L.validateImport(JSON.parse(r.result));
          if (!v.ok) throw new Error('bad');
          state = v.data; save(); renderAll();
          showMsg('dataMsg', t('importOk'), false);
        } catch (e) { showMsg('dataMsg', t('errImport'), true); }
        el('importFile').value = '';
      };
      r.readAsText(f);
    });

    el('clearBtn').addEventListener('click', function () {
      const v = window.prompt(t('clearConfirm'));
      if (v === null) return;
      if (v.trim() !== 'DELETE') { showMsg('dataMsg', t('clearConfirm'), true); return; }
      state = { pack: null, entries: [] }; save(); renderAll();
      showMsg('dataMsg', t('clearDone'), false);
    });

    renderAll();
  });
})();
