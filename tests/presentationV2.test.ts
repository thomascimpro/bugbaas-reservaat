import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fitArt,plateSlices,heroBugSize,teamBugSize} from '../src/uiGeometryV2';
import {combatCue,turnStamp} from '../src/combatFxV2';
import type {TacticEvent,TacticRun} from '../game/tacticsV2';
import {WALK_MODELS} from '../game/walkingV2';
import {baseSpeciesId} from '../game/dexV2';
import {SHINY_PALETTES,instanceBug} from '../src/bugModelV2';
import * as THREE from 'three';

test('every active map species has its own shiny palette and two full-size baked portraits',()=>{
 const manifest=JSON.parse(readFileSync('assets/v2/portraits/v1/manifest.json','utf8')).species;
 assert.deepEqual(Object.keys(manifest).sort(),Object.keys(WALK_MODELS).sort());
 for(const [id,model] of Object.entries(WALK_MODELS)){
  assert.equal(manifest[id].model,model);assert.deepEqual(manifest[id].palette,SHINY_PALETTES[baseSpeciesId(id)]);
  const normal=readFileSync('assets/v2/portraits/v1/'+id+'.png'),shiny=readFileSync('assets/v2/portraits/v1/'+id+'-shiny.png');
  for(const data of [normal,shiny]){assert.equal(data.readUInt32BE(16),1024);assert.equal(data.readUInt32BE(20),1024);assert.equal(data[25],6);}
  assert.notDeepEqual(normal,shiny);for(const suffix of ['', '-shiny'])assert.ok(readFileSync('assets/v2/portraits/v1/'+id+suffix+'.webp').length>1000);
 }
 const source=new THREE.MeshStandardMaterial({color:'#AA7733'}),root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(),source));
 const shiny=instanceBug({root,clips:[]},2,'ant',true),normal=instanceBug({root,clips:[]},2,'ant',false);
 const material=(g:THREE.Group)=>((g.children[0] as THREE.Group).children[0] as THREE.Mesh).material;
 assert.notEqual(material(shiny.group),source);assert.equal(material(normal.group),source);assert.equal(source.userData.bugVariant,undefined);
});

test('all 48 measured icon frames fit their atlas and remain centered without aspect distortion',()=>{
 const metadata=JSON.parse(readFileSync('assets/v2/ui/metadata.json','utf8'));const names=new Set();
 for(const key of ['ui-main','ui-tools','ui-actions']){const atlas=metadata[key];assert.equal(Object.keys(atlas.frames).length,16);
  for(const [name,raw] of Object.entries(atlas.frames)){names.add(name);const f=raw as {x:number;y:number;width:number;height:number};assert.ok(f.width>0&&f.height>0&&f.x>=0&&f.y>=0&&f.x+f.width<=atlas.width&&f.y+f.height<=atlas.height);
   for(const size of [12,27,54,72,120]){const display=fitArt(f,size);assert.ok(display.left>=0&&display.top>=0);assert.ok(display.left+display.width<=size&&display.top+display.height<=size);assert.ok(Math.abs(display.width/display.height-f.width/f.height)<1e-10);assert.ok(Math.abs(display.left*2+display.width-size)<1e-10);}
  }
 }assert.equal(names.size,48);
});

test('tiled nine-patch preserves every image aspect and fills buttons at phone and tablet sizes',()=>{
 const bounds=[14,122,2159,571];
 for(const width of [38,80,150,290,350,530])for(const height of [46,58,80,112]){
  const slices=plateSlices(width,height,bounds);let area=0;
  for(const s of slices){assert.ok(s.left>=0&&s.top>=0&&s.width>0&&s.height>0);assert.ok(s.left+s.width<=width+1e-9&&s.top+s.height<=height+1e-9);assert.ok(Math.abs(s.width/s.source.width-s.height/s.source.height)<1e-9);area+=s.width*s.height;
   for(const other of slices){if(other===s)continue;const overlapX=Math.min(s.left+s.width,other.left+other.width)-Math.max(s.left,other.left),overlapY=Math.min(s.top+s.height,other.top+other.height)-Math.max(s.top,other.top);assert.ok(overlapX<1e-8||overlapY<1e-8);}
  }
  assert.ok(Math.abs(area-width*height)<1e-6);
 }
 const normal=plateSlices(350,58,bounds),wide=plateSlices(530,58,bounds),tall=plateSlices(350,112,bounds);
 assert.equal(normal[0].width,wide[0].width);assert.equal(normal[0].height,tall[0].height);
 assert.deepEqual(plateSlices(0,0,bounds),[]);
});

test('three bug illustrations stay inside their available row on small phones and wider screens',()=>{
 for(const width of [280,300,340,370,410,540]){assert.ok(heroBugSize(width)*3.24<=width-24+1e-9);assert.ok((teamBugSize(width)+14)*3+16<=width+1e-9);}
});

const event=(kind:TacticEvent['kind'],text:string,amount=0,target='a'):TacticEvent=>({side:0,target,kind,text,amount});
test('feedback uses only the target confirmed events and keeps poison, healing and direct damage separate',()=>{
 const events=[event('damage','Prik',18),event('damage','Gif',4),event('heal','Herstel',22),event('energy','Energie',20),event('damage','Doorbraak',99,'b')];const before=JSON.stringify(events),cue=combatCue(events,'a')!;assert.equal(cue.damage,18);assert.equal(cue.poison,4);assert.equal(cue.healing,22);assert.equal(cue.kind,'heal');assert.equal(JSON.stringify(events),before);assert.equal(combatCue(events,'absent'),null);assert.equal(combatCue([event('energy','Energie',20)],'a'),null);
});

test('attack and status events select distinct visual effects',()=>{
 for(const [text,kind] of Object.entries({Aanval:'hit',Prik:'sting',Doorbraak:'burst',Gifbeet:'venom',Pantserbreker:'crush',Gif:'venom'}))assert.equal(combatCue([event('damage',text,12)],'a')!.kind,kind);
 for(const [type,text,kind] of [['heal','Gezuiverd','cleanse'],['shield','Schild','shield'],['shield','Verschansen','fortify'],['switch','Gewisseld','switch']] as const)assert.equal(combatCue([event(type,text)],'a')!.kind,kind);
});

test('polls and settings refreshes share the same animation stamp while a new turn changes it',()=>{
 const run={id:'battle-a',round:3,phase:'fight'} as TacticRun;assert.equal(turnStamp(run),turnStamp({...run,events:[event('damage','Prik',18)]}));assert.notEqual(turnStamp(run),turnStamp({...run,round:4}));assert.notEqual(turnStamp(run),turnStamp({...run,id:'battle-b'}));assert.notEqual(turnStamp(run),turnStamp({...run,phase:'won'}));
});
