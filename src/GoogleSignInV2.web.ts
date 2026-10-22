import {GoogleAuthProvider,linkWithPopup,signInWithPopup,type Auth} from 'firebase/auth';
export const googleSignInAvailable=true;
export async function signInGoogle(auth:Auth,link:boolean){
 const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
 if(link&&auth.currentUser)return linkWithPopup(auth.currentUser,provider);
 return signInWithPopup(auth,provider);
}
