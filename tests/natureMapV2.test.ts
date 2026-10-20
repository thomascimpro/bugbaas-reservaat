import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import type {Map as GameMap} from 'maplibre-gl';
import {addMapNature,buildingFootprints,footprintShape,scenerySpot,SCENERY_LIMITS} from '../src/natureMapV2';
import type {AreaFeature} from '../game/habitatsV2';
const square=(x:number)=>[[x,0],[x+.0001,0],[x+.0001,.0001],[x,.0001],[x,0]];

test('city scenery renders every building in a MultiPolygon instead of only the first footprint',()=>{
 const dataset:Record<string,string>={},scene=new THREE.Scene(),feature={properties:{render_height:10},geometry:{type:'MultiPolygon',coordinates:[[square(0)],[square(.0005)],[square(.001)]]}};
 const map={querySourceFeatures:(_source:string,options:{sourceLayer:string})=>options.sourceLayer==='building'?[feature]:[],getCanvas:()=>({dataset})} as unknown as GameMap;
 const nature=addMapNature(map,scene,(lng,lat)=>new THREE.Vector3(lng*100000,0,lat*100000));
 try{nature.update({lat:0,lng:0,accuracy:8});assert.equal(dataset.sceneryBuildings,'3');const roofs=scene.children[0].children[0];assert.ok(roofs.children.length>0);const bounds=new THREE.Box3().setFromObject(roofs);assert.ok(bounds.max.x>=109,'last separate footprint is included');}
 finally{nature.dispose();assert.equal(scene.children.length,0);}
});

const coord=(meters:number)=>meters/111320;
const rectangle=(x:number,y:number,w:number,h:number)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]].map(p=>p.map(coord));
const local=(lng:number,lat:number)=>new THREE.Vector3(lng*111320,0,lat*111320);
const feature=(layer:string,ring:number[][],properties:Record<string,unknown>={}):AreaFeature=>({layer,properties,geometry:{type:'Polygon',coordinates:[ring]}});
function scenery(all:AreaFeature[]){const dataset:Record<string,string>={},scene=new THREE.Scene(),map={querySourceFeatures:(_source:string,o:{sourceLayer:string})=>all.filter(f=>f.layer===o.sourceLayer),getCanvas:()=>({dataset})} as unknown as GameMap,nature=addMapNature(map,scene,local);nature.update({lat:0,lng:0,accuracy:8});return {dataset,scene,nature};}

test('building roof and wall geometry preserve courtyard holes and all separate footprints',()=>{
 const outer=rectangle(-20,-20,40,40),hole=rectangle(-10,-10,20,20),building:AreaFeature={layer:'building',properties:{render_height:10},geometry:{type:'Polygon',coordinates:[outer,hole]}};
 const footprints=buildingFootprints([building],local,new THREE.Vector3());assert.equal(footprints.length,1);assert.equal(footprints[0].rings.length,2);
 const shape=footprintShape(footprints[0].rings),geometry=new THREE.ShapeGeometry(shape),positions=geometry.getAttribute('position'),index=geometry.getIndex()!;let area=0;
 for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);area+=Math.abs((positions.getX(b)-positions.getX(a))*(positions.getY(c)-positions.getY(a))-(positions.getX(c)-positions.getX(a))*(positions.getY(b)-positions.getY(a)))/2;}
 assert.ok(Math.abs(area-1200)<.01);geometry.dispose();
 const {scene,nature,dataset}=scenery([building]);try{const roofGroup=scene.children[0].children[0],ray=new THREE.Raycaster(new THREE.Vector3(0,30,0),new THREE.Vector3(0,-1,0));assert.equal(ray.intersectObject(roofGroup,true).length,0,'courtyard remains open through the roof and walls');ray.ray.origin.x=15;assert.ok(ray.intersectObject(roofGroup,true).length>0);assert.ok(Number(dataset.sceneryWindows)>0);}finally{nature.dispose();}
});

test('scenery placement requires mapped nature and clears roads, water, buildings and trainer at the size of the plant',()=>{
 const fix={lat:0,lng:0},point=(x:number,y=0)=>({lng:coord(x),lat:coord(y)}),wood=feature('landcover',rectangle(-300,-300,600,600),{class:'wood'}),road:AreaFeature={layer:'transportation',properties:{class:'minor'},geometry:{type:'LineString',coordinates:[[coord(60),coord(-200)],[coord(60),coord(200)]]}},water=feature('water',rectangle(100,-50,40,100)),building=feature('building',rectangle(-100,-50,30,100));
 const all=[wood,road,water,building];
 assert.equal(scenerySpot(point(10),all,fix,5.2,'tree'),false);assert.ok(scenerySpot(point(30),all,fix,5.2,'tree'),'trees may grow inside the 65 meter catch radius');
 assert.equal(scenerySpot(point(52),all,fix,5.2,'tree'),false);assert.equal(scenerySpot(point(96),all,fix,5.2,'tree'),false);assert.equal(scenerySpot(point(110),all,fix,.5,'low'),false);assert.equal(scenerySpot(point(-68),all,fix,5.2,'tree'),false);
 assert.equal(scenerySpot(point(200),[],fix,.5,'low'),false);assert.ok(scenerySpot(point(146),[water],fix,1.2,'low'),'reeds can grow beside mapped water');assert.equal(scenerySpot(point(170),[water],fix,1.2,'low'),false);
});

test('woodland uses both tree silhouettes with capped instances and keeps tall growth off mapped obstacles',()=>{
 const wood=feature('landcover',rectangle(-300,-300,600,600),{class:'wood'}),road:AreaFeature={layer:'transportation',properties:{class:'path'},geometry:{type:'LineString',coordinates:[[coord(60),coord(-300)],[coord(60),coord(300)]]}},all=[wood,road],{scene,nature,dataset}=scenery(all);
 try{assert.ok(Number(dataset.sceneryTrees)>40);assert.ok(Number(dataset.sceneryTrees)<=SCENERY_LIMITS.trees);assert.ok(Number(dataset.sceneryConifers)>0);assert.ok(Number(dataset.sceneryConifers)<Number(dataset.sceneryTrees));assert.ok(Number(dataset.sceneryShrubs)>0);const trunks=scene.getObjectByName('scenery-tree-trunks') as THREE.InstancedMesh,matrix=new THREE.Matrix4(),pos=new THREE.Vector3();for(let i=0;i<trunks.count;i++){trunks.getMatrixAt(i,matrix);pos.setFromMatrixPosition(matrix);assert.ok(scenerySpot({lng:coord(pos.x),lat:coord(pos.z)},all,{lat:0,lng:0},5.19,'tree'));}assert.ok(scene.getObjectByName('scenery-contact-shadows'));}finally{nature.dispose();assert.equal(scene.children.length,0);}
});

test('meadow flowers and every building group remain bounded for mobile rendering',()=>{
 const meadow=feature('landcover',rectangle(-300,-300,600,600),{class:'grass'}),{scene,nature,dataset}=scenery([meadow]);try{assert.ok(Number(dataset.sceneryFlowers)>0);assert.ok(Number(dataset.sceneryFlowers)<=SCENERY_LIMITS.flowers);assert.ok(Number(dataset.sceneryShrubs)<=SCENERY_LIMITS.shrubs);assert.ok(scene.children[0].children.filter(o=>o instanceof THREE.InstancedMesh).length<30);}finally{nature.dispose();}
 const buildings:AreaFeature={layer:'building',properties:{},geometry:{type:'MultiPolygon',coordinates:Array.from({length:121},(_,i)=>[rectangle(i%11*15,Math.floor(i/11)*15,4,4)])}};
 assert.equal(buildingFootprints([buildings],local,new THREE.Vector3()).length,SCENERY_LIMITS.buildings);
});
