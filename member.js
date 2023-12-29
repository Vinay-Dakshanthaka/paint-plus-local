//Auth
import {
    auth,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
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

import { firebaseErrorHandler } from './assets/js/error.js'
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var userData = null;
var loggedIn = null;

// Function to check if the user is logged in
function isUserLoggedIn() {
    return !!auth.currentUser;
}


// Add an event listener to the confirmation logout button
confirmLogoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // Redirect to the login page or perform any other actions
            // console.log("User logged out successfully");
            window.location.href = "login.html"; // Redirect to the login page
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

/**
 * Necessary event listeners to call after pageload
 * 
 * @author dev
 */

    document.getElementById('memberForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserDetails(e);
    })


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



/**
 * 
 * Use onAuthStateChanged to control access to admin dashboard
 * @author mydev
 */
onAuthStateChanged(auth, async (user) => {
    console.log("inside onAuth")
    if (user) {
        console.log("if")
        loggedIn = true
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })

        onLoggedIn();
        // User is authenticated
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then(async (docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                roleAccess(userData.role);
                updateProfileName(userData.role, userData.firstName)
                updateProfilePicture(userData.role, userData.profilePicture)
                await getCurrentUserDetails();
            }
        });
    } else {
        console.log("else")
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })

        loggedIn = false;
        window.location.href = "register.html";
        onLoggedOut();
    }
    await postPageLoadFunctions()
});

function updateProfileName(role, fullName) {
    // Based on the role, select the appropriate element
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

// Event listener for occupation dropdown
const occupationDropdown = document.getElementById('occupation');
const occupationInputField = document.getElementById('occupationInputField');

occupationDropdown.addEventListener('change', function () {
    if (this.value === 'others') {
        // If 'Others' is selected, show the input field
        occupationInputField.classList.remove('d-none')
    } else {
        // If any other option is selected, hide the input field
        occupationInputField.classList.add('d-none')
    }
});

//Email sending part
async function getCurrentUserDetails() {
    var memberForm = document.getElementById('memberForm');
    var userName = document.getElementById('name');
    var email = document.getElementById('email');
    var phoneNumber = document.getElementById('phoneNumber');
    const user = auth.currentUser;
    if (user) {
        const uid = user.uid;

        // Get user document from Firestore
        const userDocRef = doc(firestore, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            console.log("if")
            const userData = userDocSnap.data();
            console.log(userData);
            email.value = userData.email || '';
            phoneNumber.value = userData.phoneNumber || '';

            // Assuming your Firestore document has 'firstName' and 'lastName' fields
            const firstName = userData.firstName || '';
            const lastName = userData.lastName || '';

            // Update the full name in the form
            userName.value = `${firstName} ${lastName}`;
        }
    }

    let nameValid = isValidName(userName.value);
    let emailValid = isValidEmail(email.value);
    let phoneNumberValid = isValidPhoneNumber(phoneNumber.value);
    console.log(nameValid, emailValid, phoneNumberValid);
}

// Function to validate occupation
function isValidOccupation(occupation, otherOccupation) {
    if (occupation === 'others') {
        return otherOccupation.trim() !== '';
    }
    return true;
}

// Function to validate UPI ID
// function isValidUPI(upi) {
//     const upiPattern = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+$/;
//     return upiPattern.test(upi);
// }

// Function to save user details in Firestore
async function saveUserDetails(e) {
    console.log(e);

    document.querySelector('#sendButton').disabled = true;
    document.querySelector('#sendButton').textContent = 'Submitting ...';

    var userName = document.getElementById('name').value;
    var email = document.getElementById('email').value;
    var phoneNumber = document.getElementById('phoneNumber').value;
    var occupation = document.getElementById('occupation').value;
    var otherOccupation = document.getElementById('otherOccupation').value;
    var message = document.getElementById('message').value;
    // var upi = document.getElementById('upi').value;

    let nameValid = isValidName(userName);
    let emailValid = isValidEmail(email);
    let phoneNumberValid = isValidPhoneNumber(phoneNumber);
    let occupationValid = isValidOccupation(occupation, otherOccupation);
    let messageValid = isMessage(message);
    // let upiValid = isValidUPI(upi);

    console.log(nameValid, emailValid, phoneNumberValid, occupationValid, messageValid)
    if (nameValid && emailValid && phoneNumberValid && occupationValid && messageValid) {
        try {
            // Extract additional details from the form
            await updateDoc(doc(firestore, 'users', auth.currentUser.uid), {
                // upi: upi,
                message: message,
                occupation: occupation,
                membershipInactiveStatus: false,
                membershipPendingStatus: true,
                membershipActiveStatus: false
            });

            // Display success message and reset the form
            document.querySelector('#sendButton').disabled = false;
            document.querySelector('#sendButton').textContent = 'Submit';
            displayMessage('Details saved successfully!', 'success');

            sendEmail(userName, email, phoneNumber, occupation, message);

            document.getElementById('memberForm').reset();

        } catch (error) {
            // Handle errors
            firebaseErrorHandler(error)
        }
    }
    e.preventDefault()
}

// Email sending function
async function sendEmail(userName, email, phoneNumber, occupation, message) {
    console.log(userName, email, phoneNumber, message);
    // Perform AJAX request to send email
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.emailjs.com/api/v1.0/email/send', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    var data = JSON.stringify({
        user_id: '9vI1CaPihFLVZy2y1',
        service_id: 'service_acgo5sc',
        template_id: 'template_v843hvk',
        template_params: {
            'userName': userName,
            'email': email,
            'phoneNumber': phoneNumber,
            'occupation': occupation,
            'message': message,
            // 'upi': upi
        }
    });
    // console.log(data);

    xhr.onload = function () {
        if (xhr.status === 200) {
            document.querySelector('#sendButton').disabled = false;
            document.querySelector('#sendButton').textContent = 'Submit';
            // resultDiv.textContent = 'Your mail is sent!';
            displayMessage('Your mail is sent!', 'success');
            document.getElementById('memberForm').reset();
        } else {
            document.querySelector('#sendButton').disabled = false;
            document.querySelector('#sendButton').textContent = 'Submit';
            // resultDiv.textContent = 'Oops... ' + xhr.responseText;
            displayMessage('Something went wrong!, Try again.', 'danger');
            document.getElementById('memberForm').reset();
        }
    };
    console.log(data);
    xhr.send(data);
}

//*************************************toast message**********************************
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
function isValidName(name) {
    return name.length >= 3;
}

//Function to validate email 
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Function to validate phone number (must be exactly 10 digits)
function isValidPhoneNumber(phoneNumber) {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phoneNumber);
}

function isMessage(message) {
    return message.length >= 3;
}

// Function to display error messages
function displayError(errorElementId, isValid, errorMessage) {
    const errorElement = document.getElementById(errorElementId);
    if (!isValid) {
        errorElement.textContent = errorMessage;
    } else {
        errorElement.textContent = "";
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