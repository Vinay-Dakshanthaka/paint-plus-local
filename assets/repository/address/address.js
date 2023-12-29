/**
 * @description
 * 
 * Respository for addresses
 * @author dev
 */

import { firestore, doc, getDoc, collection } from "../initialize.js";
const userCollRef = collection(firestore, 'user')

export async function getAddress(addressIdOrRef, userId = null, options) {
    let docRef = null
    if (options?.addressId) {
        docRef = doc(userCollRef, userId, 'addresses', addressIdOrRef)
    }
    else if (options?.addressRef) {
        docRef = addressIdOrRef
    }

    else throw new Error('please provide options {addressId: true} or {addressRef: true}  whether the first argument is addressId or addressRef')

    const addressSanpshot = await getDoc(docRef)
    // console.log(addressSanpshot)
    return addressSanpshot.data()
}