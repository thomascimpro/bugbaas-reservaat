import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {DEX_SPECIES} from '../game/dexV2';
import {species} from '../game/catalogV2';

const argument=process.argv.indexOf('--source'),source=argument>=0?resolve(process.argv[argument+1]):'';
if(!source)throw new Error('Supply the original BugBaas assets/bugdex directory with --source.');
const output=resolve('assets/v2/illustrations');
const slug=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
// Explicit species matches only: do not use an adult illustration for a larva,
// reuse the same picture for several evolution stages, or recolour a normal into a shiny.
const aliases:Record<string,string>={
 ant:'rode-bosmier',aphid:'groene-bladluis',moth:'nachtvlinder',butterfly:'koninginnenpage',
 leafhopper:'helmcicade',caterpillar:'rups',
 asianladybeetle:'aziatisch-lieveheersbeestje',rosechafer:'gouden-tor',
 rainbowscarab:'regenboogmestkever',leafbeetle:'bladkever',sacredscarab:'heilige-scarabee',
 ant_elite:'zwarte-wegmier',butterfly_elite:'monarchvlinder',
 mosquito_2:'gewone-steekmug',mosquito_3:'grote-steekmug',dragonfly_3:'grote-keizerlibel',
 spider_3:'vogelspin',snail_2:'tuinslak',snail_3:'wijngaardslak',
};
// Source art that is unusable as a sprite; these species use their model-matched 3D portrait instead.
const rejected:Record<string,string>={
 weevil:'snuitkever.png depicts a cockroach, not a weevil',
 waterstrider:'schaatsenrijder.png has detached floating legs and is unreadable as a thumbnail',
};
// Source art with detached opaque specks/cut-off fragments next to the bug; remove those islands only.
const strayIslands=new Set(['atlasbeetle','mantis','rosalialonghorn','wasp_3']);
async function withoutStrayIslands(bytes:Buffer){
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{width,height}=info,label=new Int32Array(width*height),islands:{pixels:number[];max:number}[]=[];
 for(let start=0;start<width*height;start++){if(label[start]||!data[start*4+3])continue;const island={pixels:[start],max:0};label[start]=islands.length+1;
  for(let k=0;k<island.pixels.length;k++){const p=island.pixels[k],x=p%width,y=(p-x)/width;island.max=Math.max(island.max,data[p*4+3]);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,q=ny*width+nx;if(nx<0||ny<0||nx>=width||ny>=height||label[q]||!data[q*4+3])continue;label[q]=label[start];island.pixels.push(q);}}
  islands.push(island);}
 const largest=islands.reduce((a,b)=>b.pixels.length>a.pixels.length?b:a);
 for(const island of islands)if(island!==largest&&island.max>=60)for(const p of island.pixels)data[p*4+3]=0;
 return sharp(data,{raw:{width,height,channels:4}}).png().toBuffer();
}
const files=new Set(await readdir(source)),used=new Set<string>(),rows:{id:string;file:string;width:number;height:number;sha256:string}[]=[];
await mkdir(join(output,'thumbs'),{recursive:true});
for(const {id} of DEX_SPECIES){
 const filename=(aliases[id]??slug(species(id).name))+'.png';
 if(!files.has(filename)||used.has(filename)||rejected[id])continue;
 const original=await readFile(join(source,filename)),bytes=strayIslands.has(id)?await withoutStrayIslands(original):original,meta=await sharp(bytes).metadata();
 if(!meta.width||!meta.height||meta.width<512||meta.height<512||!meta.hasAlpha)continue;
 used.add(filename);
 await sharp(bytes).webp({quality:92,alphaQuality:100,effort:3}).toFile(join(output,id+'.webp'));
 await sharp(bytes).resize(256,256,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:82,alphaQuality:100,effort:3}).toFile(join(output,'thumbs',id+'.webp'));
 rows.push({id,file:filename,width:meta.width,height:meta.height,sha256:createHash('sha256').update(original).digest('hex')});
}
await writeFile('src/bugIllustrationsV2.ts',[
 "import type {ImageSourcePropType} from 'react-native';",
 '// Original BugBaas illustrations. Shinies use their own model-matched portraits.',
 'export const bugIllustrations:Record<string,{hd:ImageSourcePropType;thumb:ImageSourcePropType}>={',
 ...rows.map(({id})=>` '${id}':{hd:require('../assets/v2/illustrations/${id}.webp'),thumb:require('../assets/v2/illustrations/thumbs/${id}.webp')},`),
 '};','',
].join('\n'));
await writeFile(join(output,'source.json'),JSON.stringify({sourceProject:'CimPro BugBaas-3.0',sourceDirectory:'assets/bugdex',rights:'Existing BugBaas artwork reused in BugBaas; original rights retained.',processing:'Transparent original resolution WebP; 256px list thumbnails. No upscaling or recolouring. Detached specks removed for '+[...strayIslands].join(', ')+'.',rejected,species:rows},null,2)+'\n');
console.log(JSON.stringify({illustrations:rows.length,thumbnails:rows.length,sourceDimensions:[...new Set(rows.map(r=>r.width+'x'+r.height))],shinyRecolours:0}));
