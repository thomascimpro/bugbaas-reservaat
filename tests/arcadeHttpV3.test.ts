import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GameService} from '../server/service';
import {apiHandler} from '../server/http';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {ensureField} from '../game/fieldV2';
import {unknownHabitat} from '../game/habitatsV2';
import type {ArcadeTicket} from '../game/arcade/tapDuel';
import {replayArcade} from '../game/arcade/games';
import {playOriginalTap} from './originalArcadeDriver';
import type {GameViewV2} from '../game/typesV2';
import {arcadeRunKey} from '../server/arcadeServiceV3';

test('real HTTP accepts an original replay over64KiB, recovers a dropped response once, and retains ordinary/legacy request limits',async()=>{
 const store=new SqliteStore(':memory:'),uid='arcade-http-fixture',clock={now:Date.UTC(2026,10,3,12)},p=freshV2(uid,'ARCADE42',clock.now);ensureField(p,clock.now);ensureGo(p,clock.now);p.onboarded=true;
 p.specimens=['ant','moth','beetle'].map((species,i)=>({id:'http-bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:clock.now,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));p.go!.team=p.specimens.map(b=>b.id);
 await store.run(['v2Players:'+uid],d=>d.set('v2Players:'+uid,p));
 const service=new GameService(store,'local',180000,()=>clock.now),handle=apiHandler(service,async()=>uid,async(_fix,now)=>unknownHabitat(now));let dropResponse=false;
 const server=createServer((req,res)=>{if(dropResponse){dropResponse=false;res.end=(()=>{res.destroy();return res;}) as typeof res.end;}void handle(req,res);});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+(server.address() as {port:number}).port+'/api/game/v2/command';
 const post=(body:unknown)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer local-http-fixture'},body:JSON.stringify(body)});
 try{
  const opened=await fetch(url.replace('/command','/state'),{headers:{Authorization:'Bearer local-http-fixture'}});assert.equal(opened.status,200);const initial=await opened.json() as {player:{revision:number}};
  const started=await post({type:'arcadeStart',ids:p.go!.team,league:'great',commandId:randomUUID(),expectedRevision:initial.player.revision});assert.equal(started.status,200);const view=await started.json() as {arcadeTicket:ArcadeTicket;player:{revision:number;go:{dust:number}}},t=view.arcadeTicket,{state,inputs:aimed}=playOriginalTap(t);
  assert.equal(t.rules,'tap_duel-2');
  // Actual target taps plus harmless empty-space taps produce a valid long input
  // log, never more than the renderer/server limit of three events per tick.
  const inputs=[...aimed,...Array.from({length:state.tick},(_,tick)=>[{tick,x:0,y:1000},{tick,x:1,y:1000}]).flat()].sort((a,b)=>a.tick-b.tick);
  assert.equal(replayArcade(t,inputs).state.score,state.score);
  const command={type:'arcadeSubmit',format:'original-2',run:t.id,inputs,commandId:randomUUID(),expectedRevision:view.player.revision};assert.ok(Buffer.byteLength(JSON.stringify(command))>65536);clock.now+=state.durationTicks*20;
  const withoutFormat=await post({...command,format:undefined});assert.equal(withoutFormat.status,413);
  // Execute and commit normally, then destroy the socket at res.end so the client never receives the ACK.
  dropResponse=true;await assert.rejects(post(command));
  const committed=await store.run([arcadeRunKey(uid,t.id)],d=>d.get(arcadeRunKey(uid,t.id)) as ArcadeTicket);assert.equal(committed.status,'accepted');assert.equal(committed.receipt!.score,state.score);assert.equal(committed.receipt!.dust,175);assert.equal(committed.receipt!.xp,20);
  const submitted=await post(command);assert.equal(submitted.status,200);const result=await submitted.json() as GameViewV2;assert.deepEqual(result.player.arcade!.last,committed.receipt);assert.equal(result.player.go!.dust,view.player.go.dust+175);assert.equal(result.player.arcade!.completed,1);assert.equal(result.player.arcade!.rewarded,1);assert.equal(result.player.arcade!.dailyXP,20);
  const duplicate=await post(command);assert.equal(duplicate.status,200);assert.equal((await duplicate.json() as typeof result).player.go!.dust,result.player.go!.dust);
  const retryRun=await post({...command,commandId:randomUUID(),expectedRevision:result.player.revision,inputs:[]});assert.equal(retryRun.status,200);const recovered=await retryRun.json() as GameViewV2;assert.deepEqual(recovered.player.arcade!.last,committed.receipt);assert.equal(recovered.player.go!.dust,result.player.go!.dust);assert.equal(recovered.player.go!.trainer!.xp,result.player.go!.trainer!.xp);assert.equal(recovered.player.arcade!.completed,1);assert.equal(recovered.player.arcade!.rewarded,1);assert.equal(recovered.player.arcade!.dailyXP,20);
  const ordinary=await post({type:'favorite',id:'http-bug-0',commandId:randomUUID(),expectedRevision:0,extra:'x'.repeat(9000)});assert.equal(ordinary.status,413);
  const fakeOrdinary=await post({type:'favorite',id:'http-bug-0',format:'original-2',commandId:randomUUID(),expectedRevision:0,extra:'x'.repeat(66000)});assert.equal(fakeOrdinary.status,413);
  const oversized=await post({...command,inputs:'x'.repeat(1048576)});assert.equal(oversized.status,413);
  const legacyId=randomUUID(),legacy:ArcadeTicket={...t,id:legacyId,rules:'tap-1',status:'started',receipt:undefined};await store.run([arcadeRunKey(uid,legacyId)],d=>d.set(arcadeRunKey(uid,legacyId),legacy));
  const fakeLegacy=await post({type:'arcadeSubmit',run:legacyId,format:'original-2',inputs:[],commandId:randomUUID(),expectedRevision:recovered.player.revision});assert.equal(fakeLegacy.status,400);assert.match((await fakeLegacy.json() as {error:string}).error,/invoerversie/);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));store.close();}
});
