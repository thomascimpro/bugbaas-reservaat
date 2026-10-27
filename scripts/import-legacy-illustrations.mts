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
const files=new Set(await readdir(source)),used=new Set<string>(),rows:{id:string;file:string;width:number;height:number;sha256:string}[]=[];
await mkdir(join(output,'thumbs'),{recursive:true});
for(const {id} of DEX_SPECIES){
 const filename=(aliases[id]??slug(species(id).name))+'.png';
 if(!files.has(filename)||used.has(filename))continue;
 const bytes=await readFile(join(source,filename)),meta=await sharp(bytes).metadata();
 if(!meta.width||!meta.height||meta.width<512||meta.height<512||!meta.hasAlpha)continue;
 used.add(filename);
 await sharp(bytes).webp({quality:92,alphaQuality:100,effort:3}).toFile(join(output,id+'.webp'));
 await sharp(bytes).resize(256,256,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:82,alphaQuality:100,effort:3}).toFile(join(output,'thumbs',id+'.webp'));
 rows.push({id,file:filename,width:meta.width,height:meta.height,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile('src/bugIllustrationsV2.ts',[
 "import type {ImageSourcePropType} from 'react-native';",
 '// Original BugBaas illustrations. Shinies use their own model-matched portraits.',
 'export const bugIllustrations:Record<string,{hd:ImageSourcePropType;thumb:ImageSourcePropType}>={',
 ...rows.map(({id})=>` '${id}':{hd:require('../assets/v2/illustrations/${id}.webp'),thumb:require('../assets/v2/illustrations/thumbs/${id}.webp')},`),
 '};','',
].join('\n'));
await writeFile(join(output,'source.json'),JSON.stringify({sourceProject:'CimPro BugBaas-3.0',sourceDirectory:'assets/bugdex',rights:'Existing BugBaas artwork reused in BugBaas; original rights retained.',processing:'Transparent original resolution WebP; 256px list thumbnails. No upscaling or recolouring.',species:rows},null,2)+'\n');
console.log(JSON.stringify({illustrations:rows.length,thumbnails:rows.length,sourceDimensions:[...new Set(rows.map(r=>r.width+'x'+r.height))],shinyRecolours:0}));
