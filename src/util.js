// GRID Chain crypto + canonical encoding utilities (zero dependencies).
// Keys are raw ed25519: secret = 32-byte seed, public = 32-byte pubkey, hex-encoded.
import crypto from 'node:crypto';

const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex'); // ed25519 PKCS#8 header + OCTET STRING(32)
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');          // ed25519 SPKI header

function der(prefix, raw) {
  return Buffer.concat([prefix, Buffer.from(raw, 'hex')]);
}

export function randomKeypair() {
  const seed = crypto.randomBytes(32).toString('hex');
  return keypairFromSeed(seed);
}

export function keypairFromSeed(seedHex) {
  const priv = crypto.createPrivateKey({ key: der(PKCS8_PREFIX, seedHex), format: 'der', type: 'pkcs8' });
  const pub = crypto.createPublicKey(priv).export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
  return { secret: seedHex, public: pub, address: addressFromPub(pub) };
}

export function signMsg(seedHex, msgBytes) {
  const priv = crypto.createPrivateKey({ key: der(PKCS8_PREFIX, seedHex), format: 'der', type: 'pkcs8' });
  return crypto.sign(null, msgBytes, priv).toString('hex');
}

export function verifySig(pubHex, msgBytes, sigHex) {
  try {
    const pub = crypto.createPublicKey({ key: der(SPKI_PREFIX, pubHex), format: 'der', type: 'spki' });
    return crypto.verify(null, msgBytes, pub, Buffer.from(sigHex, 'hex'));
  } catch {
    return false;
  }
}

export function addressFromPub(pubHex) {
  return 'grid1' + sha256Hex(pubHex).slice(0, 40);
}

export function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function sha256Bytes(data) {
  return crypto.createHash('sha256').update(data).digest();
}

// Deterministic JSON encoding: recursively sorted keys, no whitespace.
// This is the canonical byte payload every signature covers.
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return '{' + Object.keys(value).sort()
    .map((k) => JSON.stringify(k) + ':' + canonical(value[k]))
    .join(',') + '}';
}

export function utf8(str) {
  return new TextEncoder().encode(str);
}

// Rounding helpers — GRID amounts to 4 decimals, token amounts to 2.
// JS float math is deterministic across platforms; fine for this testnet.
export const r4 = (n) => Math.round(n * 1e4) / 1e4;
export const r2 = (n) => Math.round(n * 100) / 100;
