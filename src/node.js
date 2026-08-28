// GRID Chain node: mempool, block production loop, disk persistence.
import fs from 'node:fs';
import path from 'node:path';
import { Chain, blockPayload, txPayload } from './chain.js';
import { randomKeypair, signMsg, verifySig } from './util.js';

export const BLOCK_INTERVAL_MS = 4000;

export class GridNode {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.mempool = [];
    fs.mkdirSync(dataDir, { recursive: true });
    this.validator = loadOrCreate(path.join(dataDir, 'validator.json'), () => {
      const kp = randomKeypair();
      return { secret: kp.secret, public: kp.public };
    });
    this.faucet = loadOrCreate(path.join(dataDir, 'faucet.json'), () => {
      const kp = randomKeypair();
      return { secret: kp.secret, public: kp.public, address: kp.address };
    });

    const chainFile = path.join(dataDir, 'chain.json');
    if (fs.existsSync(chainFile)) {
      const raw = JSON.parse(fs.readFileSync(chainFile, 'utf8'));
      this.chain = new Chain();
      this.chain.blocks = raw.blocks;
      this.chain.recentTxs = raw.recentTxs || [];
      this.chain.state = replayChain(raw.blocks, this.validator.public, raw.faucetAddress);
      console.log(`[node] loaded chain: ${this.chain.blocks.length} blocks, height ${this.chain.height()}`);
    } else {
      this.chain = Chain.genesis(this.faucet.address);
      this.chain.makeBlock([], this.validator); // genesis block seals the faucet allocation
      console.log('[node] created new genesis chain');
      this.persist();
    }
  }

  start() {
    this.timer = setInterval(() => this.tryBlock(), BLOCK_INTERVAL_MS);
    this.timer.unref?.();
  }

  tryBlock() {
    if (this.mempool.length === 0) return;
    this.chain.makeBlock(this.mempool, this.validator);
    // Clear the whole mempool: applied txs are sealed, dropped ones must be
    // re-submitted by clients with a fresh nonce. Simple and safe for v0.1.
    this.mempool = [];
    this.persist();
  }

  // Pre-validate against a cloned state so clients get immediate feedback.
  tryTx(tx) {
    const trial = new Chain();
    trial.state = structuredClone(this.chain.state);
    trial.applyTx(tx, { height: this.chain.height() + 1, time: Date.now() });
  }

  submitTx(tx) {
    this.tryTx(tx); // throws ChainError on invalid txs
    this.mempool.push(tx);
    return this.mempool.length;
  }

  faucetTo(address, amount) {
    // The node signs with the faucet key; goes through the same validation path.
    const faucetNonce = (this.chain.state.accounts[this.faucet.address] || { nonce: 0 }).nonce;
    const tx = {
      type: 'TRANSFER',
      from: this.faucet.address,
      nonce: faucetNonce,
      params: { to: address, amount },
      pub: this.faucet.public,
    };
    tx.sig = signMsg(this.faucet.secret, txPayload(tx));
    this.submitTx(tx);
    return tx;
  }

  persist() {
    const file = path.join(this.dataDir, 'chain.json');
    const tmp = file + '.tmp';
    const payload = {
      validatorPub: this.validator.public,
      faucetAddress: this.faucet.address,
      blocks: this.chain.blocks,
      recentTxs: this.chain.recentTxs,
    };
    fs.writeFileSync(tmp, JSON.stringify(payload));
    fs.renameSync(tmp, file);
  }
}

function loadOrCreate(file, make) {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const val = make();
  fs.writeFileSync(file, JSON.stringify(val));
  return val;
}

// Rebuild state by replaying every block's txs; verifies hash links and
// validator signatures along the way. Tampered files fail loudly.
function replayChain(blocks, validatorPub, faucetAddress) {
  const chain = Chain.genesis(faucetAddress);
  chain.blocks = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (i > 0 && b.prev !== blocks[i - 1].hash) throw new Error(`block ${i}: broken prev link`);
    if (b.proposer !== validatorPub) throw new Error(`block ${i}: wrong proposer`);
    if (!verifySig(validatorPub, blockPayload(b), b.sig)) throw new Error(`block ${i}: bad signature`);
    if (i === 0) {
      chain.blocks.push(b);
      continue;
    }
    for (const tx of b.txs) chain.applyTx(tx, { height: b.height, time: b.time });
    chain.blocks.push(b);
  }
  return chain.state;
}
