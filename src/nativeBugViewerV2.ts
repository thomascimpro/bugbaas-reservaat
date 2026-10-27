import * as THREE from 'three';
import {borrowBugModel,instanceBug,lightBugs,addShinyGlitter} from './bugModelV2';
import type {BugModel} from './bugModelV2';
import {WALK_MODELS} from '../game/walkingV2';

// Public, read-only renderer: no account state, GPS, map, or game commands.
const query=new URLSearchParams(location.search),id=query.get('id')??'',shiny=query.get('shiny')==='1',reduced=query.get('motion')==='0',host=document.getElementById('bug-viewer')!;
const native=()=> (window as unknown as {ReactNativeWebView?:{postMessage:(value:string)=>void}}).ReactNativeWebView;
let stopped=false,ready=false,active=true,frame=0,last=0,elapsed=0,renders=0,renderer:THREE.WebGLRenderer|undefined,scene:THREE.Scene|undefined,camera:THREE.OrthographicCamera|undefined,group:THREE.Group|undefined,mixer:THREE.AnimationMixer|undefined,model:BugModel|undefined,lease:ReturnType<typeof borrowBugModel>|undefined,glitter:ReturnType<typeof addShinyGlitter>|undefined,observer:ResizeObserver|undefined;
const notify=(kind:'ready'|'error')=>{host.dataset.status=kind;try{native()?.postMessage(JSON.stringify({kind,id,shiny}));}catch{}};
function disposeResources(...roots:(THREE.Object3D|undefined)[]){const resources=new Set<{dispose:()=>void}>();for(const root of roots)root?.traverse(o=>{if(o instanceof THREE.SkinnedMesh)resources.add(o.skeleton);if(o instanceof THREE.Mesh){resources.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material]){resources.add(material);for(const value of Object.values(material))if(value instanceof THREE.Texture)resources.add(value);}}});resources.forEach(resource=>resource.dispose());}
function dispose(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);observer?.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',dispose);renderer?.domElement.removeEventListener('webglcontextlost',contextLost);mixer?.stopAllAction();if(mixer&&group)mixer.uncacheRoot(mixer.getRoot());glitter?.dispose();disposeResources(group,model?.root);lease?.release();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();scene?.clear();delete (window as unknown as {__bugbaasViewer?:unknown}).__bugbaasViewer;}
function fail(){if(stopped)return;notify('error');dispose();}
function contextLost(event:Event){event.preventDefault();fail();}
function paint(){if(stopped||!ready||!renderer||!scene||!camera)return;try{renderer.render(scene,camera);renderer.domElement.dataset.renderCount=String(++renders);}catch{fail();}}
function animate(time:number){if(stopped||!ready||!active||document.hidden||reduced)return;frame=requestAnimationFrame(animate);if(time-last<1000/30-1)return;const delta=last?Math.min((time-last)/1000,.1):0;last=time;elapsed+=delta;mixer?.update(delta);if(glitter&&camera)glitter.update(elapsed,true,camera.quaternion);paint();}
function visibility(){cancelAnimationFrame(frame);last=0;if(stopped||!ready||!active||document.hidden)return;paint();if(!reduced)frame=requestAnimationFrame(animate);}
function resize(){if(!renderer||!camera||!group)return;const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight),aspect=width/height;renderer.setSize(width,height,false);camera.left=-2.1*aspect;camera.right=2.1*aspect;camera.top=2.1;camera.bottom=-2.1;camera.zoom=1;camera.updateProjectionMatrix();group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3());camera.position.copy(center).add(new THREE.Vector3(4,3.7,6));camera.lookAt(center);camera.updateMatrixWorld();let extent=0;for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const point=new THREE.Vector3(x,y,z).project(camera);extent=Math.max(extent,Math.abs(point.x),Math.abs(point.y));}camera.zoom=.87/Math.max(.01,extent);camera.updateProjectionMatrix();if(glitter)glitter.update(elapsed,!reduced,camera.quaternion);paint();}
async function start(){
 if(!Object.hasOwn(WALK_MODELS,id)){notify('error');return;}
 try{
  scene=new THREE.Scene();lightBugs(scene);camera=new THREE.OrthographicCamera(-2.1,2.1,2.1,-2.1,.1,100);renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.appendChild(renderer.domElement);renderer.domElement.addEventListener('webglcontextlost',contextLost);
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',dispose);(window as unknown as {__bugbaasViewer?:{setActive:(value:boolean)=>void}}).__bugbaasViewer={setActive(value){active=value===true;visibility();}};
  lease=borrowBugModel(WALK_MODELS[id]);model=await lease.promise;if(stopped){disposeResources(model.root);return;}
  const made=instanceBug(model,3.3,id,shiny);group=made.group;mixer=made.mixer;scene.add(group);ready=true;resize();
  if(shiny){glitter=addShinyGlitter(group,3.3);glitter.update(0,false,camera.quaternion);}
  paint();if(stopped)return;renderer.domElement.dataset.modelReady='true';renderer.domElement.dataset.species=id;renderer.domElement.dataset.shiny=String(shiny);notify('ready');observer=new ResizeObserver(resize);observer.observe(host);visibility();
 }catch{fail();}
}
void start();
