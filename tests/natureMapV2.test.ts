import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import type {Map as GameMap} from 'maplibre-gl';
import {addMapNature} from '../src/natureMapV2';
const square=(x:number)=>[[x,0],[x+.0001,0],[x+.0001,.0001],[x,.0001],[x,0]];

test('city scenery renders every building in a MultiPolygon instead of only the first footprint',()=>{
 const dataset:Record<string,string>={},scene=new THREE.Scene(),feature={properties:{render_height:10},geometry:{type:'MultiPolygon',coordinates:[[square(0)],[square(.0005)],[square(.001)]]}};
 const map={querySourceFeatures:(_source:string,options:{sourceLayer:string})=>options.sourceLayer==='building'?[feature]:[],getCanvas:()=>({dataset})} as unknown as GameMap;
 const nature=addMapNature(map,scene,(lng,lat)=>new THREE.Vector3(lng*100000,0,lat*100000));
 try{nature.update({lat:0,lng:0,accuracy:8});assert.equal(dataset.sceneryBuildings,'3');const roofs=scene.children[0].children[0];assert.ok(roofs.children.length>0);const bounds=new THREE.Box3().setFromObject(roofs);assert.ok(bounds.max.x>=109,'last separate footprint is included');}
 finally{nature.dispose();assert.equal(scene.children.length,0);}
});
