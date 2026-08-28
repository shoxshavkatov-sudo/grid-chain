// GRID Chain HTTP server: JSON API + auth (login/password accounts wrapping
// keypair wallets) + SSE stream + OG cards + static frontend.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
import { GridNode } from './src/node.js';
import {
  ChainError, CREATE_FEE, FAUCET_TOTAL, GRADUATION_TARGET, TOTAL_SUPPLY, V_GRID, txHash, txPayload,
} from './src/chain.js';
import { randomKeypair, addressFromPub, signMsg } from './src/util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PORT = process.env.PORT || 3000;
const FAUCET_AMOUNT = 5000;
const FAUCET_COOLDOWN_MS = 60 * 60 * 1000;

const node = await new GridNode(DATA_DIR).ready();
node.start();

const faucetLast = new Map(); // address -> last claim timestamp
const sseClients = new Set(); // open event-stream connections

// ---------------------------------------------------------------------------
// Accounts with login/password. The keypair secret is stored AES-256-GCM
// encrypted with the password; a login session keeps the decrypted secret in
// RAM only, and signs transactions via the /api/relay endpoint.
const USERS_FILE = path.join(DATA_DIR, 'users.json');
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return {}; }
}
function saveUsers() {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users)); } catch (e) { console.error('[auth] users save failed:', e.message); }
}
const users = loadUsers();
const sessions = new Map(); // token -> { username, secret, address, public, created }

function hashPassword(password, saltHex) {
  return scryptSync(password, Buffer.from(saltHex, 'hex'), 32);
}
function encryptSecret(secret, password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return {
    salt: salt.toString('hex'), iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'), data: data.toString('hex'),
  };
}
function decryptSecret(enc, password) {
  const key = scryptSync(password, Buffer.from(enc.salt, 'hex'), 32);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(enc.tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(enc.data, 'hex')), decipher.final()]).toString('utf8');
}
function issueToken(user, username, password) {
  const token = randomBytes(24).toString('hex');
  sessions.set(token, {
    username,
    secret: decryptSecret(user.enc, password),
    address: user.address,
    public: user.public,
    created: Date.now(),
  });
  return token;
}

node.onBlock((block, chain) => {
  const prices = {};
  for (const [id, t] of Object.entries(chain.state.tokens)) {
    prices[id] = { p: t.x / t.y, v: t.volume, trades: t.trades, graduated: t.graduated };
  }
  const payload = JSON.stringify({
    type: 'block',
    height: block.height,
    feed: chain.recentTxs.slice(0, 6),
    prices,
  });
  for (const res of sseClients) {
    try { res.write(`data: ${payload}\n\n`); } catch { sseClients.delete(res); }
  }
});

// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) { reject(new ChainError('too_large', 'body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new ChainError('bad_json', 'invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function tokenSummary(t, state) {
  const price = t.x / t.y;
  const reserve = t.x - V_GRID;
  const creatorName = (state.profiles && state.profiles[t.creator] && state.profiles[t.creator].name) || null;
  return {
    id: t.id, ticker: t.ticker, name: t.name, desc: t.desc, image: t.image,
    creator: t.creator, creatorName,
    createdAt: t.createdAt,
    price, reserve, liquidity: t.x,
    progress: Math.max(0, Math.min(1, reserve / GRADUATION_TARGET)),
    graduated: t.graduated,
    trades: t.trades, volume: t.volume,
    holders: Object.keys(t.holders).length,
    openOrders: (t.orders || []).length,
    comments: (t.comments || []).length,
    marketCap: price * (TOTAL_SUPPLY - t.y),
  };
}

function accountView(state, addr) {
  const a = state.accounts[addr];
  if (!a) return { address: addr, grid: 0, nonce: 0, tokens: [], positions: {}, stats: null };
  return {
    address: addr,
    grid: a.grid,
    nonce: a.nonce,
    tokens: Object.entries(a.tokens || {}).map(([id, amount]) => ({
      id, amount, ...(state.tokens[id] ? { ticker: state.tokens[id].ticker } : {}),
    })),
    positions: a.positions || {},
    stats: a.stats || null,
  };
}

function achievementsFor(state, addr) {
  const a = state.accounts[addr];
  if (!a) return [];
  const st = a.stats || {};
  const created = Object.values(state.tokens).filter((t) => t.creator === addr);
  const keys = [];
  if ((st.tokensCreated || 0) >= 1 || created.length >= 1) keys.push('first_coin');
  if ((st.trades || 0) >= 10) keys.push('trader_10');
  if ((st.trades || 0) >= 100) keys.push('trader_100');
  if ((st.comments || 0) >= 10) keys.push('chatter');
  if ((st.comments || 0) >= 100) keys.push('loud');
  if ((st.buyVol || 0) >= 10000) keys.push('whale');
  if (created.some((t) => t.graduated)) keys.push('graduator');
  if (Object.values(a.tokens || {}).length >= 5) keys.push('collector');
  return keys;
}

function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function ogCardSvg(t) {
  const price = (t.x / t.y).toPrecision(4);
  const pct = Math.round(Math.max(0, Math.min(1, (t.x - V_GRID) / GRADUATION_TARGET)) * 100);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#050505"/>
  <g stroke="rgba(255,255,255,.05)"><path d="M0 105h1200M0 210h1200M0 315h1200M0 420h1200M0 525h1200"/>
  <path d="M120 0v630M240 0v630M360 0v630M480 0v630M600 0v630M720 0v630M840 0v630M960 0v630M1080 0v630"/></g>
  <rect x="80" y="80" width="72" height="72" rx="16" fill="none" stroke="#fff" stroke-width="3"/>
  <text x="116" y="128" font-family="monospace" font-size="40" font-weight="700" fill="#fff" text-anchor="middle">G</text>
  <text x="180" y="132" font-family="monospace" font-size="34" font-weight="700" fill="#fff" letter-spacing="6">GRID CHAIN</text>
  <text x="80" y="300" font-family="monospace" font-size="150" font-weight="800" fill="#fff">$${esc(t.ticker)}</text>
  <text x="84" y="370" font-family="sans-serif" font-size="36" fill="#9a9a9a">${esc(t.name)}</text>
  <text x="84" y="470" font-family="monospace" font-size="44" font-weight="700" fill="#2fd97f">${esc(price)} GRID</text>
  <text x="84" y="515" font-family="sans-serif" font-size="24" fill="#9a9a9a">${t.trades} trades · ${Object.keys(t.holders).length} holders · vol ${Math.round(t.volume).toLocaleString('en-US')} GRID</text>
  <rect x="84" y="545" width="1032" height="14" rx="7" fill="#1a1a1a"/>
  <rect x="84" y="545" width="${Math.round(1032 * pct / 100)}" height="14" rx="7" fill="#fff"/>
  <text x="84" y="595" font-family="sans-serif" font-size="20" fill="#5a5a5a">bonding curve ${pct}% → graduation</text>
</svg>`;
}

async function route(req, res, url) {
  const p = url.pathname;
  const q = url.searchParams;
  const chain = node.chain;

  if (p === '/api/auth/register' && req.method === 'POST') {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return json(res, 400, { error: 'username must be 3-24 chars: letters, digits, _' });
    }
    if (password.length < 6 || password.length > 128) {
      return json(res, 400, { error: 'password must be 6-128 chars' });
    }
    const key = username.toLowerCase();
    if (users[key]) return json(res, 409, { error: 'username already taken' });
    if ((chain.state.profiles || {}) && Object.values(chain.state.profiles).some((pr) => pr.name && pr.name.toLowerCase() === key)) {
      return json(res, 409, { error: 'this name is already used on-chain' });
    }
    const kp = randomKeypair();
    // on-chain identity right away: profile name = username, signed by the node
    try {
      const tx = { type: 'PROFILE', from: kp.address, nonce: 0, params: { name: username }, pub: kp.public };
      tx.sig = signMsg(kp.secret, txPayload(tx));
      node.submitTx(tx);
    } catch (e) {
      console.warn('[auth] profile tx failed:', e.message);
    }
    const salt = randomBytes(16).toString('hex');
    users[key] = {
      username,
      salt,
      hash: hashPassword(password, salt).toString('hex'),
      enc: encryptSecret(kp.secret, password),
      address: kp.address,
      public: kp.public,
      created: Date.now(),
    };
    saveUsers();
    const token = issueToken(users[key], key, password);
    return json(res, 200, { token, username, address: kp.address, public: kp.public });
  }

  if (p === '/api/auth/login' && req.method === 'POST') {
    const body = await readBody(req);
    const key = String(body.username || '').trim().toLowerCase();
    const user = users[key];
    if (!user) return json(res, 401, { error: 'wrong username or password' });
    const hash = hashPassword(String(body.password || ''), user.salt);
    if (!timingSafeEqual(hash, Buffer.from(user.hash, 'hex'))) {
      return json(res, 401, { error: 'wrong username or password' });
    }
    const token = issueToken(user, key, String(body.password || ''));
    return json(res, 200, { token, username: user.username, address: user.address, public: user.public });
  }

  if (p === '/api/auth/me' && req.method === 'POST') {
    const token = String((req.headers.authorization || '').replace(/^Bearer /i, '') || '');
    const s = sessions.get(token);
    if (!s) return json(res, 401, { error: 'session expired, login again' });
    return json(res, 200, { username: s.username, address: s.address, public: s.public });
  }

  if (p === '/api/auth/logout' && req.method === 'POST') {
    const token = String((req.headers.authorization || '').replace(/^Bearer /i, '') || '');
    sessions.delete(token);
    return json(res, 200, { ok: true });
  }

  // Sign a transaction with the session's wallet (for logged-in users without
  // a local browser key). Same validation path as client-signed txs.
  if (p === '/api/relay' && req.method === 'POST') {
    const token = String((req.headers.authorization || '').replace(/^Bearer /i, '') || '');
    const s = sessions.get(token);
    if (!s) return json(res, 401, { error: 'session expired, login again' });
    const body = await readBody(req);
    const nonce = (chain.state.accounts[s.address] || { nonce: 0 }).nonce;
    const tx = { type: String(body.type || ''), from: s.address, nonce, params: body.params || {}, pub: s.public };
    try {
      tx.sig = signMsg(s.secret, txPayload(tx));
      node.submitTx(tx);
    } catch (e) {
      if (e instanceof ChainError) return json(res, 400, { error: e.message, code: e.code });
      throw e;
    }
    return json(res, 200, { ok: true, queued: true, tx });
  }

  if (p === '/api/health') {
    return json(res, 200, { ok: true, height: chain.height(), store: node.store.mode });
  }

  // Server-sent events: live blocks, prices and feed
  if (p === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(`data: ${JSON.stringify({ type: 'hello', height: chain.height() })}\n\n`);
    sseClients.add(res);
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 25000);
    req.on('close', () => { clearInterval(ping); sseClients.delete(res); });
    return;
  }

  if (p === '/api/stats') {
    let volume = 0;
    for (const t of Object.values(chain.state.tokens)) volume += t.volume;
    let supply = 0;
    for (const a of Object.values(chain.state.accounts)) supply += a.grid;
    return json(res, 200, {
      height: chain.height(),
      blockTime: 4,
      txCount: chain.blocks.reduce((n, b) => n + b.txs.length, 0),
      tokens: Object.keys(chain.state.tokens).length,
      accounts: Object.keys(chain.state.accounts).length,
      volume: Math.round(volume * 100) / 100,
      gridSupply: Math.round(supply * 100) / 100,
      faucetRemaining: (chain.state.accounts[node.faucet.address] || { grid: 0 }).grid,
      constants: { CREATE_FEE, FAUCET_TOTAL, GRADUATION_TARGET, TOTAL_SUPPLY, V_GRID, TRADE_FEE: 0.01 },
    });
  }

  if (p === '/api/config') {
    return json(res, 200, {
      admin: chain.state.admin || null,
      adminName: chain.state.admin && chain.state.profiles[chain.state.admin]
        ? chain.state.profiles[chain.state.admin].name : null,
      config: chain.state.config || {},
    });
  }

  if (p === '/api/deposits') {
    return json(res, 200, {
      deposits: (chain.state.deposits || []).map((d) => ({
        ...d,
        name: (chain.state.profiles[d.from] || {}).name || null,
        address: d.from,
      })),
    });
  }

  if (p === '/api/accounts') {
    const list = Object.entries(chain.state.accounts)
      .filter(([addr]) => addr !== node.faucet.address)
      .map(([address, a]) => ({
        address,
        grid: a.grid,
        name: (chain.state.profiles[address] || {}).name || null,
        nonce: a.nonce,
      }))
      .sort((a, b) => b.grid - a.grid)
      .slice(0, 100);
    return json(res, 200, list);
  }

  if (p === '/api/blocks') {
    const limit = Math.min(100, Number(q.get('limit')) || 20);
    const blocks = chain.blocks.slice(-limit).reverse().map((b) => ({
      height: b.height, time: b.time, txs: b.txs.length,
      hash: b.hash, stateRoot: b.stateRoot,
    }));
    return json(res, 200, blocks);
  }

  if (p.startsWith('/api/block/')) {
    const h = Number(p.split('/')[3]);
    const b = chain.blocks[h];
    if (!b) return json(res, 404, { error: 'block not found' });
    return json(res, 200, b);
  }

  if (p.startsWith('/api/tx/')) {
    const hash = p.split('/')[3];
    const recent = chain.recentTxs.find((tx) => tx.hash === hash);
    if (recent) return json(res, 200, recent);
    for (const b of chain.blocks) {
      const tx = (b.txs || []).find((tx2) => txHash(tx2) === hash);
      if (tx) return json(res, 200, { ...tx, block: b.height, time: b.time });
    }
    return json(res, 404, { error: 'tx not found' });
  }

  if (p === '/api/txs') {
    const limit = Math.min(100, Number(q.get('limit')) || 30);
    return json(res, 200, chain.recentTxs.slice(0, limit));
  }

  if (p === '/api/tokens') {
    const list = Object.values(chain.state.tokens)
      .map((t) => tokenSummary(t, chain.state))
      .sort((a, b) => b.createdAt - a.createdAt);
    return json(res, 200, list);
  }

  if (p.startsWith('/api/tokens/')) {
    const id = decodeURIComponent(p.split('/')[3] || '').toUpperCase();
    if (p.split('/')[3] && p.split('/')[3].endsWith('.svg')) {
      const t = chain.state.tokens[id.replace(/\.svg$/i, '').toUpperCase()];
      if (!t) return json(res, 404, { error: 'token not found' });
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' });
      return res.end(ogCardSvg(t));
    }
    const t = chain.state.tokens[id];
    if (!t) return json(res, 404, { error: 'token not found' });
    const holders = Object.entries(t.holders)
      .map(([address, amount]) => ({
        address, amount,
        name: (chain.state.profiles && chain.state.profiles[address] && chain.state.profiles[address].name) || null,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20);
    const comments = (t.comments || []).map((c) => ({
      from: c.from,
      name: (chain.state.profiles && chain.state.profiles[c.from] && chain.state.profiles[c.from].name) || null,
      text: c.text,
      time: c.time,
    }));
    const orders = (t.orders || []).map((o) => ({
      id: o.id, from: o.from, side: o.side, amount: o.amount, price: o.price, created: o.created,
      name: (chain.state.profiles && chain.state.profiles[o.from] && chain.state.profiles[o.from].name) || null,
    }));
    return json(res, 200, { ...tokenSummary(t, chain.state), history: t.history, holders, comments, orders });
  }

  if (p.startsWith('/api/profile/')) {
    const addr = p.split('/')[3];
    const prof = chain.state.profiles && chain.state.profiles[addr];
    const created = Object.values(chain.state.tokens)
      .filter((t) => t.creator === addr)
      .map((t) => tokenSummary(t, chain.state));
    const a = chain.state.accounts[addr];
    return json(res, 200, {
      address: addr,
      name: prof ? prof.name : null,
      updated: prof ? prof.updated : null,
      created,
      achievements: achievementsFor(chain.state, addr),
      stats: (a && a.stats) || null,
      activity: chain.recentTxs.filter((tx) => tx.from === addr).slice(0, 20),
    });
  }

  if (p.startsWith('/api/leaderboard')) {
    const accounts = Object.entries(chain.state.accounts)
      .map(([address, a]) => ({
        address,
        name: (chain.state.profiles[address] || {}).name || null,
        ...(a.stats || { buyVol: 0, sellVol: 0, trades: 0, comments: 0, tokensCreated: 0, realized: 0 }),
      }))
      .filter((a) => a.address !== node.faucet.address);
    const coins = Object.values(chain.state.tokens)
      .map((t) => tokenSummary(t, chain.state))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map((t) => ({ id: t.id, ticker: t.ticker, volume: t.volume, price: t.price, holders: t.holders, trades: t.trades }));
    return json(res, 200, {
      traders: accounts
        .map((a) => ({ ...a, vol: Math.round((a.buyVol + a.sellVol) * 100) / 100 }))
        .sort((a, b) => b.vol - a.vol).slice(0, 10),
      chatters: accounts.sort((a, b) => b.comments - a.comments).slice(0, 10),
      creators: accounts.sort((a, b) => b.tokensCreated - a.tokensCreated).slice(0, 10),
      coins,
    });
  }

  if (p.startsWith('/api/account/')) {
    const addr = p.split('/')[3];
    return json(res, 200, accountView(chain.state, addr));
  }

  if (p.startsWith('/api/address-of/')) {
    const pub = p.split('/')[3];
    if (!/^([0-9a-f]{64})$/.test(pub)) return json(res, 400, { error: 'invalid pubkey' });
    return json(res, 200, { address: addressFromPub(pub) });
  }

  if (p.startsWith('/api/resolve/')) {
    const name = decodeURIComponent(p.split('/')[3] || '').trim().toLowerCase();
    if (!name) return json(res, 400, { error: 'empty name' });
    const entry = Object.entries(chain.state.profiles || {})
      .find(([, prof]) => prof.name && prof.name.toLowerCase() === name);
    if (!entry) return json(res, 404, { error: 'name not found' });
    return json(res, 200, { address: entry[0], name: entry[1].name });
  }

  if (p === '/api/wallet/new' && req.method === 'POST') {
    const kp = randomKeypair();
    return json(res, 200, {
      address: kp.address, public: kp.public, secret: kp.secret,
      note: 'store this secret locally — it is never sent back by the node',
    });
  }

  if (p === '/api/faucet' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.address || !/^grid1[0-9a-f]{40}$/.test(body.address)) {
      return json(res, 400, { error: 'invalid address' });
    }
    const last = faucetLast.get(body.address) || 0;
    if (Date.now() - last < FAUCET_COOLDOWN_MS) {
      const waitMin = Math.ceil((FAUCET_COOLDOWN_MS - (Date.now() - last)) / 60000);
      return json(res, 429, { error: `faucet cooldown, try again in ~${waitMin} min` });
    }
    const funded = (chain.state.accounts[body.address] || { grid: 0 }).grid;
    if (funded >= FAUCET_AMOUNT) return json(res, 429, { error: 'address already funded' });
    node.faucetTo(body.address, FAUCET_AMOUNT);
    faucetLast.set(body.address, Date.now());
    return json(res, 200, { ok: true, amount: FAUCET_AMOUNT, queued: true });
  }

  if (p === '/api/tx' && req.method === 'POST') {
    const tx = await readBody(req);
    try {
      node.submitTx(tx);
      return json(res, 200, { ok: true, queued: true, mempool: node.mempool.length });
    } catch (e) {
      if (e instanceof ChainError) return json(res, 400, { error: e.message, code: e.code });
      throw e;
    }
  }

  return json(res, 404, { error: 'not found' });
}

function serveStatic(req, res, url) {
  // browsers probe these automatically; answer with the svg favicon instead of 404s
  if (url.pathname === '/favicon.ico' || url.pathname === '/apple-touch-icon.png') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
    return fs.createReadStream(path.join(__dirname, 'public', 'favicon.svg')).pipe(res);
  }
  // shareable preview cards: /coin/TICKER/og.svg
  const ogMatch = url.pathname.match(/^\/coin\/([A-Za-z0-9]{2,8})\/og\.svg$/);
  if (ogMatch) {
    const t = node.chain.state.tokens[ogMatch[1].toUpperCase()];
    if (!t) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' });
    return res.end(ogCardSvg(t));
  }
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
  const abs = path.join(__dirname, 'public', filePath);
  if (!abs.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403); return res.end('forbidden');
  }
  fs.readFile(abs, (err, data) => {
    if (err) {
      // SPA fallback only for extension-less routes (real assets 404 cleanly)
      if (path.extname(filePath)) { res.writeHead(404); return res.end('not found'); }
      fs.readFile(path.join(__dirname, 'public', 'index.html'), (e2, index) => {
        if (e2) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(index);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/') || url.pathname === '/api/stream') await route(req, res, url);
    else serveStatic(req, res, url);
  } catch (e) {
    if (e instanceof ChainError) return json(res, 400, { error: e.message, code: e.code });
    console.error('[http]', e);
    json(res, 500, { error: 'internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`[grid-chain] node listening on :${PORT} (store: ${node.store.mode})`);
  console.log(`[grid-chain] validator ${node.validator.public.slice(0, 16)}… faucet ${node.faucet.address.slice(0, 16)}…`);
});
