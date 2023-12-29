import {firestore, auth, getCountFromServer, collection, query, where,getDoc,doc, getDocs} from '../initialize.js'

const produtcsColRef = collection(firestore, 'products')

/**
 * product collection ref
 * @returns my
 */
export function getProductCollectionRef(){
    return produtcsColRef;
}

/***
 * getting the product docs snapshot
 * @author mydev
 */
export async function getProductDocsSnapshot(){
    const productDocsSnapshot = await getDocs(produtcsColRef);
    return productDocsSnapshot;
}


export async function getProductDocsQuerySnapshot(productId){
    const productDocsQuerySnapshot = await getDocs(produtcsColRef,where('productId','==',productId))
    if(!productDocsQuerySnapshot.empty){
        return productDocsQuerySnapshot; 
    }
    return "No product data for this prodcut"
}

/**
 * 
 * @param {*} categoryId 
 * @returns category count
 * 
 * @author dev
 */
export async function getCategoryCount(categoryId){
    const q = query(produtcsColRef, where('categoryId', '==', categoryId))
    const count = await getCountFromServer(q)
    return count.data().count
}

/**
 * 
 * @param {*} productId 
 * @returns 
 * Product Detials - {imageUrl, name, category, productDetails, manufacturerName}
 */
export async function getProductDetails(productId){
    const productSnapshot = await getDoc(doc(produtcsColRef, productId))
    if (productSnapshot.exists()){
        return productSnapshot.data()
    }
    return false
}

/**
 * 
 * @param {string} productId 
 * @returns {number} price
 * 
 * @author dev
 */
export async function getProductPrice(productId){
    const productDetails = await getProductDetails(productId)
    return parseFloat(productDetails.price)
}

