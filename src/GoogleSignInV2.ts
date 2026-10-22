import {Platform,TurboModuleRegistry} from 'react-native';
import {GoogleAuthProvider,linkWithCredential,signInWithCredential,type Auth} from 'firebase/auth';
import {GOOGLE_WEB_CLIENT_ID} from './googleConfigV2';
export const googleSignInAvailable=Platform.OS==='android'&&!!TurboModuleRegistry.get('RNGoogleSignin');
export async function signInGoogle(auth:Auth,link:boolean){
 if(!googleSignInAvailable)throw new Error('Google-inloggen werkt in het geïnstalleerde Android-spel.');
 const {GoogleSignin}=require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
 GoogleSignin.configure({webClientId:GOOGLE_WEB_CLIENT_ID,offlineAccess:false});
 await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog:true});
 const result=await GoogleSignin.signIn();
 if(result.type==='cancelled')throw Object.assign(new Error('Inloggen geannuleerd.'),{code:'auth/popup-closed-by-user'});
 if(!result.data.idToken)throw new Error('Google gaf geen veilige aanmelding terug. Probeer opnieuw.');
 const credential=GoogleAuthProvider.credential(result.data.idToken);
 if(link&&auth.currentUser)return linkWithCredential(auth.currentUser,credential);
 return signInWithCredential(auth,credential);
}
