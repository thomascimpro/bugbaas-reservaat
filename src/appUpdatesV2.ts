export const APP_RELEASES_URL='https://github.com/thomascimpro/bugbaas-reservaat/releases/latest';
const API='https://api.github.com/repos/thomascimpro/bugbaas-reservaat/releases/latest';
export const releaseVersion=(raw:unknown)=>typeof raw==='string'&&/^v?\d+\.\d+\.\d+$/.test(raw)?raw.replace(/^v/,''):null;
export type AppReleaseV2={version:string};
/** Only public stable releases; the download link always stays on our own release page. */
export function publishedReleaseV2(raw:unknown):AppReleaseV2|null{
 if(!raw||typeof raw!=='object')return null;const r=raw as {tag_name?:unknown;draft?:unknown;prerelease?:unknown},version=releaseVersion(r.tag_name);
 return version&&r.draft===false&&r.prerelease===false?{version}:null;
}
/** Independent of the APK's old backend URL. Network/rate-limit failures never block play. */
export async function fetchAppReleaseV2(fetcher:typeof fetch=fetch,timeoutMs=5000):Promise<AppReleaseV2|null>{
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([
  fetcher(API,{signal:controller.signal,headers:{Accept:'application/vnd.github+json'}}).then(async r=>r.ok?publishedReleaseV2(await r.json()):null),
  new Promise<null>(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(null);},timeoutMs);}),
 ]);}catch{return null;}finally{clearTimeout(timer);}
}
