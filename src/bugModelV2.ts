import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';

// The same material palettes drive the animated model and its baked 2D portrait.
export const SHINY_PALETTES:Record<string,readonly [string,string,string]>={
 ant:['#14243D','#2597B1','#BCF2E3'],
 beetle:['#291C42','#9B4BB7','#E7AF65'],
 aphid:['#4D203E','#DB78AF','#FFE0BD'],
 weevil:['#173B43','#39B8A0','#DDF1A4'],
 moth:['#213D50','#5BB8CD','#E4E2FF'],
 earwig:['#173B3A','#51B79A','#F2D797'],
 grasshopper:['#432744','#BE76B6','#F5DAC2'],
 lacewing:['#433649','#D19C66','#FFF1C1'],
 dungbeetle:['#173E48','#418AB2','#B9F0DC'],
 mantis:['#293B32','#6EAE83','#F2DEA8'],
 butterfly:['#233558','#668DDB','#F9D898'],
 divingbeetle:['#342446','#A16DC5','#D4EDFC'],
 waterstrider:['#253247','#7A93B4','#E8C782'],
 hoverfly:['#193C3A','#5FC9BA','#E5FFE4'],
 leafhopper:['#382950','#B48AD9','#F8DAB8'],
 cricket:['#34354A','#7998C9','#E2D8B2'],
 stick:['#292E48','#7D77B8','#D7E3EC'],
 leaf:['#493E23','#C8A04E','#F6EDB8'],
 silverfish:['#49332B','#CF9870','#F9D8AD'],
 hercules:['#20343E','#639BA3','#F0CD7C'],
 caterpillar:['#42374A','#B291CE','#F5DEB9'],
 antlion:['#253746','#5990A8','#D9EBC9'],
 cockroach:['#183B48','#428D9C','#D2E8E5'],
 cranefly:['#422C49','#AF7BBE','#F1D6B3'],
 flea:['#233A3A','#6FB5A3','#D5EFBA'],
 giantwaterbug:['#43284D','#AA79B4','#F1DAA4'],
 mayfly:['#233B52','#79B7D1','#EFF5D8'],
 termite:['#313256','#8A92C5','#F2DBA8'],
 tigerbeetle:['#3D2945','#BB6E9A','#F4CF87'],
 tortoisebeetle:['#293E45','#53BEB0','#F2DEA0'],
};
export type BugModel={root:THREE.Group;clips:THREE.AnimationClip[]};
export async function loadBugModel(name:string):Promise<BugModel>{const g=await new GLTFLoader().loadAsync('/models/'+name+'.glb');return {root:g.scene,clips:g.animations};}
export function instanceBug(model:BugModel,size:number,species?:string,shiny=false){
 const root=clone(model.root) as THREE.Group;
 if(shiny&&species&&SHINY_PALETTES[species]){
  const colors=SHINY_PALETTES[species].map(c=>new THREE.Color(c));
  root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const original=Array.isArray(o.material)?o.material:[o.material];const materials=original.map(source=>{
   const m:THREE.Material=source.clone();m.userData.bugVariant='shiny';const sheen={value:0};m.userData.shinySheen=sheen;
   m.onBeforeCompile=shader=>{shader.uniforms.bbSheen=sheen;shader.uniforms.bbShadow={value:colors[0]};shader.uniforms.bbBody={value:colors[1]};shader.uniforms.bbAccent={value:colors[2]};shader.fragmentShader='uniform float bbSheen;\nuniform vec3 bbShadow;\nuniform vec3 bbBody;\nuniform vec3 bbAccent;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    vec3 bbSource=sqrt(max(diffuseColor.rgb,vec3(0.0)));
    float bbValue=dot(bbSource,vec3(0.2126,0.7152,0.0722));
    vec3 bbColor=mix(bbShadow,bbBody,smoothstep(0.04,0.55,bbValue));
    bbColor=mix(bbColor,bbAccent,smoothstep(0.55,0.95,bbValue));
    float bbMask=smoothstep(0.025,0.085,bbValue)*(1.0-smoothstep(0.88,0.99,bbValue));
    diffuseColor.rgb=mix(diffuseColor.rgb,bbColor,bbMask);
    float bbSweep=bbSheen>0.0?pow(max(0.0,sin(vViewPosition.y*2.2+vViewPosition.x*.9-bbSheen*1.25)),12.0):0.0;
    diffuseColor.rgb+=vec3(.12,.16,.2)*bbSweep*bbMask;
   `);};m.customProgramCacheKey=()=> 'bugbaas-shiny-v2-'+species;return m;
  });o.material=Array.isArray(o.material)?materials:materials[0];});
 }
 root.updateMatrixWorld(true);root.traverse(o=>{if(o instanceof THREE.SkinnedMesh)o.computeBoundingBox();});const box=new THREE.Box3().setFromObject(root),dimensions=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=size/Math.max(dimensions.x,dimensions.y,dimensions.z);
 root.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);root.scale.setScalar(scale);const group=new THREE.Group();group.add(root);const mixer=new THREE.AnimationMixer(root),idle=model.clips.find(c=>c.name.toLowerCase()==='idle')??model.clips[0];if(idle){mixer.clipAction(idle).play();mixer.update(0);}return {group,mixer};
}
export function lightBugs(scene:THREE.Scene){scene.add(new THREE.HemisphereLight(0xfff9df,0x53654b,2.7));const sun=new THREE.DirectionalLight(0xfff1c7,3.5);sun.position.set(-80,160,70);scene.add(sun);}

// Kept outside instanceBug so baked portraits stay clean and source models stay reusable.
export function addShinyGlitter(bug:THREE.Group,size:number){
 const effect=new THREE.Group();effect.name='shiny-glitter';bug.add(effect);
 const geometry=new THREE.PlaneGeometry(1,1),bounds=new THREE.Box3().setFromObject(bug).getSize(new THREE.Vector3()),height=Math.max(bounds.y,size*.28),sheens:{value:number}[]=[];let started:number|undefined;bug.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.shinySheen)sheens.push(m.userData.shinySheen);});
 const glints=Array.from({length:16},(_,i)=>{
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide,toneMapped:false,
   uniforms:{alpha:{value:1}},vertexShader:'varying vec2 sparkleUv; void main(){sparkleUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:'varying vec2 sparkleUv; uniform float alpha; void main(){vec2 p=abs(sparkleUv-.5)*2.;float star=pow(p.x,.55)+pow(p.y,.55);float edge=1.-smoothstep(.88,1.,star);if(edge<.01)discard;vec3 color=mix(vec3(.57,.76,1.),vec3(1.,1.,1.),1.-smoothstep(.16,.64,star));gl_FragColor=vec4(color,edge*alpha);}'
  }),mesh=new THREE.Mesh(geometry,material);
  mesh.name='shiny-glint';mesh.renderOrder=4;effect.add(mesh);return mesh;
 });
 const update=(seconds:number,moving:boolean,orientation:THREE.Quaternion)=>{
  if(moving)started??=seconds;const elapsed=moving?seconds-(started??seconds):0;
  sheens.forEach(s=>s.value=moving?elapsed+1:0);
  glints.forEach((mesh,i)=>{
   const seed=((i*73+19)%101)/101,life=moving?(elapsed/3.6+i*.173)%1:seed,pulse=moving?Math.pow(Math.sin(life*Math.PI),3):.82;
   const reveal=moving&&elapsed<1.6?Math.sin(elapsed/1.6*Math.PI)*.35:0;
   mesh.position.set((((i*47+11)%97)/97-.5)*size*.91,height*(.05+life*.96),(((i*31)%83)/83-.5)*size*.6);
   mesh.quaternion.copy(orientation);mesh.scale.setScalar(size*(i%4===0?.16:.095)*(.3+.7*Math.max(pulse,reveal)));mesh.material.uniforms.alpha.value=Math.max(pulse,reveal);
  });
 };
 update(0,false,new THREE.Quaternion());
 return {update,dispose(){bug.remove(effect);geometry.dispose();glints.forEach(mesh=>mesh.material.dispose());}};
}
