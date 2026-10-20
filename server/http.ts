import type { IncomingMessage, ServerResponse } from 'node:http';
import { GameError } from '../game/types';
import type { GameService } from './service';
import {GoServiceV2 as GameServiceV2} from './goServiceV2';
import {getFieldEnvironment} from './environmentV2';
import { timingSafeEqual } from 'node:crypto';

export function apiHandler(service: GameService, resolveUid: (token: string) => Promise<string | {uid:string;linked:boolean}>, environment=getFieldEnvironment) {
  const v2 = new GameServiceV2(service.store,service.mode,service.clock,environment);
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.searchParams.has('route')) url.pathname = '/api/game/' + url.searchParams.get('route');
      let raw = '';
      const parsed = (req as IncomingMessage & { body?: unknown }).body;
      if (req.method === 'POST') {
        checkJson(req);
        if (parsed !== undefined) raw = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        else for await (const chunk of req) { raw += chunk.toString(); if (Buffer.byteLength(raw) > 8192) throw new GameError('Verzoek te groot.', 413); }
        if (Buffer.byteLength(raw) > 8192) throw new GameError('Verzoek te groot.', 413);
      }
      const body: Record<string, unknown> = raw ? JSON.parse(raw) : {};
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new GameError('Een JSON-object is vereist.');
      let result: unknown;
      if (url.pathname === '/api/game/v2/cron/advance-due' && req.method === 'GET') {
        const expected=process.env.CRON_SECRET, supplied=req.headers.authorization?.slice(7);
        if(!expected||!supplied||Buffer.byteLength(expected)!==Buffer.byteLength(supplied)||!timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))throw new GameError('Geen schedulerautorisatie.',403);
        result=await v2.advanceDue();
      }
      else if (url.pathname === '/api/game/info' && req.method === 'GET') result = { mode: service.mode, rules:'bugbaas-field-league-1' };
      else if (url.pathname === '/api/game/session' && req.method === 'POST') result = await service.localSession();
      else {
        const bearer = req.headers.authorization;
        if (!bearer?.startsWith('Bearer ')) throw new GameError('Log in om je voortgang te openen.', 401);
        let uid: string, linked=false; try { const identity=await resolveUid(bearer.slice(7));uid=typeof identity==='string'?identity:identity.uid;linked=typeof identity==='object'&&identity.linked; } catch { throw new GameError('Je sessie is verlopen. Log opnieuw in.', 401); }
        if(url.pathname==='/api/game/v2/state'&&req.method==='GET')result=await v2.state(uid,linked);
        else if(url.pathname==='/api/game/v2/command'&&req.method==='POST')result=await v2.command(uid,body,linked);
        else if (/^\/api\/game\/(state|action|arena)(\/|$)/.test(url.pathname)) throw new GameError('Deze oude spelmodus is verwijderd. Vernieuw BugBaas.',410);
        else throw new GameError('Deze route bestaat niet.', 404);
      }
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(result));
    } catch (e) {
      const status = e instanceof GameError ? e.status : e instanceof SyntaxError ? 400 : 500;
      res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: status >= 500 ? 'De spelserver is tijdelijk niet bereikbaar. Probeer opnieuw; je voortgang blijft bewaard.' : e instanceof Error ? e.message : 'Ongeldig verzoek.' }));
      if (status >= 500) {
        const failure = e instanceof Error ? e : new Error('unknown');
        console.error('game-api failure', { name: failure.name, code: (failure as Error & { code?: string | number }).code, message: failure.message.replace(/Bearer\s+\S+|ya29\.[\w.-]+|eyJ[\w.-]+/g, '[redacted]').slice(0, 400) });
      }
    }
  };
}
function checkJson(req: IncomingMessage) { if (!req.headers['content-type']?.startsWith('application/json')) throw new GameError('JSON vereist.', 415); }
