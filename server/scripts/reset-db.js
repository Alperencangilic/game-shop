// Deletes the database file (stop the server first)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
for (const file of ['store.db', 'store.db-wal', 'store.db-shm']) {
  fs.rmSync(path.join(dataDir, file), { force: true });
}
console.log('Database removed. Start the server to create fresh demo data.');
