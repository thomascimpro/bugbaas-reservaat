import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const views=JSON.parse(await readFile('scripts/portrait-views.json','utf8'));
const compiled=await build({stdin:{contents:`
import * as THREE from 'three';
import {loadBugModel,instanceBug,lightBugs,SHINY_PALETTES} from './src/bugModelV2';
import {WALK_MODELS} from './game/walkingV2';
import {baseSpeciesId} from './game/dexV2';
const cache=new Map();
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(1024,1024);renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.body.appendChild(renderer.domElement);
window.species=Object.keys(WALK_MODELS);
// Per-species portrait overrides for thin/pale bugs that are unreadable at thumbnail size (see docs/POGO_WERKREGISTER.md).
// dir: camera offset from the model centre (default 4,3.7,6); outline: px of dark cartoon rim (catch-scene colour #0c1f19) behind the opaque silhouette.
const VIEWS=${JSON.stringify(views)};
window.portraitViews=VIEWS;
function withOutline(source,radius){
 const size=source.width,silhouette=document.createElement('canvas'),out=document.createElement('canvas');silhouette.width=silhouette.height=out.width=out.height=size;
 const s=silhouette.getContext('2d'),o=out.getContext('2d');s.drawImage(source,0,0);const pixels=s.getImageData(0,0,size,size);
 for(let i=0;i<pixels.data.length;i+=4){const a=pixels.data[i+3]>150?255:0;pixels.data[i]=12;pixels.data[i+1]=31;pixels.data[i+2]=25;pixels.data[i+3]=a;}s.putImageData(pixels,0,0);
 for(let step=0;step<32;step++){const angle=step/32*Math.PI*2;o.drawImage(silhouette,Math.round(Math.cos(angle)*radius),Math.round(Math.sin(angle)*radius));}
 // Keep the rim outside the rendered footprint so translucent wings are not darkened from behind.
 const footprint=document.createElement('canvas');footprint.width=footprint.height=size;const f=footprint.getContext('2d');f.drawImage(source,0,0);const mask=f.getImageData(0,0,size,size);
 for(let i=0;i<mask.data.length;i+=4)mask.data[i+3]=mask.data[i+3]>8?255:0;f.putImageData(mask,0,0);
 o.globalCompositeOperation='destination-out';o.drawImage(footprint,0,0);o.globalCompositeOperation='source-over';
 o.drawImage(source,0,0);return out.toDataURL('image/png');
}
window.renderBug=async(id,shiny,override)=>{
 const view={dir:[4,3.7,6],outline:0,...VIEWS[id],...override};
 if(!cache.has(id))cache.set(id,await loadBugModel(WALK_MODELS[id]));
 const {group,mixer}=instanceBug(cache.get(id),3.3,id,shiny),scene=new THREE.Scene();lightBugs(scene);scene.add(group);
 group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3());
 const camera=new THREE.OrthographicCamera(-2.1,2.1,2.1,-2.1,.1,100);camera.position.copy(center).add(new THREE.Vector3(...view.dir));camera.lookAt(center);camera.updateMatrixWorld();camera.updateProjectionMatrix();
 let extent=0;for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y));}
 camera.zoom=.85/extent;camera.updateProjectionMatrix();renderer.render(scene,camera);const png=view.outline>0?withOutline(renderer.domElement,view.outline):renderer.domElement.toDataURL('image/png');mixer.stopAllAction();
 group.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();if(shiny&&o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});
 if(shiny){const model=cache.get(id);model.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(m))if(value instanceof THREE.Texture)value.dispose();m.dispose();}}});cache.delete(id);renderer.renderLists.dispose();}
 return {png,palette:SHINY_PALETTES[id]??SHINY_PALETTES[baseSpeciesId(id)],model:WALK_MODELS[id]};
};
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',logLevel:'warning'});
const script=compiled.outputFiles[0].contents;
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0"><script src="/studio.js"></script></body></html>');}else if(path==='/studio.js'){res.setHeader('Content-Type','application/javascript');res.end(script);}else if(/^\/models\/[A-Za-z0-9_-]+\.glb$/.test(path)){res.setHeader('Content-Type','model/gltf-binary');res.end(await readFile(resolve('public','.'+path)));}else{res.statusCode=404;res.end();}}catch{res.statusCode=500;res.end('Asset unavailable');}});
const port=Number(process.env.PORTRAIT_PORT??8094);server.listen(port,'127.0.0.1',()=>console.log('Portrait renderer http://127.0.0.1:'+port));
