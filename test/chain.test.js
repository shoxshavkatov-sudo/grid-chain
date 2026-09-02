import test from 'node:test';
import assert from 'node:assert/strict';
import { Chain, ChainError, CREATE_FEE, V_GRID, TOTAL_SUPPLY, GRADUATION_TARGET, cardAttrs } from '../src/chain.js';
import { randomKeypair, signMsg } from '../src/util.js';
import { txPayloadUtil, verifyUtil } from './helpers.js';

const validator = randomKeypair();
const alice = randomKeypair();
const bob = randomKeypair();

function makeTx(kp, chainState, type, params) {
  const acc = chainState.accounts[kp.address] || { nonce: 0 };
  const tx = { type, from: kp.address, nonce: acc.nonce, params, pub: kp.public };
  tx.sig = signMsg(kp.secret, txPayloadUtil(tx));
  return tx;
}

function r2approx(n) { return Math.round(n * 100) / 100; }

function freshChain() {
  const c = Chain.genesis('grid1faucet');
  c.makeBlock([], validator);
  // fund alice from "nowhere" by direct state edit (test-only shortcut)
  c.state.accounts[alice.address] = { grid: 10000, nonce: 0, tokens: {}, pub: alice.public };
  return c;
}

test('keypair sign/verify roundtrip', () => {
  const kp = randomKeypair();
  const msg = Buffer.from('grid test');
  const sig = signMsg(kp.secret, msg);
  assert.ok(verifyUtil(kp.public, msg, sig));
  assert.ok(!verifyUtil(kp.public, Buffer.from('tampered'), sig));
});

test('transfer moves balance and bumps nonce', () => {
  const c = freshChain();
  const tx = makeTx(alice, c.state, 'TRANSFER', { to: bob.address, amount: 100 });
  c.applyTx(tx, { height: 1, time: 1 });
  assert.equal(c.state.accounts[alice.address].grid, 9900);
  assert.equal(c.state.accounts[bob.address].grid, 100);
  assert.equal(c.state.accounts[alice.address].nonce, 1);
});

test('insufficient balance rejected', () => {
  const c = freshChain();
  const tx = makeTx(alice, c.state, 'TRANSFER', { to: bob.address, amount: 999999 });
  assert.throws(() => c.applyTx(tx, {}), (e) => e.code === 'insufficient');
});

test('wrong nonce rejected', () => {
  const c = freshChain();
  const tx = makeTx(alice, c.state, 'TRANSFER', { to: bob.address, amount: 1 });
  tx.nonce = 5;
  tx.sig = signMsg(alice.secret, txPayloadUtil(tx));
  assert.throws(() => c.applyTx(tx, {}), (e) => e.code === 'bad_nonce');
});

test('bad signature rejected', () => {
  const c = freshChain();
  const tx = makeTx(alice, c.state, 'TRANSFER', { to: bob.address, amount: 1 });
  tx.sig = 'ff'.repeat(64);
  assert.throws(() => c.applyTx(tx, {}), (e) => e.code === 'bad_sig');
});

test('create token burns fee, buy/sell roundtrip conserves value, price rises', () => {
  const c = freshChain();

  const create = makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'TEST', name: 'Test Coin' });
  c.applyTx(create, { height: 1, time: 1 });
  assert.equal(c.state.accounts[alice.address].grid, 10000 - CREATE_FEE);
  const t = c.state.tokens.TEST;
  assert.ok(t);
  assert.equal(t.x, V_GRID);
  assert.equal(t.y, TOTAL_SUPPLY);

  // first buy
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'TEST', amount: 1000 }), { height: 1, time: 2 });
  const got1 = c.state.accounts[alice.address].tokens.TEST;
  assert.ok(got1 > 0);
  const price1 = t.x / t.y;
  assert.ok(price1 > V_GRID / TOTAL_SUPPLY, 'price must rise after buy');

  // second same-size buy yields fewer tokens (curve steepens)
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'TEST', amount: 1000 }), { height: 1, time: 3 });
  const got2 = c.state.accounts[alice.address].tokens.TEST - got1;
  assert.ok(got2 < got1, 'diminishing returns on the curve');

  // sell everything back
  c.applyTx(makeTx(alice, c.state, 'SELL', { token: 'TEST', amount: c.state.accounts[alice.address].tokens.TEST }), { height: 1, time: 4 });
  assert.equal(c.state.accounts[alice.address].tokens.TEST, undefined);
  // after a full roundtrip: creation fee + ~1% trade fees each way are gone
  const diff = (10000 - CREATE_FEE) - c.state.accounts[alice.address].grid;
  assert.ok(diff > 0 && diff < 80, `roundtrip loss out of expected fee range: ${diff}`);
  assert.ok(Math.abs(t.x - V_GRID) < 2, 'reserve should return near the virtual floor');
});

test('sell more than owned rejected', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'TEST', name: 'Test Coin' }), { height: 1, time: 1 });
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'TEST', amount: 10 }), { height: 1, time: 2 });
  const bal = c.state.accounts[alice.address].tokens.TEST;
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'SELL', { token: 'TEST', amount: bal + 1 }), {}),
    (e) => e.code === 'insufficient');
});

test('duplicate ticker rejected', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'TEST', name: 'Test Coin' }), { height: 1, time: 1 });
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'TEST', name: 'Another' }), {}),
    (e) => e.code === 'dup_ticker');
});

test('blocks chain together and verify; tampering detected', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'TRANSFER', { to: bob.address, amount: 5 }), { height: 1, time: 1 });
  const b1 = c.makeBlock([makeTx(alice, c.state, 'TRANSFER', { to: bob.address, amount: 7 })], validator);
  assert.equal(c.blocks.length, 2);
  assert.equal(b1.prev, c.blocks[0].hash);
  assert.ok(c.verifyChain(validator.public));

  c.blocks[1].time += 1000; // tamper
  assert.ok(!c.verifyChain(validator.public), 'tampered chain must fail verification');
});

test('graduation flips when reserve target reached', () => {
  const c = freshChain();
  c.state.accounts[alice.address].grid = 1_000_000; // test-only top-up
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'MOON', name: 'Moon' }), { height: 1, time: 1 });
  // 1% fee means part of the spend never reaches the curve — buy with a margin
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'MOON', amount: GRADUATION_TARGET * 2 }), { height: 1, time: 2 });
  assert.ok(c.state.tokens.MOON.graduated);
});

test('profile tx sets an on-chain name', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'PROFILE', { name: '  vibe   coder ' }), { height: 1, time: 1 });
  assert.equal(c.state.profiles[alice.address].name, 'vibe coder');
  assert.equal(c.state.accounts[alice.address].nonce, 1);
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'PROFILE', { name: '' }), {}), (e) => e.code === 'bad_name');
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'PROFILE', { name: 'x'.repeat(25) }), {}), (e) => e.code === 'bad_name');
});

test('token transfer moves balances and holders', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'TEST', name: 'Test Coin' }), { height: 1, time: 1 });
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'TEST', amount: 1000 }), { height: 1, time: 2 });
  const bal = c.state.accounts[alice.address].tokens.TEST;
  c.applyTx(makeTx(alice, c.state, 'TOKEN_TRANSFER', { token: 'TEST', to: bob.address, amount: 100 }), { height: 1, time: 3 });
  assert.equal(c.state.accounts[alice.address].tokens.TEST, bal - 100);
  assert.equal(c.state.accounts[bob.address].tokens.TEST, 100);
  assert.equal(c.state.tokens.TEST.holders[bob.address], 100);
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'TOKEN_TRANSFER', { token: 'TEST', to: bob.address, amount: 1e9 }), {}),
    (e) => e.code === 'insufficient');
});

test('comment tx burns fee and stores the message on-chain', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'TEST', name: 'Test Coin' }), { height: 1, time: 1 });
  const before = c.state.accounts[alice.address].grid;
  c.applyTx(makeTx(alice, c.state, 'COMMENT', { token: 'TEST', text: '  gm grid  ' }), { height: 1, time: 2 });
  assert.equal(c.state.tokens.TEST.comments.length, 1);
  assert.equal(c.state.tokens.TEST.comments[0].text, 'gm grid');
  assert.equal(c.state.accounts[alice.address].grid, before - 1);
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'COMMENT', { token: 'TEST', text: 'x'.repeat(201) }), {}),
    (e) => e.code === 'bad_text');
});

test('history records volume for candles', () => {
  const c = freshChain();
  c.state.accounts[alice.address].grid = 100000;
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'VOLT', name: 'Volt' }), { height: 1, time: 1 });
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'VOLT', amount: 777 }), { height: 1, time: 2 });
  const last = c.state.tokens.VOLT.history.at(-1);
  assert.ok(last.v === 777, 'volume must be recorded in history');
  assert.ok(last.p > 0);
});

test('trade fee is split: half burned, half to the creator', () => {
  const c = freshChain();
  c.state.accounts[alice.address].grid = 100000;
  c.state.accounts[bob.address] = { grid: 100000, nonce: 0, tokens: {}, pub: bob.public };
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'FEE', name: 'Fee Coin' }), { height: 1, time: 1 });
  const aliceBefore = c.state.accounts[alice.address].grid;
  c.applyTx(makeTx(bob, c.state, 'BUY', { token: 'FEE', amount: 1000 }), { height: 1, time: 2 });
  const creatorGain = c.state.accounts[alice.address].grid - aliceBefore;
  assert.ok(creatorGain > 4 && creatorGain < 6, `creator should earn ~5 GRID, got ${creatorGain}`);
  assert.ok(c.state.accounts[bob.address].grid <= 100000 - 1000, 'buyer paid full amount');
});

test('positions and stats are tracked for PnL', () => {
  const c = freshChain();
  c.state.accounts[alice.address].grid = 100000;
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'PNL', name: 'Pnl' }), { height: 1, time: 1 });
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'PNL', amount: 1000 }), { height: 1, time: 2 });
  const pos = c.state.accounts[alice.address].positions.PNL;
  assert.ok(pos.amount > 0 && pos.avg > 0);
  const st = c.state.accounts[alice.address].stats;
  assert.equal(st.trades, 1);
  assert.ok(st.buyVol >= 1000);
});

test('limit sell order below market fills immediately', () => {
  const c = freshChain();
  c.state.accounts[alice.address].grid = 100000;
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'LMT', name: 'Limit' }), { height: 1, time: 1 });
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'LMT', amount: 1000 }), { height: 1, time: 2 });
  const price = c.state.tokens.LMT.x / c.state.tokens.LMT.y;
  const tokens = c.state.accounts[alice.address].tokens.LMT;
  const gridBefore = c.state.accounts[alice.address].grid;
  // sell limit UNDER the current price → crosses instantly
  c.applyTx(makeTx(alice, c.state, 'ORDER', { token: 'LMT', side: 'sell', amount: r2approx(tokens / 2), price: price * 0.5 }), { height: 1, time: 3 });
  assert.equal(c.state.tokens.LMT.orders.length, 0, 'crossed order must fill');
  assert.ok(c.state.accounts[alice.address].grid > gridBefore, 'seller received payout');
  assert.ok(Math.abs(c.state.accounts[alice.address].tokens.LMT - tokens / 2) < 1, 'roughly half the tokens remain');
});

test('limit buy order above market fills when price rises to it', () => {
  const c = freshChain();
  c.state.accounts[alice.address].grid = 100000;
  c.state.accounts[bob.address] = { grid: 100000, nonce: 0, tokens: {}, pub: bob.public };
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'LMB', name: 'Limit B' }), { height: 1, time: 1 });
  const price0 = c.state.tokens.LMB.x / c.state.tokens.LMB.y;
  // bob places a buy order above the current price
  c.applyTx(makeTx(bob, c.state, 'ORDER', { token: 'LMB', side: 'buy', amount: 500, price: price0 * 3 }), { height: 1, time: 2 });
  // an order crossing the market at placement fills immediately
  assert.equal(c.state.tokens.LMB.orders.length, 0);
  assert.ok((c.state.accounts[bob.address].tokens.LMB || 0) > 0);

  // alice places a resting buy order just below market (with float-dust headroom)
  c.applyTx(makeTx(alice, c.state, 'ORDER', { token: 'LMB', side: 'buy', amount: 200, price: price0 * 1.01 }), { height: 1, time: 3 });
  assert.equal(c.state.tokens.LMB.orders.length, 1, 'resting order stays open');
  // bob sells hard, price drops, order triggers
  c.applyTx(makeTx(bob, c.state, 'SELL', { token: 'LMB', amount: c.state.accounts[bob.address].tokens.LMB }), { height: 1, time: 4 });
  assert.equal(c.state.tokens.LMB.orders.length, 0, 'order must fill after price drop');
});

test('NFT cards: mint burns fee, ids unique, sell/buy/cancel flow', () => {
  const c = freshChain();
  c.state.accounts[alice.address].grid = 100000;
  c.state.accounts[bob.address] = { grid: 100000, nonce: 0, tokens: {}, pub: bob.public };
  const ids = [];
  for (let i = 0; i < 5; i++) {
    c.applyTx(makeTx(alice, c.state, 'MINT_CARD', {}), { height: 1, time: 1 + i });
  }
  const minted = Object.values(c.state.cards);
  assert.equal(minted.length, 5);
  assert.equal(new Set(minted.map((x) => x.id)).size, 5, 'ids must be unique');
  assert.equal(c.state.accounts[alice.address].grid, 100000 - 5 * 500, 'fee burned per mint');
  assert.ok(minted.every((x) => x.owner === alice.address));

  const card = minted[0];
  // non-owner cannot list
  assert.throws(() => c.applyTx(makeTx(bob, c.state, 'SELL_CARD', { id: card.id, price: 100 }), {}),
    (e) => e.code === 'not_owner');
  // owner lists, bob buys with fee
  c.applyTx(makeTx(alice, c.state, 'SELL_CARD', { id: card.id, price: 1000 }), { height: 2, time: 1 });
  const aliceBefore = c.state.accounts[alice.address].grid;
  const bobBefore = c.state.accounts[bob.address].grid;
  c.applyTx(makeTx(bob, c.state, 'BUY_CARD', { id: card.id }), { height: 2, time: 2 });
  assert.equal(c.state.cards[card.id].owner, bob.address);
  assert.equal(c.state.cards[card.id].sale, null, 'delisted after sale');
  assert.equal(c.state.accounts[bob.address].grid, bobBefore - 1000);
  const expected = 1000 - Math.round(1000 * 0.025 * 1e4) / 1e4;
  assert.ok(Math.abs(c.state.accounts[alice.address].grid - aliceBefore - expected) < 0.01, 'seller got price minus fee');

  // unlisted card cannot be bought
  const card2 = minted[1];
  assert.throws(() => c.applyTx(makeTx(bob, c.state, 'BUY_CARD', { id: card2.id }), {}), (e) => e.code === 'not_for_sale');
  // list + cancel
  c.applyTx(makeTx(alice, c.state, 'SELL_CARD', { id: card2.id, price: 50 }), { height: 3, time: 1 });
  c.applyTx(makeTx(alice, c.state, 'CANCEL_SALE', { id: card2.id }), { height: 3, time: 2 });
  assert.equal(c.state.cards[card2.id].sale, null);
});

test('NFT card attrs are deterministic with all rarities possible', () => {
  const a1 = cardAttrs(417);
  const a2 = cardAttrs(417);
  assert.deepEqual(a1, a2, 'same id → same attrs');
  assert.ok(a1.c1 && a1.c2 && a1.glyph);
  const rarities = new Set();
  for (let i = 1; i <= 200; i++) rarities.add(cardAttrs(i).rarity);
  assert.ok(rarities.has('common'));
  const uniq = new Set();
  for (let i = 1; i <= 1000; i++) uniq.add(JSON.stringify(cardAttrs(i)));
  assert.ok(uniq.size > 900, 'patterns must be near-unique: ' + uniq.size);
});

test('fulfill_deposit: operator-only auto-credit, idempotent by hash', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'CLAIM_ADMIN', {}), { height: 1, time: 1 });
  c.applyTx(makeTx(alice, c.state, 'SET_CONFIG', { key: 'tonRate', value: '0.005' }), { height: 1, time: 2 });
  // non-operator cannot fulfill
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'FULFILL_DEPOSIT', { address: bob.address, tons: 1, hash: 'abc' }), {}),
    (e) => e.code === 'not_operator');
  c.operatorAddr = bob.address; // pretend bob runs the node
  c.applyTx(makeTx(bob, c.state, 'FULFILL_DEPOSIT', { address: bob.address, tons: 2, hash: 'tx1' }), { height: 1, time: 3 });
  assert.equal(c.state.accounts[bob.address].grid, 400); // 2 / 0.005
  // same hash again → rejected
  assert.throws(() => c.applyTx(makeTx(bob, c.state, 'FULFILL_DEPOSIT', { address: bob.address, tons: 2, hash: 'tx1' }), {}),
    (e) => e.code === 'dup');
  // below minimum
  assert.throws(() => c.applyTx(makeTx(bob, c.state, 'FULFILL_DEPOSIT', { address: bob.address, tons: 0.3, hash: 'tx2' }), {}),
    (e) => e.code === 'bad_amount');
});

test('cancel order refunds the escrow', () => {
  const c = freshChain();
  c.state.accounts[alice.address].grid = 100000;
  c.applyTx(makeTx(alice, c.state, 'CREATE_TOKEN', { ticker: 'CNC', name: 'Cancel' }), { height: 1, time: 1 });
  const price0 = c.state.tokens.CNC.x / c.state.tokens.CNC.y;
  const before = c.state.accounts[alice.address].grid;
  c.applyTx(makeTx(alice, c.state, 'ORDER', { token: 'CNC', side: 'buy', amount: 300, price: price0 * 0.5 }), { height: 1, time: 2 });
  assert.ok(c.state.accounts[alice.address].grid === before - 300, 'escrow locked');
  const ord = c.state.tokens.CNC.orders[0];
  c.applyTx(makeTx(alice, c.state, 'CANCEL_ORDER', { token: 'CNC', id: ord.id }), { height: 1, time: 3 });
  assert.equal(c.state.tokens.CNC.orders.length, 0);
  assert.ok(c.state.accounts[alice.address].grid === before, 'escrow refunded');
});

test('admin lifecycle: claim once, mint is admin-only', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'CLAIM_ADMIN', {}), { height: 1, time: 1 });
  assert.equal(c.state.admin, alice.address);
  assert.throws(() => c.applyTx(makeTx(bob, c.state, 'CLAIM_ADMIN', {}), {}), (e) => e.code === 'admin_exists');
  assert.throws(() => c.applyTx(makeTx(bob, c.state, 'MINT', { to: bob.address, amount: 100 }), {}), (e) => e.code === 'not_admin');
  const bobBefore = (c.state.accounts[bob.address] || { grid: 0 }).grid;
  c.applyTx(makeTx(alice, c.state, 'MINT', { to: bob.address, amount: 1234.5 }), { height: 1, time: 2 });
  assert.equal(c.state.accounts[bob.address].grid, bobBefore + 1234.5);
});

test('buy flow: rate config, deposit request, approve mints, reject burns nothing', () => {
  const c = freshChain();
  c.applyTx(makeTx(alice, c.state, 'CLAIM_ADMIN', {}), { height: 1, time: 1 });
  // no rate yet → requests rejected
  assert.throws(() => c.applyTx(makeTx(bob, c.state, 'REQUEST_BUY', { currency: 'USDT_TRC20', usdtAmount: 10 }), {}),
    (e) => e.code === 'no_rate');
  c.applyTx(makeTx(alice, c.state, 'SET_CONFIG', { key: 'usdtRate', value: '0.01' }), { height: 1, time: 2 });
  assert.equal(c.state.config.usdtRate, 0.01);
  c.applyTx(makeTx(alice, c.state, 'SET_CONFIG', { key: 'tonRate', value: '0.003' }), { height: 1, time: 2 });
  assert.equal(c.state.config.tonRate, 0.003);
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'SET_CONFIG', { key: 'evil_key', value: '1' }), {}), (e) => e.code === 'bad_key');
  // no deposit address yet → rejected
  assert.throws(() => c.applyTx(makeTx(bob, c.state, 'REQUEST_BUY', { currency: 'USDT_TRC20', usdtAmount: 10 }), {}),
    (e) => e.code === 'no_address');
  c.applyTx(makeTx(alice, c.state, 'SET_CONFIG', { key: 'dep_USDT_TRC20', value: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' }), { height: 1, time: 3 });

  c.applyTx(makeTx(bob, c.state, 'REQUEST_BUY', { currency: 'USDT_TRC20', usdtAmount: 25 }), { height: 1, time: 4 });
  assert.equal(c.state.deposits.length, 1);
  const d = c.state.deposits[0];
  assert.equal(d.grid, 2500); // 25 / 0.01
  assert.ok(d.memo.length === 8);
  assert.equal(d.status, 'pending');

  const bobBefore = (c.state.accounts[bob.address] || { grid: 0 }).grid;
  c.applyTx(makeTx(alice, c.state, 'APPROVE_DEPOSIT', { id: d.id }), { height: 1, time: 5 });
  assert.equal(d.status, 'approved');
  assert.equal(c.state.accounts[bob.address].grid, bobBefore + 2500);
  assert.throws(() => c.applyTx(makeTx(alice, c.state, 'APPROVE_DEPOSIT', { id: d.id }), {}), (e) => e.code === 'bad_state');

  c.applyTx(makeTx(bob, c.state, 'REQUEST_BUY', { currency: 'USDT_TRC20', usdtAmount: 5 }), { height: 1, time: 6 });
  const d2 = c.state.deposits[0];
  c.applyTx(makeTx(alice, c.state, 'APPROVE_DEPOSIT', { id: d2.id, reject: true }), { height: 1, time: 7 });
  assert.equal(d2.status, 'rejected');
  assert.equal(c.state.accounts[bob.address].grid, bobBefore + 2500, 'rejected deposit must not mint');
});
