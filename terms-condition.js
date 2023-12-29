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
    getCountFromServer } from './assets/repository/initialize.js'

//storage
import {
    storage, 
    ref,
    uploadBytes, 
    getDownloadURL,
    } from './assets/repository/initialize.js'
    
var userData=null;    
const productsRef = collection(firestore, 'products');
var loggedIn = false;
var cart = null
var unsubscribeOnSnapshot = null
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

//****************************event listener*******************************
//to be added after loading all products
function addEventListenerToProducts() {
    console.log("inside add event")
    document.querySelectorAll('.minus').forEach(btn => {
        btn.addEventListener('click', minusQuantity)
    })

    document.querySelectorAll('.plus').forEach(btn => {
        btn.addEventListener('click', plusQuantity)
    })

}

//************************************************************************


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

/**
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions(){
    await updateCart();
    // await fetchNavCategories();
}

// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, async (user) => {
    const adminAppbar = document.getElementById("adminAppbar");
    const userAppbar = document.getElementById("userAppbar");
    const agentAppbar = document.getElementById("agentAppbar");

    if (user) {
        // User is logged in

        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        var userData = null;
        onLoggedIn();
        docSnap.then(async (docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                console.log("from onAuthStateChanged")
                loggedIn = true
                userData = docSnapshot.data();
                roleAccess(userData.role);
                // onLoggedIn();
                console.log(1)
                roleAccess(userData.role);
                updateProfileName(userData.role,userData.firstName);
                updateProfilePicture(userData.role,userData.profilePicture)
            }
        });
    } else {
        // User is not logged in
        loggedIn = false;
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
    }
    
    await postPageLoadFunctions()
});

//*****************************loading and role access************************************
function updateProfileName(role, fullName) {
    // Based on the role, select the appropriate element
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
    profileNameElement.textContent = fullName;
}

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

    // Check if profilePicture is empty or undefined
    if (profilePicture && profilePicture.trim() !== '') {
        profilePictureElement.src = profilePicture;
    } else {
        // Set to the default profile picture if no picture is provided
        profilePictureElement.src = defaultProfilePicture;
    }
}

function roleAccess(role) {
    // console.log('inside role')
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
        ["AGENT", "agentAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    let vdsf = ""
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
}

//to execut upon logging in
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

//to execute upon logging out
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

//stop the loader show the main body
function stopLoader() {
    document.querySelector("#overlay").classList.add("hidden");
    document.querySelector("#main").classList.remove("hidden");
}

// Add an event listener to the confirmation logout button
confirmLogoutBtn.addEventListener("click", () => {
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

// Function to fetch and display products
async function fetchAndDisplayProducts(customQuery = false, productSnapshot = null) {
    return new Promise(async (resolve) => {
        const productsContainer = document.querySelector('.product-box');
        productsContainer.innerHTML = ``
        const productsRef = collection(firestore, 'products');
        var productIds = []
        cart = await getCart()
        console.log(cart)
        if (cart.length) {
            cart.forEach(doc => productIds.push(doc.productId))
        }
        var cartStatus = false

        var querySnapshot = null
        if (customQuery) {
            querySnapshot = productSnapshot
        }
        else {
            querySnapshot = await getDocs(productsRef)
        }
        querySnapshot.forEach((doc) => {
            const productData = doc.data();
            console.log(productData)
            //check if the product is present in cart
            const resultIndex = productIds.findIndex(id => id === productData.productId)
            if (resultIndex >= 0) cartStatus = true
            else cartStatus = false

            if (cartStatus) console.log(productData, productData.quantity >= 1 && cartStatus, cart[resultIndex].quantity)
            const productUrl = productData.imageUrl;
            // console.log(productUrl);
            // Create a product card
            const productCard = document.createElement('div');
            productCard.classList.add('col-xl-4', 'col-lg-4', 'col-md-6', 'col-sm-6', 'col-xs-6', 'mb-6', 'gi-product-box', 'pro-gl-content')
            // productCard.className = 'col-md-3'; // Adjust the class based on your layout
            productCard.innerHTML = `
                                    <div class="gi-product-content product" data-aos="fade-up" data-id="${productData.productId}">
                                        <div class="gi-product-inner">
                                            <div class="gi-pro-image-outer">
                                                <div class="gi-pro-image">
                                                    <a href="product-left-sidebar.html" class="image">
                                                        <span class="label veg">
                                                            <span class="dot"></span>
                                                        </span>
                                                        <img class="main-image" src="${productData.imageUrl}"
                                                            alt="Product" >
                                                        <img class="hover-image" src="assets/img/product-images/interior_paint2.jpg"
                                                            alt="Product">
                                                    </a>
                                                    <span class="flags">
                                                        <span class="sale">Sale</span>
                                                    </span>
                                                    <div class="gi-pro-actions">
                                                        <a class="gi-btn-group wishlist" title="Wishlist"><i
                                                                class="fi-rr-heart"></i></a>
                                                        <a href="#" class="gi-btn-group quickview"
                                                            data-link-action="quickview" title="Quick view"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#gi_quickview_modal"><i
                                                                class="fi-rr-eye"></i></a>
                                                        <a href="javascript:void(0)" title="Add To Cart"
                                                            class="gi-btn-group add-to-cart"><i
                                                                class="fi-rr-shopping-basket"></i></a>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="gi-pro-content">
                                                <a href="shop-left-sidebar-col-3.html">
                                                </a>
                                                <h5 class="gi-pro-title"><a href="product-left-sidebar.html">${productData.name}</a></h5>
                                                <p class="gi-info">Contrary to popular belief, Lorem Ipsum is not simply
                                                    random text. It has roots in a piece of classical Latin literature
                                                    from 45 BC, making it over 2000 years old.</p>
                                                <div class="gi-pro-rat-price">
                                                    <span class="gi-pro-rating">
                                                        <i class="gicon gi-star fill"></i>
                                                        <i class="gicon gi-star fill"></i>
                                                        <i class="gicon gi-star fill"></i>
                                                        <i class="gicon gi-star"></i>
                                                        <i class="gicon gi-star"></i>
                                                    </span>
                                                    <span class="gi-price">
                                                        <span class="new-price">$78.00</span>
                                                        <span class="old-price">$85.00</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
            `

            // Append the product card to the container
            productsContainer.appendChild(productCard);
            productCard.querySelector('.add-to-cart').addEventListener('click', () => {
                console.log(productData)
                window.location.href = `product-detail.html?data=${productData.productId}`
            })
        });

        //adding event listener to cart
        // addEventListenerToProducts()
        //add realtime updates
        // {
        //     if (!customQuery) {
        //         unsubscribeOnSnapshot = onSnapshot(collection(firestore, 'products'),
        //             (querySnapshot => {
        //                 if (!querySnapshot.empty) {
        //                     console.log('inside onSnapshot')
        //                     console.log("dfaf")
        //                     querySnapshot.forEach(doc => {
        //                         const itemCard = document.querySelector(`#product-${doc.data().productId}`)
        //                         itemCard.querySelector('.product-quantity').textContent = doc.data().quantity
        //                         if (doc.data().quantity < 1) {
        //                             itemCard.querySelector('.shown-stock').classList.add('d-none')
        //                             itemCard.querySelector('.quantity').classList.add('d-none')
        //                             itemCard.querySelector('.cart-btn').classList.add('d-none')
        //                             itemCard.querySelector('.out-of-stock').classList.remove('d-none')
        //                         }
        //                         else {
        //                             itemCard.querySelector('.shown-stock').classList.remove('d-none')
        //                             // itemCard.querySelector('.quantity').classList.remove('d-none')
        //                             itemCard.querySelector('.cart-btn').classList.remove('d-none')
        //                             itemCard.querySelector('.out-of-stock').classList.add('d-none')
        //                         }

        //                         if (itemCard.querySelector('.quantity input').value > +itemCard.querySelector('.product-quantity').textContent) {
        //                             itemCard.querySelector('.quantity input').value = 1
        //                         }
        //                     })
        //                 }
        //             })
        //         )
        //     }
        // }
        resolve()
    })
}


//disable or enable all add to cart buttons
function cartButtons(state) {
    document.querySelectorAll('.cart').forEach((cart) => {
        cart.disabled = state
    })
}

function changeTextContent(target, textContent) {
    target.textContent = textContent
}


async function getCart() {
    return new Promise(async (resolve) => {
        if (loggedIn) {
            console.log("form getCArt()")
            const cartSnapshot = await getDocs(collection(firestore, 'users', auth.currentUser.uid, 'cart'))
            console.log("form getCArt(1.1)")
            if (cartSnapshot.empty) {
                console.log("form getCArt(1.2)")
                resolve([])
            }
            console.log("form getCArt(1.3)")
            let cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc.data())
            })
            console.log("form getCArt(1.4)")
            resolve(cart)
        }
        else {
            console.log("form getCArt1)")
            const cartSnapshot = JSON.parse(sessionStorage.getItem('cart'))
            if (!cartSnapshot) {
                console.log('from true')
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

// async function showOrHideQuantity(productId, action) {
//     console.log('showOrHideQuantity')
//     return new Promise(async (resolve) => {
//         var emptyCart = true
//         if (loggedIn) {
//             const cartSnapshot = await getDocs(
//                 query(
//                     collection(firestore, 'users', auth.currentUser.uid, 'cart'),
//                     where('productId', '==', productId)
//                 )
//             )
//             if (!cartSnapshot.empty) {
//                 emptyCart = false
//             }
//             else {
//                 emptyCart = true
//             }
//         }
//         else {
//             const cart = JSON.parse(sessionStorage.getItem('cart'))
//             if (cart) {
//                 emptyCart = false
//             }
//             else {
//                 emptyCart = true
//             }
//         }
//         if (!emptyCart) {
//             console.log("from if")
//             console.log(productId)
//             if (action === 'hide') {
//                 document.querySelector(`#product-${productId}`).querySelector('.quantity').classList.add('d-none')
//             }
//             else {
//                 document.querySelector(`#product-${productId}`).querySelector('.quantity').classList.remove('d-none')
//             }
//         }
//         else {
//             console.log("from else")
//             document.querySelector(`#product-${productId}`).querySelector('.quantity').classList.add('d-none')
//         }
//         console.log('showOrHideQuantity1')
//         resolve()
//     })

// }


function fetchManufacturers() {
    return new Promise(async (resolve) => {
        const filterOptionClone = document.querySelector('.filter-option').cloneNode(true)
        const manufacturerContainer = document.querySelector('.manufacturer-filter-card')

        const manufacturerSnapshot = await getDocs(collection(firestore, 'manufacturers'))

        const filterOption = filterOptionClone.cloneNode(true)
        const input = filterOption.querySelector('input')
        input.setAttribute('name', 'manufacturers')
        input.setAttribute('value', 'all')
        input.setAttribute('id', 'all-manufacturer')

        const label = filterOption.querySelector('label')
        label.setAttribute('for', 'all-manufacturer')
        label.innerHTML = 'All'
        filterOption.classList.remove('d-none')
        input.addEventListener('click', fetchFilteredProducts)
        manufacturerContainer.appendChild(filterOption)

        manufacturerSnapshot.forEach(doc => {
            console.log(doc.data())

            const filterOption = filterOptionClone.cloneNode(true)
            const input = filterOption.querySelector('input')
            input.setAttribute('name', 'manufacturers')
            input.setAttribute('value', `${doc.data().manufacturerId}`)
            input.setAttribute('id', `id-${doc.data().manufacturerId}`)
            input.setAttribute('field', `manufacturerId`)
            const label = filterOption.querySelector('label')
            label.setAttribute('for', `id-${doc.data().manufacturerId}`)
            label.innerHTML = `${doc.data().name}`
            filterOption.classList.remove('d-none')
            input.addEventListener('click', fetchFilteredProducts)
            manufacturerContainer.appendChild(filterOption)
        })
        resolve()
    })
}

function fetchCategories() {
    return new Promise(async (resolve) => {
        const categorySnapshot = await getDocs(collection(firestore, 'categories'))
        if (categorySnapshot.empty) {
            console.log('from empty')
            resolve()
            return
        }

        const categoryList = document.querySelector('.category-list')
        categoryList.innerHTML = ``



        categorySnapshot.forEach(doc => {
            const list = document.createElement('li')
            list.innerHTML = `
                                            <div class="gi-sidebar-block-item">
                                                <input type="checkbox">
                                                <a href="javascript:void(0)">
                                                    <span class="name" data-id="${doc.data().categoryId}">${doc.data().name}</span>
                                                </a>
                                                <span class="checked"></span>
                                            </div>
            `
            categoryList.appendChild(list)

            list.addEventListener('click', fetchFilteredProducts)
        })
        resolve()
    })
}

async function fetchFilteredProducts(event) {
    console.log('from fetchFilteredProducts')
    const filterCards = document.querySelectorAll('.filter-card')
    // console.log(filterCards)
    const sortBy = []
    var fieldValues = []
    filterCards.forEach(filterCard => {
        const radios = filterCard.querySelectorAll('div .filter-option input')
        // console.log(radios)
        var field = null
        fieldValues = []
        radios.forEach(radio => {
            // console.log(radio)
            console.log(radio.value, radio.value !== 'all')
            if (radio.value !== 'all') {
                console.log('from if', radio.checked)
                if (radio.checked) {
                    field = radio.getAttribute('field')
                    fieldValues.push(radio.value)
                }
            }
            else {
                console.log('from else')
                if (radio.checked) {
                    radios.forEach(radio => {
                        if (radio.value !== 'all') radio.checked = false
                    })
                    const result = sortBy.findIndex(feild => feild === radio.getAttribute('field'))
                    if (result >= 0) {
                        sortBy.splice(result, 1)
                    }
                }
            }
        })

        if (fieldValues.length) {
            sortBy.push({
                field: field,
                by: fieldValues
            })
        }
    })
    console.log(sortBy)
    // return

    if (sortBy.length) {
        if (sortBy.length == 1) {
            const productSnapshot = await getDocs(
                query(
                    collection(firestore, 'products'),
                    or(
                        where(sortBy[0].field, 'in', sortBy[0].by)
                    )
                )
            )
            unsubscribeOnSnapshot()
            await fetchAndDisplayProducts(true, productSnapshot)
            unsubscribeOnSnapshot = onSnapshot(
                query(
                    collection(firestore, 'products'),
                    or(
                        where(sortBy[0].field, 'in', sortBy[0].by)
                    )
                ),
                (querySnapshot => {
                    if (!querySnapshot.empty) {
                        console.log('inside onSnapshot')
                        console.log("dfaf")
                        querySnapshot.forEach(doc => {
                            realTimeActions(doc.data())
                        })
                    }
                })
            )
        }
        if (sortBy.length == 2) {
            const productSnapshot = await getDocs(
                query(
                    collection(firestore, 'products'),
                    where(sortBy[0].field, 'in', sortBy[0].by),
                    where(sortBy[1].field, 'in', sortBy[1].by)
                )
            )
            unsubscribeOnSnapshot()
            await fetchAndDisplayProducts(true, productSnapshot)
            unsubscribeOnSnapshot = onSnapshot(
                query(
                    collection(firestore, 'products'),
                    collection(firestore, 'products'),
                    where(sortBy[0].field, 'in', sortBy[0].by),
                    where(sortBy[1].field, 'in', sortBy[1].by)
                ),
                (querySnapshot => {
                    if (!querySnapshot.empty) {
                        console.log('inside onSnapshot')
                        console.log("dfaf")
                        querySnapshot.forEach(doc => {
                            realTimeActions(doc.data())
                        })
                    }
                })
            )
        }
    }
    else {
        fetchAndDisplayProducts()
    }
}

function realTimeActions(data) {
    console.log('from realTimeActions')
    const itemCard = document.querySelector(`#product-${data.productId}`)
    itemCard.querySelector('.product-quantity').textContent = data.quantity
    if (data.quantity < 1) {
        itemCard.querySelector('.shown-stock').classList.add('d-none')
        itemCard.querySelector('.quantity').classList.add('d-none')
        itemCard.querySelector('.cart-btn').classList.add('d-none')
        itemCard.querySelector('.out-of-stock').classList.remove('d-none')
    }
    else {
        itemCard.querySelector('.shown-stock').classList.remove('d-none')
        // itemCard.querySelector('.quantity').classList.remove('d-none')
        itemCard.querySelector('.cart-btn').classList.remove('d-none')
        itemCard.querySelector('.out-of-stock').classList.add('d-none')
    }

    if (itemCard.querySelector('.quantity input').value > +itemCard.querySelector('.product-quantity').textContent) {
        itemCard.querySelector('.quantity input').value = 1
    }

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
