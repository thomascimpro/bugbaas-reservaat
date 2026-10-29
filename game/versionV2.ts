/** Raise only when older apps can no longer read the server state safely (e.g. new moves or species keys). */
export const MIN_CLIENT_VERSION='0.1.21';
/** True when version a is lower than b; unknown versions are never treated as outdated. */
export function olderVersion(a:string|undefined,b:string|undefined){
 if(!a||!b)return false;const x=a.split('.').map(Number),y=b.split('.').map(Number);if([...x,...y].some(n=>!Number.isFinite(n)))return false;
 for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]??0)-(y[i]??0);if(d)return d<0;}return false;
}
