// GRID Chain core: state machine, transactions, bonding curve, blocks.
import { canonical, sha256Hex, utf8, verifySig, signMsg, addressFromPub, r2, r4 } from './util.js';

export class ChainError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// Bonding curve: constant-product AMM seeded with virtual liquidity.
// x = GRID liquidity (starts at V_GRID), y = token liquidity (starts at TOTAL_SUPPLY).
// Price per token = x / y; it rises as GRID flows in. The virtual seed V_GRID
// is the floor: real collected GRID = x - V_GRID, graduation at GRADUATION_TARGET.
export const V_GRID = 1000;
export const TOTAL_SUPPLY = 1_000_000_000;
export const GRADUATION_TARGET = 10_000;
export const CREATE_FEE = 100;          // GRID, burned on token creation (anti-spam)
export const FAUCET_TOTAL = 100_000_000;
export const HISTORY_CAP = 400;

export function txPayload(tx) {
  // The exact bytes a signature covers: everything except sig and hash.
  return utf8(canonical({ type: tx.type, from: tx.from, nonce: tx.nonce, params: tx.params }));
}

export function txHash(tx) {
  return sha256Hex(utf8(canonical({
    type: tx.type, from: tx.from, nonce: tx.nonce, params: tx.params, sig: tx.sig,
  })));
}

export function blockPayload(block) {
  return utf8(canonical({
    height: block.height,
    time: block.time,
    prev: block.prev,
    stateRoot: block.stateRoot,
    txs: block.txs.map(txHash),
    proposer: block.proposer,
  }));
}

export function blockHash(block) {
  const { hash, ...header } = block; // exclude the hash field itself
  return sha256Hex(utf8(canonical(header)));
}

export function stateRoot(state) {
  return sha256Hex(utf8(canonical(state)));
}

function emptyAccount() {
  return { grid: 0, nonce: 0, tokens: {} };
}

function tokenPrice(t) { return t.x / t.y; }

function addrFromPub(pub) {
  try { return addressFromPub(pub); } catch { return null; }
}

export class Chain {
  constructor() {
    this.blocks = [];
    this.recentTxs = []; // flattened, newest first, capped — API convenience only
    this.state = { accounts: {}, tokens: {}, profiles: {} };
  }

  static genesis(faucetAddress) {
    const c = new Chain();
    this.ensureAccount(c.state, faucetAddress).grid = FAUCET_TOTAL;
    return c;
  }

  static ensureAccount(state, addr) {
    let a = state.accounts[addr];
    if (!a) { a = emptyAccount(); state.accounts[addr] = a; }
    return a;
  }

  height() { return this.blocks.length - 1; }

  // ---- transaction application -------------------------------------------

  verifyTxSig(tx) {
    if (!tx || typeof tx !== 'object') throw new ChainError('bad_tx', 'malformed tx');
    const acc = this.state.accounts[tx.from];
    const pub = (acc && acc.pub) || tx.pub;
    if (!pub || !/^([0-9a-f]{64})$/.test(pub)) throw new ChainError('bad_pub', 'missing or malformed pubkey');
    if (!verifySig(pub, txPayload(tx), tx.sig)) throw new ChainError('bad_sig', 'invalid signature');
    if (addrFromPub(pub) !== tx.from) throw new ChainError('bad_from', 'from does not match pubkey');
  }

  applyTx(tx, blockMeta) {
    this.verifyTxSig(tx);
    const s = this.state;
    const from = tx.from;
    const sender = Chain.ensureAccount(s, from);
    if (tx.nonce !== sender.nonce) {
      throw new ChainError('bad_nonce', `expected nonce ${sender.nonce}, got ${tx.nonce}`);
    }
    const p = tx.params || {};

    switch (tx.type) {
      case 'TRANSFER': {
        const amount = r4(Number(p.amount));
        if (!(amount > 0)) throw new ChainError('bad_amount', 'amount must be positive');
        if (!p.to || typeof p.to !== 'string') throw new ChainError('bad_to', 'missing recipient');
        if (sender.grid < amount) throw new ChainError('insufficient', 'insufficient GRID balance');
        sender.grid = r4(sender.grid - amount);
        Chain.ensureAccount(s, p.to).grid = r4(Chain.ensureAccount(s, p.to).grid + amount);
        break;
      }
      case 'CREATE_TOKEN': {
        const ticker = String(p.ticker || '').toUpperCase();
        const name = String(p.name || '').trim();
        if (!/^[A-Z0-9]{2,8}$/.test(ticker)) throw new ChainError('bad_ticker', 'ticker must be 2-8 chars A-Z/0-9');
        if (!name || name.length > 40) throw new ChainError('bad_name', 'name 1-40 chars required');
        if (String(p.desc || '').length > 200) throw new ChainError('bad_desc', 'description too long');
        if (String(p.image || '').length > 300) throw new ChainError('bad_image', 'image url too long');
        if (s.tokens[ticker]) throw new ChainError('dup_ticker', 'ticker already exists');
        if (sender.grid < CREATE_FEE) throw new ChainError('insufficient', `creation fee is ${CREATE_FEE} GRID`);
        sender.grid = r4(sender.grid - CREATE_FEE); // burned
        const now = blockMeta ? blockMeta.time : Date.now();
        s.tokens[ticker] = {
          id: ticker, ticker, name,
          desc: String(p.desc || ''),
          image: String(p.image || ''),
          creator: from,
          createdAt: now,
          x: V_GRID, y: TOTAL_SUPPLY, k: V_GRID * TOTAL_SUPPLY,
          holders: {},
          trades: 0, volume: 0, graduated: false,
          history: [{ t: now, p: V_GRID / TOTAL_SUPPLY }],
        };
        break;
      }
      case 'PROFILE': {
        const name = String(p.name || '').replace(/\s+/g, ' ').trim();
        if (!name || name.length > 24) throw new ChainError('bad_name', 'profile name must be 1-24 chars');
        if (!s.profiles) s.profiles = {};
        s.profiles[from] = { name, updated: blockMeta ? blockMeta.time : Date.now() };
        break;
      }
      case 'BUY': {
        const t = s.tokens[String(p.token || '').toUpperCase()];
        if (!t) throw new ChainError('no_token', 'unknown token');
        const dx = r4(Number(p.amount));
        if (!(dx > 0)) throw new ChainError('bad_amount', 'amount must be positive');
        if (sender.grid < dx) throw new ChainError('insufficient', 'insufficient GRID balance');
        const dy = r2(t.y - t.k / (t.x + dx));
        if (!(dy > 0)) throw new ChainError('curve', 'zero token output');
        sender.grid = r4(sender.grid - dx);
        t.x = r4(t.x + dx);
        t.y = r2(t.y - dy);
        sender.tokens[t.id] = r2((sender.tokens[t.id] || 0) + dy);
        t.holders[from] = r2((t.holders[from] || 0) + dy);
        t.trades++;
        t.volume = r4(t.volume + dx);
        if (!t.graduated && t.x - V_GRID >= GRADUATION_TARGET) t.graduated = true;
        this._pushHistory(t, blockMeta);
        break;
      }
      case 'SELL': {
        const t = s.tokens[String(p.token || '').toUpperCase()];
        if (!t) throw new ChainError('no_token', 'unknown token');
        const amt = r2(Number(p.amount));
        if (!(amt > 0)) throw new ChainError('bad_amount', 'amount must be positive');
        if ((sender.tokens[t.id] || 0) < amt) throw new ChainError('insufficient', 'insufficient token balance');
        let out = r4(t.x - t.k / (t.y + amt));
        out = Math.min(out, r4(t.x - V_GRID)); // never drain below the virtual floor
        if (!(out > 0)) throw new ChainError('curve', 'zero GRID output (reserve at floor)');
        sender.tokens[t.id] = r2(sender.tokens[t.id] - amt);
        if (sender.tokens[t.id] <= 0) delete sender.tokens[t.id];
        t.holders[from] = r2((t.holders[from] || 0) - amt);
        if (t.holders[from] <= 0) delete t.holders[from];
        t.x = r4(t.x - out);
        t.y = r2(t.y + amt);
        sender.grid = r4(sender.grid + out);
        t.trades++;
        t.volume = r4(t.volume + out);
        this._pushHistory(t, blockMeta);
        break;
      }
      default:
        throw new ChainError('bad_type', `unknown tx type ${tx.type}`);
    }

    sender.nonce = sender.nonce + 1;
    // Bind the account to its pubkey on first sight; later txs must sign with it.
    if (!sender.pub && tx.pub) sender.pub = tx.pub;

    this.recentTxs.unshift({
      hash: txHash(tx), type: tx.type, from,
      summary: describeTx(tx, this.state),
      block: blockMeta ? blockMeta.height : -1,
      time: blockMeta ? blockMeta.time : Date.now(),
    });
    if (this.recentTxs.length > 200) this.recentTxs.length = 200;
  }

  _pushHistory(t, blockMeta) {
    t.history.push({ t: blockMeta ? blockMeta.time : Date.now(), p: tokenPrice(t) });
    if (t.history.length > HISTORY_CAP) t.history.splice(0, t.history.length - HISTORY_CAP);
  }

  // ---- blocks -------------------------------------------------------------

  makeBlock(txs, validator) {
    const height = this.blocks.length;
    const prev = height ? this.blocks[height - 1].hash : '0'.repeat(64);
    const meta = { height, time: Date.now() };
    const applied = [];
    for (const tx of txs) {
      try {
        this.applyTx(tx, meta);
        applied.push(tx);
      } catch (e) {
        // Dropped txs never enter the block; state stays consistent.
        console.warn(`[chain] dropping tx in block ${height}: ${e.code}: ${e.message}`);
      }
    }
    const draft = {
      height, time: meta.time, prev,
      stateRoot: stateRoot(this.state),
      txs: applied,
      proposer: validator.public,
      sig: '',
    };
    draft.sig = signMsg(validator.secret, blockPayload(draft));
    draft.hash = blockHash(draft);
    this.blocks.push(draft);
    return draft;
  }

  verifyChain(validatorPub) {
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      if (i > 0 && b.prev !== this.blocks[i - 1].hash) return false;
      if (b.proposer !== validatorPub) return false;
      if (!verifySig(validatorPub, blockPayload(b), b.sig)) return false;
      if (blockHash(b) !== b.hash) return false;
    }
    return true;
  }
}

function describeTx(tx, state) {
  const p = tx.params || {};
  switch (tx.type) {
    case 'TRANSFER': return `→ ${String(p.to).slice(0, 14)}… ${p.amount} GRID`;
    case 'CREATE_TOKEN': return `created $${String(p.ticker).toUpperCase()}`;
    case 'PROFILE': return `set profile name → ${String(p.name).slice(0, 24)}`;
    case 'BUY': {
      const t = state.tokens[String(p.token || '').toUpperCase()];
      const price = t ? (t.x / t.y).toPrecision(4) : '?';
      return `bought $${p.token} for ${p.amount} GRID @ ${price}`;
    }
    case 'SELL': return `sold ${p.amount} $${p.token}`;
    default: return tx.type;
  }
}
