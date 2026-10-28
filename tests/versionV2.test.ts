import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIN_CLIENT_VERSION,olderVersion} from '../game/versionV2';

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
