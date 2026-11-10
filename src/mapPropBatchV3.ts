import * as THREE from 'three';
import {borrowBugModel} from './bugModelV2';

/** Static scenery shares source materials and uses one instanced draw per model mesh. */
/** Only the state part of a prop takes the instance tint (post medallion), so rock, pole and leaves keep their colours. */
const tintable=(mesh:THREE.InstancedMesh)=>/PostDisc|TeamColor|EggShell/.test((Array.isArray(mesh.material)?mesh.material[0]:mesh.material)?.name??'');
export function mapPropBatch(scene:THREE.Object3D,name:string,height:number,capacity:number,changed:()=>void){
 const lease=borrowBugModel(name),meshes:THREE.InstancedMesh[]=[],matrix=new THREE.Object3D();let removed=false,count=0,ready=false;
 void lease.promise.then(model=>{if(removed)return;model.root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model.root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),s=height/(size.y||1),normal=new THREE.Matrix4().makeScale(s,s,s).multiply(new THREE.Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
  model.root.traverse(o=>{if(!(o instanceof THREE.Mesh)||o instanceof THREE.SkinnedMesh)return;const geometry=o.geometry.clone().applyMatrix4(normal.clone().multiply(o.matrixWorld)),mesh=new THREE.InstancedMesh(geometry,o.material,capacity);mesh.name='prop-'+name;mesh.count=0;mesh.frustumCulled=false;scene.add(mesh);meshes.push(mesh);});ready=meshes.length>0;changed();
 }).catch(()=>{});
 return {get ready(){return ready;},get count(){return count;},reset(){count=0;for(const mesh of meshes)mesh.count=0;},place(at:THREE.Vector3,scale=1,yaw=0,tint?:THREE.Color){if(!ready)return false;if(count>=capacity)return true;matrix.position.copy(at);matrix.rotation.set(0,yaw,0);matrix.scale.setScalar(scale);matrix.updateMatrix();for(const mesh of meshes){mesh.setMatrixAt(count,matrix.matrix);if(tint&&tintable(mesh))mesh.setColorAt(count,tint);mesh.count=count+1;}count++;return true;},commit(){for(const mesh of meshes){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}},dispose(){removed=true;for(const mesh of meshes){scene.remove(mesh);mesh.geometry.dispose();mesh.dispose();}meshes.length=0;lease.release();}};
}
