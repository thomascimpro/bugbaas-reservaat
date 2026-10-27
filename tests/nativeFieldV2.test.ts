import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {NATIVE_GPS_SHIM,nativeFieldURL,parseNativeFieldRequest} from '../src/nativeFieldProtocolV2';
import {createNativeGPSWatches} from '../src/nativeGPSWatchesV2';
import {displayGPSFixV2} from '../src/gpsFixV2';
import {validFix} from '../game/walkingV2';

test('last-known and coarse location can preview the map but cannot authorize gameplay or fabricate a fix',()=>{
 const now=Date.UTC(2026,9,27,12),fresh={lat:51.44,lng:5.47,accuracy:5,timestamp:now},cached={...fresh,timestamp:now-60000},coarse={...fresh,accuracy:1200};
 for(const fix of [fresh,cached,coarse])assert.deepEqual(displayGPSFixV2(fix,now),fix);
 assert.deepEqual(validFix(displayGPSFixV2(fresh,now),now),fresh);assert.throws(()=>validFix(displayGPSFixV2(cached,now),now));assert.throws(()=>validFix(displayGPSFixV2(coarse,now),now));
 for(const invalid of [null,{}, {...fresh,lat:91},{...fresh,lng:190},{...fresh,accuracy:NaN},{...fresh,accuracy:5001},{...fresh,timestamp:now-86400001},{...fresh,timestamp:now+5001}])assert.equal(displayGPSFixV2(invalid,now),null);
});

test('native clearWatch cancels a pending Expo subscription and removes its late result',async()=>{
 const watches=createNativeGPSWatches(),request=watches.begin(1);let removed=0,complete!:(value:{remove:()=>void})=>void;
 const pending=new Promise<{remove:()=>void}>(resolve=>{complete=resolve;}).then(request.attach);
 watches.clear(1);assert.equal(request.current(),false);
 complete({remove:()=>{removed++;}});await pending;assert.equal(removed,1);
 watches.stop();assert.equal(removed,1);
});

test('native background stop invalidates pending watches even after a new watch reuses the id',()=>{
 const watches=createNativeGPSWatches(),old=watches.begin(1);let oldRemoved=0,newRemoved=0;
 watches.stop();const resumed=watches.begin(1);resumed.attach({remove:()=>{newRemoved++;}});
 old.attach({remove:()=>{oldRemoved++;}});
 assert.equal(old.current(),false);assert.equal(resumed.current(),true);assert.equal(oldRemoved,1);assert.equal(newRemoved,0);
 watches.stop();assert.equal(resumed.current(),false);assert.equal(newRemoved,1);
});

test('native replacing an active watch removes it and clear remains idempotent',()=>{
 const watches=createNativeGPSWatches(),first=watches.begin(1);let firstRemoved=0,secondRemoved=0;
 first.attach({remove:()=>{firstRemoved++;}});const second=watches.begin(1);
 assert.equal(first.current(),false);assert.equal(firstRemoved,1);
 second.attach({remove:()=>{secondRemoved++;}});watches.clear(1);watches.clear(1);watches.stop();
 assert.equal(second.current(),false);assert.equal(firstRemoved,1);assert.equal(secondRemoved,1);
});

test('native map bridge accepts only field actions and rejects type overrides, account operations and oversized messages',()=>{
 const message={kind:'command',id:'test-1',command:'worldLocate',params:{fix:{lat:52,lng:5,accuracy:8,timestamp:1}}};
 assert.deepEqual(parseNativeFieldRequest(JSON.stringify(message)),message);
 for(const m of [{...message,command:'goTransfer'},{...message,params:{type:'goTransfer',id:'owned'}},{...message,params:{commandId:'replay'}},{...message,params:[]},{...message,token:'private'},{kind:'navigate',name:'javascript:alert(1)'},{kind:'geo',action:'get',id:-1},{kind:'geo',action:'get',id:1,url:'https://other.example'}])assert.equal(parseNativeFieldRequest(JSON.stringify(m)),null);
 assert.equal(parseNativeFieldRequest('x'.repeat(16385)),null);
 assert.equal(parseNativeFieldRequest('{'),null);
});
test('native frame URL requires HTTPS outside development and allows only emulator loopback for HTTP',()=>{
 assert.equal(nativeFieldURL('https://game.example'),'https://game.example/?nativeField=1');
 assert.equal(nativeFieldURL('http://10.0.2.2:8088',true),'http://10.0.2.2:8088/?nativeField=1');
 for(const [url,development] of [['http://10.0.2.2:8088',false],['http://other.example',true],['javascript:alert(1)',false]] as const)assert.throws(()=>nativeFieldURL(url,development));
});
test('native map camera accepts finite viewport values without allowing remote actions or invalid ranges',()=>{
 const m={kind:'navigate',name:'team',camera:{center:[5.13,52.09],zoom:18,pitch:48,bearing:-24}};
 assert.ok(parseNativeFieldRequest(JSON.stringify(m)));
 for(const camera of [{...m.camera,zoom:100},{...m.camera,pitch:-1},{...m.camera,center:[190,52]},{...m.camera,center:['5',52]}])assert.equal(parseNativeFieldRequest(JSON.stringify({...m,camera})),null);
});
test('native catch navigation can select a specimen only within the collection destination',()=>{
 const message={kind:'navigate',name:'team',specimenId:'wild-a123456789abcdef-2',camera:{center:[5.13,52.09],zoom:18,pitch:56,bearing:-20}};
 assert.deepEqual(parseNativeFieldRequest(JSON.stringify(message)),message);
 assert.ok(parseNativeFieldRequest(JSON.stringify({kind:'navigate',name:'team'})),'ordinary collection navigation stays compatible');
 for(const specimenId of ['',7,{},'x'.repeat(161),'../../private','<script>'])assert.equal(parseNativeFieldRequest(JSON.stringify({...message,specimenId})),null);
 for(const name of ['map','profile','account','ranked'])assert.equal(parseNativeFieldRequest(JSON.stringify({...message,name})),null);
 assert.equal(parseNativeFieldRequest(JSON.stringify({...message,token:'private'})),null);
});
test('native field menu opens the existing cocoon screen without permitting specimen selection there',()=>{
 const message={kind:'navigate',name:'cocoons'};
 assert.deepEqual(parseNativeFieldRequest(JSON.stringify(message)),message);
 assert.equal(parseNativeFieldRequest(JSON.stringify({...message,specimenId:'owned-bug'})),null);
});
test('GPS bridge forwards exact native timestamps once, deduplicates Android delivery and changes permission only once',async()=>{
 const outgoing:unknown[]=[],window=new EventTarget() as EventTarget&Record<string,any>,document=new EventTarget() as EventTarget&Record<string,any>,navigator={} as Record<string,any>;
 window.ReactNativeWebView={postMessage:(raw:string)=>outgoing.push(JSON.parse(raw))};
 const sandbox={window,document,navigator,EventTarget,Event,Map,Number,Promise,JSON,Object,Math,Error,setTimeout:()=>1,clearTimeout:()=>{}};
 runInNewContext(NATIVE_GPS_SHIM,sandbox);runInNewContext(NATIVE_GPS_SHIM,sandbox);
 let positions=0,actual:unknown,permissions=0;const p=await navigator.permissions.query({name:'geolocation'});p.addEventListener('change',()=>permissions++);
 const id=navigator.geolocation.watchPosition((value:unknown)=>{positions++;actual=value;});assert.deepEqual(outgoing,[{kind:'geo',action:'watch',id}]);
 const dispatch=(target:EventTarget,value:unknown)=>{const e=new Event('message');Object.defineProperty(e,'data',{value:JSON.stringify(value)});target.dispatchEvent(e);};
 const position={coords:{latitude:52.09,longitude:5.13,accuracy:8},timestamp:123456};const m={kind:'position',seq:1,id,position};dispatch(document,m);dispatch(window,m);assert.equal(positions,1);assert.deepEqual(JSON.parse(JSON.stringify(actual)),position);
 dispatch(window,{kind:'permission',seq:2,state:'granted'});dispatch(window,{kind:'permission',seq:3,state:'granted'});assert.equal(permissions,1);
 dispatch(window,{kind:'active',seq:4,active:false});assert.equal(document.hidden,true);
 navigator.geolocation.clearWatch(id);dispatch(window,{...m,seq:5});assert.equal(positions,1);assert.deepEqual(outgoing.at(-1),{kind:'geo',action:'clear',id});
});
