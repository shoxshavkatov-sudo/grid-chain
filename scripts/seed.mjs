// Seeds a demo coin with rich trade history (for candle charts) and on-chain chat.
// Usage: BASE=https://grid-chain.onrender.com node scripts/seed.mjs
import { randomKeypair, signMsg, canonical, utf8 } from '../src/util.js';

const BASE = process.env.BASE || 'http://localhost:3000';
const api = async (p, opts) => {
  const r = await fetch(BASE + '/api' + p, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(p + ' -> ' + (j.error || r.status));
  return j;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const kp = randomKeypair();

async function nonceOf(addr) { return (await api('/account/' + addr)).nonce; }
async function send(k, type, params) {
  const n = await nonceOf(k.address);
  const tx = { type, from: k.address, nonce: n, params, pub: k.public };
  tx.sig = signMsg(k.secret, utf8(canonical({ type, from: tx.from, nonce: n, params })));
  await api('/tx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tx) });
  for (let i = 0; i < 15; i++) {
    await wait(1100);
    if ((await nonceOf(k.address)) > n) return;
  }
  throw new Error('tx not sealed: ' + type);
}

const existing = await api('/tokens').catch(() => []);
if (existing.some((x) => x.id === 'CANDLE')) {
  console.log('$CANDLE already exists — nothing to seed');
  process.exit(0);
}

console.log('seeder wallet:', kp.address);
await api('/faucet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: kp.address }) });
await wait(6000);

await send(kp, 'PROFILE', { name: 'candle_dev' });
await send(kp, 'CREATE_TOKEN', {
  ticker: 'CANDLE',
  name: 'Candle Coin',
  desc: 'demo coin with a hot chart — red & green candles, on-chain chat, vibe only',
});

// alternating buys/sells of varying size → red/green candles with volume
const moves = [
  ['BUY', 300], ['BUY', 150], ['SELL', 60000], ['BUY', 500], ['BUY', 250],
  ['SELL', 120000], ['BUY', 800], ['BUY', 400], ['SELL', 90000], ['BUY', 1200],
];
for (const [side, amount] of moves) {
  await send(kp, side, { token: 'CANDLE', amount });
  console.log(' ', side, amount);
}

await send(kp, 'COMMENT', { token: 'CANDLE', text: 'first message written directly into the blockchain 🕯️' });
await send(kp, 'COMMENT', { token: 'CANDLE', text: 'red candles are just discount green candles' });
await send(kp, 'COMMENT', { token: 'CANDLE', text: 'every message here is a signed transaction. wild.' });

const tok = await api('/tokens/CANDLE');
console.log(`\n$CANDLE: price=${tok.price.toPrecision(6)} trades=${tok.trades} holders=${tok.holders} comments=${(tok.comments || []).length}`);
console.log('SEED OK ✓');
