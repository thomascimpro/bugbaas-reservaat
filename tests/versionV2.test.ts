import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIN_CLIENT_VERSION,olderVersion} from '../game/versionV2';
import {APP_RELEASES_URL,fetchAppReleaseV2,publishedReleaseV2,releaseVersion} from '../src/appUpdatesV2';

test('version comparison blocks only genuinely older apps',()=>{
 assert.equal(olderVersion('0.1.12','0.1.13'),true);assert.equal(olderVersion('0.1.9','0.1.13'),true);assert.equal(olderVersion('0.1.13','0.1.13'),false);
 assert.equal(olderVersion('0.1.14','0.1.13'),false);assert.equal(olderVersion('0.2.0','0.1.13'),false);assert.equal(olderVersion('1.0','0.9.9'),false);
 for(const unknown of [undefined,'','dev','0.x.1'])assert.equal(olderVersion(unknown,'0.1.13'),false,'unknown versions are never locked out');
 assert.equal(olderVersion('0.1.12',undefined),false,'servers without a minimum never block');
});

test('the shipped app version always meets the server minimum',()=>{
 const app=JSON.parse(readFileSync('app.json','utf8')).expo.version;
 assert.equal(olderVersion(app,MIN_CLIENT_VERSION),false,'raising MIN_CLIENT_VERSION above the app version would lock out the current release');
});

test('update notices use only stable numeric release tags and the fixed own download page',()=>{
 const release={tag_name:'v0.1.38',draft:false,prerelease:false};assert.deepEqual(publishedReleaseV2(release),{version:'0.1.38'});
 for(const raw of [null,{}, {...release,draft:true},{...release,prerelease:true},{...release,tag_name:'v0.1.38-beta'},{...release,tag_name:'https://example.test'}])assert.equal(publishedReleaseV2(raw),null);
 assert.equal(releaseVersion('v0.1.38'),'0.1.38');assert.equal(olderVersion('0.1.37',publishedReleaseV2(release)!.version),true);
 assert.equal(APP_RELEASES_URL,'https://github.com/thomascimpro/bugbaas-reservaat/releases/latest');
});

test('public release lookup never uses an old game server or login, and outages/rate limits do not block play',async()=>{
 const available=await fetchAppReleaseV2((async(url,options)=>{assert.equal(url,'https://api.github.com/repos/thomascimpro/bugbaas-reservaat/releases/latest');assert.equal(new Headers(options?.headers).has('Authorization'),false);return Response.json({tag_name:'v0.1.38',draft:false,prerelease:false});}) as typeof fetch);assert.equal(available?.version,'0.1.38');
 assert.equal(await fetchAppReleaseV2((async()=>new Response(null,{status:403})) as typeof fetch),null);
 assert.equal(await fetchAppReleaseV2((async()=>{throw new Error('offline');}) as typeof fetch),null);
 let aborted=false;const result=await fetchAppReleaseV2((async(_url,options)=>new Promise<Response>((_,reject)=>{options?.signal?.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));});})) as typeof fetch,5);assert.equal(result,null);assert.equal(aborted,true);
});
