import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { GameService } from './service';
import { apiHandler } from './http';
import { SqliteStore } from './sqlite';
import { FirestoreStore, cloudIdentity } from './firestore';
import {GoServiceV2 as GameServiceV2} from './goServiceV2';

const cloud = process.env.GAME_STORE === 'firestore';
const store = cloud ? new FirestoreStore() : new SqliteStore(resolve(process.env.GAME_LOCAL_DB??'.local/reservaat.sqlite'));
const duration = cloud ? 20 * 60000 : 3 * 60000;
const service = new GameService(store, cloud ? 'cloud' : 'local', duration);
const api = apiHandler(service, cloud ? cloudIdentity : token => service.localUid(token));
const root = resolve('dist');
const types: Record<string, string> = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.glb': 'model/gltf-binary', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };
const port = Number(process.env.GAME_LOCAL_PORT ?? 8086);
const server = createServer(async (req, res) => {
  if ((req.url ?? '').startsWith('/api/game/')) return api(req, res);
  try {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    let file = resolve(root, `.${path}`); if (file !== root && !file.startsWith(root + sep)) { res.statusCode = 403; return res.end(); }
    try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html'); } catch { file = resolve(root, 'index.html'); }
    const data = await readFile(file); res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache'); res.end(data);
  } catch { res.statusCode = 503; res.end('De webbuild is nog niet klaar. Voer npm run web:build uit.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`BugBaas ${cloud ? 'cloud' : 'lokale preview'}: http://127.0.0.1:${port}`));
if(!cloud){const v2=new GameServiceV2(store,'local');let running=false;const timer=setInterval(()=>{if(running)return;running=true;void v2.advanceDue().catch(()=>console.error('De lokale deadlineverwerking is mislukt.')).finally(()=>{running=false;});},1000);server.on('close',()=>clearInterval(timer));}
