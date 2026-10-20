import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Player } from '../game/types';
import type { Documents, Store } from './store';

export class SqliteStore implements Store {
  private db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (key TEXT PRIMARY KEY, data TEXT NOT NULL);');
  }
  async run<T>(keys: string[], callback: (docs: Documents) => T): Promise<T> {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const docs: Documents = new Map();
      const select = this.db.prepare('SELECT data FROM records WHERE key = ?');
      for (const key of new Set(keys)) { const row = select.get(key) as { data: string } | undefined; docs.set(key, row ? JSON.parse(row.data) : undefined); }
      const result = callback(docs);
      const write = this.db.prepare('INSERT INTO records (key, data) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET data=excluded.data');
      for (const [key, value] of docs) { if (!keys.includes(key)) throw new Error('Een record valt buiten de transactie.'); if (value !== undefined) write.run(key, JSON.stringify(value)); }
      this.db.exec('COMMIT'); return result;
    } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  async listPlayers(): Promise<Player[]> {
    return (this.db.prepare("SELECT data FROM records WHERE key LIKE 'player:%' ORDER BY json_extract(data, '$.arena.rating') DESC LIMIT 50").all() as { data: string }[]).map(r => JSON.parse(r.data) as Player);
  }
  close() { this.db.close(); }
  async query<T>(kind:string, filters: {field:string;op:'=='|'<='|'>='|'array-contains';value:unknown}[]=[],order?:{field:string;descending?:boolean},limit=50):Promise<T[]> {
    if(!/^[A-Za-z0-9]+$/.test(kind)||[...filters.map(f=>f.field),...(order?[order.field]:[])].some(f=>!/^\w+(\.\w+)*$/.test(f)))throw new Error('Ongeldige query.');
    const values:(string|number|null)[]=[kind+':%'];const clauses=['key LIKE ?'];
    for(const f of filters){if(f.op==='array-contains'){clauses.push('EXISTS (SELECT 1 FROM json_each(records.data, ?) WHERE value = ?)');values.push('$.'+f.field,typeof f.value==='boolean'?Number(f.value):f.value as string|number);}else{clauses.push(`json_extract(data, ?) ${f.op==='=='?'=':f.op} ?`);values.push('$.'+f.field,typeof f.value==='boolean'?Number(f.value):f.value as string|number);}}
    const sort=order?` ORDER BY json_extract(data, '$.${order.field}') ${order.descending?'DESC':'ASC'}`:'';
    return (this.db.prepare(`SELECT data FROM records WHERE ${clauses.join(' AND ')}${sort} LIMIT ?`).all(...values,Math.min(100,limit)) as {data:string}[]).map(r=>JSON.parse(r.data) as T);
  }
}
