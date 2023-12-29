//------------------------Firebase Config-----------------------
//Auth
import {
    auth,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    getUserSnapshot,
} from './assets/repository/initialize.js'

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
    getCountFromServer
} from './assets/repository/initialize.js'

//storage
import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL
} from './assets/repository/initialize.js'

import { getCategoryCount } from './assets/repository/products/products.js'
import { firebaseErrorHandler } from "./assets/js/error.js";
import { getCategoryDocsSnapshot } from './assets/repository/category/category.js';
import { getManufacturerDocsSnapshot } from './assets/repository/manufacturer/manufacturer.js';
import { getVideoSnapshot } from './assets/repository/admin-dash/admin-dash.js';
import { getCartDocsSnapshot } from './assets/repository/userCart/userCart.js';

//global
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var userData = null;
var loggedIn = null;


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
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions() {
    await updateCart();
    await fetchNavCategories();
    await fetchAndDisplayVideos();
    embedCategoriesCard();
    embedManufacturers();
}

/**
 * @param {auth}
 * @author mydev
 */
onAuthStateChanged(auth, async (user) => {
    if(user) {
        loggedIn = true
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })

        onLoggedIn();
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
        // window.location.href = "login.html";
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
        // ["AGENT", "agentAppbar"],
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
 * navbar items before login
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

async function fetchProductsForSlider() {
    const productSlider = document.querySelector('#products-for-slider')
    productSlider.innerHTML = ''

    const productSliderCollection = collection(firestore, 'products')
    const productSliderSnapshot = await getDocs(productSliderCollection);
    let productCount = 0;
    productSliderSnapshot.forEach(async (doc) => {
        if (productCount < 8) {
            const productDoc = doc.data()
            // console.log(productDoc)
            const productDiv = document.createElement('div')
            productDiv.classList.add('gi-product-content')
            productDiv.innerHTML = `
                        <div class="gi-product-inner">
                            <div class="gi-pro-image-outer">
                                <div class="gi-pro-image">
                                    <a href="products.html" class="image">
                                        <span class="label veg">
                                            <span class="dot"></span>
                                        </span>
                                        <img class="main-image"
                                            src="${productDoc.imageUrl}"
                                            alt="Product">
                                        <img class="hover-image"
                                            src="${productDoc.imageUrl}"
                                            alt="Product">
                                    </a>
                                    <span class="flags">
                                        <span class="sale">Sale</span>
                                    </span>
                                </div>
                            </div>
                            <div class="gi-pro-content">
                                <a href="products.html">
                                </a>
                                <h5 class="gi-pro-title"><a href="products.html">
                                 ${productDoc.name}
                                </a></h5>
                                <div class="gi-pro-rat-price">
                                    <span class="gi-pro-rating">
                                        <i class="gicon gi-star fill"></i>
                                        <i class="gicon gi-star fill"></i>
                                        <i class="gicon gi-star fill"></i>
                                        <i class="gicon gi-star fill"></i>
                                        <i class="gicon gi-star"></i>
                                    </span>
                                    <span class="gi-price">
                                        <span class="new-price"><span>&#8377;</span>${productDoc.price}</span>
                                        <span class="old-price"><span>&#8377;</span>${productDoc.price + 30}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
        `
            productSlider.appendChild(productDiv)
            productCount++;
        }
    })
    $('.gi-product-slider').owlCarousel({
        loop: true,
        dots: false,
        nav: false,
        smartSpeed: 1000,
        autoplay: false,
        items: 3,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            421: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 3
            },
            1200: {
                items: 4
            },
            1367: {
                items: 5
            }
        }
    });
}


async function fetchAndDisplayVideos() {
    const videoGalleryContainer = document.getElementById('videoGallery');
    const tempContainer = document.createElement('span')
    // tempContainer.classList.add('row')
    let videoContainer = null
    let videoElement = null
    try {
        // Fetch videos from Firestore
        const videosSnapshot = await getVideoSnapshot();

        // Iterate through each video document
        videosSnapshot.forEach((videoDoc) => {
            videoContainer = document.createElement('div');
            videoElement = document.createElement('video');
            const videoData = videoDoc.data();
            videoContainer.classList.add('gi-ser-content', 'col-sm-6', 'col-md-6', 'col-lg-6', 'p-tp-12', 'wow', 'fadeInUp');

            // Create the video element
            videoElement.controls = true;
            videoElement.preload = 'metadata';

            // Set the poster and source attributes
            videoElement.poster = 'https://i.ytimg.com/vi/xwXCAmZX2F0/maxresdefault.jpg';
            const videoSource = document.createElement('source');
            videoSource.src = videoData.url;
            videoSource.type = 'video/mp4';
            videoElement.appendChild(videoSource);

            // Append the video element to the container
            videoContainer.appendChild(videoElement);

            // Append the container to the video gallery
            tempContainer.appendChild(videoContainer)
        });
        videoGalleryContainer.innerHTML = ``
        videoGalleryContainer.innerHTML = tempContainer.innerHTML
        tempContainer.remove()
    } catch (error) {
        console.error('Error fetching videos:', error);
    }
}

async function newArrivalProducts() {
    const newArrivalProduct = document.querySelector('#new-product-arrival-section')
    newArrivalProduct.innerHTML = ''

    const newArrivalCollection = collection(firestore, 'products')
    const newArrivalSnapShot = await getDocs(newArrivalCollection);
    newArrivalSnapShot.forEach((doc) => {
        const newArrivalData = doc.data();
        if (newArrivalData.newProductArrivalStatus == true) {
            // console.log(newArrivalData)
            const newArrivalDiv = document.createElement('div')
            newArrivalDiv.classList.add('col-md-4', 'col-sm-6', 'col-xs-6', 'gi-col-5', 'gi-product-box')
            newArrivalDiv.innerHTML = `
                <div class="gi-product-content">
                    <div class="gi-product-inner">
                        <div class="gi-pro-image-outer">
                            <div class="gi-pro-image">
                                <a href="products.html" class="image">
                                    <span class="label veg">
                                        <span class="dot"></span>
                                    </span>
                                    <img class="main-image"
                                        src="${newArrivalData.imageUrl}"
                                        alt="Product">
                                    <img class="hover-image"
                                        src="${newArrivalData.imageUrl}"
                                        alt="Product">
                                </a>
                                <span class="flags">
                                    <span class="sale">New</span>
                                </span>
                                <div class="gi-pro-actions">
                                    <a href="products.html"
                                        class="gi-btn-group quickview" data-link-action="quickview"
                                        title="Quick view" data-bs-toggle="modal"
                                        data-bs-target="#gi_quickview_modal"><i
                                            class="fi-rr-eye"></i></a>
                                </div>
                            </div>
                        </div>
                        <div class="gi-pro-content">
                            <a href="products.html">
                            </a>
                            <h5 class="gi-pro-title"><a href="products.html">
                                    ${newArrivalData.name}</a></h5>
                            <div class="gi-pro-rat-price">
                                <span class="gi-pro-rating">
                                    <i class="gicon gi-star fill"></i>
                                    <i class="gicon gi-star fill"></i>
                                    <i class="gicon gi-star fill"></i>
                                    <i class="gicon gi-star"></i>
                                    <i class="gicon gi-star"></i>
                                </span>
                                <span class="gi-price">
                                    <span class="new-price"><span>&#8377</span>${newArrivalData.price}</span>
                                    <span class="old-price"><span>$#8377</span>$65.00</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `
            newArrivalProduct.appendChild(newArrivalDiv);
        }
    })
}

/**
 * 
 * @returns categories list = 
 * [{
 *  categoryId,
 *  name
 * }]
 */
function fetchCategories() {
    console.log('inside categories')
    return new Promise(async (res) => {
        const categories = []
        console.log(1)
        let categorySnapshot = null
        try {
            console.log(2)
            categorySnapshot = await getCategoryDocsSnapshot();
            console.log(3)
        } catch (error) {
            console.log(error)
            firebaseErrorHandler(error)
        }
        console.log(3)
        if (categorySnapshot.empty) {
            res(categories)
        }
        else {
            categorySnapshot.forEach(doc => {
                categories.push(doc.data())
            })
            res(categories)
        }
    })
}

/**
 * 
 * @returns manufacturers list = 
 * [{
 *  manufacturerId,
 *  name,
 *  imageUrl
 * }]
 */
function fetchManufacturers() {
    console.log('inside manufacturers');
    return new Promise(async (res) => {
        const manufacturers = [];
        console.log(1);
        let manufacturerSnapshot = null;
        try {
            console.log(2);
            manufacturerSnapshot = await getManufacturerDocsSnapshot();
            console.log(3);
        } catch (error) {
            console.log(error);
            firebaseErrorHandler(error);
        }
        console.log(3);
        if (manufacturerSnapshot.empty) {
            res(manufacturers);
        } else {
            manufacturerSnapshot.forEach(doc => {
                manufacturers.push(doc.data());
            });
            res(manufacturers);
        }
    });
}

/**
 * Function to embed Categories card in home page
 */
async function embedCategoriesCard() {
    console.log('inside embedCategories');
    const categories = await fetchCategories();
    const categoryBox = document.querySelector('.category-box');
    categoryBox.innerHTML = '';

    // let count = 1;
    let allPromises = categories.map(async (category) => {
        // if (count == 6) count = 1;
        // const categoryCount = await getCategoryCount(category.categoryId);

        const categoryCard = document.createElement('div');
        categoryCard.classList.add('col-md-4', 'col-sm-6', 'col-xs-6', 'gi-col-5', 'col-6');
        categoryCard.innerHTML = `
            <div class="card cat-cards">
                <a href="products.html?categoryId=${category.categoryId}">
                    <img src="${category.imageUrl}" class="card-img-top" alt="${category.name}">
                </a>
                <div class="card-body explore-category-btn">
                    <a href="products.html?categoryId=${category.categoryId}"
                        class="explore-category text-decoration-none d-flex justify-content-between align-items-center">
                        ${category.name} <span><i class="fi-rr-angle-double-small-right" aria-hidden="true"></i></span>
                    </a>
                </div>
            </div>
        `;

        categoryBox.appendChild(categoryCard);
        // count++;
    });

    await Promise.all(allPromises);
}

async function embedManufacturers() {
    console.log('inside embedManufacturers');
    const manufacturers = await fetchManufacturers();
    const manufacturersContainer = document.querySelector('.brand-box');
    manufacturersContainer.innerHTML = '';

    let allPromises = manufacturers.map(async (manufacturer) => {

        const manufacturerIcon = document.createElement('div');
        manufacturerIcon.classList.add('brands');
        manufacturerIcon.innerHTML = `
            <div class="gi-cat-icon">
                <img src="${manufacturer.imageUrl}" alt="${manufacturer.name}" class="img-fluid">
            </div>
        `;

        manufacturersContainer.appendChild(manufacturerIcon);
    });

    await Promise.all(allPromises);
    $('.gi-category-block').owlCarousel({
        loop: true,
        dots: false,
        nav: false,
        smartSpeed: 10000,
        autoplay: true,
        autoplayTimeout: 5000,
        items: 3,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            421: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 3
            },
            1200: {
                items: 4
            },
            1367: {
                items: 5
            }
        }
    });
}

//-------------------------------------------------------------------------/
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
//-----------------------------------------------------------------------/
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

async function getCart() {
    return new Promise(async (resolve) => {
        if (loggedIn) {
            const cartSnapshot = await getCartDocsSnapshot(loggedIn, auth.currentUser.uid);
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
//------------------------------------------------------------------------------

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
    const categorySnapshot = await getCategoryDocsSnapshot();
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
