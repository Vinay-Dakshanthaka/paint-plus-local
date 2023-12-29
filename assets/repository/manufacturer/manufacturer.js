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
 * manufacturer collection ref
 * @returns mydev
 */
export function getManufacturerCollectionRef(){
    const manufacturerCollectionRef = collection(firestore,'manufacturers');
    return manufacturerCollectionRef;
}

/**
 * manufacturer storage reff to upload images
 * @param {*} manufacturerImageFile 
 * @param {*} folderPath 
 * folderpath -- means custom folder path give by user it will with same folder path in the storage 
 * @returns get downloaded url of the image
 */
export async function getManufacturerStorageImageURL(manufacturerImageFile,folderPath){
    const storageRef = ref(storage,folderPath);
    await uploadBytes(storageRef,manufacturerImageFile)
    return getDownloadURL(storageRef);
}

/**
 * manufacturer Docs Sanpshot
 * @returns mydev
 */
export async function getManufacturerDocsSnapshot(){
    const manufacturerCollectionRef = getManufacturerCollectionRef();
    return await getDocs(manufacturerCollectionRef);
}

/**
 * getting manufacturer Docs through manufacturerId field
 * @param {*} manufacturerId
 */
export async function getManufacturerQuerySnapshot(manufacturerId){
   const manufacturerCollectionRef = getManufacturerCollectionRef();
   return await getDocs(query(manufacturerCollectionRef,where('manufacturerId', '==', manufacturerId)))
}

/**
 * Extracts the file name from the image URL
 * @param {string} imageUrl 
 * @returns {string} File name
 */
export function getStorageImageFolderPathFileName(imageUrl) {
    const url = new URL(imageUrl);
    return decodeURIComponent(url.pathname).replace(/^.*[\\\/]/, '');
}

