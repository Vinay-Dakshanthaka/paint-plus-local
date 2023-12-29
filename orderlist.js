//Auth
import  {
    auth,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,} from './assets/repository/initialize.js'

//firstore
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
 } from './assets/repository/initialize.js'

//storage
import {
    storage, 
    ref,
    uploadBytes, 
    getDownloadURL,
    } from './assets/repository/initialize.js'
import { getCartDocsSnapshot } from './assets/repository/userCart/userCart.js';

var userData = null;
var loggedIn = null;
var customerName = null;
// var orders=null;
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var userId = new URLSearchParams(window.location.search).get('userId');
console.log(userId);
// if(!userId) window.location.href="admin_dashboard.html"


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
 * 
 *
 * @param {*} 
 * @returns mydev
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("if")       
        loggedIn = true
        onLoggedIn();
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })

        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        fetchOrdersForDisplay();
        docSnap.then((docSnapshot) => {
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                console.log(userData.role);
                roleAccess(userData.role);
                updateProfileName(userData.role, userData.firstName)
                updateCart();
                // fetchNavCategories();
                updateProfilePicture(userData.role, userData.profilePicture)
                if(userData.role==='ADMIN')
                   document.querySelector('#update-order-status-head').style.display = 'block';
            }
        });
    } else {
        console.log("else");
        updateCart();
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
         
        // fetchNavCategories();
        onLoggedOut();
    }
});

/**
 * fetchOrderForUser
 * displayOrdersInTable
 * @returns mydev
 */
async function fetchOrdersForDisplay(){
   const orders = await fetchOrdersForUser();
   let ordersTableContainer = document.querySelector('.gi-vendor-dashboard-card')
   if(orders.length==0){
    document.querySelector('.gi-vendor-dashboard-card').classList.remove('d-none')
     const noOrdersMessage = document.createElement('div');
     noOrdersMessage.innerHTML = `No orders found for this customer`;
     ordersTableContainer.innerHTML = ''
     ordersTableContainer.appendChild(noOrdersMessage);

     displayMessage('No orders found for this customer','danger');
   }
   else{
       document.querySelector('.gi-vendor-dashboard-card').classList.remove('d-none');
       displayOrdersInTable(orders);
   }
}

/**
 * 
 *
 * @param {*} 
 * @returns mydev
 */
function onLoggedIn() {
    console.log("onloggedIn")
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
 * 
 *
 * @param {*} 
 * @returns mydev
 */
function onLoggedOut() {
    console.log("onloggedOut")
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
 *
 * @param {*} 
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
 * @param {*} role
 * @return mydev 
 */
function roleAccess(role) {
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
        // ["AGENT", "agentAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
}

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
 * 
 *
 * @param {*} 
 * @returns dev
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
    const categorySnapshot = await getCartDocsSnapshot();
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

/**
 * 
 *
 * @param {*} 
 * @returns dev
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
 *
 * @param {*} 
 * @returns mydev
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
 *
 * @param {*} 
 * @returns mydev
 */
async function fetchOrdersForUser() {
    console.log(userId)
    let ordersRef = null;
    if(userId){
        const custRef = doc(firestore, "users",userId);
        ordersRef = collection(custRef, "orders");
        const custSnapshot = await getDoc(custRef)
        // document.querySelector('.gi-breadcrumb-title').classList.remove('d-none')
        // document.querySelector('.order-list-customer').textContent = custSnapshot.data().firstName + " " + custSnapshot.data().lastName
    }
    else{
        const custRef = doc(firestore, "users", auth.currentUser.uid);
        ordersRef = collection(custRef, "orders");
        const custSnapshot = await getDoc(custRef)
        // document.querySelector('.gi-breadcrumb-title').classList.remove('d-none')
        // document.querySelector('.order-list-customer').textContent = custSnapshot.data().firstName + " " + custSnapshot.data().lastName
    }

    try {
        const querySnapshot = await getDocs(ordersRef);
        const orders = [];
        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const orderData = doc.data();
                orders.push(orderData);
            });
        }
        console.log(orders);
        return orders;
    } catch (error) {
        console.error("Error fetching orders for user:", error);
        return [];
    }
}

async function displayOrdersInTable(orders) {
    const tableBody = document.querySelector('.wish-empt');
    tableBody.innerHTML = ""; 
  
    orders.forEach(order => {
        const newRow = document.createElement('tr');
        newRow.classList.add('pro-gl-content');
        newRow.innerHTML = `
            <td scope="row"><span>${order.orderId}</span></td>
            <td><div class="order-products"></div></td>
            <td><span>${order.orderDate}</span></td>
           <td><span class="avl">${order.status}</span></td>
            <td>
                <span class="tbl-btn">
                    <a class="gi-btn-2 add-to-cart m-r-5px" href="track-order.html?orderId=${order.orderId}${userId?`&userId=${userId}`:''}" title="Track Order">
                        <i class="fi-rr-truck-moving"></i>
                    </a>
                    <a class="gi-btn-1 gi-remove-wish" href="order-details.html?orderId=${order.orderId}${userId?`&userId=${userId}`:''}" title="Order Details">
                        <i class="fi-rr-list"></i>
                    </a>
                </span>
            </td>
            <td>${userData.role ==='ADMIN'?`
                <button class="gi-btn-1 mt-2 update-tracking-status"
                data-order-id="${order.orderId}" 
                data-order-status="${order.status}"
                data-bs-toggle="modal" 
                data-bs-target="#updateTrackStatusModal">
                Update
            </button>`:''}</td>
        `;
        
        const orderProducts = newRow.querySelector('.order-products')
        order.productsDetails.forEach(product => {
            const span = document.createElement('span')
            span.innerHTML = `${product.name}`
            orderProducts.appendChild(span)
        });
        tableBody.appendChild(newRow);
        
    });

    const updateTrackingStatusButtons = document.querySelectorAll('.update-tracking-status');
    updateTrackingStatusButtons.forEach(button => {
        console.log("1")
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const orderId = e.target.getAttribute('data-order-id');
            document.querySelector('#order-id').value = orderId;
            const orderStatus =e.target.getAttribute('data-order-status')
            document.querySelector('#current-order-tracking-status').textContent = orderStatus
            console.log(orderStatus);
            
            const trackStatusSelect = document.querySelector('#track-status') 
            let statusMap = {
                'Order Confirmed':1,
                'Processing Order':2,
                'Quality Check':3,
                'Product Dispatched':4,
                'Product Delivered':5
            }
            if(orderStatus){
                const currentStatusValue = statusMap[orderStatus];
                for (const option of trackStatusSelect.options) {
                    const optionStatus = statusMap[option.value];
                    option.disabled = optionStatus <= currentStatusValue;
                }

                for(const option of trackStatusSelect.options){
                    const optionStatus = statusMap[option.value];
                    option.disabled = optionStatus!== currentStatusValue + 1;
                }
                trackStatusSelect.value = orderStatus;
            } 
        });
    });
}


document.getElementById('update-track-status-form').addEventListener('submit', updateTrackOrderStatus);
async function updateTrackOrderStatus(e) {
    document.querySelector('#sub_btn').disabled = true;
    document.querySelector('#sub_btn').textContent = 'Updating ...'
    e.preventDefault();
    try {
        const trackOrderId = document.getElementById('order-id').value;
        const trackOrderStatusSelectedOption = document.getElementById('track-status').value;

        if (trackOrderId && trackOrderStatusSelectedOption && userId) {
            const orderRef = doc(firestore, 'users', userId, 'orders', trackOrderId);
            await updateDoc(orderRef, {
                status: trackOrderStatusSelectedOption
            });
            displayMessage("Track Order Status Updated Successfully",'success')
            fetchOrdersForDisplay();
            document.querySelector('#sub_btn').disabled = false;
            document.querySelector('#sub_btn').textContent = 'Save Changes'
            console.log('Order status updated successfully');
        } else {
            displayMessage("Please Select Option",'danger')
           
            console.error('Please Select Option');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}


function displayMessage(message, type) {
    // Get the toast container element
    const toastContainer = document.querySelector(".toast-container");

    // Create a clone of the toast template
    const toast = document.querySelector(".toast").cloneNode(true);

    // console.log(toast)
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
