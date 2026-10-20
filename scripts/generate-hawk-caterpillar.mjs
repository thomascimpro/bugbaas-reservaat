import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {writeFile} from 'node:fs/promises';

globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:'+blob.type+';base64,'+Buffer.from(result).toString('base64');this.onloadend?.();});}};
// Original BugBaas low-poly hawk-moth larva: six true legs, five pairs of prolegs and a tail horn.
// No species IDs, ownership records or evolution rules are changed by this asset.
const root=new THREE.Group();root.name='HawkCaterpillar';
const body=new THREE.MeshStandardMaterial({color:0x78a84c,roughness:.83,flatShading:true}),belly=new THREE.MeshStandardMaterial({color:0xabc56e,roughness:.9,flatShading:true}),stripe=new THREE.MeshStandardMaterial({color:0xe1da92,roughness:.85,flatShading:true}),headMat=new THREE.MeshStandardMaterial({color:0x79914b,roughness:.8,flatShading:true}),dark=new THREE.MeshStandardMaterial({color:0x483c2b,roughness:.7,flatShading:true});
const segmentGeometry=new THREE.SphereGeometry(1,10,6),limbGeometry=new THREE.SphereGeometry(1,6,4),parts=[],tracks=[];
for(let i=0;i<12;i++){
 const part=new THREE.Group();part.name='segment'+i;const radius=i===0?.24:i===11?.19:.275-Math.abs(i-6)*.004;
 part.position.set(-1.38+i*.24,.34+Math.sin(i/11*Math.PI)*.07,0);root.add(part);parts.push(part);
 const mesh=new THREE.Mesh(segmentGeometry,i===0?headMat:body);mesh.scale.set(i===0?.22:.2,radius,radius*.88);part.add(mesh);
 if(i>0&&i<11)for(const side of [-1,1]){const mark=new THREE.Mesh(limbGeometry,stripe);mark.scale.set(.035,.14,.016);mark.position.set(.02,.04,side*radius*.83);mark.rotation.z=-.55;part.add(mark);const spiracle=new THREE.Mesh(limbGeometry,dark);spiracle.scale.set(.018,.025,.012);spiracle.position.set(.08,-.065,side*radius*.85);part.add(spiracle);}
 if([2,3,4,6,7,8,9,11].includes(i))for(const side of [-1,1]){const leg=new THREE.Mesh(limbGeometry,i<5?dark:belly);leg.scale.set(i<5?.035:.07,.13,.07);leg.position.set(-.035,-radius*.86,side*radius*.57);leg.rotation.x=side*.4;part.add(leg);}
 if(i===0)for(const side of [-1,1])for(let eye=0;eye<3;eye++){const dot=new THREE.Mesh(limbGeometry,dark);dot.scale.setScalar(.015);dot.position.set(-.17+eye*.035,.015,side*.17);part.add(dot);}
 if(i===10){const horn=new THREE.Mesh(new THREE.ConeGeometry(.035,.24,6),dark);horn.position.set(.05,.29,0);horn.rotation.z=-.6;part.add(horn);}
 const times=[0,1,2,3,4],values=times.flatMap(t=>[part.position.x,part.position.y+Math.sin(t*Math.PI/2+i*.35)*.012,part.position.z]);tracks.push(new THREE.VectorKeyframeTrack(part.name+'.position',times,values));
}
const clips=[new THREE.AnimationClip('idle',4,tracks),new THREE.AnimationClip('walk',2,parts.map((p,i)=>new THREE.VectorKeyframeTrack(p.name+'.position',[0,.5,1,1.5,2],[0,.5,1,1.5,2].flatMap(t=>[p.position.x+Math.sin(t*Math.PI+i*.5)*.025,p.position.y+Math.max(0,Math.sin(t*Math.PI*2+i*.5))*.035,0]))))];
const data=await new GLTFExporter().parseAsync(root,{binary:true,animations:clips,onlyVisible:true});
await writeFile('public/models/HawkCaterpillar.glb',Buffer.from(data));
await writeFile('assets/3d/hawk-caterpillar-source.json',JSON.stringify({name:'HawkCaterpillar',author:'BugBaas',source:'Original procedural geometry; scripts/generate-hawk-caterpillar.mjs',created:'2026-10-20',license:'Original project asset',anatomy:'12 segments, 3 pairs of true legs, 5 pairs of prolegs, tail horn',animations:clips.map(c=>c.name)},null,2));
console.log('HawkCaterpillar.glb written; original BugBaas mesh and idle/walk clips.');
