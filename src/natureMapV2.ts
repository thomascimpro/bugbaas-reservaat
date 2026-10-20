import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import type {Map as GameMap} from 'maplibre-gl';
import {areaBiome,biomeAt,contains,edgeDistance,natureSpot} from '../game/habitatsV2';
import type {AreaFeature} from '../game/habitatsV2';
import type {Fix} from '../game/walkingV2';

export function buildingHeight(p:Record<string,unknown>){return Math.min(12,Math.max(2.5,(Number(p.render_height)||5)*.42));}
function texture(r:number,g:number,b:number){const data=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,n=Math.sin(x*Math.PI/16)*Math.cos(y*Math.PI/16)*3+Math.sin((x+y)*Math.PI/8)*1.5;data[i]=r+n;data[i+1]=g+n;data[i+2]=b+n;data[i+3]=255;}return {width:64,height:64,data};}
export function applyNatureStyle(map:GameMap){
 if(!map.hasImage('bb-grass'))map.addImage('bb-grass',texture(184,211,132));if(!map.hasImage('bb-forest'))map.addImage('bb-forest',texture(100,153,105));
 for(const layer of map.getStyle().layers){const source='source-layer' in layer?layer['source-layer']:'';try{
  if(layer.type==='background')map.setPaintProperty(layer.id,'background-color','#BED58E');
  else if(layer.type==='symbol')map.setLayoutProperty(layer.id,'visibility','none');
  else if(layer.type==='fill-extrusion'){map.setLayoutProperty(layer.id,'visibility','none');map.setPaintProperty(layer.id,'fill-extrusion-color',['interpolate',['linear'],['to-number',['get','render_height'],5],0,'#E5DDBE',10,'#D8CAAC',30,'#BAC6AC']);map.setPaintProperty(layer.id,'fill-extrusion-height',['min',12,['max',2.5,['*',.42,['to-number',['get','render_height'],5]]]]);map.setPaintProperty(layer.id,'fill-extrusion-base',0);map.setPaintProperty(layer.id,'fill-extrusion-opacity',1);}
  else if(layer.type==='fill'){
   if(source==='water'){map.setPaintProperty(layer.id,'fill-color','#73B6B3');map.setPaintProperty(layer.id,'fill-opacity',1);}
   else if(source==='landcover'){map.setPaintProperty(layer.id,'fill-color',['match',['get','class'],'wood','#63996C','grass','#B8D384','wetland','#94BEA1','sand','#E7D5A0','ice','#D9E5DF','#B5CD91']);if(/wood/.test(layer.id))map.setPaintProperty(layer.id,'fill-pattern','bb-forest');else if(/grass/.test(layer.id))map.setPaintProperty(layer.id,'fill-pattern','bb-grass');}
   else if(source==='park'){map.setPaintProperty(layer.id,'fill-color','#ACCC75');map.setPaintProperty(layer.id,'fill-opacity',.9);map.setPaintProperty(layer.id,'fill-pattern','bb-grass');}
   else if(source==='building'){map.setPaintProperty(layer.id,'fill-color','#D4CAAA');map.setPaintProperty(layer.id,'fill-outline-color','#BABD97');}
   else if(source==='landuse'){map.setPaintProperty(layer.id,'fill-color',['match',['get','class'],'residential','#CCD7A5','industrial','#CBD1B0','commercial','#CED5B0','farmland','#CAD896','grass','#BAD586','cemetery','#A9C592','pitch','#A6C780','#C2D39B']);}
  }else if(layer.type==='line'&&source==='transportation')map.setPaintProperty(layer.id,'line-color',/casing|outline/.test(layer.id)?'#B3C39A':'#F4EED6');
 }catch{}}
}
function features(map:GameMap){const data:AreaFeature[]=[],seen=new Set<string>();for(const layer of ['landcover','landuse','park','water','waterway','building','transportation'])try{for(const f of map.querySourceFeatures('openmaptiles',{sourceLayer:layer})){const key=layer+':'+JSON.stringify(f.geometry);if(seen.has(key))continue;seen.add(key);data.push({layer,properties:f.properties,geometry:f.geometry});}}catch{}return data;}
function hash(x:number,y:number){let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
export function addMapNature(map:GameMap,scene:THREE.Scene,local:(lng:number,lat:number)=>THREE.Vector3){
 const group=new THREE.Group(),roofGroup=new THREE.Group();group.add(roofGroup);scene.add(group);const resources=new Set<{dispose:()=>void}>(),matrix=new THREE.Object3D();let signature='',last=0;
 const instanced=(geometry:THREE.BufferGeometry,color:number,count:number)=>{const material=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}),mesh=new THREE.InstancedMesh(geometry,material,count);mesh.count=0;mesh.frustumCulled=false;resources.add(geometry);resources.add(material);group.add(mesh);return mesh;};
 const trunks=instanced(new THREE.CylinderGeometry(.45,.7,5,6),0x88704c,160),crowns=[0x73a56e,0x8cb87b,0x4c8b65].map(c=>instanced(new THREE.IcosahedronGeometry(1,1),c,160)),flowers=[0xf3d775,0xc18fba,0xf2ede1].map(c=>instanced(new THREE.IcosahedronGeometry(.6,0),c,110)),grass=instanced(new THREE.ConeGeometry(.6,2,3),0x80a65f,200);
 const wallMaterials=[0xe5d6b4,0xddcca7,0xe9dfca,0xcbd2ad].map(color=>{const m=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true});resources.add(m);return m;});
 const roofMaterials=[0xbc8c63,0xc69b6d,0xa99c76,0xb1b58b].map(color=>{const m=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true,side:THREE.DoubleSide});resources.add(m);return m;});
 function place(mesh:THREE.InstancedMesh,pos:THREE.Vector3,scale:THREE.Vector3,rotation=0){if(mesh.count>=mesh.instanceMatrix.count)return;matrix.position.copy(pos);matrix.scale.copy(scale);matrix.rotation.set(0,rotation,0);matrix.updateMatrix();mesh.setMatrixAt(mesh.count++,matrix.matrix);}
 function refresh(fix:Fix){if(Date.now()-last<5000)return;last=Date.now();const all=features(map),key=Math.round(fix.lat*5000)+':'+Math.round(fix.lng*5000)+':'+all.length;if(key===signature)return;signature=key;const greens=all.filter(f=>areaBiome(f));for(const m of [trunks,...crowns,...flowers,grass])m.count=0;
  const points:{lat:number;lng:number;x:number;y:number;d:number}[]=[],stepLat=14/111320,stepLng=14/(111320*Math.cos(fix.lat*Math.PI/180)),cx=Math.round(fix.lng/stepLng),cy=Math.round(fix.lat/stepLat);
  for(let y=cy-17;y<=cy+17;y++)for(let x=cx-17;x<=cx+17;x++){const random=hash(x,y),p={lng:(x+(random-.5)*.65)*stepLng,lat:(y+(hash(y,x)-.5)*.65)*stepLat},d=Math.hypot((p.lng-fix.lng)/stepLng,(p.lat-fix.lat)/stepLat);if(d<18)points.push({...p,x,y,d});}points.sort((a,b)=>a.d-b.d);
  for(const p of points){const r=hash(p.x,p.y),biome=biomeAt(p,greens);if(biome==='urban'||!natureSpot(p,all))continue;
   if(biome==='forest'||biome==='meadow'&&r>.93){const at=local(p.lng,p.lat),s=.8+r*.5;place(trunks,at.clone().add(new THREE.Vector3(0,2.5*s,0)),new THREE.Vector3(s,s,s));const crown=crowns[Math.floor(r*997)%3];place(crown,at.clone().add(new THREE.Vector3(0,6.5*s,0)),new THREE.Vector3(3.7*s,4.3*s,3.3*s),r*6);}
   else if(biome==='meadow'&&r<.62){const at=local(p.lng,p.lat);for(let i=0;i<3;i++){const p2=at.clone().add(new THREE.Vector3(i*1.3-1.2,.65,(i%2)*1.2));place(grass,p2,new THREE.Vector3(.8,.65,.8),r*6);place(flowers[(p.x+p.y+i+300000000)%3],p2.clone().add(new THREE.Vector3(0,.7,0)),new THREE.Vector3(1.1,.6,1.1));}}
   else if(biome==='wetland'&&all.some(f=>f.layer==='water'&&edgeDistance(p,f.geometry)<18)){const at=local(p.lng,p.lat);for(let i=0;i<3;i++)place(grass,at.clone().add(new THREE.Vector3(i*.9,1.1,0)),new THREE.Vector3(.6,1.2,.6),r*6);}
  }
  for(const mesh of [trunks,...crowns,...flowers,grass])mesh.instanceMatrix.needsUpdate=true;
  for(const child of [...roofGroup.children]){roofGroup.remove(child);(child as THREE.Mesh).geometry.dispose();}
  const buildings=all.filter(f=>f.layer==='building'&&(f.geometry.type==='Polygon'||f.geometry.type==='MultiPolygon')).map(f=>{const ring=f.geometry.type==='Polygon'?f.geometry.coordinates[0]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates[0][0]:[],pts=ring.slice(0,-1).map(p=>local(p[0],p[1])),center=pts.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(pts.length||1);return {f,pts,center};}).filter(b=>b.pts.length>=3&&b.pts.length<90&&b.center.distanceTo(local(fix.lng,fix.lat))<260).sort((a,b)=>a.center.distanceTo(local(fix.lng,fix.lat))-b.center.distanceTo(local(fix.lng,fix.lat))).slice(0,100);
  map.getCanvas().dataset.sceneryBuildings=String(buildings.length);map.getCanvas().dataset.sceneryTrees=String(trunks.count);map.getCanvas().dataset.sceneryFlowers=String(flowers.reduce((n,m)=>n+m.count,0));
  const roofBatches:THREE.BufferGeometry[][]=[[],[],[],[]],wallBatches:THREE.BufferGeometry[][]=[[],[],[],[]];
  for(const {f,pts,center} of buildings){const height=buildingHeight(f.properties)+.1;let geometry:THREE.BufferGeometry;
   if(pts.length===4&&pts.every(p=>p.distanceTo(center)<25)){
    const p=pts.map(p=>p.clone().setY(height));if(p[0].distanceTo(p[1])>p[1].distanceTo(p[2]))p.push(p.shift()!);const a=p[0].clone().add(p[1]).multiplyScalar(.5),b=p[2].clone().add(p[3]).multiplyScalar(.5),rise=Math.min(2.5,p[0].distanceTo(p[1])*.2);a.y+=rise;b.y+=rise;const triangle=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3)=>[...a.toArray(),...b.toArray(),...c.toArray()];geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([...triangle(p[0],p[3],b),...triangle(p[0],b,a),...triangle(a,b,p[2]),...triangle(a,p[2],p[1]),...triangle(p[0],a,p[1]),...triangle(p[3],p[2],b)],3));geometry.computeVertexNormals();
   }else{const shape=new THREE.Shape(pts.map(p=>new THREE.Vector2(p.x,-p.z)));geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);geometry.translate(0,height,0);}
   const color=Math.floor(Math.abs(center.x*3+center.z*7))%roofMaterials.length;
   if(geometry.index){const original=geometry;geometry=geometry.toNonIndexed();original.dispose();}geometry.deleteAttribute('uv');roofBatches[color].push(geometry);
   const shape=new THREE.Shape(pts.map(p=>new THREE.Vector2(p.x,-p.z))),walls=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});walls.rotateX(-Math.PI/2);wallBatches[color].push(walls);
  }
  for(let i=0;i<4;i++)for(const [batch,materials] of [[wallBatches,wallMaterials],[roofBatches,roofMaterials]] as const){if(!batch[i].length)continue;const geometry=mergeGeometries(batch[i],false);batch[i].forEach(g=>g.dispose());if(geometry)roofGroup.add(new THREE.Mesh(geometry,materials[i]));}
 }
 return {update:refresh,dispose(){scene.remove(group);for(const child of roofGroup.children)(child as THREE.Mesh).geometry.dispose();for(const m of [trunks,...crowns,...flowers,grass])m.dispose();resources.forEach(r=>r.dispose());}};
}
