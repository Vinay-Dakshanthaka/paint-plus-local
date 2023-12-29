// ------------------------Import FireStore Services --------------------------------
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
    deleteField
} from "./assets/repository/initialize.js";

// ----------------------Import Auth Services --------------------------
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
} from "./assets/repository/initialize.js";

// ----------------------Import Storage Services -----------------------------
import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL
    } from "./assets/repository/initialize.js";



//-------------------------- global variable ----------------------------------
const productsRef = collection(firestore, 'products');
var loggedIn = false;
var cart = null
var unsubscribeOnSnapshot = null
var userData = null;
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var orderId = new URLSearchParams(window.location.search).get('orderId')
if(orderId){
    console.log("if")
   document.querySelector('#track-order-block').classList.remove('d-none')
   document.querySelector('#input-track-order-block').classList.add('none')
}
else{
    console.log("esle")
    document.querySelector('#input-track-order-block').classList.remove('d-none')
    document.querySelector('#track-order-block').classList.add('none')
}
// console.log(orderId);
var userId = new URLSearchParams(window.location.search).get('userId')
console.log(userId)
//-----------------------------------------------------------------------------

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

//get user snapshot cart(dependency)
function getUserSnapshot(uid) {
    const userRef = doc(firestore, 'users', uid)
    console.log('3')
    return new Promise((resolve, reject) => {
        resolve(getDoc(userRef))
    })
}
//*-----------------------------------------------------------------------

/**
 * OnAuthStateChanged 
 * It will Check if User is Exist or Not
 * Calling updateCart() function
 * Calling roleAccess Based on the Role
 * Calling updateProfileName Based user Data
 * Calling updateProfilePicture Based on UserData
 * 
 * @returns mydev
 */
onAuthStateChanged(auth, async (user) => {
    const adminAppbar = document.getElementById("adminAppbar");
    const userAppbar = document.getElementById("userAppbar");
    // const agentAppbar = document.getElementById("agentAppbar");
    if (user) {
        console.log("from onAuthStateChanged" )

        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        // const orders= await fetchOrdersForUser();
        onLoggedIn();
        docSnap.then(async (docSnapshot) => {
            if (docSnapshot.exists()) {
                loggedIn = true
                userData = docSnapshot.data();
                console.log(userData)
                console.log(1)
                await updateCart();
                roleAccess(userData.role);
                updateProfileName(userData.role,userData.firstName);
                updateProfilePicture(userData.role,userData.profilePicture)
                // fetchNavCategories();
                if(orderId)
                await getOrderDetailsForTracking()
            }
        });
    } else {
        loggedIn = false;
        console.log(loggedIn)
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
        onLoggedOut();
        await updateCart();
        // fetchNavCategories();
    }
});

/**
 * 
 * @param {*} access profileName for user
 * @param {*} fullName 
 * @returns mydev
 */
function updateProfileName(role, fullName) {
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
    profileNameElement.textContent = fullName;
}


/**
 * 
 * @param {*} role access profilePicture for user
 * @param {*} profilePicture 
 * @returns my dev
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
    } else {
        profilePictureElement.src = defaultProfilePicture;
    }
}

/**
 * 
 * @param {*} role access the AppBar based on the role
 * @returns my dev
 */
function roleAccess(role) {
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
        // ["AGENT", "agentAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    let vdsf = ""
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
}


/**
 * hide or show the navbar items before and after login
 * @returns mydev
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
 * hide or show the navbar items before and after logout
 * @returns mydev
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
 * logout function
 * @returns mydev
 */
confirmLogoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            console.log("User logged out successfully");
            window.location.href = "login.html"; 
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

/**
 * get the cart details
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
 * 
 * @returns promise
 */
async function fetchNavCategories() {
    const categoryList = document.querySelector('.nav-category')
    const mobileCategoryList = document.querySelector('.mobile-nav-category')

    categoryList.innerHTML = `
    <div class='w-100 d-flex justify-content-center'>
        <div class="spinner-grow text-secondary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    `
    mobileCategoryList.innerHTML = `
    <div class='w-100 d-flex justify-content-center'>
        <div class="spinner-grow text-secondary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    `
    const categorySnapshot = await getDocs(collection(firestore, 'categories'))
    if (categorySnapshot.empty) {
        console.log('from empty')
        resolve()
        return
    }

    categoryList.innerHTML = ``
    mobileCategoryList.innerHTML = ``

    categorySnapshot.forEach(doc => {
        const span = document.createElement('span')
        span.innerHTML = `
        <div class="gi-tab-list nav flex-column nav-pills me-3" id="v-pills-tab"
        role="tablist" aria-orientation="vertical">
            <button class="nav-link" id="v-pills-home-tab" data-bs-toggle="pill"
                data-bs-target="#v-pills-home" type="button" role="tab"
                aria-controls="v-pills-home" aria-selected="true">
                <a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
            </button>
        </div>
        `
        categoryList.appendChild(span)

        const list = document.createElement('li')
        list.innerHTML = `
        <a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
        `
        mobileCategoryList.appendChild(list)
    })
}

document.querySelector('#track-order-form').addEventListener('submit',fetchTrackOrderDetailsForInputTrackingId)

/***
 * fetch Tracking based in the orderId or trackId
 */
async function fetchTrackOrderDetailsForInputTrackingId(e){
    e.preventDefault();
    const inputProductOrderId = document.querySelector('#input-product-order-id').value
    // console.log(auth.currentUser.uid)
    // console.log(inputProductOrderId)
    // console.log(userId);

    await expectedDate();
    if(!loggedIn){
        console.log("556")
        displayMessage("Please login to know your product tracking details",'danger')
        return;
     }

    if(auth.currentUser.uid && inputProductOrderId){

        const orderDetailsSnapshot = await getDocs(query(
            collection(firestore,'users',auth.currentUser.uid,'orders'),
            where("orderId","==",inputProductOrderId)));

            if(orderDetailsSnapshot && orderDetailsSnapshot.docs.length>0){
                console.log("3")
                document.querySelector('#input-track-order-block').classList.add('d-none')
                document.querySelector('#track-order-block').classList.remove('d-none')
                document.querySelector('.gi-order-id').textContent = inputProductOrderId;
                const prodcutDetailsData = orderDetailsSnapshot.docs[0].data()
                const trackerOrderId = document.getElementById('track-order-id')
                trackerOrderId.textContent = prodcutDetailsData.orderId
                // console.log(prodcutDetailsData)
                expectedDate({orderedDate: prodcutDetailsData.orderDate, expectedDays: 2})
                updateTrackingLOrderStatus(prodcutDetailsData.status);
            }
            else{
                console.log("No tracking Status exist for this order")
                displayMessage("No tracking Status exist for this order",'danger')
            }
    }
    else if(user){
        console.log("please enter the prodcut id to track")
        displayMessage("please enter the prodcut id to track",'danger')
    }

}

/**
 * expected Date of order
 */

async function expectedDate({orderedDate = '22/12/2023', expectedDays = 2} = {}){
    const expectedDate = document.querySelector('.expected-date');
    const inputDateString = orderedDate;

    const [day, month, year] = inputDateString.split('/').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + expectedDays);

    const formattedDate = currentDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).replace(/(\d+)\/(\w+)\/(\d+)/, "$1 $2, $3");
    expectedDate.textContent = formattedDate
}

/**
 * Tracking order Details function 
 * @returns mydev
 */
async function getOrderDetailsForTracking(){
    // console.log(orderId)
    // console.log(auth.currentUser.uid)
    // console.log(userId)
    if(userId===null && orderId){
        
        console.log("if")
        const orderSnapshot = await getDocs(query(
            collection(firestore, 'users', auth.currentUser.uid, 'orders'),
            where('orderId', '==', orderId)
        ));
        const orderData = orderSnapshot.docs[0].data();
        console.log(orderData.orderId)
        const giOrderId = document.querySelector('.gi-order-id');
        giOrderId.textContent = orderData.orderId
        const trackerOrderId = document.getElementById('track-order-id')
        trackerOrderId.textContent = orderData.orderId
        expectedDate({orderedDate: orderData.orderDate, expectedDays: 2})
        updateTrackingLOrderStatus(orderData.status)
    }

    else{
        console.log("else")
        const orderSnapshot = await getDocs(query(
            collection(firestore, 'users', userId, 'orders'),
            where('orderId', '==', orderId)
        ));
        const orderData = orderSnapshot.docs[0].data();
        const giOrderId = document.querySelector('.gi-order-id');
        giOrderId.textContent = orderData.orderId
        const trackerOrderId = document.getElementById('track-order-id')
        trackerOrderId.textContent = orderData.orderId
        expectedDate({orderedDate: orderData.orderDate, expectedDays: 2})
        updateTrackingLOrderStatus(orderData.status)
    }   
}

 /**
  * update Tracking order based Progressbar Percentage
  * @param {*} status
  * @returns mydev 
  */
 function updateTrackingLOrderStatus(status){
    console.log(status)
    const progressBar = document.querySelector('.progress-bar')
    const steps = document.querySelectorAll('.gi-step')
    
    const statusMap = {
        'Order Confirmed':1,
        'Processing Order':2,
        'Quality Check':3,
        'Product Dispatched':4,
        'Product Delivered':5
    }

    const totalSteps = Object.keys(statusMap).length;
    let completedSteps = statusMap[status] || 0;
    // console.log(completedSteps);
    
    const progressPercentage = (completedSteps / totalSteps) *100;
    console.log(progressPercentage);
    progressBar.style.width = `${progressPercentage}%`;

    steps.forEach((step,index)=>{
        if(index < completedSteps){
            step.classList.add('gi-step-completed')
            step.classList.remove('gi-step-active')
        }
        else if(index === completedSteps){
            step.classList.add('gi-step-active');
            step.classList.remove('gi-step-completed')
        }
        else {
            step.classList.remove('gi-step-completed');
            step.classList.remove('gi-step-active');
            // step.classList.remove('fa-check')
        }
    })
}

/**
 * 
 * @param {*} message 
 * @param {*} type 
 * 
 * Toast message
 */
function displayMessage(message, type) {
    // Get the toast container element
    const toastContainer = document.querySelector(".toast-container");

    // Create a clone of the toast template
    const toast = document.querySelector(".toast").cloneNode(true);

    console.log(toast)
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
