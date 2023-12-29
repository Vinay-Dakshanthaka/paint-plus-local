//Auth
import  {
    auth, 
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential, 
    getUserSnapshot} from './assets/repository/initialize.js'

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
    getCountFromServer } from './assets/repository/initialize.js'

//storage
import {
    storage, 
    ref,
    uploadBytes, 
    getDownloadURL,
    } from './assets/repository/initialize.js'
import { getProductDocsQuerySnapshot } from './assets/repository/products/products.js'

/**
 * Global Variables
 */
let loggedIn = false

const urlParam = new URLSearchParams(window.location.search)
const productId = urlParam.get('data')
console.log(productId)

if (!productId) {
    window.location.href = 'products.html'
}
else {
    getAndEmbedProductData(productId)
}


/**
 * 
 * Add an event listener to the confirmation logout button
 * @author mydev
 */
document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // Redirect to the login page or perform any other actions
            console.log("User logged out successfully");
            window.location.href = "login.html"; // Redirect to the login page
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

/**
 * add to ccart button 
 * @author mydev
 */
document.querySelector('.add-to-cart').addEventListener('click', addToCart)

/**
 * loading the auth user
 * @author mydev
 */
onAuthStateChanged(auth,async(user) => {
    if (user) {
        loggedIn = true
        onLoggedIn();
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })

        const userDocSnapshot = await getUserSnapshot(auth.currentUser.uid)
        if (!userDocSnapshot.empty) {
            const userData = userDocSnapshot.data();
            roleAccess(userData.role);
            updateCart();
            updateProfileName(userData.role, userData.firstName);
            updateProfilePicture(userData.role, userData.profilePicture);
            // fetchNavCategories();
            // getUserRealTime()
        }
    }
    else {
        loggedIn = false;
        updateCart()
        onLoggedOut()
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
        // fetchNavCategories();
    }
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
 * 
 * @param {user role} role 
 * @param {user firstname} firstName 
 * @returns
 * @author mydev 
 */
function updateProfileName(role, firstName) {
    // Based on the role, select the appropriate element
    console.log(firstName)
    let profileNameElement;
    switch (role) {
        case 'CUSTOMER':
            profileNameElement = document.getElementById('customerAppbar').querySelector('.profile-name');
            break;
        case 'AGENT':
            profileNameElement = document.getElementById('agentAppbar').querySelector('.profile-name');
            break;
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
 * 
 * @param {user role} role 
 * @param {user imageUrl} profilePicture 
 * @returns 
 * @author mydev
 */
function updateProfilePicture(role, profilePicture) {
    let profilePictureElement;
    const defaultProfilePicture = 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp';

    switch (role) {
        case 'CUSTOMER':
            profilePictureElement = document.getElementById('customerAppbar').querySelector('#profile-picture');
            break;
        case 'AGENT':
            profilePictureElement = document.getElementById('agentAppbar').querySelector('#profile-picture');
            break;
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
 * this function will executing after login
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
 * 
 * this function will executing after logout
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
 * @param {*} productId 
 * 
 * product class attributes :
 * product-section
 * product-loader
 * product-name
 * product-price
 * product-first-image
 */
async function getAndEmbedProductData(productId) {

    // function call
    const productSnapshot = await getProductDocsQuerySnapshot(productId);
    console.log(productSnapshot.docs)
    const productData = productSnapshot.docs[0].data()
    console.log(productData);
    const productLoader = document.querySelector('.product-loader')
    const productName = document.querySelector('.product-name')
    const productPrice = document.querySelector('.product-price')
    const productFirstImageList = document.querySelectorAll('.product-first-image')
    const productSize = document.querySelector('.product-size')
    const productManufacturer = document.querySelector('.product-manufacturer')
    const productIdNo = document.querySelector('.product-id')
    const productCategory = document.querySelector('.product-category')
    const productSection = document.querySelector('.product-section')
    const productDesc = document.querySelector('.gi-single-desc')
    const productDetails =  document.querySelector('.gi-single-pro-tab-details')
    const productSpecifications = document.querySelector('.gi-single-pro-tab-spec');
    
    // console.log(productFirstImageList[0],productFirstImageList[1])
    productFirstImageList[0].src = productData.imageUrl
    productFirstImageList[1].src = productData.imageUrl
    console.log(productData.price);
 
    const defaultPrice = productData.price;
    productPrice.textContent = defaultPrice;
    productName.textContent = productData.name
    // productPrice.textContent = productData.price
    productDesc.textContent = productData.featuredProductDescription;

    productManufacturer.textContent = productData.manufacturerName;
    productIdNo.textContent = productData.productId;
    productCategory.textContent = productData.categoryName;
    productDetails.textContent = productData.productDetails;
    productSpecifications.textContent = productData.productSpecifications;

    setTimeout(() => {
        productLoader.classList.add('d-none')
        productSection.style.height = 'auto'
        productSection.style.opacity = '1'
        setTimeout(() => {
            $('.single-product-cover').slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                fade: false,
                asNavFor: '.single-nav-thumb',
            });

            $('.single-nav-thumb').slick({
                slidesToShow: 4,
                slidesToScroll: 1,
                asNavFor: '.single-product-cover',
                dots: false,
                arrows: true,
                focusOnSelect: true
            });
            $('.zoom-image-hover').zoom()
        }, 10);
    }, 1000);
}


/**
 * Add to Cart
 * @author dev
 */
async function addToCart() {
    const addToCartButton = document.querySelector('.add-to-cart')
    addToCartButton.disabled = true
    addToCartButton.textContent = 'ADDING ...'
    if (loggedIn) {
        const cartSnapshot = await getDocs(
            query(
                collection(firestore, 'users', auth.currentUser.uid, 'cart'),
                where('cartId', '==', productId),
            )
        )
        console.log(cartSnapshot.empty)
        if (cartSnapshot.empty) {
            await setDoc(doc(collection(firestore, 'users', auth.currentUser.uid, 'cart'), productId), {
                cartId: productId,
                productId: productId,
                quantity: document.querySelector('.user-quantity').value,
            })
        }
        else {
            await updateDoc(cartSnapshot.docs[0].ref, { quantity: document.querySelector('.user-quantity').value })
        }
    }
    else {
        const cart = JSON.parse(sessionStorage.getItem('cart'))
        console.log("form else")
        if (cart) {
            console.log(productId)
            const result = cart.findIndex(doc => doc.cartId === productId)
            console.log(result)
            if (result >= 0) {
                cart[result].quantity = document.querySelector('.user-quantity').value;
                sessionStorage.setItem('cart', JSON.stringify(cart))
            }
            else {
                cart.push({
                    cartId: productId,
                    productId: productId,
                    quantity: document.querySelector('.user-quantity').value,
                })
                sessionStorage.setItem('cart', JSON.stringify(cart))
            }
        }
        else {
            sessionStorage.setItem('cart', JSON.stringify([{
                cartId: productId,
                productId: productId,
                quantity: 1,
            }]))
        }

    }
    addToCartButton.disabled = false
    addToCartButton.textContent = 'ADD TO CART'
    displayMessage('Added To Cart !', 'success')
    await updateCart()
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

/**
 * 
 * @returns promise<cart<List>>
 * 
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
                aria-controls="v-pills-home" aria-selected="true"><a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
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