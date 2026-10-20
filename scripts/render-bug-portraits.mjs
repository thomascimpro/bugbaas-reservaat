import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const compiled=await build({stdin:{contents:`
import * as THREE from 'three';
import {loadBugModel,instanceBug,lightBugs,SHINY_PALETTES} from './src/bugModelV2';
import {WALK_MODELS} from './game/walkingV2';
const cache=new Map();
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(1024,1024);renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.body.appendChild(renderer.domElement);
window.species=Object.keys(WALK_MODELS);
window.renderBug=async(id,shiny)=>{
 if(!cache.has(id))cache.set(id,await loadBugModel(WALK_MODELS[id]));
 const {group,mixer}=instanceBug(cache.get(id),3.3,id,shiny),scene=new THREE.Scene();lightBugs(scene);scene.add(group);
 group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3());
 const camera=new THREE.OrthographicCamera(-2.1,2.1,2.1,-2.1,.1,100);camera.position.copy(center).add(new THREE.Vector3(4,3.7,6));camera.lookAt(center);camera.updateMatrixWorld();camera.updateProjectionMatrix();
 let extent=0;for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y));}
 camera.zoom=.85/extent;camera.updateProjectionMatrix();renderer.render(scene,camera);const png=renderer.domElement.toDataURL('image/png');mixer.stopAllAction();
 if(shiny)group.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});
 return {png,palette:SHINY_PALETTES[id],model:WALK_MODELS[id]};
};
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',logLevel:'warning'});
const script=compiled.outputFiles[0].contents;
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0"><script src="/studio.js"></script></body></html>');}else if(path==='/studio.js'){res.setHeader('Content-Type','application/javascript');res.end(script);}else if(/^\/models\/[A-Za-z]+\.glb$/.test(path)){res.setHeader('Content-Type','model/gltf-binary');res.end(await readFile(resolve('public','.'+path)));}else{res.statusCode=404;res.end();}}catch{res.statusCode=500;res.end('Asset unavailable');}});
server.listen(8094,'127.0.0.1',()=>console.log('Portrait renderer http://127.0.0.1:8094'));
