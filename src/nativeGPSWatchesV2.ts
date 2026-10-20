type Subscription={remove:()=>void};

// Register before awaiting Expo so cancellation also covers a pending watch.
export function createNativeGPSWatches(){
 const requests=new Map<number,{subscription?:Subscription}>();
 const clear=(id:number)=>{const request=requests.get(id);requests.delete(id);request?.subscription?.remove();};
 return {
  clear,
  stop:()=>{for(const id of requests.keys())clear(id);},
  begin:(id:number)=>{
   clear(id);const request:{subscription?:Subscription}={};requests.set(id,request);
   const current=()=>requests.get(id)===request;
   return {current,attach:(subscription:Subscription)=>{if(current())request.subscription=subscription;else subscription.remove();}};
  }
 };
}
