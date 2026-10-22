import {test} from 'node:test';
import assert from 'node:assert/strict';
import {virtualPosts} from '../game/virtualPostsV2';
import {contains,edgeDistance} from '../game/habitatsV2';
import type {AreaFeature} from '../game/habitatsV2';
import {distance} from '../game/walkingV2';
import {awardPostCocoon,COCOON_POST_CHANCE} from '../game/goCocoonsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {freshV2} from '../game/safariV2';
import {rng} from '../game/catalogV2';
import {spinPost} from '../game/worldSitesV2';

const FIX={lat:51.4416,lng:5.4697,accuracy:5},NOW=Date.UTC(2026,9,22,10);
const path:AreaFeature={layer:'transportation',properties:{class:'path',subclass:'footway'},geometry:{type:'LineString',coordinates:[[FIX.lng-.008,FIX.lat],[FIX.lng+.008,FIX.lat]]}};
const square=(layer:string,properties:Record<string,unknown>={}):AreaFeature=>({layer,properties,geometry:{type:'Polygon',coordinates:[[[FIX.lng-.01,FIX.lat-.01],[FIX.lng+.01,FIX.lat-.01],[FIX.lng+.01,FIX.lat+.01],[FIX.lng-.01,FIX.lat+.01],[FIX.lng-.01,FIX.lat-.01]]]}});
test('virtual posts use stable global IDs, mapped walking geometry and bounded density across nearby GPS fixes',()=>{
 const a=virtualPosts(FIX,[path]),b=virtualPosts({...FIX,lng:FIX.lng+.00008},[path]);assert.ok(a.length>=2&&a.length<=8);assert.ok(a.every(p=>p.source==='virtual'&&!p.osmId&&distance(FIX,p)<=310&&edgeDistance(p,path.geometry)<.01));
 for(const post of a){const same=b.find(p=>p.id===post.id);if(same)assert.deepEqual(same,post);assert.ok(a.every(p=>p===post||distance(p,post)>=85));}
 assert.ok(a.some(p=>b.some(q=>q.id===p.id)));assert.deepEqual(virtualPosts(FIX,[path,path]),a);
 assert.equal(virtualPosts(FIX,[path],a).length,0);
});
test('no walkable geometry, private paths, buildings, water, dangerous roads and restricted land do not get virtual posts',()=>{
 assert.deepEqual(virtualPosts(FIX,[]),[]);assert.deepEqual(virtualPosts(FIX,[{...path,properties:{class:'street'}}]),[]);
 for(const properties of [{class:'path',subclass:'footway',access:'private'},{class:'path',subclass:'footway',foot:'no'}])assert.deepEqual(virtualPosts(FIX,[{...path,properties}]),[]);
 for(const block of [square('building'),square('water'),square('landuse',{access:'private'}),{...path,properties:{class:'motorway'}}])assert.deepEqual(virtualPosts(FIX,[path,block]),[]);
 assert.ok(contains(FIX,square('building').geometry));
});
test('post cocoon drops require a real spin, cap the bag and cannot reroll a consumed full-bag chance',()=>{
 const p=freshV2('virtual-post-qa','VIRT1234',NOW);ensureField(p,NOW);ensureGo(p,NOW);const post=virtualPosts(FIX,[path])[0];p.walking={fix:{...FIX,...post},at:NOW,day:'2026-10-22',spawns:[],caught:[],count:0,posts:[post]};
 let seed='';for(let i=0;i<10000;i++)if(rng('post-'+i+':post-cocoon')()<COCOON_POST_CHANCE){seed='post-'+i;break;}
 assert.equal(awardPostCocoon(p,post.id,seed,NOW),null);spinPost(p,post.id,seed,NOW);assert.equal(p.go!.cocoons!.items.length,2);assert.ok(p.go!.sites!.lastLoot!.cocoon);assert.equal(awardPostCocoon(p,post.id,seed,NOW),null);
 const items=p.go!.cocoons!.items;items.push({...items[0],id:'full'});p.go!.sites!.visits[post.id]=NOW+1;assert.equal(awardPostCocoon(p,post.id,seed,NOW+1),null);items.pop();assert.equal(awardPostCocoon(p,post.id,seed,NOW+1),null);
 assert.throws(()=>spinPost(p,post.id,seed,NOW+1),/laadt/);
});

test('older bags keep every owned count and initialize new rare slots without NaN or replacing supplies',()=>{
 const p=freshV2('old-bag','OLDB1234',NOW);const f=ensureField(p,NOW);f.inventory.blue=42;delete (f.inventory as Partial<typeof f.inventory>).gold;delete (f.inventory as Partial<typeof f.inventory>).silver;delete (f.inventory as Partial<typeof f.inventory>).basic;ensureField(p,NOW);assert.equal(f.inventory.blue,42);assert.equal(f.inventory.basic,30);assert.equal(f.inventory.gold,0);assert.equal(f.inventory.silver,0);assert.ok(Object.values(f.inventory).every(Number.isFinite));
});
