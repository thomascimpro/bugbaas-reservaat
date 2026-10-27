import {gymMarkerPosition} from '../src/worldMarkerLayoutV2';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {borrowBugModel,instanceBug} from '../src/bugModelV2';

test('map and catch share one decoded model, and eviction preserves active leases',async()=>{
 const original=GLTFLoader.prototype.loadAsync,loads:string[]=[],disposed:string[]=[];
 GLTFLoader.prototype.loadAsync=async function(url){loads.push(url);const scene=new THREE.Group(),geometry=new THREE.BoxGeometry();geometry.addEventListener('dispose',()=>disposed.push(url));scene.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial()));return {scene,animations:[]} as never;};
 try{
  const map=borrowBugModel('qa-shared'),catchStage=borrowBugModel('qa-shared');assert.equal(map.promise,catchStage.promise);assert.equal(await map.promise,await catchStage.promise);assert.equal(loads.filter(url=>url.endsWith('/qa-shared.glb')).length,1);
  map.release();for(let i=0;i<5;i++){const other=borrowBugModel('qa-idle-'+i);await other.promise;other.release();}
  assert.ok(disposed.length>=2);assert.ok(!disposed.some(url=>url.endsWith('/qa-shared.glb')));
  catchStage.release();catchStage.release();for(let i=5;i<9;i++){const other=borrowBugModel('qa-idle-'+i);await other.promise;other.release();}
  assert.ok(disposed.some(url=>url.endsWith('/qa-shared.glb')));
 }finally{GLTFLoader.prototype.loadAsync=original;}
});

test('distinct evolution meshes retain their normal materials and apply a body shiny without legacy gold trim',()=>{
 const root=new THREE.Group(),source=new THREE.MeshStandardMaterial({color:'#AA7733'});root.add(new THREE.Mesh(new THREE.BoxGeometry(2,1,1),source));const model={root,clips:[]};
 const normal=instanceBug(model,3,'beetle'),elite=instanceBug(model,3,'beetle_elite'),shiny=instanceBug(model,3,'beetle_elite',true),inner=(g:THREE.Group)=>(g.children[0] as THREE.Group),material=(g:THREE.Group)=>(inner(g).children[0] as THREE.Mesh).material as THREE.Material;
 assert.equal(material(normal.group),source);assert.equal(material(elite.group),source);assert.equal(inner(elite.group).scale.x,inner(normal.group).scale.x);assert.equal(source.userData.elite,undefined);
 const shader={uniforms:{},fragmentShader:'#include <map_fragment>\n#include <opaque_fragment>'};material(shiny.group).onBeforeCompile(shader as never,{} as never);assert.doesNotMatch(shader.fragmentShader,/bbEliteRim/);assert.match(shader.fragmentShader,/bbShadow/);assert.equal(material(shiny.group).userData.bugVariant,'shiny');assert.equal(material(shiny.group).userData.elite,undefined);
});

test('new stage meshes skip legacy gold trim and shiny applies after authored vertex colors',()=>{
 const root=new THREE.Group(),source=new THREE.MeshStandardMaterial({color:'#FFFFFF',vertexColors:true});root.add(new THREE.Mesh(new THREE.BoxGeometry(2,1,1),source));const model={root,clips:[]},normal=instanceBug(model,3,'mantis_elite'),shiny=instanceBug(model,3,'mantis_elite',true),material=(g:THREE.Group)=>((g.children[0] as THREE.Group).children[0] as THREE.Mesh).material as THREE.Material;
 assert.equal(material(normal.group),source);assert.equal(material(normal.group).userData.elite,undefined);assert.equal(material(shiny.group).userData.elite,undefined);const shader={uniforms:{},fragmentShader:'#include <map_fragment>\n#include <color_fragment>\n#include <opaque_fragment>'};material(shiny.group).onBeforeCompile(shader as never,{} as never);assert.ok(shader.fragmentShader.indexOf('vec3 bbSource')>shader.fragmentShader.indexOf('#include <color_fragment>'));assert.doesNotMatch(shader.fragmentShader,/bbEliteRim/);assert.equal(source.userData.bugVariant,undefined);
});


test('gym badges leave the original bug hit area clickable and stay inside a small map',()=>{
 const origin={x:160,y:420};assert.equal(gymMarkerPosition(origin,[],320,640),origin);
 const moved=gymMarkerPosition(origin,[origin],320,640);assert.notDeepEqual(moved,origin);assert.ok(moved.x+39<origin.x-35||moved.x-39>origin.x+35||moved.y+6<origin.y-60||moved.y-99>origin.y+13);assert.ok(moved.x>=43&&moved.x<=277&&moved.y>=175&&moved.y<=515);assert.deepEqual(origin,{x:160,y:420});
 const edge=gymMarkerPosition({x:300,y:420},[{x:300,y:420}],320,640);assert.equal(edge.x,212);
});
