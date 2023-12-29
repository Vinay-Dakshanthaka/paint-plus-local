/**
 * firestore 
 */
import {
    firestore,
    collection,
    query,
    where,
    getDocs,
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
   
} from "../initialize.js";

/**
 * get category collection Ref
 * @returns collecRef
 * 
 * @author mani (write your name | dev is my name short form)
 */
export function getCategoryCollectionRef(){
    return collection(firestore,'categories');
}

/**
 * category storage ref to upload images
 * @param {*} categoryImageFile 
 * @param {*} folderPath 
 * folderpath -- means custom folder path give by user it will with same folder path in the storage 
 * @returns get downloaded url of the image
 */
export async function getCategoryStorageImageURL(categoryImageFile,folderPath){
    const storageRef = ref(storage,folderPath);
    await uploadBytes(storageRef,categoryImageFile)
    return getDownloadURL(storageRef);
}

/**
 * category Docs Sanpshot
 * @returns mydev
 */
export async function getCategoryDocsSnapshot(){
    const categoryCollectionRef = getCategoryCollectionRef();
    return await getDocs(categoryCollectionRef);
}

/**
 * getting manufacturer Docs through manufacturerId field
 * @param {*} categoryId
 */
export async function getCategoryQuerySnapshot(categoryId){
   const categoryCollectionRef = getCategoryCollectionRef();
   return await getDocs(query(categoryCollectionRef,where('categoryId', '==', categoryId)))
}