import { getFirestore } from 'firebase/firestore';
import { app } from './config'; 

const firestore = getFirestore(app);

export { firestore };