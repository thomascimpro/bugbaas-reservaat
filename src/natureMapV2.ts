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
   else if(source==='building'){map.setPaintProperty(layer.id,'fill-color','#D4CAAA');map.setPaintProperty(layer.id,'fill-outline-color','#BABD97');map.setLayerZoomRange?.(layer.id,layer.minzoom??0,24);}
   else if(source==='landuse'){map.setPaintProperty(layer.id,'fill-color',['match',['get','class'],'residential','#CCD7A5','industrial','#CBD1B0','commercial','#CED5B0','farmland','#CAD896','grass','#BAD586','cemetery','#A9C592','pitch','#A6C780','#C2D39B']);}
  }else if(layer.type==='line'&&source==='transportation')map.setPaintProperty(layer.id,'line-color',/casing|outline/.test(layer.id)?'#B3C39A':'#F4EED6');
 }catch{}}
}
function features(map:GameMap){const data:AreaFeature[]=[],seen=new Set<string>();for(const layer of ['landcover','landuse','park','water','waterway','building','transportation'])try{for(const f of map.querySourceFeatures('openmaptiles',{sourceLayer:layer})){const key=layer+':'+JSON.stringify(f.geometry);if(seen.has(key))continue;seen.add(key);data.push({layer,properties:f.properties,geometry:f.geometry});}}catch{}return data;}
function hash(x:number,y:number){let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
export const SCENERY_LIMITS={buildings:100,trees:160,shrubs:100,flowers:180,grass:220,reeds:140,windows:1200,doors:100,trim:1400};
type Point={lat:number;lng:number};
export function scenerySpot(p:Point,all:AreaFeature[],fix:Point,radius:number,kind:'tree'|'shrub'|'low'){
 const meters=Math.hypot((p.lat-fix.lat)*111320,(p.lng-fix.lng)*111320*Math.cos(fix.lat*Math.PI/180));
 if(meters<(kind==='tree'?16:kind==='shrub'?10:3)+radius||!natureSpot(p,all))return false;
 const green=all.some(f=>areaBiome(f)&&contains(p,f.geometry)),bank=all.some(f=>(f.layer==='water'||f.layer==='waterway')&&edgeDistance(p,f.geometry)<14);
 return (green||bank)&&!all.some(f=>f.layer==='transportation'&&edgeDistance(p,f.geometry)<6+radius||(f.layer==='water'||f.layer==='waterway'||f.layer==='building')&&(contains(p,f.geometry)||edgeDistance(p,f.geometry)<radius+1));
}
export function buildingFootprints(all:AreaFeature[],local:(lng:number,lat:number)=>THREE.Vector3,origin:THREE.Vector3){
 return all.flatMap(f=>{
  if(f.layer!=='building')return [];
  const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];
  return polygons.map(polygon=>{
   const rings=polygon.map(ring=>{const closed=ring.length>1&&ring[0][0]===ring.at(-1)![0]&&ring[0][1]===ring.at(-1)![1];return (closed?ring.slice(0,-1):ring).map(p=>local(p[0],p[1]));}),pts=rings[0]??[],center=pts.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(pts.length||1);
   return {f,pts,rings,center};
  });
 }).filter(b=>b.pts.length>=3&&b.center.distanceTo(origin)<260).sort((a,b)=>a.center.distanceTo(origin)-b.center.distanceTo(origin)).slice(0,SCENERY_LIMITS.buildings);
}
export function footprintShape(rings:THREE.Vector3[][]){
 const shape=new THREE.Shape((rings[0]??[]).map(p=>new THREE.Vector2(p.x,-p.z)));
 for(const ring of rings.slice(1))if(ring.length>=3)shape.holes.push(new THREE.Path(ring.map(p=>new THREE.Vector2(p.x,-p.z))));
 return shape;
}
function combined(parts:THREE.BufferGeometry[]){const merged=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());return merged;}
function leafCanopy(){
 return combined([[0,1.1,0,1.25,1.55,1.15],[-.9,.3,.1,.95,1.15,1],[.85,.5,.15,1,1.25,.9],[0,.15,-.85,1.15,.95,.85]].map(([x,y,z,sx,sy,sz])=>new THREE.IcosahedronGeometry(1,0).scale(sx,sy,sz).translate(x,y,z)));
}
function pineCanopy(){return combined([[0,1.65,3.9],[2,1.35,3.3],[3.8,.9,2.8]].map(([y,r,h])=>new THREE.ConeGeometry(r,h,7).translate(0,y,0)));}
function flowerHead(){return combined(Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return new THREE.OctahedronGeometry(.32,0).scale(1,.35,1).translate(Math.cos(a)*.25,0,Math.sin(a)*.25);}));}
function reedClump(){return combined(Array.from({length:5},(_,i)=>new THREE.CylinderGeometry(.035,.06,1.8+i*.13,3).translate((i%3-.8)*.35,.9+i*.065,(Math.floor(i/3)-.5)*.45)));}
function windowFrame(){return combined([[0,.59,1.18,.13],[0,-.59,1.18,.13],[-.53,0,.12,1.3],[.53,0,.12,1.3],[0,0,.075,1.2]].map(([x,y,w,h])=>new THREE.BoxGeometry(w,h,.18).translate(x,y,0)));}

export function addMapNature(map:GameMap,scene:THREE.Scene,local:(lng:number,lat:number)=>THREE.Vector3){
 const group=new THREE.Group(),roofGroup=new THREE.Group();group.add(roofGroup);scene.add(group);
 const resources=new Set<{dispose:()=>void}>(),matrix=new THREE.Object3D(),instances:THREE.InstancedMesh[]=[];let signature='',last=-Infinity,dirty=true,removed=false,revision=0;
 const invalidate=()=>{if(!removed){dirty=true;map.triggerRepaint?.();}};
 // Rotation/pitch do not change terrain. Rebuilding roofs/vegetation on every
 // camera move caused periodic main-thread stalls while orbiting the trainer.
 const sourceChanged=(event:{sourceId?:string;sourceDataType?:string})=>{if(event.sourceId==='openmaptiles'&&event.sourceDataType==='content')invalidate();};
 const listen=typeof map.on==='function'&&typeof map.off==='function';
 if(listen)map.on('sourcedata',sourceChanged);
 const material=(color:number)=>{const m=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true});resources.add(m);return m;};
 const instanced=(name:string,geometry:THREE.BufferGeometry,color:number,count:number,shadow=false)=>{
  const m=shadow?new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,depthWrite:false}):material(color),mesh=new THREE.InstancedMesh(geometry,m,count);
  mesh.name=name;mesh.count=0;mesh.frustumCulled=false;resources.add(geometry);resources.add(m);group.add(mesh);instances.push(mesh);return mesh;
 };
 const trunks=instanced('scenery-tree-trunks',new THREE.CylinderGeometry(.25,.5,5,5),0x80613f,SCENERY_LIMITS.trees);
 const branches=instanced('scenery-tree-branches',new THREE.CylinderGeometry(.12,.24,2.8,5).rotateZ(.65).translate(.65,0,0),0x80613f,SCENERY_LIMITS.trees);
 const crowns=[0x66965a,0x80a564,0x4d8059].map((c,i)=>instanced('scenery-broadleaf-'+i,leafCanopy(),c,SCENERY_LIMITS.trees));
 const pines=[0x3b7354,0x56875b].map((c,i)=>instanced('scenery-conifer-'+i,pineCanopy(),c,SCENERY_LIMITS.trees));
 const shrubs=instanced('scenery-shrubs',leafCanopy(),0x759652,SCENERY_LIMITS.shrubs);
 const flowers=[0xefcf6a,0xc195ba,0xf3e9ce].map((c,i)=>instanced('scenery-flowers-'+i,flowerHead(),c,SCENERY_LIMITS.flowers));
 const stems=instanced('scenery-flower-stems',new THREE.CylinderGeometry(.035,.05,.8,3),0x678a4c,SCENERY_LIMITS.flowers);
 const grass=instanced('scenery-grass',combined([new THREE.ConeGeometry(.26,1.1,3).translate(-.22,.55,0),new THREE.ConeGeometry(.2,.8,3).translate(.24,.4,.12)]),0x88a75a,SCENERY_LIMITS.grass);
 const reeds=instanced('scenery-reeds',reedClump(),0x8c9d61,SCENERY_LIMITS.reeds);
 const reedHeads=instanced('scenery-reed-heads',new THREE.CylinderGeometry(.13,.13,.6,5).translate(0,2.1,0),0x8b714b,SCENERY_LIMITS.reeds);
 const shadows=instanced('scenery-contact-shadows',new THREE.CircleGeometry(1,12).rotateX(-Math.PI/2),0x31563a,SCENERY_LIMITS.trees+SCENERY_LIMITS.shrubs,true);
 const frames=instanced('scenery-window-frames',windowFrame(),0xf1dfb7,SCENERY_LIMITS.windows);
 const windows=instanced('scenery-window-glass',new THREE.BoxGeometry(.94,1.06,.1),0x517b74,SCENERY_LIMITS.windows);
 const doors=instanced('scenery-doors',new THREE.BoxGeometry(1.1,1.9,.16),0x94704e,SCENERY_LIMITS.doors);
 const trim=instanced('scenery-roof-trim',new THREE.BoxGeometry(1,.2,.24),0xe3cfaa,SCENERY_LIMITS.trim);
 const ridges=instanced('scenery-roof-ridges',new THREE.BoxGeometry(1,.2,.28),0x996a4e,SCENERY_LIMITS.buildings);
 const wallMaterials=[0xe7d4ad,0xd8c59d,0xf0e3c5,0xc9cfac].map(material),roofMaterials=[0xb97750,0xbe9164,0x89927a,0x9c795f].map(material);
 roofMaterials.forEach(m=>{m.side=THREE.DoubleSide;});
 const shadowMaterial=new THREE.MeshBasicMaterial({color:0x3e543c,transparent:true,opacity:.1,depthWrite:false});resources.add(shadowMaterial);
 function place(mesh:THREE.InstancedMesh,pos:THREE.Vector3,scale:THREE.Vector3,rotation=0){
  if(mesh.count>=mesh.instanceMatrix.count)return;matrix.position.copy(pos);matrix.scale.copy(scale);matrix.rotation.set(0,rotation,0);matrix.updateMatrix();mesh.setMatrixAt(mesh.count++,matrix.matrix);
 }
 function refresh(fix:Fix){
  const now=Date.now();if(removed||now-last<1000)return;last=now;
  const view=map.getCenter?.()??fix,key=[view.lat,view.lng,fix.lat,fix.lng].map(n=>Math.round(n*5000)).join(':');if(!dirty&&key===signature)return;dirty=false;signature=key;
  const all=features(map),greens=all.filter(f=>areaBiome(f)),origin=local(view.lng,view.lat);for(const m of instances)m.count=0;
  const points:{lat:number;lng:number;x:number;y:number;d:number}[]=[],stepLat=14/111320,stepLng=14/(111320*Math.cos(view.lat*Math.PI/180)),cx=Math.round(view.lng/stepLng),cy=Math.round(view.lat/stepLat);
  for(let y=cy-17;y<=cy+17;y++)for(let x=cx-17;x<=cx+17;x++){const random=hash(x,y),p={lng:(x+(random-.5)*.65)*stepLng,lat:(y+(hash(y,x)-.5)*.65)*stepLat},d=Math.hypot((p.lng-view.lng)/stepLng,(p.lat-view.lat)/stepLat);if(d<18)points.push({...p,x,y,d});}points.sort((a,b)=>a.d-b.d);
  for(const p of points){
   const r=hash(p.x,p.y),biome=biomeAt(p,greens),at=local(p.lng,p.lat),forest=greens.some(f=>areaBiome(f)==='forest'&&contains(p,f.geometry)),meadow=greens.some(f=>areaBiome(f)==='meadow'&&contains(p,f.geometry));
   if((forest&&r>.3||meadow&&r>.94)&&trunks.count<SCENERY_LIMITS.trees&&scenerySpot(p,all,fix,5.2,'tree')){
    const s=.8+hash(p.y,p.x)*.4,pine=forest&&r>.74;
    place(trunks,at.clone().add(new THREE.Vector3(0,2.5*s,0)),new THREE.Vector3(s,s,s));
    if(pine)place(pines[Math.floor(r*173)%pines.length],at.clone().add(new THREE.Vector3(0,4.7*s,0)),new THREE.Vector3(2*s,1.3*s,2*s),r*6);
    else{place(branches,at.clone().add(new THREE.Vector3(0,4.2*s,0)),new THREE.Vector3(s,s,s),r*6);place(crowns[Math.floor(r*997)%crowns.length],at.clone().add(new THREE.Vector3(0,5.7*s,0)),new THREE.Vector3(2.2*s,1.85*s,2.2*s),r*6);}
    place(shadows,at.clone().add(new THREE.Vector3(.5,.035,.4)),new THREE.Vector3(pine?3.4*s:4.4*s,1,3.1*s),r*6);
   }else if((forest&&r<.17||meadow&&r>.75)&&shrubs.count<SCENERY_LIMITS.shrubs&&scenerySpot(p,all,fix,2.3,'shrub')){
    const s=.65+r*.5;place(shrubs,at.clone().add(new THREE.Vector3(0,.5,0)),new THREE.Vector3(s,.6*s,s),r*6);place(shadows,at.clone().add(new THREE.Vector3(0,.03,0)),new THREE.Vector3(1.8*s,1,1.4*s));
   }else if(meadow&&r<.65&&scenerySpot(p,all,fix,2.3,'low')){
    for(let i=0;i<3&&stems.count<SCENERY_LIMITS.flowers;i++){
     const offset={lng:p.lng+(i-1)*1.1/111320/Math.cos(view.lat*Math.PI/180),lat:p.lat+(i%2)*.8/111320};if(!scenerySpot(offset,all,fix,.6,'low'))continue;
     const pos=local(offset.lng,offset.lat),s=.7+hash(p.x+i,p.y)*.55;place(grass,pos,new THREE.Vector3(s,s,s),r*6);place(stems,pos.clone().add(new THREE.Vector3(0,.4*s,0)),new THREE.Vector3(s,s,s));place(flowers[Math.floor(hash(p.y+i,p.x)*3)],pos.clone().add(new THREE.Vector3(0,.85*s,0)),new THREE.Vector3(s,s,s),r*6);
    }
   }else if(biome==='wetland'&&all.some(f=>(f.layer==='water'||f.layer==='waterway')&&edgeDistance(p,f.geometry)<14)&&scenerySpot(p,all,fix,1.2,'low')){
    const s=.8+r*.4;place(reeds,at,new THREE.Vector3(s,s,s),r*6);place(reedHeads,at,new THREE.Vector3(s,s,s),r*6);
   }else if(forest&&scenerySpot(p,all,fix,.7,'low'))place(grass,at,new THREE.Vector3(1.4,.7,1.4),r*6);
  }
  for(const child of [...roofGroup.children]){roofGroup.remove(child);(child as THREE.Mesh).geometry.dispose();}
  const buildings=buildingFootprints(all,local,origin),roofBatches:THREE.BufferGeometry[][]=[[],[],[],[]],wallBatches:THREE.BufferGeometry[][]=[[],[],[],[]],shadowBatch:THREE.BufferGeometry[]=[];
  for(const {f,pts,rings,center} of buildings){
   const height=buildingHeight(f.properties)+.1,shape=footprintShape(rings);let geometry:THREE.BufferGeometry;
   if(rings.length===1&&pts.length===4&&pts.every(p=>p.distanceTo(center)<25)){
    const p=pts.map(p=>p.clone().setY(height));if(p[0].distanceTo(p[1])>p[1].distanceTo(p[2]))p.push(p.shift()!);
    const a=p[0].clone().add(p[1]).multiplyScalar(.5),b=p[2].clone().add(p[3]).multiplyScalar(.5),rise=Math.min(3,p[0].distanceTo(p[1])*.25);a.y+=rise;b.y+=rise;
    const triangle=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3)=>[...a.toArray(),...b.toArray(),...c.toArray()];geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([...triangle(p[0],p[3],b),...triangle(p[0],b,a),...triangle(a,b,p[2]),...triangle(a,p[2],p[1]),...triangle(p[0],a,p[1]),...triangle(p[3],p[2],b)],3));geometry.computeVertexNormals();
    const delta=b.clone().sub(a);place(ridges,a.clone().add(b).multiplyScalar(.5),new THREE.Vector3(delta.length(),1,1),Math.atan2(-delta.z,delta.x));
   }else{geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);geometry.translate(0,height+.12,0);}
   const color=Math.floor(Math.abs(center.x*3+center.z*7))%roofMaterials.length;
   if(geometry.index){const original=geometry;geometry=geometry.toNonIndexed();original.dispose();}geometry.deleteAttribute('uv');roofBatches[color].push(geometry);
   const walls=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});walls.rotateX(-Math.PI/2);wallBatches[color].push(walls);
   const shadow=new THREE.ShapeGeometry(shape);shadow.rotateX(-Math.PI/2);shadow.translate(.5,.025,.5);shadowBatch.push(shadow);
   for(const ring of rings)for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],delta=b.clone().sub(a),length=delta.length();if(length<.5)continue;place(trim,a.clone().add(b).multiplyScalar(.5).setY(height),new THREE.Vector3(length,1,1),Math.atan2(-delta.z,delta.x));}
   // Facade details stay small and are capped across the entire visible town.
   if(center.distanceTo(origin)>190)continue;
   const signed=pts.reduce((sum,p,i)=>sum+p.x*pts[(i+1)%pts.length].z-pts[(i+1)%pts.length].x*p.z,0)>=0?1:-1;let door=false;
   for(let i=0;i<pts.length;i++){
    const a=pts[i],b=pts[(i+1)%pts.length],delta=b.clone().sub(a),length=delta.length();if(length<4)continue;
    const tangent=delta.clone().divideScalar(length),outward=new THREE.Vector3(tangent.z*signed,0,-tangent.x*signed),yaw=Math.atan2(-delta.z,delta.x),columns=Math.min(5,Math.floor(length/3.5)),floors=Math.min(3,Math.max(1,Math.floor(height/2.8)));
    if(!door&&length>5){place(doors,a.clone().lerp(b,.5).addScaledVector(outward,.1).setY(.95),new THREE.Vector3(1,1,1),yaw);door=true;}
    for(let floor=0;floor<floors;floor++)for(let col=0;col<columns;col++){
     if(floor===0&&door&&Math.abs((col+1)/(columns+1)-.5)<.13)continue;
     const pos=a.clone().lerp(b,(col+1)/(columns+1)).addScaledVector(outward,.12).setY(1.5+floor*2.8);if(pos.y+.7>height)continue;
     place(frames,pos,new THREE.Vector3(1,1,1),yaw);place(windows,pos.clone().addScaledVector(outward,.045),new THREE.Vector3(1,1,1),yaw);
    }
   }
  }
  for(let i=0;i<4;i++)for(const [batch,materials] of [[wallBatches,wallMaterials],[roofBatches,roofMaterials]] as const){if(!batch[i].length)continue;const geometry=combined(batch[i]);roofGroup.add(new THREE.Mesh(geometry,materials[i]));}
  if(shadowBatch.length)roofGroup.add(new THREE.Mesh(combined(shadowBatch),shadowMaterial));
  for(const mesh of instances)mesh.instanceMatrix.needsUpdate=true;
  Object.assign(map.getCanvas().dataset,{sceneryCenter:JSON.stringify({lat:view.lat,lng:view.lng}),sceneryRevision:String(++revision),sceneryBuildings:String(buildings.length),sceneryTrees:String(trunks.count),sceneryConifers:String(pines.reduce((n,m)=>n+m.count,0)),sceneryShrubs:String(shrubs.count),sceneryFlowers:String(stems.count),sceneryReeds:String(reeds.count),sceneryWindows:String(windows.count)});
 }
 return {update:refresh,dispose(){removed=true;if(listen)map.off('sourcedata',sourceChanged);scene.remove(group);for(const child of roofGroup.children)(child as THREE.Mesh).geometry.dispose();for(const m of instances)m.dispose();resources.forEach(r=>r.dispose());}};
}
