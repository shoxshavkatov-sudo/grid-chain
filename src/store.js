// Storage abstraction: file (dev / ephemeral) or Postgres (persistent deploys).
// Both store the same JSON payload; Postgres keeps the chain alive across redeploys.
import fs from 'node:fs';
import path from 'node:path';

export function fileStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'chain.json');
  return {
    mode: 'file',
    async load() {
      if (!fs.existsSync(file)) return null;
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    },
    async save(payload) {
      const tmp = file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(payload));
      fs.renameSync(tmp, file);
    },
  };
}

export function postgresStore(connectionString) {
  let pool = null;
  async function getPool() {
    if (!pool) {
      const { default: pg } = await import('pg');
      pool = new pg.Pool({ connectionString, max: 4 });
      await pool.query(
        'CREATE TABLE IF NOT EXISTS chain_state (id INT PRIMARY KEY, payload JSONB NOT NULL, updated_at BIGINT NOT NULL)'
      );
    }
    return pool;
  }
  return {
    mode: 'postgres',
    async load() {
      const p = await getPool();
      const r = await p.query('SELECT payload FROM chain_state WHERE id = 1');
      return r.rows.length ? r.rows[0].payload : null;
    },
    async save(payload) {
      const p = await getPool();
      await p.query(
        'INSERT INTO chain_state (id, payload, updated_at) VALUES (1, $1, $2) ' +
        'ON CONFLICT (id) DO UPDATE SET payload = $1, updated_at = $2',
        [JSON.stringify(payload), Date.now()]
      );
    },
  };
}
