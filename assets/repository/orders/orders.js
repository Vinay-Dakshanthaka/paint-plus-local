/**
 * @description
 * 
 * Respository for Orders
 * @author dev
 */

//firestore
import {
    firestore,
    collection,
    getCountFromServer,
    getDoc,
    doc
} from "../initialize.js";

/**
 * 
 * @param {*} orderId 
 * @param {*} userId 
 * 
 * @returns 
 * Json {
 *  addressRef, 
 *  bill = {subtotal, delivery, total}, 
 *  mop, 
 *  orderData, 
 *  orderId, 
 *  orderTime, 
 *  productsDetails, 
 *  status
 * }
 */
export async function getOrderDetails(orderId, userId){
    console.log(orderId)
    const orderRef = doc(firestore, 'users', userId, 'orders', orderId)
    const orderSnapshot = await getDoc(orderRef)
    return orderSnapshot.data()
}
