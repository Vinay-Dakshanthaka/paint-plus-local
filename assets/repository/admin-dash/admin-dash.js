/**
 * firestore 
 */
import {
    firestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    addDoc,
    deleteDoc,
    or,
    and,
    limit,
    startAfter,
    endAt,
    orderBy,
    getCountFromServer,
    deleteField,
    arrayUnion
    } from "../initialize.js";

/**
 *
 *  storage
 */ 
import {
   storage,
   ref, 
   uploadBytes,
   uploadBytesResumable, 
   getDownloadURL,
   deleteObject
   } from "../initialize.js";

/**
 * auth 
 */ 
import {
   auth,
   signOut,
   onAuthStateChanged,
   updatePassword,
   EmailAuthProvider,
   reauthenticateWithCredential,
   signInWithEmailAndPassword,
   sendPasswordResetEmail,
   createUserWithEmailAndPassword
} from "../initialize.js";

/**
 * 
 * @returns {any} get users Docs
 * @author mydev
 */
export async function getUsersDocsSnapshot(){
    const usersCollectionRef = collection(firestore,'users');
    return await getDocs(usersCollectionRef);  
}

/**
 * 
 * @returns {any} get video snapshot
 * @author mydev
 */
export async function getVideoSnapshot() {
    const videosCollectionRef = collection(firestore, 'videos');
    return await getDocs(videosCollectionRef);
}  