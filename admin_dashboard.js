/**
 * import firestore
 * @returns mydev
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
    getUserSnapshot
} from './assets/repository/initialize.js'

/**
 * import storage services or functions
 * @returns mydev
 */
import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL
} from './assets/repository/initialize.js'

/**
 * import auth services
 * @returns mydev
 */
import {
    auth,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from './assets/repository/initialize.js'


import { getUsersDocsSnapshot } from './assets/repository/admin-dash/admin-dash.js';

var userData = null;
var loggedIn = false;

/**
 * @param {auth}
 * @author mydev
 */
onAuthStateChanged(auth, async (user) => {
    if(user) {
        loggedIn = true
        onLoggedIn();
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })
        const userDocSnapshot =await getUserSnapshot(user.uid);
            if (!userDocSnapshot.empty) {
                userData = userDocSnapshot.data();
                roleAccess(userData.role);
                updateProfileName(userData.role,userData.firstName);
                updateProfilePicture(userData.role,userData.profilePicture)
            }
    } 
    else {
        onLoggedOut();
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
        window.location.href = "login.html";
    }
    await postPageLoadFunctions();
});

/**
 * to role based dashboard
 * @param {user role} role 
 */
function roleAccess(role) {
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
        ["AGENT", "agentAppbar"],
    ]);

    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
}

/**
 * @param {user role} role 
 * @param {user firstName} firstName 
 * @returns DOM Element
 * @author mydev
 */
function updateProfileName(role, firstName) {
    console.log(firstName)
    let profileNameElement;
    switch (role) {
        case 'CUSTOMER':
            profileNameElement = document.getElementById('customerAppbar').querySelector('.profile-name');
            break;
        // case 'AGENT':
        //     profileNameElement = document.getElementById('agentAppbar').querySelector('.profile-name');
        //     break;
        case 'ADMIN':
            profileNameElement = document.getElementById('adminAppbar').querySelector('.profile-name');
            break;
        default:
            console.error('Unknown role:', role);
            return;
    }
    profileNameElement.textContent = firstName;
}

/**
 * @param {user role} role 
 * @param {user imageUrl} profilePicture 
 * @returns DOM Element
 * @author mydev
 */
function updateProfilePicture(role, profilePicture) {
    let profilePictureElement;
    const defaultProfilePicture = 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp';

    switch (role) {
        case 'CUSTOMER':
            profilePictureElement = document.getElementById('customerAppbar').querySelector('#profile-picture');
            break;
        // case 'AGENT':
        //     profilePictureElement = document.getElementById('agentAppbar').querySelector('#profile-picture');
        //     break;
        case 'ADMIN':
            profilePictureElement = document.getElementById('adminAppbar').querySelector('#profile-picture');
            break;
        default:
            console.error('Unknown role:', role)
            return;
    }

    if (profilePicture && profilePicture.trim() !== '') {
        profilePictureElement.src = profilePicture;
    } 
    else {
        profilePictureElement.src = defaultProfilePicture;
    }
}

/**
 * navbar items after login
 * @author mydev
 */
function onLoggedIn() {
    var navItemList = document.querySelectorAll(".loggedIn");
    navItemList.forEach((navItem) => {
        navItem.style.display = "block";
    });

    navItemList = document.querySelectorAll(".loggedOut");
    navItemList.forEach((navItem) => {
        navItem.style.display = "none";
    });
}

/**
 * navbar itmes before login
 * @author mydev
 */
function onLoggedOut() {
    var navItemList = document.querySelectorAll(".loggedOut");
    navItemList.forEach((navItem) => {
        navItem.style.display = "block";
    });

    navItemList = document.querySelectorAll(".loggedIn");
    navItemList.forEach((navItem) => {
        navItem.style.display = "none";
    });
}

/**
 * 
 * logout event Listenser
 * @returns mydev
 */
document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

 
/**
 * @returns display user data in the table    
 * @author mydev
 */
async function fetchAndDisplayUserData() {
    const usersDataSnapshot = await getUsersDocsSnapshot();
    const userRole = userData.role
    const userDetails = document.getElementById('userDetailsData');
    userDetails.innerHTML = ' ';

    if (userRole === 'ADMIN') {
        usersDataSnapshot.forEach((doc) => {
            const userData = doc.data();
            const userRow = document.createElement('tr');
            userRow.innerHTML = `
                <td>${userData.firstName || ''}</td>
                <td>${userData.lastName || ''}</td>
                <td>${userData.email || ''}</td>
                <td>${userData.phoneNumber || ''}</td>
                <td>${userData.role || ''}</td>
                <td>
                    <a class="btn btn-primary" type="button"
                            href="orderlist.html?userId=${doc.id}">
                        View Orders
                    </a>
                </td>
                `;
            userDetails.appendChild(userRow);
        });
    }
}

//update cart function cart(dependency)
/**
 * 
 * @returns promise
 * 
 * requires: 
 * getCart()
 */
function updateCart() {
    return new Promise(async (resolve) => {
        console.log("from update cart")
        const shownCart = document.querySelector('#shown-cart')

        let cart = await getCart()
        console.log(cart.length)

        if (cart.length) {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = cart.length)
        }
        else {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = 0)
        }
        console.log("resolve")
        resolve()
    })
}

/**
 * @returns promise
 * @returns mydev
 */
async function getCart() {
    return new Promise(async (resolve) => {
        if (loggedIn) {
            const cartSnapshot = await getDocs(collection(firestore, 'users', auth.currentUser.uid, 'cart'))
            if (cartSnapshot.empty) {
                resolve([])
            }
            let cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc.data())
            })
            resolve(cart)
        }
        else {
            const cartSnapshot = JSON.parse(sessionStorage.getItem('cart'))
            if (!cartSnapshot) {
                resolve([])
                return
            }
            var cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc)
            })
            resolve(cart)
        }
    })
}


/**
 * Necessary functions to call after pageload
 */
async function postPageLoadFunctions(){
    await updateCart();
    fetchAndDisplayUserData();
    // await fetchNavCategories();
}

/**
 * 
 * @param {*} message 
 * @param {*} type 
 * Toast message
 * @author mydev
 */
function displayMessage(message, type) {
    // Get the toast container element
    const toastContainer = document.querySelector(".toast-container");

    // Create a clone of the toast template
    const toast = document.querySelector(".toast").cloneNode(true);
    // Set the success message
    toast.querySelector(".compare-note").innerHTML = message;

    //set text type  success/danger
    if (type === "danger") {
        toast.classList.remove("bg-success");
        toast.classList.add("bg-danger");
    } else {
        toast.classList.add("bg-success");
        toast.classList.remove("bg-danger");
    }

    // Append the toast to the container
    toastContainer.appendChild(toast);

    // Initialize the Bootstrap toast and show it
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove the toast after it's closed
    toast.addEventListener("hidden.bs.toast", function () {
        toast.remove();
    });
}
