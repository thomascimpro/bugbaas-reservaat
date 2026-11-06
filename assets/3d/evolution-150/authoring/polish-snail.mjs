import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {resample,dedup,prune,quantize} from '@gltf-transform/functions';
import * as THREE from 'three';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),doc=await io.read('assets/3d/evolution-150/sources/OriginalBoneSnail.glb'),buffer=doc.getRoot().listBuffers()[0];
for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){const position=p.getAttribute('POSITION'),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(position.getArray(),3));if(p.getIndices())geometry.setIndex(Array.from(p.getIndices().getArray()));geometry.computeVertexNormals();p.setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(geometry.getAttribute('normal').array).setBuffer(buffer));geometry.dispose();}
for(const m of doc.getRoot().listMaterials())m.setRoughnessFactor(.42).setMetallicFactor(m.getName()==='mat1'?.12:.2);
await doc.transform(resample(),dedup(),prune(),quantize({quantizePosition:14,quantizeNormal:10}));await io.write('public/models/SnailStage3Polished.glb',doc);console.log('Bone snail: complete authored body and five real clips.');
