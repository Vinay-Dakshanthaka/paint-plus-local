import {
     initializeApp 
     } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";

import {
    ref, 
    uploadBytes,
    uploadBytesResumable, 
    getDownloadURL,
    getStorage,
    deleteObject
    } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-storage.js";

import {
    getFirestore,
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
    } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";

import {
    getAuth,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

// const firebaseConfig = {
//     apiKey: "AIzaSyCK3AF6d6OwYAshLu2ZV68v8vjwBHVs0lE",
//     authDomain: "paintplus-app.firebaseapp.com",
//     projectId: "paintplus-app",
//     storageBucket: "paintplus-app.appspot.com",
//     messagingSenderId: "296059905348",
//     appId: "1:296059905348:web:07ea2d69f5f6610e1d2311"
//   };

// Client database setting
const firebaseConfig = {
    apiKey: "AIzaSyA8dXEmGalH7j1uWchxrdhx7xQNTQuu7gE",
    authDomain: "client-webapp-22f57.firebaseapp.com",
    projectId: "client-webapp-22f57",
    storageBucket: "client-webapp-22f57.appspot.com",
    messagingSenderId: "437931792288",
    appId: "1:437931792288:web:934885ad9d7525050f76c5"
};

//global
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

//auth
export {
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword
}

//firstore
export {
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
}

//storage
export {
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
}

/**
 * 
 * Add an event listener to the confirmation logout button
 * @param {string} userId 
 * @returns {userDoc} in the jsonData format  
 * @author mydev 
 */

export function getUserSnapshot(userId){
    const userCollectionDoc = doc(firestore,'users',userId);
    return getDoc(userCollectionDoc);
 }
