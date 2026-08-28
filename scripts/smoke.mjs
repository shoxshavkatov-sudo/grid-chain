// End-to-end smoke test against a running node.
// Usage: BASE=http://localhost:8901 node scripts/smoke.mjs
import { randomKeypair, signMsg, addressFromPub } from '../src/util.js';
import { canonical, utf8 } from '../src/util.js';

const BASE = process.env.BASE || 'http://localhost:8901';
const api = async (p, opts) => {
  const r = await fetch(BASE + '/api' + p, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(p + ' -> ' + (j.error || r.status));
  return j;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const kp = randomKeypair();
console.log('wallet:', kp.address);

async function nonce() {
  const a = await api('/account/' + kp.address);
  return a.nonce;
}
async function send(type, params) {
  const n = await nonce();
  const tx = { type, from: kp.address, nonce: n, params, pub: kp.public };
  tx.sig = signMsg(kp.secret, utf8(canonical({ type, from: tx.from, nonce: n, params })));
  const res = await api('/tx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tx) });
  // wait until sealed
  for (let i = 0; i < 15; i++) {
    await wait(1000);
    if ((await nonce()) > n) return;
  }
  throw new Error('tx not sealed in 15s: ' + type);
}

const health = await api('/health');
console.log('health:', JSON.stringify(health));

await api('/faucet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: kp.address }) });
await wait(6000);
const acc1 = await api('/account/' + kp.address);
console.log('after faucet:', acc1.grid, 'GRID');
if (acc1.grid <= 0) throw new Error('faucet failed');

const ticker = 'SMKE' + Math.floor(Math.random() * 90 + 10);
await send('CREATE_TOKEN', { ticker, name: 'Smoke Coin', desc: 'e2e test' });
await send('BUY', { token: ticker, amount: 500 });
await send('SELL', { token: ticker, amount: 100 });

const tok = await api('/tokens/' + ticker);
const acc2 = await api('/account/' + kp.address);
console.log(`token $${ticker}: price=${tok.price.toPrecision(6)} reserve=${tok.reserve} holders=${tok.holders}`);
console.log('final balance:', acc2.grid, 'GRID, tokens:', JSON.stringify(acc2.tokens));

const stats = await api('/stats');
console.log('chain stats:', JSON.stringify({ height: stats.height, txCount: stats.txCount, tokens: stats.tokens, accounts: stats.accounts }));
console.log('\nSMOKE OK ✓');
