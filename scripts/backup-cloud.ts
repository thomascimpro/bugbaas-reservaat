import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {cert,initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {SqliteStore} from '../server/sqlite';
import {decodeFirestorePayload} from '../server/firestoreCodec';

const PROJECT='bugbaas-reservaat-261012';
type Snapshot={format:'bugbaas-data-v1';project:string;at:string;authMetadataOnly:true;accounts:unknown[];documents:{path:string;data:{payload:unknown}}[]};
const hash=(value:Buffer)=>createHash('sha256').update(value).digest('hex');
const option=(name:string)=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;};
async function main(){
 const verify=option('--verify'),restore=option('--restore-local');
 if(verify){
  const bytes=await readFile(resolve(verify)),expected=(await readFile(resolve(verify)+'.sha256','utf8')).trim().split(/\s/)[0];
  if(hash(bytes)!==expected)throw Error('Backup checksum mismatch.');const snapshot=JSON.parse(bytes.toString('utf8')) as Snapshot;
  if(snapshot.format!=='bugbaas-data-v1'||snapshot.project!==PROJECT||!Array.isArray(snapshot.documents))throw Error('Not a backup of the new BugBaas project.');
  const keys=snapshot.documents.map(d=>{if(!/^(v2[A-Za-z]+|gameRecords)\/[^/]+$/.test(d.path)||!Object.hasOwn(d.data,'payload'))throw Error('Invalid game record.');const [collection,id]=d.path.split('/');return collection==='gameRecords'?decodeURIComponent(id):collection+':'+decodeURIComponent(id);});
  if(new Set(keys).size!==keys.length)throw Error('Duplicate game records.');
  if(restore){
   const target=resolve(restore);try{await access(target);throw Error('Restore target must be a new, empty offline database.');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
   const store=new SqliteStore(target);try{await store.run(keys,docs=>snapshot.documents.forEach((d,i)=>docs.set(keys[i],decodeFirestorePayload(d.data.payload))));await store.run(keys,docs=>{snapshot.documents.forEach((d,i)=>{if(JSON.stringify(docs.get(keys[i]))!==JSON.stringify(decodeFirestorePayload(d.data.payload)))throw Error('Offline restoration differs from the backup.');});});}finally{store.close();}
  }
  console.log(JSON.stringify({verified:true,documents:keys.length,offlineRestore:!!restore,liveWrites:false,authPasswordsIncluded:false}));return;
 }
 const credentials=option('--credentials');if(!credentials)throw Error('Pass --credentials with a private server credential file.');const service=JSON.parse(await readFile(resolve(credentials),'utf8'));if(service.project_id!==PROJECT)throw Error('Only the new BugBaas project may be backed up.');
 const folder=resolve(option('--output')??join(homedir(),'.codex','private','bugbaas-reservaat','backups'));
 const repo=resolve(__dirname,'..');if(folder===repo||folder.startsWith(repo+'\\')||folder.startsWith(repo+'/'))throw Error('Backups must stay outside the source repository.');
 const app=initializeApp({projectId:PROJECT,credential:cert(service)}),db=getFirestore(app),collections=(await db.listCollections()).filter(c=>/^(v2[A-Za-z]+|gameRecords)$/.test(c.id));
 const documents=await db.runTransaction(async tx=>{const result:Snapshot['documents']=[];for(const collection of collections){const snapshot=await tx.get(collection.limit(10001));if(snapshot.size>10000||result.length+snapshot.size>10000)throw Error('Backup exceeds the 10000-record safety limit.');for(const doc of snapshot.docs)result.push({path:doc.ref.path,data:doc.data() as {payload:unknown}});}return result;},{readOnly:true});
 const accounts:unknown[]=[];let cursor:string|undefined;do{const page=await getAuth(app).listUsers(1000,cursor);for(const user of page.users)accounts.push({uid:user.uid,email:user.email??null,emailVerified:user.emailVerified,disabled:user.disabled,providers:user.providerData.map(p=>p.providerId)});cursor=page.pageToken;}while(cursor);
 const snapshot:Snapshot={format:'bugbaas-data-v1',project:PROJECT,at:new Date().toISOString(),authMetadataOnly:true,accounts,documents};await mkdir(folder,{recursive:true});const file=join(folder,'bugbaas-'+snapshot.at.replace(/[:.]/g,'-')+'.json'),bytes=Buffer.from(JSON.stringify(snapshot));await writeFile(file,bytes,{flag:'wx',mode:0o600});await writeFile(file+'.sha256',hash(bytes)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({backup:file,documents:documents.length,accounts:accounts.length,sha256:hash(bytes),liveWrites:false,authPasswordsIncluded:false}));
}
void main().catch(e=>{console.error(e instanceof Error?e.message:'Backup failed.');process.exitCode=1;});
