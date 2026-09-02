// GRID Chain core: state machine, transactions, bonding curve, fees,
// positions (PnL), account stats, limit orders with escrow, blocks.
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
export const TRADE_FEE = 0.01;          // 1% of trade value: half burned, half to the coin creator
export const CARD_SUPPLY = 1000;        // NFT card edition size
export const CARD_MINT_FEE = 500;       // GRID, burned — mint price for a unique card
export const CARD_TRADE_FEE = 0.025;    // 2.5% marketplace fee, burned

// Deterministic generative attributes for an NFT card id — same on every node.
// Hue comes from the golden angle → every one of the 1000 cards has a
// mathematically unique color, so no two patterns can ever coincide.
const CARD_GLYPHS = ['◆', '◇', '▲', '△', '●', '○', '✦', '✧', '⬡', '⬢', '✖', '◉', '❖', '⬟', '★', '☄'];

export function cardAttrs(id) {
  const h = sha256Hex('grid-card-' + id);
  const hue = (Number(id) * 137.508) % 360;
  const sat = 45 + (parseInt(h.slice(0, 2), 16) % 35);
  const l1 = 7 + (parseInt(h.slice(2, 4), 16) % 10);
  const l2 = 28 + (parseInt(h.slice(4, 6), 16) % 26);
  const c1 = `hsl(${hue.toFixed(1)},${sat}%,${l1}%)`;
  const c2 = `hsl(${((hue + 42) % 360).toFixed(1)},${sat + 8}%,${l2}%)`;
  const glyph = CARD_GLYPHS[parseInt(h.slice(6, 8), 16) % CARD_GLYPHS.length];
  const roll = parseInt(h.slice(8, 12), 16) % 100;
  const rarity = roll < 1 ? 'legendary' : roll < 5 ? 'epic' : roll < 20 ? 'rare' : 'common';
  // extra deterministic art parameters consumed by the SVG renderer
  const pat = parseInt(h.slice(12, 14), 16) % 6;   // main pattern family
  const pat2 = parseInt(h.slice(14, 16), 16) % 6;  // secondary layer
  const rot = parseInt(h.slice(16, 18), 16) % 360; // rotation / phase
  const density = 6 + (parseInt(h.slice(18, 20), 16) % 7);
  const alt = parseInt(h.slice(20, 22), 16);
  return { c1, c2, hue: Math.round(hue), glyph, rarity, pat, pat2, rot, density, alt };
}

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
  return { grid: 0, nonce: 0, tokens: {}, stats: undefined, positions: undefined };
}

function ensureStats(a) {
  if (!a.stats) a.stats = { buyVol: 0, sellVol: 0, trades: 0, comments: 0, tokensCreated: 0, realized: 0 };
  return a.stats;
}
function ensurePos(a, id) {
  if (!a.positions) a.positions = {};
  if (!a.positions[id]) a.positions[id] = { avg: 0, amount: 0 };
  return a.positions[id];
}

export class Chain {
  constructor() {
    this.blocks = [];
    this.recentTxs = []; // flattened, newest first, capped — API convenience only
    this.state = {
      accounts: {}, tokens: {}, profiles: {},
      admin: null,
      config: { usdtRate: 0, tonRate: 0, dep_USDT_TRC20: '', dep_TON: '', dep_BTC: '' },
      deposits: [],
      cards: {},
    };
  }

  static genesis(faucetAddress) {
    const c = new Chain();
    Chain.ensureAccount(c.state, faucetAddress).grid = FAUCET_TOTAL;
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
    try {
      if (addressFromPub(pub) !== tx.from) throw new ChainError('bad_from', 'from does not match pubkey');
    } catch (e) {
      if (e instanceof ChainError) throw e;
      throw new ChainError('bad_from', 'from does not match pubkey');
    }
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
          orders: [],
          trades: 0, volume: 0, graduated: false,
          comments: [],
          history: [{ t: now, p: V_GRID / TOTAL_SUPPLY, v: 0 }],
        };
        ensureStats(sender).tokensCreated++;
        break;
      }
      case 'PROFILE': {
        const name = String(p.name || '').replace(/\s+/g, ' ').trim();
        if (!name || name.length > 24) throw new ChainError('bad_name', 'profile name must be 1-24 chars');
        if (!s.profiles) s.profiles = {};
        s.profiles[from] = { name, updated: blockMeta ? blockMeta.time : Date.now() };
        break;
      }
      case 'BUY':
      case 'SELL': {
        const tk = s.tokens[String(p.token || '').toUpperCase()];
        if (!tk) throw new ChainError('no_token', 'unknown token');
        const amount = Number(p.amount);
        if (!(amount > 0)) throw new ChainError('bad_amount', 'amount must be positive');
        this.trade(s, from, tk, tx.type === 'BUY' ? 'buy' : 'sell', amount, blockMeta, false);
        this.matchOrders(s, tk, blockMeta);
        break;
      }
      case 'TOKEN_TRANSFER': {
        const tk = s.tokens[String(p.token || '').toUpperCase()];
        if (!tk) throw new ChainError('no_token', 'unknown token');
        const amt = r2(Number(p.amount));
        if (!(amt > 0)) throw new ChainError('bad_amount', 'amount must be positive');
        if (!p.to || typeof p.to !== 'string') throw new ChainError('bad_to', 'missing recipient');
        if ((sender.tokens[tk.id] || 0) < amt) throw new ChainError('insufficient', 'insufficient token balance');
        const to = Chain.ensureAccount(s, p.to);
        sender.tokens[tk.id] = r2(sender.tokens[tk.id] - amt);
        if (sender.tokens[tk.id] <= 0) delete sender.tokens[tk.id];
        to.tokens[tk.id] = r2((to.tokens[tk.id] || 0) + amt);
        tk.holders[from] = r2((tk.holders[from] || 0) - amt);
        if (tk.holders[from] <= 0) delete tk.holders[from];
        tk.holders[p.to] = r2((tk.holders[p.to] || 0) + amt);
        // move the position (cost basis) along with the tokens
        const pos = ensurePos(sender, tk.id);
        const toPos = ensurePos(to, tk.id);
        toPos.avg = (toPos.avg * toPos.amount + pos.avg * amt) / (toPos.amount + amt || 1);
        toPos.amount = r2(toPos.amount + amt);
        pos.amount = r2(pos.amount - amt);
        if (pos.amount <= 0) delete sender.positions[tk.id];
        break;
      }
      case 'COMMENT': {
        const tk = s.tokens[String(p.token || '').toUpperCase()];
        if (!tk) throw new ChainError('no_token', 'unknown token');
        const text = String(p.text || '').trim();
        if (!text || text.length > 200) throw new ChainError('bad_text', 'comment must be 1-200 chars');
        if (sender.grid < 1) throw new ChainError('insufficient', 'comment fee is 1 GRID');
        sender.grid = r4(sender.grid - 1); // burned anti-spam fee
        ensureStats(sender).comments++;
        tk.comments.push({ from, text, time: blockMeta ? blockMeta.time : Date.now() });
        if (tk.comments.length > 200) tk.comments.splice(0, tk.comments.length - 200);
        break;
      }
      case 'ORDER': {
        const tk = s.tokens[String(p.token || '').toUpperCase()];
        if (!tk) throw new ChainError('no_token', 'unknown token');
        const side = p.side === 'buy' ? 'buy' : p.side === 'sell' ? 'sell' : null;
        if (!side) throw new ChainError('bad_side', 'side must be buy or sell');
        const amount = Number(p.amount);
        const price = Number(p.price);
        if (!(amount > 0)) throw new ChainError('bad_amount', 'amount must be positive');
        if (!(price > 0)) throw new ChainError('bad_price', 'price must be positive');
        if (side === 'buy') {
          if (sender.grid < amount) throw new ChainError('insufficient', 'insufficient GRID to lock');
          sender.grid = r4(sender.grid - amount); // escrow
        } else {
          if ((sender.tokens[tk.id] || 0) < amount) throw new ChainError('insufficient', 'insufficient token balance to lock');
          sender.tokens[tk.id] = r2(sender.tokens[tk.id] - amount);
          if (sender.tokens[tk.id] <= 0) delete sender.tokens[tk.id];
          tk.holders[from] = r2((tk.holders[from] || 0) - amount);
          if (tk.holders[from] <= 0) delete tk.holders[from];
        }
        tk.orders.push({
          id: txHash(tx), from, side,
          amount: Number(amount), price: Number(price), // raw: prices are ~1e-6, r4 would floor them to 0
          created: blockMeta ? blockMeta.time : Date.now(),
        });
        // an order that already crosses the market fills immediately
        this.matchOrders(s, tk, blockMeta);
        break;
      }
      case 'CANCEL_ORDER': {
        const tk = s.tokens[String(p.token || '').toUpperCase()];
        if (!tk) throw new ChainError('no_token', 'unknown token');
        const idx = tk.orders.findIndex((o) => o.id === String(p.id || ''));
        if (idx === -1) throw new ChainError('no_order', 'order not found');
        const ord = tk.orders[idx];
        if (ord.from !== from) throw new ChainError('not_owner', 'not your order');
        // refund the escrow
        if (ord.side === 'buy') sender.grid = r4(sender.grid + ord.amount);
        else {
          sender.tokens[tk.id] = r2((sender.tokens[tk.id] || 0) + ord.amount);
          tk.holders[from] = r2((tk.holders[from] || 0) + ord.amount);
        }
        tk.orders.splice(idx, 1);
        break;
      }
      case 'CLAIM_ADMIN': {
        if (s.admin) throw new ChainError('admin_exists', 'admin already claimed');
        s.admin = from;
        break;
      }
      case 'MINT': {
        if (s.admin !== from) throw new ChainError('not_admin', 'admin only');
        const amount = r4(Number(p.amount));
        if (!(amount > 0)) throw new ChainError('bad_amount', 'amount must be positive');
        if (amount > 10_000_000) throw new ChainError('too_much', 'max 10,000,000 GRID per mint');
        if (!p.to || typeof p.to !== 'string') throw new ChainError('bad_to', 'missing recipient');
        Chain.ensureAccount(s, p.to).grid = r4(Chain.ensureAccount(s, p.to).grid + amount);
        break;
      }
      case 'SET_CONFIG': {
        if (s.admin !== from) throw new ChainError('not_admin', 'admin only');
        if (!s.config) s.config = {};
        const ALLOWED = {
          usdtRate: (v) => { const n = Number(v); if (!(n > 0) || n > 1000) return null; return n; },
          tonRate: (v) => { const n = Number(v); if (!(n > 0) || n > 1000) return null; return n; },
          dep_USDT_TRC20: (v) => String(v).slice(0, 120),
          dep_TON: (v) => String(v).slice(0, 120),
          dep_BTC: (v) => String(v).slice(0, 120),
        };
        const fn = ALLOWED[String(p.key)];
        if (!fn) throw new ChainError('bad_key', 'unknown config key');
        const val = fn(p.value);
        if (val === null || val === undefined || val === '') throw new ChainError('bad_value', 'invalid value');
        s.config[p.key] = val;
        break;
      }
      case 'REQUEST_BUY': {
        const rate = Number(s.config && s.config.usdtRate);
        if (!(rate > 0)) throw new ChainError('no_rate', 'GRID/USDT rate is not set yet');
        const currency = ['USDT_TRC20', 'TON', 'BTC'].includes(p.currency) ? p.currency : null;
        if (!currency) throw new ChainError('bad_currency', 'currency must be USDT_TRC20, TON or BTC');
        if (!(s.config && s.config['dep_' + currency])) throw new ChainError('no_address', `no deposit address for ${currency}`);
        const usdt = r4(Number(p.usdtAmount));
        if (!(usdt >= 1) || usdt > 100000) throw new ChainError('bad_amount', 'amount must be 1-100000 USDT');
        const grid = r4(usdt / rate);
        const id = txHash(tx);
        if (!Array.isArray(s.deposits)) s.deposits = [];
        s.deposits.unshift({
          id, from, currency, usdt, grid,
          memo: id.slice(0, 8).toUpperCase(),
          status: 'pending', time: blockMeta ? blockMeta.time : Date.now(),
        });
        if (s.deposits.length > 200) s.deposits.length = 200;
        break;
      }
      case 'APPROVE_DEPOSIT': {
        if (s.admin !== from) throw new ChainError('not_admin', 'admin only');
        const d = (s.deposits || []).find((x) => x.id === String(p.id));
        if (!d) throw new ChainError('no_deposit', 'deposit not found');
        if (d.status !== 'pending') throw new ChainError('bad_state', 'deposit already processed');
        d.status = p.reject ? 'rejected' : 'approved';
        if (!p.reject) {
          Chain.ensureAccount(s, d.from).grid = r4(Chain.ensureAccount(s, d.from).grid + d.grid);
        }
        break;
      }
      case 'MINT_CARD': {
        if (!s.cards) s.cards = {};
        const claimed = Object.keys(s.cards).length;
        if (claimed >= CARD_SUPPLY) throw new ChainError('sold_out', 'all 1000 cards are minted');
        if (sender.grid < CARD_MINT_FEE) throw new ChainError('insufficient', `card mint costs ${CARD_MINT_FEE} GRID`);
        sender.grid = r4(sender.grid - CARD_MINT_FEE); // burned
        const claimedSet = new Set(Object.keys(s.cards));
        const remaining = [];
        for (let i = 1; i <= CARD_SUPPLY; i++) if (!claimedSet.has(String(i))) remaining.push(i);
        // entropy from the tx hash → deterministic on replay
        const id = remaining[parseInt(txHash(tx).slice(0, 8), 16) % remaining.length];
        s.cards[id] = { id, owner: from, by: from, at: blockMeta ? blockMeta.time : Date.now(), sale: null };
        ensureStats(sender).cardsMinted = (ensureStats(sender).cardsMinted || 0) + 1;
        break;
      }
      case 'SELL_CARD': {
        const c = (s.cards || {})[String(p.id)];
        if (!c) throw new ChainError('no_card', 'card not found');
        if (c.owner !== from) throw new ChainError('not_owner', 'not your card');
        const price = r4(Number(p.price));
        if (!(price > 0)) throw new ChainError('bad_amount', 'price must be positive');
        c.sale = price;
        break;
      }
      case 'CANCEL_SALE': {
        const c = (s.cards || {})[String(p.id)];
        if (!c) throw new ChainError('no_card', 'card not found');
        if (c.owner !== from) throw new ChainError('not_owner', 'not your card');
        c.sale = null;
        break;
      }
      case 'BUY_CARD': {
        const c = (s.cards || {})[String(p.id)];
        if (!c) throw new ChainError('no_card', 'card not found');
        if (!(c.sale > 0)) throw new ChainError('not_for_sale', 'card is not listed');
        const price = c.sale;
        if (sender.grid < price) throw new ChainError('insufficient', 'insufficient GRID balance');
        const fee = r4(price * CARD_TRADE_FEE);
        sender.grid = r4(sender.grid - price);
        const seller = Chain.ensureAccount(s, c.owner);
        seller.grid = r4(seller.grid + price - fee); // fee burned
        c.owner = from;
        c.sale = null;
        break;
      }
      case 'FULFILL_DEPOSIT': {
        // operator-only (the node itself): auto-credit GRID for a confirmed
        // on-chain TON deposit. Idempotent by the external tx hash.
        if (from !== this.operatorAddr) throw new ChainError('not_operator', 'operator only');
        const rate = Number(s.config && s.config.tonRate);
        if (!(rate > 0)) throw new ChainError('no_rate', 'GRID/TON rate is not set');
        const address = String(p.address || '');
        if (!/^grid1[0-9a-f]{40}$/.test(address)) throw new ChainError('bad_to', 'bad grid address');
        const tons = r4(Number(p.tons));
        if (!(tons >= 0.5)) throw new ChainError('bad_amount', 'minimum deposit is 0.5 TON');
        const id = 'TON:' + String(p.hash || '');
        if (id === 'TON:') throw new ChainError('bad_hash', 'missing tx hash');
        if (!Array.isArray(s.deposits)) s.deposits = [];
        if (s.deposits.some((d) => d.id === id)) throw new ChainError('dup', 'deposit already credited');
        const grid = Math.floor(tons / rate);
        if (grid < 1) throw new ChainError('bad_amount', 'amount too small for this rate');
        s.deposits.unshift({
          id, from: address, currency: 'TON', usdt: tons, grid,
          memo: id, status: 'approved',
          time: blockMeta ? blockMeta.time : Date.now(),
        });
        if (s.deposits.length > 200) s.deposits.length = 200;
        Chain.ensureAccount(s, address).grid = r4(Chain.ensureAccount(s, address).grid + grid);
        break;
      }
      default:
        throw new ChainError('bad_type', `unknown tx type ${tx.type}`);
    }

    sender.nonce = sender.nonce + 1;
    // Bind the account to its pubkey on first sight; later txs must sign with it.
    if (!sender.pub && tx.pub) sender.pub = tx.pub;

    this.recentTxs.unshift({
      hash: txHash(tx), type: tx.type, from, to: p.to || null,
      summary: describeTx(tx, this.state),
      block: blockMeta ? blockMeta.height : -1,
      time: blockMeta ? blockMeta.time : Date.now(),
    });
    if (this.recentTxs.length > 200) this.recentTxs.length = 200;
  }

  // ---- trading core (shared by market txs and limit-order fills) ---------
  // escrowed=true means the GRID/tokens were already locked by ORDER.

  trade(s, from, tk, side, amount, blockMeta, escrowed) {
    const sender = Chain.ensureAccount(s, from);
    const creator = tk.creator && tk.creator !== from ? Chain.ensureAccount(s, tk.creator) : null;

    if (side === 'buy') {
      const dx = r4(amount);
      if (!escrowed) {
        if (sender.grid < dx) throw new ChainError('insufficient', 'insufficient GRID balance');
        sender.grid = r4(sender.grid - dx);
      }
      const fee = r4(dx * TRADE_FEE);
      const creatorCut = r4(fee / 2); // the other half is burned
      const curveIn = r4(dx - fee);
      const dy = r2(tk.y - tk.k / (tk.x + curveIn));
      if (!(dy > 0)) throw new ChainError('curve', 'zero token output');
      tk.x = r4(tk.x + curveIn);
      tk.y = r2(tk.y - dy);
      sender.tokens[tk.id] = r2((sender.tokens[tk.id] || 0) + dy);
      tk.holders[from] = r2((tk.holders[from] || 0) + dy);
      if (creator) creator.grid = r4(creator.grid + creatorCut);
      const pos = ensurePos(sender, tk.id);
      pos.avg = (pos.avg * pos.amount + dx) / (pos.amount + dy);
      pos.amount = r2(pos.amount + dy);
      const st = ensureStats(sender);
      st.buyVol = r4(st.buyVol + dx); st.trades++;
      tk.trades++; tk.volume = r4(tk.volume + dx);
      if (!tk.graduated && tk.x - V_GRID >= GRADUATION_TARGET) tk.graduated = true;
      this._pushHistory(tk, blockMeta, dx);
    } else {
      const amt = r2(amount);
      if (!escrowed) {
        if ((sender.tokens[tk.id] || 0) < amt) throw new ChainError('insufficient', 'insufficient token balance');
        sender.tokens[tk.id] = r2(sender.tokens[tk.id] - amt);
        if (sender.tokens[tk.id] <= 0) delete sender.tokens[tk.id];
        tk.holders[from] = r2((tk.holders[from] || 0) - amt);
        if (tk.holders[from] <= 0) delete tk.holders[from];
      }
      let out = r4(tk.x - tk.k / (tk.y + amt));
      out = Math.min(out, r4(tk.x - V_GRID)); // never drain below the virtual floor
      if (!(out > 0)) throw new ChainError('curve', 'zero GRID output (reserve at floor)');
      const fee = r4(out * TRADE_FEE);
      const creatorCut = r4(fee / 2);
      const net = r4(out - fee);
      tk.x = r4(tk.x - out);
      tk.y = r2(tk.y + amt);
      sender.grid = r4(sender.grid + net);
      if (creator) creator.grid = r4(creator.grid + creatorCut);
      const pos = ensurePos(sender, tk.id);
      const st = ensureStats(sender);
      st.realized = r4(st.realized + (net - pos.avg * amt));
      pos.amount = r2(pos.amount - amt);
      if (pos.amount <= 0) delete sender.positions[tk.id];
      st.sellVol = r4(st.sellVol + net); st.trades++;
      tk.trades++; tk.volume = r4(tk.volume + out);
      this._pushHistory(tk, blockMeta, out);
    }
  }

  // Fill every limit order crossed by the current price. Buy orders trigger
  // when price <= limit, sell orders when price >= limit.
  matchOrders(s, tk, blockMeta) {
    let guard = 0;
    while (guard++ < 100) {
      const price = tk.x / tk.y;
      const idx = tk.orders.findIndex((o) =>
        (o.side === 'buy' && o.price >= price) || (o.side === 'sell' && o.price <= price));
      if (idx === -1) break;
      const ord = tk.orders[idx];
      try {
        this.trade(s, ord.from, tk, ord.side, ord.amount, blockMeta, true);
        tk.orders.splice(idx, 1);
      } catch (e) {
        // a stuck order must not wedge the chain — drop it and burn the escrow
        tk.orders.splice(idx, 1);
        console.warn(`[chain] dropped stuck order ${ord.id}: ${e.message}`);
      }
    }
  }

  _pushHistory(t, blockMeta, vol) {
    t.history.push({
      t: blockMeta ? blockMeta.time : Date.now(),
      p: t.x / t.y,
      v: typeof vol === 'number' && vol > 0 ? vol : 0,
    });
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
    case 'TOKEN_TRANSFER': return `sent ${p.amount} $${String(p.token).toUpperCase()} → ${String(p.to).slice(0, 10)}…`;
    case 'COMMENT': return `💬 $${String(p.token).toUpperCase()}: ${String(p.text).slice(0, 40)}`;
    case 'ORDER': return `limit ${p.side} ${p.amount} $${String(p.token).toUpperCase()} @ ${p.price}`;
    case 'CANCEL_ORDER': return `cancelled order ${String(p.id).slice(0, 10)}…`;
    case 'CLAIM_ADMIN': return '⚡ claimed root admin';
    case 'MINT': return `minted ${p.amount} GRID → ${String(p.to).slice(0, 10)}…`;
    case 'SET_CONFIG': return `set ${p.key}`;
    case 'REQUEST_BUY': return `buy request: ${p.usdtAmount} ${p.currency} → GRID`;
    case 'APPROVE_DEPOSIT': return `${p.reject ? 'rejected' : 'approved'} deposit ${String(p.id).slice(0, 8)}…`;
    case 'FULFILL_DEPOSIT': return `⚡ auto-credit ${p.tons} TON → GRID`;
    case 'MINT_CARD': return 'minted an NFT card';
    case 'SELL_CARD': return `listed card №${p.id} for ${p.price} GRID`;
    case 'CANCEL_SALE': return `delisted card №${p.id}`;
    case 'BUY_CARD': return `bought card №${p.id}`;
    case 'BUY': {
      const t = state.tokens[String(p.token || '').toUpperCase()];
      const price = t ? (t.x / t.y).toPrecision(4) : '?';
      return `bought $${p.token} for ${p.amount} GRID @ ${price}`;
    }
    case 'SELL': return `sold ${p.amount} $${p.token}`;
    default: return tx.type;
  }
}
