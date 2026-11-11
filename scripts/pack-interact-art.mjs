// Packs the Blender renders for the swipe-to-spin post and the cocoon hatch into app art.
// Input: .local/props/postspin/f00..f15.png and .local/props/hatch/s0..s3.png
// (blender --background --factory-startup --python assets/3d/world-props/authoring/build_props.py -- <repo> hatch postspin)
// Output: assets/v2/props/post-spin.webp (4×4 sheet, 320 px frames) and assets/v2/props/hatch-0..3.webp (420 px).
import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
const out='assets/v2/props',F=320;mkdirSync(out,{recursive:true});
const frames=await Promise.all(Array.from({length:16},(_,i)=>sharp(`.local/props/postspin/f${String(i).padStart(2,'0')}.png`).resize(F,F).toBuffer()));
await sharp({create:{width:F*4,height:F*4,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames.map((input,i)=>({input,left:i%4*F,top:Math.floor(i/4)*F}))).webp({quality:86,alphaQuality:90}).toFile(out+'/post-spin.webp');
for(let i=0;i<4;i++)await sharp(`.local/props/hatch/s${i}.png`).resize(420,420).webp({quality:88,alphaQuality:92}).toFile(`${out}/hatch-${i}.webp`);
// Contact sheets for a quick look (not shipped).
await sharp({create:{width:F*4,height:F*4,channels:4,background:'#0E2828'}}).composite(frames.map((input,i)=>({input,left:i%4*F,top:Math.floor(i/4)*F}))).png().toFile('.local/props/postspin-sheet.png');
const hs=await Promise.all([0,1,2,3].map(i=>sharp(`.local/props/hatch/s${i}.png`).resize(420,420).toBuffer()));
await sharp({create:{width:1680,height:420,channels:4,background:'#0E2828'}}).composite(hs.map((input,i)=>({input,left:i*420,top:0}))).png().toFile('.local/props/hatch-sheet.png');
