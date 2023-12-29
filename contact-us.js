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
            // console.log("User logged out successfully");
            window.location.href = "login.html"; // Redirect to the login page
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

//************************cart dependency**********************************
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
 * 
 * Use onAuthStateChanged to control access to admin dashboard
 */
onAuthStateChanged(auth, (user) => {
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
        docSnap.then((docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                roleAccess(userData.role);
                updateProfileName(userData.role,userData.firstName)
                updateProfilePicture(userData.role,userData.profilePicture)
                updateCart();
                // fetchNavCategories();
            }
        });
    } else {
        console.log("else")
        loggedIn = false;
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
        // window.location.href = "login.html";
        onLoggedOut();
        updateCart();
        // fetchNavCategories();
    }
});

function updateProfileName(role, fullName) {
    // Based on the role, select the appropriate element
    console.log(fullName)
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
    document.querySelector('#overlay').classList.add('hidden');
    document.querySelector('#main').classList.remove('hidden');
}

//Email sending part
document.addEventListener('DOMContentLoaded', function (event) {
    var contactForm = document.getElementById('contactForm');
    // var resultDiv = document.getElementById('result');

    contactForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Collect form data
        var userName = document.getElementById('name').value;
        var email = document.getElementById('email').value;
        var phoneNumber = document.getElementById('phoneNumber').value;
        var message = document.getElementById('message').value;

        //Peform validation
        const nameValid = isValidName(userName);
        const emailValid = isValidEmail(email);
        const phoneNumberValid = isValidPhoneNumber(phoneNumber);
        const messageValid = isMessage(message);

        //Display error
        displayError('nameError', nameValid, '*Please enter your full name')
        displayError('emailError', emailValid, '*Please enter a valid email')
        displayError('phoneNumberError', phoneNumberValid, '*Please enter a valid 10 digit phone number')
        displayError('messageError', messageValid, '*Please fill your message');

        if (nameValid && emailValid && phoneNumberValid && messageValid) {
            console.log("dasadsadsad");
            // All fields are valid, proceed with form submission
            document.querySelector('#sendButton').disabled = true;
            document.querySelector('#sendButton').textContent = 'Submitting ...';
            sendEmail(userName, email, phoneNumber, message);
        }
    });
});

// Email sending function
function sendEmail(userName, email, phoneNumber, message) {
    console.log(userName, email, phoneNumber, message);
    // Perform AJAX request to send email
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.emailjs.com/api/v1.0/email/send', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    var data = JSON.stringify({
        user_id: 'vb9KEKs3BpHBPC0_H',
        service_id: 'service_reh310e',
        template_id: 'template_0lqohuh',
        template_params: {
            'userName': userName,
            'email': email,
            'phoneNumber': phoneNumber,
            'message': message
        }
    });
    // console.log(data);

    xhr.onload = function () {
        if (xhr.status === 200) {
            document.querySelector('#sendButton').disabled = false;
            document.querySelector('#sendButton').textContent = 'Submit';
            // resultDiv.textContent = 'Your mail is sent!';
            displayMessage('Your mail is sent!', 'success');
            document.getElementById('contactForm').reset();
        } else {
            document.querySelector('#sendButton').disabled = false;
            document.querySelector('#sendButton').textContent = 'Submit';
            // resultDiv.textContent = 'Oops... ' + xhr.responseText;
            displayMessage('Something went wrong!, Try again.', 'danger');
            document.getElementById('contactForm').reset();
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