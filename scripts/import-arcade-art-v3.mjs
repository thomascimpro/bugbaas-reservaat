// Import only the art used by the first Arcade block; keep the ImageGen originals intact.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const source=resolve('../bugbaas-creatorpakket-20261102'),out=resolve('assets/v3/arcade');
const manifest=JSON.parse(await readFile(join(source,'asset-manifest.json'),'utf8'));
await mkdir(out,{recursive:true});
const jobs=[['A05','arena',720],['A06','trail',720],['A09','logo',480],['A01','navigation',640],['A19','controls',640],['A17','types',640],['A04','fx',768],['A25','fx-extra',768],['A26','fx-last',768]];
const files=[];
for(const [id,name,width] of jobs){
 const asset=manifest.assets.find(a=>a.id===id),input=await readFile(join(source,asset.file));
 const output=await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:86,alphaQuality:100}).toBuffer();
 const meta=await sharp(output).metadata();await writeFile(join(out,name+'.webp'),output);
 files.push({id,file:name+'.webp',width:meta.width,height:meta.height,bytes:output.length,sha256:createHash('sha256').update(output).digest('hex'),source:asset.file,sourceSHA256:asset.sha256,provenance:asset.provenance,regions:asset.regions?.map(r=>({name:r.name,rect:r.rect.map(v=>v*meta.width/asset.width),anchor:r.anchor}))});
}
// Runtime hero art is a real specimen only when the species matches; generic hero art is decorative.
for(const name of ['dragonfly','stag-beetle','firefly','katydid']){
 const src='assets/cutouts/'+name+'.png',input=await readFile(join(source,src)),output=await sharp(input).resize({width:384}).webp({quality:88,alphaQuality:100}).toBuffer();
 await writeFile(join(out,name+'.webp'),output);files.push({file:name+'.webp',bytes:output.length,source:src,sourceSHA256:createHash('sha256').update(input).digest('hex'),sha256:createHash('sha256').update(output).digest('hex'),provenance:'OpenAI imagegen; original prompt in creator package'});
}
await writeFile(join(out,'source.json'),JSON.stringify({sourcePackage:'bugbaas-creatorpakket-20261102',purpose:'First isolated Arcade block; no 3D changes',files},null,2)+'\n');
console.log(JSON.stringify({files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0)}));
