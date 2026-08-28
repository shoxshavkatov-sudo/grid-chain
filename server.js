// GRID Chain HTTP server: JSON API + static launchpad frontend. Zero dependencies.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GridNode } from './src/node.js';
import {
  ChainError, CREATE_FEE, FAUCET_TOTAL, GRADUATION_TARGET, TOTAL_SUPPLY, V_GRID,
} from './src/chain.js';
import { randomKeypair, addressFromPub } from './src/util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PORT = process.env.PORT || 3000;
const FAUCET_AMOUNT = 5000;
const FAUCET_COOLDOWN_MS = 60 * 60 * 1000;

const node = new GridNode(DATA_DIR);
node.start();

const faucetLast = new Map(); // address -> last claim timestamp

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
    marketCap: price * (TOTAL_SUPPLY - t.y),
  };
}

function accountView(state, addr) {
  const a = state.accounts[addr];
  if (!a) return { address: addr, grid: 0, nonce: 0, tokens: [] };
  return {
    address: addr,
    grid: a.grid,
    nonce: a.nonce,
    tokens: Object.entries(a.tokens || {}).map(([id, amount]) => ({
      id, amount, ...(state.tokens[id] ? { ticker: state.tokens[id].ticker } : {}),
    })),
  };
}

async function route(req, res, url) {
  const p = url.pathname;
  const q = url.searchParams;
  const chain = node.chain;

  if (p === '/api/health') return json(res, 200, { ok: true, height: chain.height() });

  if (p === '/api/stats') {
    let volume = 0;
    for (const t of Object.values(chain.state.tokens)) volume += t.volume;
    return json(res, 200, {
      height: chain.height(),
      blockTime: 4,
      txCount: chain.blocks.reduce((n, b) => n + b.txs.length, 0),
      tokens: Object.keys(chain.state.tokens).length,
      accounts: Object.keys(chain.state.accounts).length,
      volume: Math.round(volume * 100) / 100,
      faucetRemaining: (chain.state.accounts[node.faucet.address] || { grid: 0 }).grid,
      constants: { CREATE_FEE, FAUCET_TOTAL, GRADUATION_TARGET, TOTAL_SUPPLY, V_GRID },
    });
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
    const id = decodeURIComponent(p.split('/')[3]).toUpperCase();
    const t = chain.state.tokens[id];
    if (!t) return json(res, 404, { error: 'token not found' });
    const holders = Object.entries(t.holders)
      .map(([address, amount]) => ({
        address, amount,
        name: (chain.state.profiles && chain.state.profiles[address] && chain.state.profiles[address].name) || null,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20);
    return json(res, 200, { ...tokenSummary(t, chain.state), history: t.history, holders });
  }

  if (p.startsWith('/api/profile/')) {
    const addr = p.split('/')[3];
    const prof = chain.state.profiles && chain.state.profiles[addr];
    const created = Object.values(chain.state.tokens)
      .filter((t) => t.creator === addr)
      .map((t) => tokenSummary(t, chain.state));
    return json(res, 200, {
      address: addr,
      name: prof ? prof.name : null,
      updated: prof ? prof.updated : null,
      created,
      activity: chain.recentTxs.filter((tx) => tx.from === addr).slice(0, 20),
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
    if (url.pathname.startsWith('/api/')) await route(req, res, url);
    else serveStatic(req, res, url);
  } catch (e) {
    if (e instanceof ChainError) return json(res, 400, { error: e.message, code: e.code });
    console.error('[http]', e);
    json(res, 500, { error: 'internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`[grid-chain] node listening on :${PORT}`);
  console.log(`[grid-chain] validator ${node.validator.public.slice(0, 16)}… faucet ${node.faucet.address.slice(0, 16)}…`);
});
