//------------------------Firebase Config-----------------------
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
    
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var userData = null;
var loggedIn = null;

// Function to check if the user is logged in
function isUserLoggedIn() {
    return !!auth.currentUser;
}

//***********************************event listener**************************************
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

//event for phone number validation
document.querySelector("#editMobileNumber").addEventListener("keyup", () => {
    // Validate phone number
    if (!isValidPhoneNumber(document.querySelector("#editMobileNumber").value)) {
        // Display an error message
        document.getElementById("phoneError").textContent =
            "*Phone number must be 10 digits.";
        document.getElementById("phoneError").style.scale = "1"
        // Stop the function execution if validation fails
    } else {
        document.getElementById("phoneError").textContent = "";
    }
});

//event for firstName validation
document.querySelector("#editFullName").addEventListener("keyup", () => {
    if (!isValidFullName(document.querySelector("#editFullName").value)) {
        // Display an error message
        document.getElementById("nameError").textContent =
            "*Name must be at least 3 characters.";
    }
    else {
        document.getElementById("nameError").textContent = ''
    }
});

//***************************************************************************************

//************************cart dependency************************************************
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

//get user snapshot cart(dependency)
function getUserSnapshot(uid) {
    const userRef = doc(firestore, 'users', uid)
    console.log('3')
    return new Promise((resolve, reject) => {
        resolve(getDoc(userRef))
    })
}
//***************************************************************************************

//*****************************loading and role access************************************
// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, (user) => {
    if (user) {
        loggedIn = true
        onLoggedIn();

        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })
        // User is authenticated
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then((docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                roleAccess(userData.role);
                fetchAndDisplayAddresses();
                updateProfileName(userData.role,userData.firstName);
                updateProfilePicture(userData.role,userData.profilePicture)
                updateCart();
                // fetchNavCategories();
            }
        });
    } else {
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
        // User is not authenticated, redirect to login page
        window.location.href = "login.html";
    }
});

function updateProfileName(role, fullName) {
    // Based on the role, select the appropriate element
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
        // ["AGENT", "agentAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
}

//to execute upon logging in
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

//***************************************************************************************

// Function to fetch and display user's addresses
function fetchAndDisplayAddresses() {
    const user = auth.currentUser.uid;
    const userAddressesRef = collection(firestore, 'users', user, 'addresses');

    // Clear existing address cards
    const addressCardContainer = document.getElementById("addressCardContainer");
    addressCardContainer.innerHTML = "";

    getDocs(userAddressesRef)
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const addressData = doc.data();
                const {
                    fullName,
                    mobileNumber,
                    houseBuilding,
                    roadAreaColony,
                    pinCode,
                    city,
                    state,
                    addressType,
                    isDefault
                } = addressData;

                // Create a Bootstrap card for each address
                const card = document.createElement("div");
                card.classList.add("col-6", "mx=auto", "mb-2");
                card.innerHTML = `
                    <div class="col-md-12" >
                        <div class="bg-white card addresses-item mb-4 border border-gray shadow">
                            <div class="gold-members p-4">
                                <div class="media">
                                    <div class="mr-3"><i class="icofont-ui-home icofont-3x"></i></div>
                                    <div class="media-body position-relative">
                                    <span class="position-absolute top-0 end-0 badge bg-success text-bold ${doc.data().isDefault ? '' : 'd-none'}">Default</span>
                                    <h5 class="card-title">${fullName}</h5><br>
                                    <h6 class="card-subtitle mb-2 text-muted">${mobileNumber}</h6>
                                    <p class="card-text">${houseBuilding}, ${roadAreaColony}<br>${pinCode}, ${city}, ${state}</p>
                                    <p class="card-text">Type: ${addressType}</p>
                                    ${isDefault ?
                        `<p class="mb-0 text-black font-weight-bold" >
                                            <a class="gi-btn-1 edit-address me-2" data-address-id="${doc.id}" id="edit-${doc.id}" data-bs-toggle="modal" data-bs-target="#editAddressModal" data-bs-toggle="modal" href="#exampleModalToggle" role="button" href="#">EDIT <i class="fi-rr-pencil"></i></a> 
                                            <a class="gi-btn-1 bg-danger delete-address me-2" data-address-id="${doc.id}" id="delete-${doc.id}"  href="#">DELETE <i class="fi-rs-trash"></i></a>
                                            <!-- span class="gi-btn-1 bg-success set-default-address me-2">DEFAULT</1span> -->` :
                        `<p class="mb-0 text-black font-weight-bold">
                                            <a class="gi-btn-1 edit-address me-2" data-address-id="${doc.id}" id="edit-${doc.id}" data-bs-toggle="modal" data-bs-target="#editAddressModal" data-bs-toggle="modal" href="#exampleModalToggle" role="button" href="#">EDIT <i class="fi-rr-pencil"></i></a> 
                                            <a class="gi-btn-1 bg-danger delete-address me-2" data-address-id="${doc.id}" id="delete-${doc.id}"  href="#">DELETE <i class="fi-rs-trash"></i></a>
                                            <a class="gi-btn-1 set-default-address" data-address-id="${doc.id}" id="default-${doc.id}" style="background-color:#007BA7;">Set as Default</a>`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;

                addressCardContainer.appendChild(card);

                // Add event listeners for delete and set as default buttons
                const deleteButton = card.querySelector(".delete-address");
                const setDefaultButton = card.querySelector(".set-default-address");
                const setEditButton = card.querySelector(".edit-address");

                deleteButton.addEventListener("click", async () => {
                    console.log(1)
                    document.querySelector(`#delete-${doc.id}`).disabled = true
                    document.querySelector(`#delete-${doc.id}`).textContent = 'Deleting...'
                    console.log(2)
                    // Call a function to handle address deletion
                    if (!await deleteAddress(doc.id)) {
                        console.log(5)
                        document.querySelector(`#delete-${doc.id}`).disabled = false
                        document.querySelector(`#delete-${doc.id}`).textContent = 'Delete'
                    }
                    console.log(6)
                });

                if (!isDefault) {
                    setDefaultButton.addEventListener("click", () => {
                        document.querySelector(`#default-${doc.id}`).disabled = true
                        document.querySelector(`#default-${doc.id}`).textContent = 'Setting as default...'
                        // Call a function to set this address as the default
                        setDefaultAddress(doc.id);
                    });
                }

                setEditButton.addEventListener("click", () => {
                    // Call a function to set this address as the default
                    editAddress(doc.id);
                });
            });
        })
        .catch((error) => {
            console.error("Error fetching addresses: ", error);
        });
}

//***********************************************************************************

// Function to delete an address
function deleteAddress(addressId) {
    return new Promise(async (resolve) => {
        console.log(3)
        const confirmation = confirm('Are you sure you want to delete this address?');
        console.log(confirmation)
        if (confirmation) {
            console.log(4)
            const user = auth.currentUser.uid;
            const userAddressRef = doc(firestore, 'users', user, 'addresses', addressId);

            deleteDoc(userAddressRef)
                .then(async () => {
                    // Address deleted successfully
                    console.log("Address deleted successfully");
                    // You can refresh the address list or perform other actions here

                    const addressSnapshot = await getDocs(collection(firestore, 'users', user, 'addresses'));

                    if (addressSnapshot.empty) {
                        fetchAndDisplayAddresses();
                        displayMessage('Please add your address!', 'success');
                        resolve(true);
                        return;
                    }

                    const remainingAddresses = addressSnapshot.docs.filter(doc => doc.data().isDefault === true);

                    console.log(remainingAddresses);

                    if (remainingAddresses.length === 0) {
                        console.log('inside if');
                        const firstAddressId = addressSnapshot.docs[0].id;
                        const data = { isDefault: true };
                        await updateDoc(doc(firestore, 'users', user, 'addresses', firstAddressId), data);
                    }

                    fetchAndDisplayAddresses();
                    displayMessage('Address deleted successfully!', 'success');
                    resolve(true);
                })
                .catch((error) => {
                    displayMessage('Error deleting address', 'danger');
                    console.error("Error deleting address:", error);
                    resolve(false);
                });
        }
        else {
            console.log(5, 'from false');
            resolve(false);
        }
    })
}

// Function to set an address as default
async function setDefaultAddress(addressId) {

    const user = auth.currentUser.uid;
    const userAddressesRef = collection(firestore, 'users', user, 'addresses');
    console.log("inside default")

    const addressesDocs = await getDocs(userAddressesRef);

    addressesDocs.forEach(async (addressDoc) => {
        if (addressDoc.id === addressId) {
            await updateDoc(doc(userAddressesRef, addressDoc.id), { isDefault: true })
        }
        else {
            await updateDoc(doc(userAddressesRef, addressDoc.id), { isDefault: false })
        }
    })
    displayMessage('Address set as default', 'success');
    document.querySelector(`#default-${addressId}`).disabled = false
    document.querySelector(`#default-${addressId}`).textContent = 'Set as Default'
    fetchAndDisplayAddresses();
}

//*****************************************************************************************

// Function to handle edit address
function editAddress(addressId) {
    console.log("Editing address with ID:", addressId);
    const user = auth.currentUser.uid;
    const userAddressRef = doc(firestore, 'users', user, 'addresses', addressId);

    getDoc(userAddressRef)
        .then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const addressData = docSnapshot.data();
                console.log(addressData)
                const {
                    fullName,
                    mobileNumber,
                    houseBuilding,
                    roadAreaColony,
                    pinCode,
                    city,
                    state,
                    addressType,
                } = addressData;

                // Fill the edit form with the existing address data
                document.getElementById("editFullName").value = fullName;
                document.getElementById("editMobileNumber").value = mobileNumber;
                document.getElementById("editHouseBuilding").value = houseBuilding;
                document.getElementById("editRoadAreaColony").value = roadAreaColony;
                document.getElementById("editPinCode").value = pinCode;
                document.getElementById("editCity").value = city;
                document.getElementById("editState").value = state;
                document.getElementById("editAddressType").value = addressType;
                document.getElementById("editAddressId").value = addressId;
            }
        })
        .catch((error) => {
            displayMessage('Error fetching address for edit.', 'danger');
            console.error("Error fetching address for edit: ", error);
        });
}

// // Add event listeners for edit buttons
// const editButtons = document.querySelectorAll(".edit-address");
// editButtons.forEach((editButton) => {
//     editButton.addEventListener("click", () => {
//         console.log("Edit button clicked");
//         const addressId = editButton.getAttribute("data-address-id");
//         editAddress(addressId);
//     });
// });

// Function to handle address submission
function submitEditedAddress() {

    document.querySelector('#editAddressSubmitBtn').disabled = true
    document.querySelector('#editAddressSubmitBtn').textContent = 'Saving...'

    const fullName = document.getElementById("editFullName").value;
    const mobileNumber = document.getElementById("editMobileNumber").value;
    const houseBuilding = document.getElementById("editHouseBuilding").value;
    const roadAreaColony = document.getElementById("editRoadAreaColony").value;
    const pinCode = document.getElementById("editPinCode").value;
    const city = document.getElementById("editCity").value;
    const state = document.getElementById("editState").value;
    const addressType = document.getElementById("editAddressType").value;


    // Retrieve the edited address data from the form
    const editedAddress = {
        fullName: document.getElementById("editFullName").value,
        mobileNumber: document.getElementById("editMobileNumber").value,
        houseBuilding: document.getElementById("editHouseBuilding").value,
        roadAreaColony: document.getElementById("editRoadAreaColony").value,
        pinCode: document.getElementById("editPinCode").value,
        city: document.getElementById("editCity").value,
        state: document.getElementById("editState").value,
        addressType: document.getElementById("editAddressType").value,
    };

    // Check if any of the required fields are empty
    if (!fullName || !mobileNumber || !houseBuilding || !roadAreaColony || !pinCode || !city || !state || !addressType) {
        // Display a message to the user
        displayMessage("Please fill in all the required details.", "danger");
        document.querySelector('#editAddressSubmitBtn').disabled = false
        document.querySelector('#editAddressSubmitBtn').textContent = 'Save Changes'
        return; // Stop the function execution if any required field is empty
    }

    // Validate first name (minimum 3 characters)
    if (!isValidFullName(fullName) || (!isValidPhoneNumber(mobileNumber)) || (!isValidPinCode(pinCode))) {
        console.log(!isValidFullName(fullName))
        console.log((!isValidPhoneNumber(mobileNumber)))
        document.querySelector('#editAddressSubmitBtn').disabled = false
        document.querySelector('#editAddressSubmitBtn').textContent = 'Save Changes'
        displayMessage('Please check your entered values!', 'danger')
        return; // Stop the function execution if validation fails
    }

    // Save the edited address data to Firestore
    const user = auth.currentUser.uid;
    const addressId = document.getElementById("editAddressId").value;
    console.log(addressId)
    const userAddressRef = doc(firestore, 'users', user, 'addresses', addressId);

    updateDoc(userAddressRef, editedAddress)
        .then(() => {
            displayMessage('Address updated successfully!', 'success');
            fetchAndDisplayAddresses();

            document.querySelector('#editAddressSubmitBtn').disabled = false
            document.querySelector('#editAddressSubmitBtn').textContent = 'Save Changes'
        })
        .catch((error) => {
            displayMessage('Error updating address', 'danger');
            console.error("Error updating address:", error);

            document.querySelector('#editAddressSubmitBtn').disabled = false
            document.querySelector('#editAddressSubmitBtn').textContent = 'Save Changes'
        });
}

// Add an event listener for the submit button in the edit modal
document.getElementById("editAddressSubmitBtn").addEventListener("click", submitEditedAddress);

//********************************pin code api integration************************************

// Function to fetch city and state based on pin code
document.getElementById("editPinCode").addEventListener("input", function () {
    const pinCode = this.value;
    console.log(pinCode)
    if (pinCode.length == 6) {
        fetch(`https://india-pincode-with-latitude-and-longitude.p.rapidapi.com/api/v1/pincode/${pinCode}`, {
            method: "GET",
            headers: {
                'X-RapidAPI-Host': 'india-pincode-with-latitude-and-longitude.p.rapidapi.com',
                "X-RapidAPI-Key": "0a9d852b21mshf63ae2f46afe026p106862jsn399415a4e227",
            },
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                console.log("2")
                if (data && data[0]) {
                    document.getElementById("editCity").value = data[0].district;
                    document.getElementById("editState").value = data[0].state;
                } else {
                    displayMessage('Pin code not found.', 'danger');
                    // alert("Pin code not found.");
                }
            })
            .catch(error => {
                displayMessage('Error fetching pin code data.', 'danger');
                // alert("Error fetching pin code data.");
                console.error(error);
            });
    }
});

//******************************toast message****************************************

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

//*************************Validation**************************
// Function to validate first name (minimum 3 characters)
function isValidFullName(name) {
    return name.length >= 3;
}

// Function to validate phone number (must be exactly 10 digits)
function isValidPhoneNumber(phone) {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phone);
}

// Function to validate pin code (must be exactly 6 digits)
function isValidPinCode(pinCode) {
    return pinCode.length == 6;
}

//***************************************************************

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