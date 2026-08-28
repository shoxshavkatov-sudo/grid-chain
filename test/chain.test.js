import test from 'node:test';
import assert from 'node:assert/strict';
import { Chain, ChainError, CREATE_FEE, V_GRID, TOTAL_SUPPLY, GRADUATION_TARGET } from '../src/chain.js';
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
  // after a full roundtrip, only the creation fee (plus float dust) is gone
  const diff = (10000 - CREATE_FEE) - c.state.accounts[alice.address].grid;
  assert.ok(diff >= 0 && diff < 1, `roundtrip loss too big: ${diff}`);
  assert.ok(Math.abs(t.x - V_GRID) < 1, 'reserve should return to the virtual floor');
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
  c.applyTx(makeTx(alice, c.state, 'BUY', { token: 'MOON', amount: GRADUATION_TARGET + 10 }), { height: 1, time: 2 });
  assert.ok(c.state.tokens.MOON.graduated);
});
