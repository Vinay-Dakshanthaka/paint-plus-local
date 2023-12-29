import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    updateDoc,
    storage,
    getUserSnapshot
} from "./assets/repository/initialize.js";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    firestore,
    auth
} from "./assets/repository/initialize.js"
import {
    ref,
    uploadBytes, 
    getDownloadURL,
    deleteObject,
} from "./assets/repository/initialize.js";

import { 
    getProductDocsQuerySnapshot,
    getProductDocsSnapshot
} from "./assets/repository/products/products.js";

/**
 * Index :
 * event listener
 * role access
 * update product
 * Fetch operaion
 * toast message
 * */
//global
var userData = null;
var loggedIn = false;

/**
 *  Add an event listener to the confirmation logout button
 * @author mydev
 */
document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
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
async function postPageLoadFunctions(){
    await updateCart();
    // await fetchNavCategories();
    fetchAndDisplayProducts()
}

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
 * @author mydev
 */
document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});


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
 * to fetch the product details
 * @author mydev
 */  
async function fetchAndDisplayProducts() {
    const productDocsSnapshot = await getProductDocsSnapshot();
    const productTableBody = document.getElementById('productTableBody');

    if(!productDocsSnapshot.empty){
        productTableBody.innerHTML = ''
        productDocsSnapshot.forEach((doc) => {

            const productRow = document.createElement('tr')    
            const productData = doc.data();
                productRow.innerHTML = `
                <td>${productData.manufacturerName}</td>
                <td>${productData.categoryName}</td>
                <td>${productData.name}</td>
                <td>${productData.price}</td>
                <td><img src="${productData.imageUrl}" width="100" height="100" /></td>
                <td>
                    <button class="update-button-${productData.productId} btn btn-primary mb-2" data-product-id="${productData.productId}" data-bs-toggle="modal" data-bs-target="#exampleModal">Update Product</button>
                    <button class="delete-button-${productData.productId} btn btn-danger" data-product-id="${productData.productId}">Delete Product</button>
                </td>
            `;

            const updateButton = productRow.querySelector(`.update-button-${productData.productId}`);
            const deleteButton = productRow.querySelector(`.delete-button-${productData.productId}`);

            updateButton.addEventListener('click', (event) => {
                event.preventDefault();
                const clickedProductId = event.target.getAttribute('data-product-id');
                openUpdateModal(clickedProductId);
            });

            deleteButton.addEventListener('click', (event) => {
                event.preventDefault();
                const clickedProductId = event.target.getAttribute('data-product-id');
                deleteProduct(clickedProductId, event.target);
            });
            productTableBody.appendChild(productRow);
        });
    }
}

/**
 * delete the product with productId
 * @param {*} productId 
 * @param {*} deleteButton 
 */
async function deleteProduct(productId, deleteButton) {
    const confirmation = confirm('Are you sure you want to delete this product?');
    if (confirmation) {
        deleteButton.disabled = true
        deleteButton.textContent = 'Deleting...'
        const productDocsQuerySnapshot = await getProductDocsQuerySnapshot(productId);

        if(!productDocsQuerySnapshot.empty){
            const productDoc = productDocsQuerySnapshot.docs[0];
            const imageUrl = productDoc.data().imageUrl;

            deleteDoc(productDoc.ref)
                .then(() => {
                    displayMessage('Product deleted successfully!', 'success');
                    deleteButton.disabled = false
                    deleteButton.textContent = 'Delete Product'
                    const productRow = document.querySelector(`[data-product-id="${productId}"]`).closest('tr');
                    if (productRow) {
                        productRow.remove();
                    }

                    if (imageUrl) {
                        const storageRef = ref(storage, imageUrl);
                        deleteObject(storageRef)
                            .then(() => {
                                console.log('Image deleted from storage successfully.');
                            })
                            .catch((error) => {
                                console.error('Error deleting image from storage:', error);
                            });
                    }
                })
                .catch((error) => {
                    console.error('Error deleting product:', error);
                    displayMessage('Error deleting product', 'danger');
                });
        }
        else {
            console.log('No product found with the specified ID.');
            displayMessage('No product found with the specified ID.', 'danger');
        }
    }
}

/**
 * open to model to update product 
 * @param {*} productId 
 */
async function openUpdateModal(productId) {
    const productNameInput = document.querySelector('#productName');
    const manufacturerInput = document.querySelector('#manufacturerName')
    const categoryDropdown = document.querySelector('#categoryDropdown')
    const productPriceInput = document.querySelector('#productPrice');
    const productImageInput = document.querySelector('#productImage');
    const productImagePreview = document.querySelector('#productImagePreview');
    const previousProductImagePreview = document.querySelector('#previousProductImagePreview');
    let productDescriptionTextarea = document.querySelector('#product-description');
    let productDetailsTextarea=document.querySelector('#product-details');
    let productSpecificationsTextarea=document.querySelector('#product-specifications')

    // console.log(updateForm);
    productImageInput.value = ""
    // colorInputsContainer.innerHTML = '';
    // colors.length = 0;
    const productDocsQuerySnapshot = await getProductDocsQuerySnapshot(productId);
    if (!productDocsQuerySnapshot.empty) {
        const productDoc = productDocsQuerySnapshot.docs[0];
        const productData = productDoc.data();
        console.log(productData)

        manufacturerInput.innerHTML = productData.manufacturerName;
        if (await fetchCategories())
        categoryDropdown.value = productData.categoryId;
        productNameInput.value = productData.name;
        productPriceInput.value = productData.price;
        const existingImageUrl = productData.imageUrl;

        // Display the existing product image
        productImagePreview.src = productData.imageUrl;
        productDescriptionTextarea.value=productData.ProductDescription;
        productDetailsTextarea.value=productData.productDetails;
        productSpecificationsTextarea.value=productData.productSpecifications;
        console.log("6")

        //Display the Admin choose image here
        productImageInput.addEventListener('change', () => {
            console.log("productpreview")
            const file = productImageInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    productImagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                productImagePreview.src = productData.imageUrl;
            }
        });

        function removeUpdateEvent() {
            document.querySelector('#updateButton').removeEventListener('click', updateEvent);
            document.querySelector('#modal-close').removeEventListener('click', removeUpdateEvent)
            document.querySelector('#modal-close-cross').removeEventListener('click', removeUpdateEvent)
        }

        document.querySelector('#modal-close').addEventListener('click', removeUpdateEvent)
        document.querySelector('#modal-close-cross').addEventListener('click', removeUpdateEvent)
        document.querySelector('#updateButton').addEventListener('click', updateEvent);

        function updateEvent() {
            console.log('inside update1')
            document.querySelector('#updateButton').disabled = true
            document.querySelector('#updateButton').textContent = 'Saving...'
            const categoryOption = document.getElementById('categoryDropdown').options[document.getElementById('categoryDropdown').selectedIndex];

            if (productImageInput.files.length > 0) {
                console.log("if")
                const newImageFile = productImageInput.files[0];
                const storageRefOne = ref(storage, existingImageUrl);

                // Delete the old file
                deleteObject(storageRefOne).then(() => {
                        console.log('inside delete')
                        uploadBytes(storageRefOne, newImageFile).then((snapshot) => {
                            getDownloadURL(snapshot.ref).then((downloadURL) => {
                                let newProductData = ''

                                newProductData = {
                                    categoryName: categoryOption.getAttribute('data-name'),
                                    categoryId: categoryOption.value,
                                    name: productNameInput.value,
                                    price: parseFloat(productPriceInput.value),
                                    imageUrl: downloadURL,
                                    ProductDescription: productDescriptionTextarea.value,
                                    productDetails:productDetailsTextarea.value,
                                    productSpecifications:productSpecificationsTextarea.value,
                                };
                                
                                updateDoc(productDoc.ref, newProductData)
                                    .then((result) => {
                                        console.log(result)
                                        displayMessage("Product updated!", 'success')
                                        document.querySelector('#updateButton').disabled = false
                                        document.querySelector('#updateButton').textContent = 'Save changes'
                                        productImageInput.value = ''
                                        fetchAndDisplayProducts();
                                })
                                .catch((error) => {
                                    console.error('Error updating product:', error);
                                });
                            });
                        });
                    })
            }
            else {
                console.log("else")
                let newProductData = ''
                newProductData = {
                    categoryName: categoryOption.getAttribute('data-name'),
                    categoryId: categoryOption.value,
                    name: productNameInput.value,
                    price: parseFloat(productPriceInput.value),
                        ProductDescription: productDescriptionTextarea.value,
                    productDetails:productDetailsTextarea.value,
                    productSpecifications:productSpecificationsTextarea.value,
                };
                    
                console.log(newProductData);
                updateDoc(productDoc.ref, newProductData).then((result) => {
                    console.log(result)
                    displayMessage('Product Updated!', 'success')
                    document.querySelector('#updateButton').disabled = false
                    document.querySelector('#updateButton').textContent = 'Save changes'
                    fetchAndDisplayProducts();l
                })
            }
            console.log('inside update 2');
        }
    }
    else {
        console.log('No product found with the specified ID.');
        document.querySelector('#updateButton').disabled = false
        document.querySelector('#updateButton').textContent = 'Save changes'
    }
}

/**
 * to fetch categories
 * @returns mydev
 */
async function fetchCategories() {
    return new Promise(async (resolve) => {
        const select = document.querySelector('#categoryDropdown')
        select.innerHTML = `<option value="">
                        Loading ...
                    </option>`
        const categorySnapshot = await getDocs(collection(firestore, 'categories'))
        if (!categorySnapshot.empty) {
            select.removeEventListener('click', fetchCategories)
            select.innerHTML = ``
            const option = document.createElement('option')
            option.innerHTML = `Please select`
            option.setAttribute('value', ' ')
            select.appendChild(option)
            categorySnapshot.forEach(doc => {
                const option = document.createElement('option')
                option.setAttribute('value', doc.data().categoryId)
                option.setAttribute('data-name', doc.data().name)
                option.innerHTML = `${doc.data().name}`
                select.appendChild(option)
            })
        }
        else {
            select.innerHTML = `<option value="">Please select</option>`
            displayMessage('No categories added!', 'danger')
            resolve(false)
        }
        resolve(true)
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