// Portrait studio for the Kenney Mini Characters trainers (public/models/trainers/*.glb).
// Start: node scripts/render-trainer-portraits.mjs   then: python scripts/save-trainer-portraits.py
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const compiled=await build({stdin:{contents:`
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {lightBugs} from './src/bugModelV2';
const SIZE=512;
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(SIZE,SIZE);renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.body.appendChild(renderer.domElement);
window.renderTrainer=async(model)=>{
 const gltf=await new GLTFLoader().loadAsync('/models/'+model+'.glb'),root=gltf.scene,scene=new THREE.Scene();lightBugs(scene);scene.add(root);
 const mixer=new THREE.AnimationMixer(root),idle=gltf.animations.find(c=>c.name==='idle');if(idle){mixer.clipAction(idle).play();mixer.update(.4);}
 root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root,true),center=box.getCenter(new THREE.Vector3()),height=box.max.y-box.min.y;
 // Three-quarter view of the whole (big-headed) figure, slightly from above like the map camera.
 const camera=new THREE.PerspectiveCamera(24,1,.01,50),look=new THREE.Vector3(center.x,box.min.y+height*.52,center.z);camera.position.copy(look).add(new THREE.Vector3(.95,.55,2.1).multiplyScalar(height*1.45));camera.lookAt(look);
 renderer.render(scene,camera);
 const out=document.createElement('canvas');out.width=out.height=SIZE;const g=out.getContext('2d'),bg=g.createRadialGradient(SIZE/2,SIZE*.42,SIZE*.05,SIZE/2,SIZE/2,SIZE*.72);bg.addColorStop(0,'#3F7A5A');bg.addColorStop(.6,'#24543F');bg.addColorStop(1,'#183D32');g.fillStyle=bg;g.fillRect(0,0,SIZE,SIZE);
 const shadow=g.createRadialGradient(SIZE/2,SIZE*.9,4,SIZE/2,SIZE*.9,SIZE*.24);shadow.addColorStop(0,'rgba(8,32,24,.55)');shadow.addColorStop(1,'rgba(8,32,24,0)');g.fillStyle=shadow;g.fillRect(0,SIZE*.75,SIZE,SIZE*.25);
 g.drawImage(renderer.domElement,0,0);
 mixer.stopAllAction();root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();if(o.isMesh){o.geometry.dispose();for(const m of [o.material].flat()){m.map?.dispose();m.dispose();}}});
 return out.toDataURL('image/png');
};
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',logLevel:'warning'});
const script=compiled.outputFiles[0].contents;
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0"><script src="/studio.js"></script></body></html>');}else if(path==='/studio.js'){res.setHeader('Content-Type','application/javascript');res.end(script);}else if(/^\/models\/trainers\/[a-z0-9-]+\.glb$/.test(path)){res.setHeader('Content-Type','model/gltf-binary');res.end(await readFile(resolve('public','.'+path)));}else{res.statusCode=404;res.end();}}catch{res.statusCode=500;res.end('Asset unavailable');}});
const port=Number(process.env.PORTRAIT_PORT??8097);server.listen(port,'127.0.0.1',()=>console.log('Trainer portrait studio http://127.0.0.1:'+port));
