import { canonical, utf8, verifySig } from '../src/util.js';

// txPayload lives in chain.js but pulls in the whole chain module; tests only
// need the same canonical bytes, so rebuild them here via canonical().
export function txPayloadUtil(tx) {
  return utf8(canonical({ type: tx.type, from: tx.from, nonce: tx.nonce, params: tx.params }));
}

export { verifySig as verifyUtil };
