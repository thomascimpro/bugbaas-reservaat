// Builds self-contained trainer GLBs from Kenney Mini Characters 1.0 (CC0).
// Usage: node scripts/build-mini-characters.mjs <extracted kenney_mini-characters folder>
// The source GLBs reference an external Textures/colormap.png; this embeds it and keeps only the clips the map uses.
import {NodeIO} from '@gltf-transform/core';
import {prune,dedup} from '@gltf-transform/functions';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {createHash} from 'node:crypto';
import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const source=process.argv[2];
if(!source)throw new Error('Pass the extracted kenney_mini-characters folder.');
const KEEP=new Set(['idle','walk','sprint']);
const IDS=['female-a','female-b','female-c','female-d','female-e','female-f','male-a','male-b','male-c','male-d','male-e','male-f'];
const out='public/models/trainers',meta='assets/3d/kenney-mini-characters';
await mkdir(out,{recursive:true});await mkdir(meta,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),files=[];
for(const id of IDS){
 const input=join(source,'Models','GLB format','character-'+id+'.glb'),raw=await readFile(input);
 const doc=await io.read(input);
 for(const a of doc.getRoot().listAnimations())if(!KEEP.has(a.getName()))a.dispose();
 for(const t of doc.getRoot().listTextures()){t.setURI('');t.setMimeType('image/png');}
 await doc.transform(dedup(),prune());
 const glb=await io.writeBinary(doc),file='character-'+id+'.glb';await writeFile(join(out,file),glb);
 files.push({id,file:'public/models/trainers/'+file,bytes:glb.byteLength,sha256:sha(glb),sourceFile:'Models/GLB format/character-'+id+'.glb',sourceBytes:raw.byteLength,sourceSha256:sha(raw),animations:doc.getRoot().listAnimations().map(a=>a.getName())});
 console.log(file,glb.byteLength);
}
const rawLicense=await readFile(join(source,'License.txt'));const license=Buffer.from(rawLicense.toString('utf8').replace(/\r\n/g,'\n').replace(/^[\t ]+$/gm,'').replace(/\n?$/,'\n'));await writeFile(join(meta,'License.txt'),license);
const texture=await readFile(join(source,'Models','GLB format','Textures','colormap.png'));
await writeFile(join(meta,'source.json'),JSON.stringify({
 version:1,publisher:'Kenney',pack:'Mini Characters 1.0',source:'https://kenney.nl/assets/mini-characters',archive:'kenney_mini-characters.zip (local copy: CimPro BugBaas/assets/Kenney assets)',
 license:'CC0-1.0',licenseFile:'assets/3d/kenney-mini-characters/License.txt',licenseSha256:sha(license),sourceLicenseSha256:sha(rawLicense),importedOn:'2026-11-01',
 status:'Runtime trainer bodies (game/avatarV2.ts MINI_TRAINERS + trainerModel()); wheelchair/aid models not imported',
 build:'node scripts/build-mini-characters.mjs <extracted zip>: embeds Textures/colormap.png, keeps clips idle/walk/sprint, dedup+prune',
 texture:{file:'Models/GLB format/Textures/colormap.png',bytes:texture.byteLength,sha256:sha(texture)},files},null,2)+'\n');
