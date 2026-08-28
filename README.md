# GRID Chain

**A blockchain with a built-in coin launchpad.** Anyone can create a coin, and everyone can buy and sell it on an on-chain bonding curve — every trade is a signed transaction sealed into a block. Works as a regular website and as a Telegram Mini App.

```
blocks · hashes · ed25519 signatures · nonces · mempool · bonding curve · faucet
```

## What it is (honestly)

- A **real blockchain in the technical sense**: append-only blocks chained by SHA-256 hashes, every transaction signed with ed25519 and verified against the sender's pubkey+nonce, block state roots, tamper detection (rewrite any block → chain fails verification, state rebuilt by replay).
- **Proof-of-Authority**: one validator node seals blocks (every 4s when txs are pending). Decentralized consensus, multi-validator sets and bridging are the roadmap, not v0.1.
- **Testnet**: GRID coins are faucet points with no value.

## Launchpad economics

| | |
|---|---|
| Token supply | 1,000,000,000 fixed per coin |
| Curve | constant-product AMM with virtual liquidity (like pump.fun's bonding curve) |
| Virtual seed | 1,000 GRID + full supply → starting price 0.000001 GRID |
| Creation fee | 100 GRID, burned on-chain (anti-spam) |
| Graduation | reserve collects 10,000 GRID → flag flips (AMM migration: roadmap) |
| Faucet | 5,000 GRID per address per hour |

Price rises with every buy along the curve; selling returns GRID from the reserve (which can never drain below the virtual floor).

## Run locally

```bash
npm start            # node + API + frontend on :3000
npm test             # 11 chain-core tests
node scripts/smoke.mjs   # e2e against a running node (BASE=http://localhost:3000)
```

Zero npm dependencies — Node ≥ 20 only.

## API

```
GET  /api/stats                height, txs, tokens, accounts, volume
GET  /api/blocks?limit=20      recent blocks (hash, stateRoot)
GET  /api/block/:height        full block with txs
GET  /api/txs?limit=30         live feed
GET  /api/tokens               catalog
GET  /api/tokens/:id           detail + price history + top holders
GET  /api/account/:addr        GRID balance, token bag, nonce
GET  /api/address-of/:pubkey   derive address from an ed25519 pubkey
POST /api/wallet/new           keypair (secret shown once, node never stores it)
POST /api/faucet               { address } → 5,000 GRID, 1/hour
POST /api/tx                   signed tx: TRANSFER | CREATE_TOKEN | BUY | SELL
```

Transaction signing payload (canonical JSON, sorted keys, no whitespace):

```
{ "type": "BUY", "from": "grid1…", "nonce": 3, "params": { "amount": 1000, "token": "MOON" } }
```

Frontend signs it in-browser via WebCrypto Ed25519; keys live only in localStorage.

## Deploy (Render)

Blueprint in `render.yaml`: Node web service + 1 GB disk for the chain data. Push to GitHub, then open:

https://render.com/deploys/new?type=blueprint&repo=https://github.com/shoxshavkatov-sudo/grid-chain

The free plan sleeps after idle — chain state persists on disk across sleeps, but **redeploys reset the disk** (fresh genesis). For a persistent public testnet, pin a paid instance or move state to Postgres (the store is one JSON file, easy swap).

## Roadmap

- multi-validator PoA round-robin + validator set in state
- graduation → on-chain order book / constant-product pair migration
- Solana bridge (anchor every GRID Chain block header on Solana)
- PostgreSQL state store, block explorer page, TG native notifications
- trade fees, creator royalties, image upload to IPFS
