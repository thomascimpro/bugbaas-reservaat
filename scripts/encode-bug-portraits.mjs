import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const names=Object.keys(JSON.parse(await readFile('assets/v2/portraits/v1/manifest.json','utf8')).species);
await Promise.all(names.flatMap(id=>[id,id+'-shiny']).map(async id=>{
 const {data,info}=await sharp('assets/v2/portraits/v1/'+id+'.png').trim().resize(900,900,{fit:'inside'}).toBuffer({resolveWithObject:true});
 const horizontal=1024-info.width,vertical=1024-info.height;
 await sharp(data).extend({left:Math.floor(horizontal/2),right:Math.ceil(horizontal/2),top:Math.floor(vertical/2),bottom:Math.ceil(vertical/2),background:{r:0,g:0,b:0,alpha:0}}).webp({quality:94,alphaQuality:100}).toFile('assets/v2/portraits/v1/'+id+'.webp');
}));
const source="import type {ImageSourcePropType} from 'react-native';\nexport const bugPortraits:Record<string,readonly [ImageSourcePropType,ImageSourcePropType]>={\n"+names.map(id=>` '${id}':[require('../assets/v2/portraits/v1/${id}.webp'),require('../assets/v2/portraits/v1/${id}-shiny.webp')],`).join('\n')+'\n};\n';
await writeFile('src/bugPortraitsV2.ts',source);console.log(names.length*2+' portraits encoded');
