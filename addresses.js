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

//global
var userData = null;
var loggedIn = null;


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
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions(){
    await updateCart();
    // await fetchNavCategories();
}

// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, async (user) => {
    if (user) {
        loggedIn = true

        onLoggedIn();

        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then(async (docSnapshot) => {
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                console.log(userData.role)
                roleAccess(userData.role);
                updateProfileName(userData.role,userData.firstName);
                updateProfilePicture(userData.role,userData.profilePicture)
            }
        });
    } else {
        window.location.href = "login.html";
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
    }
    await postPageLoadFunctions()
});

/**
 * 
 * @param {*} role 
 * @param {*} fullName 
 * @returns 
 * @author mydev
 */
function updateProfileName(role, fullName) {
    console.log(fullName)
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
 * @param {*} profilePicture 
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


//event for phone number validation
document.querySelector("#phone").addEventListener("keyup", () => {
    // Validate phone number
    if (!isValidPhoneNumber(document.querySelector("#phone").value)) {
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
document.querySelector("#displayName").addEventListener("keyup", () => {
    if (!isValidFullName(document.querySelector("#displayName").value)) {
        // Display an error message
        document.getElementById("nameError").textContent =
            "*Name must be at least 3 characters.";
    }
    else {
        document.getElementById("nameError").textContent = ''
    }
});

//---------------------------------pin code api integration-------------------------------------
// Function to fetch city and state based on pin code
document.getElementById("pinCode").addEventListener("input", function () {
    const pinCode = this.value;
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
                if (data && data[0]) {
                    document.getElementById("city").value = data[0].district;
                    document.getElementById("state").value = data[0].state;
                } else {
                    displayMessage('Pin code not found.', 'danger');
                }
            })
            .catch(error => {
                displayMessage('Error fetching pin code data.', 'danger');
                console.error(error);
            });
    }
});

//------------------------------------------------------------------------------

// Function to get the current default address
async function getCurrentDefaultAddress() {
    const user = auth.currentUser.uid;
    const userAddressesRef = collection(firestore, 'users', user, 'addresses');
    const querySnapshot = await getDocs(query(userAddressesRef, where("isDefault", "==", true)));

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0]; // Return the first document with isDefault=true
    } else {
        return null; // No default address found
    }
}
//---------------------------------------------------------------------------------    

// Event listener for the address form submission
document.getElementById("addressForm").addEventListener("submit", async function (event) {

    document.querySelector('#addAddressBtn').disabled = true
    document.querySelector('#addAddressBtn').textContent = 'Adding Address...'
    event.preventDefault();

    const user = auth.currentUser.uid;

    // Get all the form input values
    const fullName = document.getElementById("displayName").value;
    const mobileNumber = document.getElementById("phone").value;
    const houseBuilding = document.getElementById("houseBuilding").value;
    const roadAreaColony = document.getElementById("roadAreaColony").value;
    const pinCode = document.getElementById("pinCode").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const addressType = document.getElementById("addressType").value;

    try {
        // Check if any of the required fields are empty
        if (!fullName || !mobileNumber || !houseBuilding || !roadAreaColony || !pinCode || !city || !state || !addressType) {
            // Display a message to the user
            displayMessage("Please fill in all the required details.", "danger");
            document.querySelector('#addAddressBtn').disabled = false
            document.querySelector('#addAddressBtn').textContent = 'Add Address'
            return; // Stop the function execution if any required field is empty
        }

        // Validate first name (minimum 3 characters)
        if (!isValidFullName(fullName) || (!isValidPhoneNumber(mobileNumber)) || (!isValidPinCode(pinCode))) {
            console.log(!isValidFullName(fullName))
            console.log((!isValidPhoneNumber(mobileNumber)))
            console.log((!isValidPinCode(pinCode)))
            document.querySelector('#addAddressBtn').disabled = false
            document.querySelector('#addAddressBtn').textContent = 'Add Address'
            displayMessage('Please check your entered values!', 'danger')
            return; // Stop the function execution if validation fails
        }

        // Create an object with the address data
        const addressData = {
            fullName,
            mobileNumber,
            houseBuilding,
            roadAreaColony,
            pinCode,
            city,
            state,
            addressType,
            isDefault: false,
        };

        // Reference to the user's addresses collection
        const userAddressesRef = collection(firestore, 'users', user, 'addresses');
        // Add the address data to Firestore

        // Check if this is the first address being added
        const isFirstAddress = !(await getCurrentDefaultAddress());

        // Add the address data to Firestore
        const newAddressRef = await addDoc(userAddressesRef, addressData);

        // Add the address Id
        await updateDoc(newAddressRef, {addressId: newAddressRef.id});

        if (isFirstAddress) {
            // If this is the first address, set it as the default address
            await updateDoc(newAddressRef, { isDefault: true });
        }

        // Address added successfully
        console.log("Address added to Firestore");

        // Display a success message to the user
        displayMessage("Address added successfully.", "success");

        document.querySelector('#addAddressBtn').disabled = false
        document.querySelector('#addAddressBtn').textContent = 'Add Address'

        // Reset the form after adding the address
        document.getElementById("addressForm").reset();
    } catch (error) {
        // Handle errors here
        console.error("Error adding address to Firestore: ", error);

        // Display an error message to the user
        displayMessage("Error adding address. Please try again.", "danger");

        document.querySelector('#addAddressBtn').disabled = false
        document.querySelector('#addAddressBtn').textContent = 'Add Address'
    } finally {
        document.querySelector('#addAddressBtn').disabled = false;
        document.querySelector('#addAddressBtn').textContent = 'Add Address';
    }
});


//------------------------------------ Toast Message--------------------------------

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

//------------------------------------ Validation --------------------------------------------- 
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

//--------------------------------------------------------------------------------- 

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

// -------------------------------openstreetmap----------------------------------------
// To get user location

let locationbutton = document.getElementById("get-loc");
let locationdiv = document.getElementById("location-detailsLabel");

locationbutton.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showlocation, checkerror);
    } else {
        locationdiv.innerText = "the browser does not support geolocation";
    }
});

const checkerror = (error) => {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            locationdiv.innerText = "please allow access to location";
            break;
        case error.POSITION_UNAVAILABLE:
            locationdiv.innerText = "location information unavailable";
            break;
        case error.TIMEOUT:
            locationdiv.innerText = "this request to get user location is timed out";
            break;

    }
};

const showlocation = async (position) => {
    let response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=en`);
    let data = await response.json();

    console.log(data);
    try {
        displayMessage('Location found', 'success');
        locationdiv.innerHTML = `${data.address.neighbourhood
                ? `${data.address.neighbourhood},${data.address.city},${data.address.state},${data.address.country},${data.address.postcode}`
                : data.address.road
                    ? `${data.address.road},${data.address.city},${data.address.state},${data.address.country},${data.address.postcode}`
                    : data.address.city_district
                        ? `${data.address.city_district},${data.address.city},${data.address.state},${data.address.country},${data.address.postcode}`
                        : `${data.address.suburb},${data.address.city},${data.address.state},${data.address.country},${data.address.postcode}`
            }`;
    } catch (error) {
        displayMessage('Unable to retrieve location. Please reload the page.', 'danger');


        console.error('Error:', error);
    }

    // locationdiv.innerHTML = `<h4>Location found</h4>\n${
    //     data.address.neighbourhood
    //       ? `${data.address.neighbourhood},${data.address.city},${data.address.state},${data.address.country},${data.address.postcode}`
    //       : data.address.road
    //         ? `${data.address.road},${data.address.city},${data.address.state},${data.address.country},${data.address.postcode}`
    //         : data.address.city_district
    //           ? `${data.address.city_district},${data.address.city},${data.address.state},${data.address.country},${data.address.postcode}`
    //           : `${data.address.suburb},${data.address.city},${data.address.state},${data.address.country},${data.address.postcode}`
    //   }`;


    // Add an event listener to the "Confirm Address" button
    document.getElementById("confirmAddressBtn").addEventListener("click", () => {
        // Populate the form fields based on the condition
        document.getElementById("roadAreaColony").value = data.address.neighbourhood || data.address.road || data.address.city_district || data.address.suburb;
        document.getElementById("pinCode").value = data.address.postcode;
        document.getElementById("city").value = data.address.city;
        document.getElementById("state").value = data.address.state;

        // Close the modal after confirming the address
        $('#location-details').modal('hide');
    });
};