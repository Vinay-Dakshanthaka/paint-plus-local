/**
 * @description
 * 
 * Respository for User cart
 * @author dev
 */
//firestore
import {
    firestore,
    collection,
    getCountFromServer,
    getDocs
} from "../initialize.js";

/**
 * 
 * @param {*} loggedIn | to check the user logged in status
 * @param {*} userId | userId if logged in
 * @returns no of items in cart
 * 
 * @author dev
 */
export async function getCartCount(loggedIn, userId = null) {
    if (loggedIn) {
        console.log("if")
        const cartCollectionRef = collection(firestore, 'users', userId, 'cart')
        const countSnapshot = await getCountFromServer(cartCollectionRef)
        console.log(countSnapshot.data().count);
        return countSnapshot.data().count
    }
    else {
        console.log("else")
        const cart = JSON.parse(sessionStorage.getItem('cart'))
        if (cart){
            return cart.length
        }
        else return 0
    }
}

/**
 * 
 * @param {*} loggedIn | to check the user logged in status
 * @param {*} userId | userId if user logged in
 * @returns cart items details
 */
export async function getCartDocsSnapshot(loggedIn,userId =null){
    if(loggedIn){
        const cartCollectionRef = collection(firestore,'users',userId,'cart');
        const cartDocsSnapshot = await getDocs(cartCollectionRef);
        return cartDocsSnapshot;
    }
    else{
      const cart =  JSON.parse(sessionStorage.getItem('cart'));
      return cart;
    }
}

/**
 * to get the all cart docs which havign the field cartId equal to "user cartId"
 * @param {*} cartId 
 * @returns 
 */
export async function getCartDocsQuerySnapshot(cartId){
    const cartCollectionRef = collection(firestore,'users',userId,'cart');
    const cartDocsQuerySnapshot = await getDocs(query(cartCollectionRef,where('cartId','==',cartId)));
    return cartDocsQuerySnapshot;
}