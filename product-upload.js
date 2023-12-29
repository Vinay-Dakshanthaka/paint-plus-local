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
    deleteObject,
    or,
    and,
    limit,
    startAfter,
    endAt,
    orderBy,
    getCountFromServer,
    deleteField,
    arrayUnion,
    getUserSnapshot
} from './assets/repository/initialize.js'

//Auth
import {
    auth,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from './assets/repository/initialize.js'

//storage
import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
} from './assets/repository/initialize.js'

import {
    getProductCollectionRef
} from './assets/repository/products/products.js'

import { 
    getManufacturerCollectionRef, 
    getManufacturerDocsSnapshot, 
    getManufacturerQuerySnapshot,
    getManufacturerStorageImageURL,
    getStorageImageFolderPathFileName 
} from './assets/repository/manufacturer/manufacturer.js';

import { 
    getCategoryCollectionRef,
    getCategoryDocsSnapshot,
    getCategoryQuerySnapshot, 
    getCategoryStorageImageURL 
} from './assets/repository/category/category.js';

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

/**
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions() {
    await updateCart();
    // await fetchNavCategories();
}


/**
 * update cart function cart(dependency)
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

//------------------------ Manage Manufacturer--------------------------------------

/**
 * loading the manufacturers
 * @author mydev
 */
document.querySelector('#manufacturer-dropdown').addEventListener('click',loadAllManufacturers);

/**
 * Add a click event listener to open the manufacturer modal
 * @return mydev 
 */
const openManufacturerModalButton = document.getElementById('add-manufacturer-button');
openManufacturerModalButton.addEventListener('click', () => {
    document.getElementById('manufacturerName').value = '';
    populateManufacturerList();
});

/**
 * save the manufacturers 
 * @returns sid
 */
document.getElementById('saveManufacturerButton').addEventListener('click', async () => {
    const manufacturerName = document.getElementById('manufacturerName').value;
    const manufacturerImageInput = document.getElementById('manufacturerImage')
    if (manufacturerName && manufacturerImageInput.files.length > 0) {
        const manufacturerImageFile = manufacturerImageInput.files[0];
        try {
            const folderPath = 'manufacturer_images/' + manufacturerImageFile.name;
            const manufacturerImageDownloadURL =await getManufacturerStorageImageURL(manufacturerImageFile,folderPath);

            const manufacturerCollectionRef = getManufacturerCollectionRef();
            const docRef = await addDoc(manufacturerCollectionRef, { name: manufacturerName, imageUrl: manufacturerImageDownloadURL });
            await updateDoc(docRef, { manufacturerId: docRef.id });

            console.log('Manufacturer added successfully');
            displayMessage('Manufacturer added successfully!', 'success');
            populateManufacturerList();
            document.getElementById('manufacturerName').value = '';
            manufacturerImageInput.value = '';
        } catch (error) {
            console.error('Error adding manufacturer:', error);
        }
    } else {
        console.error('Manufacturer name and image are required.');
        displayMessage('Manufacturer name and image are required.', 'danger');
    }
});


/**
 * populate manufacturers when any will happened in the manufacturer table
 * @returns mydev
 */
async function populateManufacturerList() {
    const manufacturerList = document.getElementById('manufacturerList');
    const manufacturerDocsSnapshot =await getManufacturerDocsSnapshot();

    if(!manufacturerDocsSnapshot.empty){
        manufacturerList.innerHTML = '';
        manufacturerDocsSnapshot.forEach((doc) => {
            const manufacturer = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                            <td>${manufacturer.name}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit">Edit</button>
                                <button class="btn btn-sm btn-danger delete" >Delete</button>
                            </td>
                        `;
            manufacturerList.appendChild(row);
            row.querySelector('.edit').addEventListener('click', () => editManufacturer(manufacturer.manufacturerId, manufacturer.name))
            row.querySelector('.delete').addEventListener('click', () => deleteManufacturer(manufacturer.manufacturerId))
        });
    }
    else{
        displayMessage('Manufactuers not found !','danger');
        manufacturerList.innerHTML = `<tr>Manufactuers not found </tr>`
    }
}


/**
 * @return mydev
 * Edit Manufacturer
 * @param {*} manufacturerId 
 * @param {*} manufacturerName 
 */
async function editManufacturer(manufacturerId, manufacturerName) {
    console.log(manufacturerId)
    console.log('from editmanufacturer')
    const updatedManufacturerName = prompt('Edit Manufacturer Name:', manufacturerName);

    if (updatedManufacturerName !== null) {
        const manufacturerQuerySnapshot =await getManufacturerQuerySnapshot(manufacturerId);

        if (!manufacturerQuerySnapshot.empty) {
            updateDoc(manufacturerQuerySnapshot.docs[0].ref, { name: updatedManufacturerName })
                .then(() => {
                    console.log(`Successfully Updated to ${updatedManufacturerName}`)
                    console.log('Manufacturer updated successfully');
                    displayMessage('Manufacturer updated successfully!', 'success');
                    document.querySelector('#manufacturer-dropdown').addEventListener('click', loadAllManufacturers)
                    populateManufacturerList();
                })
                .catch((error) => {
                    console.error('Error updating manufacturer:', error);
                });
        }
    }
}


/**
 * To deleting the manufacturer using manufacturerId
 * @param {*} manufacturerId 
 */
async function deleteManufacturer(manufacturerId) {
    const confirmation = confirm('Are you sure you want to delete this manufacturer?');
    if (confirmation) {
        try {
            const manufacturerSnapshot = await getManufacturerQuerySnapshot(manufacturerId);

            if (!manufacturerSnapshot.empty) {
                const manufacturerDoc = manufacturerSnapshot.docs[0];
                const manufacturerDocData = manufacturerDoc.data()

                // Extract the file name from the image URL
                const fileName = getStorageImageFolderPathFileName(manufacturerDocData.imageUrl);
                console.log(fileName);

                // Delete the manufacturer image from storage
                if (fileName) {
                    const storageRef = ref(storage, 'manufacturer_images/' + fileName);

                    await deleteObject(storageRef)
                        .then(() => {
                            console.log('Image deleted from storage successfully.');
                        })
                        .catch((error) => {
                            console.error('Error deleting image from storage:', error);
                        });
                }

                // Delete the manufacturer document from Firestore
                await deleteDoc(manufacturerDoc.ref);
                console.log('Manufacturer deleted successfully');
                displayMessage('Manufacturer deleted successfully!', 'success');
                document.querySelector('#manufacturer-dropdown').addEventListener('click', loadAllManufacturers)
                populateManufacturerList();
            }
        } catch (error) {
            console.error('Error deleting manufacturer:', error);
        }
    }
}

/**
 * to fetch manufacturers in modal
 * @returns mydev
 */
async function loadAllManufacturers(event) {
    event.preventDefault();
    console.log("567")
    const select = document.querySelector('#manufacturer-dropdown')
    select.innerHTML = `<option value="">
                                Loading ...
                            </option>`
    const manufacturerSnapshot = await getManufacturerDocsSnapshot();
    if (!manufacturerSnapshot.empty) {
        select.removeEventListener('click', loadAllManufacturers)
        select.innerHTML = ``
        const option = document.createElement('option')
        option.innerHTML = `Please select`
        select.appendChild(option)
        manufacturerSnapshot.forEach(doc => {
            const option = document.createElement('option')
            option.setAttribute('value', doc.data().name)
            option.setAttribute('data-id', doc.data().manufacturerId)
            option.innerHTML = `${doc.data().name}`
            select.appendChild(option)
        })
        // document.querySelector('#colorShadeDropdown').click()
    }
    else {
        select.innerHTML = `<option value="">Please select</option>`
        displayMessage('No manufactures added!', 'danger')
    }
}
//----------------------------------------------------------------------------------------


/**
 * 
 * categories loading 
 */
document.querySelector('#categoryDropdown').addEventListener('click', loadAllCategories)
// -------------------------- categories section------------------------------------------

const openCategoryModalButton = document.getElementById('add-category-button');
openCategoryModalButton.addEventListener('click', () => {
    document.getElementById('categoryName').value = '';
    populateCategoryList();
});

/**
 * save the categories 
 * @returns mydev
 */
document.getElementById('saveCategoryButton').addEventListener('click', async () => {
    const categoryName = document.getElementById('categoryName').value;
    const categoryImageInput = document.getElementById('categoryImage');

    if (categoryName && categoryImageInput.files.length > 0) {
        const categoryImageFile = categoryImageInput.files[0];
        try {
            const folderPath = 'category_images/' + categoryImageFile.name;
            const categoryImageDownloadURL = await getCategoryStorageImageURL(categoryImageFile,folderPath);

            const categoryCollectionRef = getCategoryCollectionRef();
            const docRef = await addDoc(categoryCollectionRef, { name: categoryName, imageUrl: categoryImageDownloadURL});

            // Update the categoryId with the document ID
            await updateDoc(docRef, { categoryId: docRef.id });
            console.log('Category added successfully');
            displayMessage('Category added successfully!', 'success');
            populateCategoryList();
            document.getElementById('categoryName').value = '';
            categoryImageInput.value = '';
        } catch (error) {
            console.error('Error adding category:', error);
        }
    } else {
        console.error('Category name and image are required.');
        displayMessage('Category name and image are required', 'danger');
    }
});

/**
 * populate categories when any will happened in the category table
 * @returns mydev
 */
async function populateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    const categoryDocsSnapshot = await getCategoryDocsSnapshot();

    if(!categoryDocsSnapshot.empty){
        categoryList.innerHTML = '';
        categoryDocsSnapshot.forEach((categoryDoc) => {
            const category = categoryDoc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                            <td>${category.name}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit">Edit</button>
                                <button class="btn btn-sm btn-danger delete" >Delete</button>
                            </td>
                        `;
            categoryList.appendChild(row);
            row.querySelector('.edit').addEventListener('click', () => editCategory(category.categoryId, category.name))
            row.querySelector('.delete').addEventListener('click', () => deleteCategory(category.categoryId))
        });
    }
    else{
        displayMessage('Categories not found !','danger');
        categoryList.innerHTML = `<tr>Categories not found </tr>`
    }    
}

/**
 * @return mydev
 * Edit Category
 * @param {*} categoryId 
 * @param {*} categoryName 
 */
async function editCategory(categoryId, categoryName) {
    console.log(categoryId)
    console.log('from editcategory')
    const updatedCategoryName = prompt('Edit Category Name:', categoryName);
    if (updatedCategoryName !== null) {
        const categoryQuerySnapshot = await getCategoryQuerySnapshot(categoryId);
        if (!categoryQuerySnapshot.empty) {
            updateDoc(categoryQuerySnapshot.docs[0].ref, { name: updatedCategoryName })
                .then(() => {
                    console.log(`Successfully Updated to ${updatedCategoryName}`)
                    console.log('Category updated successfully');
                    displayMessage('category updated successfully!', 'success');
                    document.querySelector('#categoryDropdown').addEventListener('click', loadAllCategories)
                    populateCategoryList();
                })
                .catch((error) => {
                    console.error('Error updating category:', error);
                });
        }
    }
}

/**
 * To delete the category using categoryId
 * @param {*} categoryId 
 */
async function deleteCategory(categoryId) {
    console.log(categoryId);
    const confirmation = confirm('Are you sure you want to delete this category?');
    if (confirmation) {
        try {
            const categoryQuerySnapshot = await getCategoryQuerySnapshot(categoryId);
            if (!categoryQuerySnapshot.empty) {
                const categoryDoc = categoryQuerySnapshot.docs[0];
                const categoryData = categoryDoc.data();

                const fileName = getStorageImageFolderPathFileName(categoryData.imageUrl);
                if (fileName) {
                    const storageRef = ref(storage, 'category_images/' + fileName);

                    await deleteObject(storageRef)
                        .then(() => {
                            console.log('Image deleted from storage successfully.');
                        })
                        .catch((error) => {
                            console.error('Error deleting image from storage:', error);
                        });
                }

                // Delete the category document from Firestore
                await deleteDoc(categoryDoc.ref);

                console.log('Category deleted successfully');
                displayMessage('Category deleted successfully!', 'success');
                document.querySelector('#categoryDropdown').addEventListener('click', loadAllCategories);
                populateCategoryList();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    }
}

/**
 * to fetch categories in model
 * @returns mydev
 */
async function loadAllCategories(event) {
    event.preventDefault();
    console.log("890")
    const select = document.querySelector('#categoryDropdown')
    select.innerHTML = `<option value="">
                                Loading ...
                            </option>`
    const categorySnapshot = await getCategoryDocsSnapshot();
    if (!categorySnapshot.empty) {
        select.removeEventListener('click', loadAllCategories)
        select.innerHTML = ``
        const option = document.createElement('option')
        option.innerHTML = `Please select`
        select.appendChild(option)
        categorySnapshot.forEach(doc => {
            const option = document.createElement('option')
            option.setAttribute('value', doc.data().name)
            option.setAttribute('data-id', doc.data().categoryId)
            option.innerHTML = `${doc.data().name}`
            select.appendChild(option)
        })
        // document.querySelector('#colorShadeDropdown').click()
    }
    else {
        select.innerHTML = `<option value="">Please select</option>`
        displayMessage('No categories added!', 'danger')
    }
}
//------------------------------------------------------------------------------------


// ------------------------ Upload Product ------------------------------------------
// Add a click event listener to the Upload Product
const uploadProductButton = document.getElementById('uploadProductButton');
uploadProductButton.addEventListener('click', uploadProduct);

async function uploadProduct() {
    document.querySelector('#uploadProductButton').disabled = true;
    document.querySelector('#uploadProductButton').textContent = 'Uploading ...';
    const productId = generateUniqueProductId();
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const fileInput = document.getElementById('productImage');
    const manufacturerOption = document.getElementById('manufacturer-dropdown').options[document.getElementById('manufacturer-dropdown').selectedIndex];
    const categoryOption = document.getElementById('categoryDropdown').options[document.getElementById('categoryDropdown').selectedIndex];
    const productDescriptionTextarea = document.querySelector('#product-description');
    const productDetailsTextarea = document.querySelector('#product-details');
    const productSpecificationsTextarea = document.querySelector('#product-specifications')
    const selectedFile = fileInput.files[0];

    if (productName && productPrice && manufacturerOption && categoryOption
         && selectedFile && productDescriptionTextarea && productDetailsTextarea && productSpecificationsTextarea) {
        const fileName = `${productId}/${selectedFile.name}`;
        const folderRef = ref(storage, 'product-images');
        const imageRef = ref(folderRef, fileName);

        uploadBytes(imageRef, selectedFile)
            .then(async (snapshot) => {
                getDownloadURL(imageRef)
                    .then(async (downloadURL) => {
                        let productData = ''
                            productData = {
                                productId: productId,
                                name: productName,
                                price: parseFloat(productPrice),
                                imageUrl: downloadURL,
                                manufacturerName: manufacturerOption.value,
                                manufacturerId: manufacturerOption.getAttribute('data-id'),
                                categoryName: categoryOption.value,
                                categoryId: categoryOption.getAttribute('data-id'),
                                ProductDescription: productDescriptionTextarea.value,
                                productDetails:productDetailsTextarea.value,
                                productSpecifications:productSpecificationsTextarea.value,
                            };
                        const productCollectionRef = getProductCollectionRef();

                        const productDocRef =await addDoc(productCollectionRef, productData);
                           await updateDoc(productDocRef,{productId:productDocRef.id})
                            .then(() => {
                                displayMessage('Product Uploaded Successfully!', 'success')

                                document.querySelector('#uploadProductButton').disabled = false;
                                document.querySelector('#uploadProductButton').textContent = 'Upload Product';
                                document.getElementById('productInfoForm').reset();
                            })
                            .catch((error) => {
                                document.querySelector('#uploadProductButton').disabled = false;
                                document.querySelector('#uploadProductButton').textContent = 'Upload Product';
                                console.error('Error adding product information to Firestore:', error);
                            });
                    })
                    .catch((error) => {
                        document.querySelector('#uploadProductButton').disabled = false;
                        document.querySelector('#uploadProductButton').textContent = 'Upload Product';
                        console.error('Error getting image download URL:', error);
                    });
            })
            .catch((error) => {
                document.querySelector('#uploadProductButton').disabled = false;
                document.querySelector('#uploadProductButton').textContent = 'Upload Product';
                console.error('Error uploading image: ', error);
            });
    } else {
        displayMessage('Please fill in all product information and select an image.', 'danger')

        document.querySelector('#uploadProductButton').disabled = false;
        document.querySelector('#uploadProductButton').textContent = 'Upload Product';
    }
}

//-------------------------------- Membership id ---------------------------------------

//Generate unique membershipId
function generateUniqueMembershipId() {
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    const formattedTime = formatTime(currentDate);

    // Generate a random alphanumeric string
    const randomString = generateRandomString(6);

    // Combine date, time, and random string to create the unique ID
    const membershipId = `${formattedDate}${formattedTime}${randomString}`;
    return membershipId;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}${minutes}${seconds}`;
}

function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset.charAt(randomIndex);
    }
    return result;
}

//--------------------------------- GenerateUniqueProdcutId ---------------------------

//Unique productId
function generateUniqueProductId() {
    const timestamp = new Date().getTime();
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}_${randomPart}`;
}

function editProduct() {
    // Redirect to product-edit.html with the product ID as a query parameter
    window.location.href = 'product-edit.html';
}

//--------------------------------- toast message ------------------------------------

//display message function
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

//---------------------------------------------------------------------------

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
        <a href="javascript:void(0)">${doc.data().name}</a>
        `
        mobileCategoryList.appendChild(list)
    })
}