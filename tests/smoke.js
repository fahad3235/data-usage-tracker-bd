// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js — exits non-zero on any failure or page error.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9358;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
const pageErrors = [];
function check(name, cond, extra) {
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/du-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return { error: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result ? r.result.result.value : undefined;
  };
  const setInput = async (id, val) => ev(
    `(()=>{const el=document.getElementById('${id}');el.value=${JSON.stringify(val)};` +
    `el.dispatchEvent(new Event('input',{bubbles:true}));return el.value;})()`);
  const txt = async (id) => ev(`document.getElementById('${id}').textContent`);

  const today = await ev(`(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})()`);
  check('title', (await ev('document.title')) === 'Data Usage Tracker BD');
  check('heading', (await ev(`document.querySelector('h1').textContent`)) === 'Data Usage Tracker BD');
  check('pack form present', (await ev(`!!document.getElementById('packForm')`)) === true);
  check('dashboard empty state before pack', (await txt('dashboard')).includes('Set up your data pack'));
  // save a pack starting today: 30 GB, 30 days
  await setInput('packName', 'Test Pack');
  await setInput('packAllowance', '30');
  await ev(`document.getElementById('packUnit').value='GB'`);
  await setInput('packStart', today);
  await setInput('packValidity', '30');
  await ev(`document.querySelector('#packForm button[type=submit]').click()`);
  await wait(400);
  check('pack saved message', (await txt('packMsg')).includes('Pack saved'));
  const dash0 = await txt('dashboard');
  check('dashboard shows 0 MB used', dash0.includes('0 MB'), dash0.slice(0, 300));
  check('dashboard shows 30 GB allowance', dash0.includes('30 GB'), dash0.slice(0, 300));
  check('chart svg renders', (await ev(`document.querySelectorAll('#chart svg rect').length`)) === 30);
  // invalid entry: 0 MB
  await setInput('entryMB', '0');
  await ev(`document.querySelector('#entryForm button[type=submit]').click()`);
  await wait(300);
  check('0 MB entry rejected inline', (await txt('entryMsg')).length > 0 && (await ev(`document.getElementById('entryMsg').className`)).includes('err'), await txt('entryMsg'));
  // valid entry: 500 MB today
  await setInput('entryMB', '500');
  await ev(`document.querySelector('#entryForm button[type=submit]').click()`);
  await wait(400);
  const dash1 = await txt('dashboard');
  check('dashboard used 500 MB after entry', dash1.includes('500 MB'), dash1.slice(0, 300));
  check('dashboard remaining 29.51 GB', dash1.includes('29.51 GB'), dash1.slice(0, 300));
  check('history has 1 row', (await ev(`document.querySelectorAll('#history tbody tr').length`)) === 1);
  // duplicate date rejected
  await setInput('entryMB', '100');
  await ev(`document.querySelector('#entryForm button[type=submit]').click()`);
  await wait(300);
  check('duplicate date rejected', (await ev(`document.getElementById('entryMsg').className`)).includes('err'), await txt('entryMsg'));
  // reload persistence
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const dashR = await txt('dashboard');
  check('reload persists 500 MB used', dashR.includes('500 MB'), dashR.slice(0, 300));
  // language toggle -> Bengali tagline + digits
  await ev(`document.getElementById('langBtn').click()`);
  await wait(300);
  const bnTag = await ev(`document.querySelector('[data-i18n="tagline"]').textContent`);
  check('BN tagline renders Bengali', bnTag && bnTag.includes('ডাটা'), bnTag);
  const bnDash = await txt('dashboard');
  check('BN digits in dashboard', /[০-৯]/.test(bnDash), bnDash.slice(0, 300));
  await ev(`document.getElementById('langBtn').click()`);
  await wait(300);
  check('EN toggle restores tagline', (await ev(`document.querySelector('[data-i18n="tagline"]').textContent`)).includes('Track your mobile'));
  // delete the entry
  await ev(`document.querySelector('#history [data-del]').click()`);
  await wait(300);
  check('delete removes history row', (await ev(`document.querySelectorAll('#history tbody tr').length`)) === 0);
  // mobile 390px: no horizontal overflow
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const overflow = await ev(`document.documentElement.scrollWidth`);
  check('390px no horizontal overflow', overflow <= 391, 'scrollWidth=' + overflow);
  check('zero console/page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 500));

  console.log(failures + ' smoke failures');
  try { chrome.kill(); } catch (e) { /* ignore */ }
  process.exit(failures || pageErrors.length ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); process.exit(2); });
