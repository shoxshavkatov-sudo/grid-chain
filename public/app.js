/* GRID Chain launchpad frontend. Zero dependencies. */
'use strict';

// ---------------------------------------------------------------- helpers
const $ = (s) => document.querySelector(s);
const viewEl = $('#view');

function toast(msg, ms = 2400) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtNum(n, dp = 2) {
  if (!isFinite(n)) return '—';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: dp });
}
function fmtPrice(p) {
  if (!isFinite(p)) return '—';
  if (p >= 1) return p.toFixed(3);
  const s = p.toFixed(9).replace(/0+$/, '');
  return s;
}
function short(addr) { return addr ? addr.slice(0, 10) + '…' + addr.slice(-4) : '—'; }
function ago(ts) {
  const d = Math.max(0, Date.now() - ts) / 1000;
  if (d < 60) return Math.floor(d) + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  return Math.floor(d / 3600) + 'h ago';
}

// canonical JSON — must match the node exactly (sorted keys, no whitespace)
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort()
    .map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
const utf8 = (s) => new TextEncoder().encode(s);
const hexToBytes = (h) => Uint8Array.from(h.match(/.{2}/g).map((b) => parseInt(b, 16)));
const bytesToHex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

async function api(path, opts) {
  const r = await fetch('/api' + path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
  return j;
}

// ---------------------------------------------------------------- wallet
function loadWallet() {
  try { return JSON.parse(localStorage.getItem('gridchain_wallet')); } catch { return null; }
}
function saveWallet(w) { localStorage.setItem('gridchain_wallet', JSON.stringify(w)); }
function requireWallet() {
  const w = loadWallet();
  if (!w) { toast('create a wallet first'); location.hash = '#/wallet'; return null; }
  return w;
}

// Ed25519 signing in the browser (WebCrypto). Raw import first, PKCS#8 DER fallback.
async function signWith(secretHex, msgBytes) {
  const algo = { name: 'Ed25519' };
  let key;
  try {
    key = await crypto.subtle.importKey('raw', hexToBytes(secretHex), algo, false, ['sign']);
  } catch {
    const seed = hexToBytes(secretHex);
    const der = new Uint8Array([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20, ...seed]);
    key = await crypto.subtle.importKey('pkcs8', der, algo, false, ['sign']);
  }
  return new Uint8Array(await crypto.subtle.sign(algo, key, msgBytes));
}

async function sendTx(type, params) {
  const w = requireWallet();
  if (!w) return null;
  const acc = await api('/account/' + w.address);
  const tx = { type, from: w.address, nonce: acc.nonce, params, pub: w.public };
  const sig = await signWith(w.secret, utf8(canonical({ type, from: tx.from, nonce: tx.nonce, params })));
  tx.sig = bytesToHex(sig);
  const res = await api('/tx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tx) });
  toast('queued — waiting for a block…');
  // poll until the tx is sealed
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1200));
    const a = await api('/account/' + w.address);
    if (a.nonce > tx.nonce) { toast('✓ confirmed'); return tx; }
  }
  toast('still pending… refresh in a moment');
  return tx;
}

// ---------------------------------------------------------------- router
let pollTimer = null;
function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
function poll(fn, ms = 4000) { stopPoll(); pollTimer = setInterval(fn, ms); }

function setActiveTab(route) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.route === route);
  });
}

async function route() {
  stopPoll();
  const hash = location.hash || '#/';
  const parts = hash.slice(2).split('/').filter(Boolean); // "" | ["trade"] | ["coin","X"] ...
  const page = parts[0] || '';
  setActiveTab('/' + page);
  try {
    if (page === '') return await renderHome();
    if (page === 'trade') return await renderTrade(parts[1] ? decodeURIComponent(parts[1]) : null);
    if (page === 'create') return await renderCreate();
    if (page === 'wallet') return await renderWallet();
    if (page === 'coin' && parts[1]) return await renderCoin(decodeURIComponent(parts[1]));
    location.hash = '#/';
  } catch (e) {
    viewEl.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}
window.addEventListener('hashchange', route);

// Telegram WebApp polish (no-op in a normal browser)
(function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready(); tg.expand();
    try { tg.setBackgroundColor('#000000'); tg.setHeaderColor('#000000'); } catch {}
  }
})();

// ---------------------------------------------------------------- home
async function renderHome() {
  const [stats, tokens, txs] = await Promise.all([api('/stats'), api('/tokens'), api('/txs?limit=14')]);
  const refresh = async () => {
    if (document.activeElement && viewEl.contains(document.activeElement)) return;
    try { await route(); } catch {}
  };
  const cells = tokens.map((t) => `
    <a class="cell-card" href="#/coin/${esc(t.id)}">
      ${t.graduated ? '<span class="grad-flag">GRADUATED</span>' : ''}
      <div class="tick">$${esc(t.ticker)}</div>
      <div class="nm">${esc(t.name)}</div>
      <div class="row"><span class="k">price</span><span>${fmtPrice(t.price)} GRID</span></div>
      <div class="row"><span class="k">vol</span><span>${fmtNum(t.volume)}</span></div>
      <div class="row"><span class="k">holders</span><span>${t.holders}</span></div>
      <div class="pbar"><i style="width:${Math.round(t.progress * 100)}%"></i></div>
    </a>`).join('');

  viewEl.innerHTML = `
    <div class="stats">
      <div class="stat"><div class="k">Block</div><div class="v">${stats.height}</div></div>
      <div class="stat"><div class="k">Transactions</div><div class="v">${stats.txCount}</div></div>
      <div class="stat"><div class="k">Coins</div><div class="v">${stats.tokens}</div></div>
      <div class="stat"><div class="k">Accounts</div><div class="v">${stats.accounts}</div></div>
      <div class="stat"><div class="k">Volume</div><div class="v">${fmtNum(stats.volume, 0)}</div></div>
    </div>
    <div class="sec-title">// Latest cells</div>
    ${cells ? `<div class="cells">${cells}</div>` : '<div class="empty">no coins yet — be the first cell on the grid<br><br><a style="color:#fff;border-bottom:1px solid #444" href="#/create">create a coin</a></div>'}
    <div class="sec-title">// Live on-chain feed</div>
    <div class="feed">${txs.map((t) => `
      <div class="row"><span class="s">${esc(t.summary)}</span><span class="m">${ago(t.time)}</span></div>`).join('') || '<div class="row"><span class="s">waiting for the first transaction…</span></div>'}
    </div>`;
  poll(refresh);
}

// ---------------------------------------------------------------- trade terminal
async function renderTrade(preselect) {
  const tokens = await api('/tokens');
  if (!tokens.length) {
    viewEl.innerHTML = '<div class="empty">nothing to trade yet — <a style="color:#fff" href="#/create">create the first coin</a></div>';
    return;
  }
  const byVol = [...tokens].sort((a, b) => b.volume - a.volume);
  const id = preselect && tokens.find((t) => t.id === preselect) ? preselect : byVol[0].id;
  const t = tokens.find((x) => x.id === id);
  const w = loadWallet();
  const acc = w ? await api('/account/' + w.address) : null;
  const held = acc ? (acc.tokens.find((x) => x.id === id) || { amount: 0 }).amount : 0;

  viewEl.innerHTML = `
    <div class="trade-wrap">
      <div class="panel">
        <h3>MARKET</h3>
        <div class="feed" id="market-list">${byVol.slice(0, 12).map((x) => `
          <a class="row" href="#/trade/${esc(x.id)}" style="display:flex;justify-content:space-between;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);font-size:12px">
            <span style="font-weight:700">$${esc(x.ticker)}</span>
            <span style="color:var(--dim)">${fmtPrice(x.price)}</span>
            <span style="color:var(--dim)">v${fmtNum(x.volume, 0)}</span>
          </a>`).join('')}</div>
      </div>
      <div>
        <div class="coin-head"><span class="tick">$${esc(t.ticker)}</span><span class="nm">${esc(t.name)}</span></div>
        <div class="stats" style="margin:18px 0">
          <div class="stat"><div class="k">Price</div><div class="v">${fmtPrice(t.price)}</div></div>
          <div class="stat"><div class="k">Your bag</div><div class="v">${fmtNum(held)}</div></div>
          <div class="stat"><div class="k">GRID bal</div><div class="v">${fmtNum(acc ? acc.grid : 0)}</div></div>
          <div class="stat"><div class="k">Progress</div><div class="v">${Math.round(t.progress * 100)}%</div></div>
        </div>
        <div class="trade-grid">
          <div class="panel">
            <h3>BUY</h3>
            <div class="field"><label>amount, GRID</label><input id="buy-amt" type="number" min="1" placeholder="1000"></div>
            <div class="quick">
              <button class="btn ghost" data-q="100">100</button>
              <button class="btn ghost" data-q="1000">1000</button>
              <button class="btn ghost" data-q="10000">10k</button>
            </div>
            <button class="btn" id="buy-btn" style="margin-top:14px">BUY $${esc(t.ticker)}</button>
          </div>
          <div class="panel">
            <h3>SELL</h3>
            <div class="field"><label>amount, tokens</label><input id="sell-amt" type="number" min="0" placeholder="${Math.floor(held) || 0}"></div>
            <div class="quick">
              <button class="btn ghost" data-sell="0.25">25%</button>
              <button class="btn ghost" data-sell="0.5">50%</button>
              <button class="btn ghost" data-sell="1">100%</button>
            </div>
            <button class="btn ghost" id="sell-btn" style="margin-top:14px">SELL $${esc(t.ticker)}</button>
          </div>
        </div>
      </div>
    </div>`;

  $('#buy-btn').onclick = async () => {
    const amt = Number($('#buy-amt').value);
    if (!(amt > 0)) return toast('enter an amount');
    await sendTx('BUY', { token: t.id, amount: amt });
    route();
  };
  $('#sell-btn').onclick = async () => {
    const amt = Number($('#sell-amt').value);
    if (!(amt > 0)) return toast('enter an amount');
    await sendTx('SELL', { token: t.id, amount: amt });
    route();
  };
  viewEl.querySelectorAll('[data-q]').forEach((b) => {
    b.onclick = () => { $('#buy-amt').value = b.dataset.q; };
  });
    viewEl.querySelectorAll('[data-sell]').forEach((b) => {
      b.onclick = () => { $('#sell-amt').value = Math.floor(held * Number(b.dataset.sell) * 100) / 100; };
    });
}

// ---------------------------------------------------------------- coin page
async function renderCoin(id) {
  const t = await api('/tokens/' + encodeURIComponent(id));
  const w = loadWallet();
  const acc = w ? await api('/account/' + w.address) : null;
  const held = acc ? (acc.tokens.find((x) => x.id === t.id) || { amount: 0 }).amount : 0;

  viewEl.innerHTML = `
    <div class="coin-head"><span class="tick">$${esc(t.ticker)}</span><span class="nm">${esc(t.name)} · by ${short(t.creator)}</span></div>
    ${t.desc ? `<p style="color:var(--dim);font-size:13px;margin-top:8px;max-width:640px">${esc(t.desc)}</p>` : ''}
    <div class="stats" style="margin:18px 0">
      <div class="stat"><div class="k">Price</div><div class="v">${fmtPrice(t.price)} GRID</div></div>
      <div class="stat"><div class="k">Market cap</div><div class="v">${fmtNum(t.marketCap, 0)}</div></div>
      <div class="stat"><div class="k">Liquidity</div><div class="v">${fmtNum(t.liquidity, 0)}</div></div>
      <div class="stat"><div class="k">Holders</div><div class="v">${t.holders}</div></div>
      <div class="stat"><div class="k">Trades</div><div class="v">${t.trades}</div></div>
      <div class="stat"><div class="k">Your bag</div><div class="v">${fmtNum(held)}</div></div>
    </div>
    <div class="pbar" style="height:8px;max-width:640px;position:relative;background:#161616;border:1px solid var(--line)">
      <i style="position:absolute;inset:0 auto 0 0;width:${Math.round(t.progress * 100)}%;background:#fff"></i>
    </div>
    <div style="display:flex;justify-content:space-between;max-width:640px;font-size:10px;color:var(--dim);margin-top:6px">
      <span>curve ${Math.round(t.progress * 100)}%</span><span>graduation at 10,000 GRID</span>
    </div>
    <div class="chart-box"><canvas id="chart"></canvas></div>
    <div class="trade-grid">
      <div class="panel">
        <h3>BUY</h3>
        <div class="field"><label>amount, GRID</label><input id="buy-amt" type="number" min="1" placeholder="1000"></div>
        <button class="btn" id="buy-btn">BUY</button>
      </div>
      <div class="panel">
        <h3>SELL</h3>
        <div class="field"><label>amount, tokens</label><input id="sell-amt" type="number" min="0" placeholder="${Math.floor(held) || 0}"></div>
        <button class="btn ghost" id="sell-btn">SELL</button>
      </div>
    </div>
    <div class="sec-title">// Top holders</div>
    <div class="holders" style="max-width:640px">${t.holders.map((h) => `
      <div class="row"><span class="a">${esc(h.address)}</span><span>${fmtNum(h.amount)}</span></div>`).join('') || '<div class="row"><span class="a">no holders yet</span></div>'}
    </div>`;

  drawChart($('#chart'), t.history);
  $('#buy-btn').onclick = async () => {
    const amt = Number($('#buy-amt').value);
    if (!(amt > 0)) return toast('enter an amount');
    await sendTx('BUY', { token: t.id, amount: amt });
    route();
  };
  $('#sell-btn').onclick = async () => {
    const amt = Number($('#sell-amt').value);
    if (!(amt > 0)) return toast('enter an amount');
    await sendTx('SELL', { token: t.id, amount: amt });
    route();
  };
  poll(async () => {
    if (document.activeElement && viewEl.contains(document.activeElement)) return;
    try { await renderCoin(id); } catch {}
  }, 6000);
}

function drawChart(canvas, history) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 600, h = 240;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  const pts = history.slice(-120);
  if (pts.length < 2) {
    ctx.fillStyle = '#8a8a8a'; ctx.font = '12px monospace';
    ctx.fillText('not enough trades yet', 16, h / 2);
    return;
  }
  const ps = pts.map((p) => p.p);
  const min = Math.min(...ps), max = Math.max(...ps);
  const pad = (max - min) * 0.15 || min * 0.2 || 1;
  const lo = min - pad, hi = max + pad;
  const X = (i) => 8 + (i / (pts.length - 1)) * (w - 16);
  const Y = (v) => 12 + (1 - (v - lo) / (hi - lo)) * (h - 28);

  ctx.strokeStyle = 'rgba(255,255,255,.07)';
  for (let i = 0; i <= 3; i++) {
    const y = 12 + (i / 3) * (h - 28);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,255,255,.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.moveTo(X(0), Y(ps[0]));
  ps.forEach((v, i) => ctx.lineTo(X(i), Y(v)));
  ctx.lineTo(X(ps.length - 1), h); ctx.lineTo(X(0), h); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  ps.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();
}

// ---------------------------------------------------------------- create
async function renderCreate() {
  const w = loadWallet();
  const acc = w ? await api('/account/' + w.address) : null;
  viewEl.innerHTML = `
    <div class="wallet-box" style="margin:0 auto">
      <div class="sec-title">// Launch a coin</div>
      <div class="panel">
        ${!w ? '<p class="note" style="margin-bottom:14px">you need a wallet first — <a href="#/wallet" style="color:#fff">create one</a></p>' : ''}
        <div class="field"><label>ticker (2–8, A–Z / 0–9)</label><input id="c-tick" maxlength="8" placeholder="MOON"></div>
        <div class="field"><label>name</label><input id="c-name" maxlength="40" placeholder="Moon Coin"></div>
        <div class="field"><label>description</label><textarea id="c-desc" maxlength="200" rows="3" placeholder="to the moon and back"></textarea></div>
        <div class="field"><label>image url (optional)</label><input id="c-img" maxlength="300" placeholder="https://…"></div>
        <button class="btn" id="c-btn" ${w ? '' : 'disabled'}>CREATE COIN — 100 GRID FEE</button>
        <p class="note">fee is burned on-chain · supply 1,000,000,000 fixed · trading starts instantly on the bonding curve ·
        ${acc ? `your balance: ${fmtNum(acc.grid)} GRID` : ''}</p>
      </div>
    </div>`;
  $('#c-btn').onclick = async () => {
    const ticker = $('#c-tick').value.trim().toUpperCase();
    const name = $('#c-name').value.trim();
    if (!/^[A-Z0-9]{2,8}$/.test(ticker)) return toast('bad ticker');
    if (!name) return toast('name required');
    if (acc && acc.grid < 100) return toast('not enough GRID — use the faucet');
    const tx = await sendTx('CREATE_TOKEN', { ticker, name, desc: $('#c-desc').value.trim(), image: $('#c-img').value.trim() });
    if (tx) { toast('✓ $' + ticker + ' is live'); location.hash = '#/coin/' + ticker; }
  };
}

// ---------------------------------------------------------------- wallet
async function renderWallet() {
  const w = loadWallet();
  if (!w) {
    viewEl.innerHTML = `
      <div class="wallet-box" style="margin:0 auto">
        <div class="sec-title">// Wallet</div>
        <div class="panel">
          <p class="note" style="margin-bottom:16px">keys live only in your browser (localStorage). the node never stores your secret.</p>
          <button class="btn" id="w-new">CREATE NEW WALLET</button>
          <div style="height:10px"></div>
          <button class="btn ghost" id="w-import">IMPORT SECRET KEY</button>
          <p class="note" id="ed-note"></p>
        </div>
      </div>`;
    $('#w-new').onclick = async () => {
      const kp = await api('/wallet/new', { method: 'POST', body: '{}' });
      saveWallet(kp);
      toast('wallet created');
      renderWallet();
    };
    $('#w-import').onclick = async () => {
      const secret = prompt('paste your 64-char hex secret');
      if (!secret) return;
      try {
        // derive address/pub client-side by asking the node for a trial? no —
        // derive via sign test; instead we verify by importing in WebCrypto
        const key = await crypto.subtle.importKey('raw', hexToBytes(secret.trim()), { name: 'Ed25519' }, true, ['sign']);
        const jwk = await crypto.subtle.exportKey('jwk', key);
        const pubHex = jwk.x ? base64ToHex(jwk.x) : null;
        if (!pubHex) throw new Error('bad key');
        const address = await api('/address-of/' + pubHex);
        saveWallet({ address: address.address, public: pubHex, secret: secret.trim() });
        toast('wallet imported');
        renderWallet();
      } catch { toast('import failed (bad secret or unsupported browser)'); }
    };
    $('#ed-note').textContent = (window.crypto && crypto.subtle) ? '' : 'this browser has no WebCrypto — open in Telegram or a modern browser';
    return;
  }

  const acc = await api('/account/' + w.address);
  viewEl.innerHTML = `
    <div class="wallet-box" style="margin:0 auto">
      <div class="sec-title">// Wallet</div>
      <div class="addr-box"><div class="k">ADDRESS</div>${esc(w.address)}</div>
      <div class="bal-list">
        <div class="row"><span>GRID</span><span>${fmtNum(acc.grid, 4)}</span></div>
        ${acc.tokens.map((t) => `<div class="row"><span><a href="#/coin/${esc(t.id)}" style="color:#fff">$${esc(t.ticker || t.id)}</a></span><span>${fmtNum(t.amount)}</span></div>`).join('')}
      </div>
      <div class="quick" style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button class="btn" id="w-faucet">GET TEST GRID</button>
        <button class="btn ghost" id="w-show">SHOW SECRET</button>
      </div>
      <p class="note">faucet: 5,000 GRID once per hour · nonce: ${acc.nonce}</p>
    </div>`;
  $('#w-faucet').onclick = async () => {
    try {
      await api('/faucet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: w.address }) });
      toast('faucet queued — waiting for a block…');
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 1200));
        const a = await api('/account/' + w.address);
        if (a.grid > 0) { toast('✓ ' + fmtNum(a.grid) + ' GRID'); return renderWallet(); }
      }
      toast('still pending…');
    } catch (e) { toast(e.message); }
  };
  $('#w-show').onclick = () => {
    const p = document.createElement('p');
    p.className = 'note';
    p.innerHTML = `<span class="secret">${esc(w.secret)}</span><br>never share this — anyone with it owns the wallet`;
    p.style.marginTop = '12px';
    $('#w-show').replaceWith(p);
  };
}

function base64ToHex(b64) {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  return [...bin].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- boot
(async function boot() {
  const tick = async () => {
    try {
      const s = await api('/stats');
      $('#height-badge').innerHTML = `block <b>${s.height}</b>`;
    } catch {}
  };
  tick();
  setInterval(tick, 4000);
  route();
})();
