import {apiHandler} from './http';
import {FirestoreStore,cloudIdentity} from './firestore';
import {GameService} from './service';
export default apiHandler(new GameService(new FirestoreStore(),'cloud',20*60000),cloudIdentity);
