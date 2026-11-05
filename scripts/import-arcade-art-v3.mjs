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
async function centeredRegions(output,regions){
 const {data,info}=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 return regions.map(r=>{const [x,y,w,h]=r.rect,left=Math.max(0,Math.floor(x)),top=Math.max(0,Math.floor(y)),right=Math.min(info.width,Math.floor(x+w)),bottom=Math.min(info.height,Math.floor(y+h));let x0=right,y0=bottom,x1=left,y1=top;
  for(let py=top;py<bottom;py++)for(let px=left;px<right;px++)if(data[(py*info.width+px)*4+3]>=24){x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px+1);y1=Math.max(y1,py+1);}
  if(x1<=x0||y1<=y0)return r;x0=Math.max(left,x0-2);y0=Math.max(top,y0-2);x1=Math.min(right,x1+2);y1=Math.min(bottom,y1+2);return {...r,contentRect:[x0,y0,x1-x0,y1-y0]};});
}
for(const [id,name,width] of jobs){
 const asset=manifest.assets.find(a=>a.id===id),input=await readFile(join(source,asset.file));
 const output=await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:86,alphaQuality:100}).toBuffer();
 const meta=await sharp(output).metadata();await writeFile(join(out,name+'.webp'),output);
 let regions=asset.regions?.map(r=>({name:r.name,rect:r.rect.map(v=>v*meta.width/asset.width),anchor:r.anchor}));
 if(name==='controls'&&regions)regions=await centeredRegions(output,regions);
 files.push({id,file:name+'.webp',width:meta.width,height:meta.height,bytes:output.length,sha256:createHash('sha256').update(output).digest('hex'),source:asset.file,sourceSHA256:asset.sha256,provenance:asset.provenance,regions});
}
// Runtime hero art is a real specimen only when the species matches; generic hero art is decorative.
for(const name of ['dragonfly','stag-beetle','firefly','katydid']){
 const src='assets/cutouts/'+name+'.png',input=await readFile(join(source,src)),output=await sharp(input).resize({width:384}).webp({quality:88,alphaQuality:100}).toBuffer();
 await writeFile(join(out,name+'.webp'),output);files.push({file:name+'.webp',bytes:output.length,source:src,sourceSHA256:createHash('sha256').update(input).digest('hex'),sha256:createHash('sha256').update(output).digest('hex'),provenance:'OpenAI imagegen; original prompt in creator package'});
}
await writeFile(join(out,'source.json'),JSON.stringify({sourcePackage:'bugbaas-creatorpakket-20261102',purpose:'First isolated Arcade block; no 3D changes',files},null,2)+'\n');
console.log(JSON.stringify({files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0)}));
