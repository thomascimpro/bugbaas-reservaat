import { apiHandler } from '../server/http';
import { FirestoreStore, cloudIdentity } from '../server/firestore';
import { GameService } from '../server/service';

export const config = { maxDuration: 30 };
export default apiHandler(new GameService(new FirestoreStore(), 'cloud', 20 * 60000), cloudIdentity);
