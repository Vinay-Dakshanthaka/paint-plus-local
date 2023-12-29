//------------------------Firebase Config-----------------------
//Auth
import {
    auth,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    getUserSnapshot
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
import { getCartDocsQuerySnapshot } from './assets/repository/userCart/userCart.js';

var userData = null;
let loggedIn = false
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

//*************************************global scripts********************************************
/**
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions() {
    await updateCart();
    // await fetchNavCategories();
}

//**********************************************************************************************

// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, async (user) => {
    const adminAppbar = document.getElementById("adminAppbar");
    const userAppbar = document.getElementById("userAppbar");
    // const agentAppbar = document.getElementById("agentAppbar");

    if (user) {
        console.log("if")
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })

        // const docRef = doc(firestore, "users", user.uid);
        onLoggedIn();
        const docSnap = getUserSnapshot(user.uid);
        var userData = null;
        docSnap.then(async (docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                console.log("from onAuthStateChanged")
                loggedIn = true
                userData = docSnapshot.data();
                roleAccess(userData.role);
                updateProfileName(userData.role, userData.firstName)
                updateProfilePicture(userData.role, userData.profilePicture)
            }
        });
    } else {
        // User is not logged in
        loggedIn = false

        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
    }
    await postPageLoadFunctions();
});

//*****************************loading and role access************************************
function roleAccess(role) {
    // console.log('inside role')
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
        // ["AGENT", "agentAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    let vdsf = ""
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
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

//******************************event listener********************************************
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
//****************************************************************************************

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

//******************************************cart dependency**********************************
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
            const cartSnapshot = await getCartDocsQuerySnapshot(loggedIn, auth.currentUser.uid);
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

// //get user snapshot cart(dependency)
// function getUserSnapshot(uid) {
//     const userRef = doc(firestore, 'users', uid)
//     console.log('3')
//     return new Promise((resolve, reject) => {
//         resolve(getDoc(userRef))
//     })
// }
//*******************************************************************************************

//*******************************************event listener**************************************
document.getElementById("signupForm").addEventListener("submit", submitForm);

//event for firstName validation
document.querySelector("#firstName").addEventListener("keyup", () => {
    if (!validateFirstName(document.querySelector("#firstName").value)) {
        // Display an error message
        document.getElementById("firstNameError").textContent =
            "*Name must have at least 3 characters.";
    }
    else {
        document.getElementById("firstNameError").textContent = ''
    }
});

//event for firstName validation
document.querySelector("#phoneNumber").addEventListener("keyup", () => {
    if (!validatePhoneNumber(document.querySelector("#phoneNumber").value)) {
        // Display an error message
        document.getElementById("phoneNumberError").textContent =
            "*Phone number must have 10 digits.";
        document.getElementById("phoneNumberError").style.scale = "1"
    }
    else {
        document.getElementById("phoneNumberError").textContent = ''
    }
});

//event for firstName validation
document.querySelector("#email").addEventListener("keyup", () => {
    if (!validateEmail(document.querySelector("#email").value)) {
        // Display an error message
        document.getElementById("emailError").textContent =
            "*Please enter a valid email.";
    }
    else {
        document.getElementById("emailError").textContent = ''
    }
});

//event for firstName validation
document.querySelector("#password").addEventListener("keyup", () => {
    if (!validatePassword(document.querySelector("#password").value)) {
        // Display an error message
        document.getElementById("passwordError").textContent =
            "*Password must have atleast 6 characters.";
    }
    else {
        document.getElementById("passwordError").textContent = ''
    }
});

// Function to toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById("password");
    const passwordToggle = document.getElementById("passwordToggle");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordToggle.classList.remove("fi-rr-eye");
        passwordToggle.classList.add("fi-rr-eye-crossed");
    } else {
        passwordInput.type = "password";
        passwordToggle.classList.remove("fi-rr-eye-crossed");
        passwordToggle.classList.add("fi-rr-eye");
    }
}

// Add a click event listener to the password toggle icon
const passwordToggle = document.getElementById("passwordToggle");
if (passwordToggle) {
    passwordToggle.addEventListener("click", togglePasswordVisibility);
}

// Function to validate the referralCode format
// function isValidReferralCode(referralCode) {
//     // const referralCodeRegex = /^[a-zA-Z0-9]{20}$/;
//     const referralCodeRegex = /^[a-zA-Z0-9]{12}$/;
//     return referralCodeRegex.test(referralCode);
// }

// Function to validate referralCode against AGENT roles
// async function validateReferralCode(referralCode) {
//     const agentsCollection = collection(firestore, "users");
//     const q = query(
//         agentsCollection,
//         where("role", "==", "AGENT"),
//         where("membershipId", "==", referralCode)
//     );

//     const querySnapshot = await getDocs(q);
//     return !querySnapshot.empty;
// }

// Submit form
async function submitForm(e) {
    e.preventDefault();

    document.querySelector('#sub_btn').textContent = 'Signing up ...'
    document.querySelector('#sub_btn').disabled = true

    // Get values
    const firstName = getInputVal("firstName");
    const lastName = getInputVal("lastName");
    const phoneNumber = getInputVal("phoneNumber");
    const email = getInputVal("email");
    const password = getInputVal("password");
    // const referralCode = getInputVal("referralCode");
    const role = "CUSTOMER";

    // Perform validation
    const firstNameValid = validateFirstName(firstName);
    const phoneNumberValid = validatePhoneNumber(phoneNumber);
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    // Display error
    displayError("firstNameError", firstNameValid, "Please enter a valid first name");
    displayError("phoneNumberError", phoneNumberValid, "Please enter a valid phone number");
    displayError("emailError", emailValid, "Please enter a valid email");
    displayError("passwordError", passwordValid, "Please enter a valid password");

    // Clear referral code error message
    // document.getElementById("referralCodeError").textContent = "";

    // Initialize referral code error flag
    // let referralCodeError = false;

    // Validate referral code format if provided
    // if (referralCode.trim() !== "") {
    //     if (!isValidReferralCode(referralCode)) {
    //         referralCodeError = true;
    //         document.getElementById("referralCodeError").textContent = "Referral code must have 12 alphanumeric characters.";
    //     } else {
    //         // Validate referral code against AGENT roles
    //         const isReferralCodeValid = await validateReferralCode(referralCode);
    //         if (!isReferralCodeValid) {
    //             referralCodeError = true;
    //             document.getElementById("referralCodeError").textContent = "AGENT not found with this Referral Code. Please try again.";
    //         }
    //     }
    // }

    // Send message values to Firestore
    if (
        firstNameValid &&
        phoneNumberValid &&
        emailValid &&
        passwordValid
        // !referralCodeError
    ) {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;
            const uid = user.uid; // Get the UID from Firebase Authentication

            // Save user data to Firestore
            const usersRef = collection(firestore, "users");
            const userDocRef = doc(usersRef, uid); // Reference to the user's document using UID
            const encryptedPassword = encPass(password);

            //*********************************membership validation and document creation***************************
            // Create a reference to the agent's document based on the referral code
            // const agentQuery = query(
            //     collection(firestore, "users"),
            //     where("membershipId", "==", referralCode)
            // );
            // const agentQuerySnapshot = await getDocs(agentQuery);
            // console.log(referralCode.textContent)
            // const agentDoc = agentQuerySnapshot.docs[0];

            const userSnapshot = await getDoc(userDocRef);

            // Determine the referredStatus based on the referralCode
            // const referredStatus = !!agentDoc;

            if (userSnapshot.empty) {
                await setDoc(userDocRef, {
                    firstName: firstName,
                    lastName: lastName,
                    phoneNumber: phoneNumber,
                    email: email,
                    password: encryptedPassword,
                    role: role,
                    // referralCode: referralCode,
                    // referredStatus: referredStatus
                });
            }
            else {
                await setDoc(userDocRef, {
                    firstName: firstName,
                    lastName: lastName,
                    phoneNumber: phoneNumber,
                    email: email,
                    password: encryptedPassword,
                    role: role,
                    // referredStatus: referredStatus,
                    // membershipInactiveStatus:true,
                    // membershipPendingStatus:false,
                    // membershipActiveStatus:false
                });
            }
            // console.log("3")
            // Show success message
            document.querySelector('#sub_btn').textContent = 'Submit'
            displayMessage("Signup Successful!", 'success')
            console.log()
            // await signInWithEmailAndPassword(auth, email, password)
            await signOut(auth)

            // Clear form
            document.getElementById("signupForm").reset();
            document.querySelector('#sub_btn').disabled = false


            // Redirect to the login page
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } catch (error) {
            document.querySelector('#sub_btn').textContent = 'Submit'
            document.querySelector('#sub_btn').disabled = false
            console.error("Create user error:", error);
            // Handle error appropriately (e.g., display an error message to the user)
            if (error.code && error.code.startsWith("auth/")) {
                const errorCode = error.code.split('/')[1]
                // console.log(errorCode)
                if (errorCode === 'email-already-in-use') {
                    document.querySelector('#emailError').textContent = errorCode.split('-').join(' ')
                    document.querySelector('#sub_btn').textContent = 'Submit'
                    document.querySelector('#sub_btn').disabled = false
                }
                else {
                    document.querySelector('#sub_btn').textContent = 'Submit'
                    document.querySelector('#sub_btn').disabled = false
                    document.querySelector('#authError').textContent = error.message.match(/Firebase:(.*)\(auth\/.*\)/)[1];
                }
            }
        }
    }
    else {
        document.querySelector('#sub_btn').textContent = 'Submit'
        document.querySelector('#sub_btn').disabled = false
    }

}

// Function to get form values
function getInputVal(id) {
    return document.getElementById(id).value;
}

// Encrypt password
function encPass(password) {
    const secretKey = "yourSecretKey";
    const encryptPassword = CryptoJS.AES.encrypt(
        password,
        secretKey
    ).toString();
    // console.log(encryptPassword);
    return encryptPassword;
}

//*************************Validation**************************
// Function to validate first name (minimum 3 characters)
function validateFirstName(name) {
    return name.length >= 3;
}

function validatePhoneNumber(phoneNumber) {
    const phoneNumberPattern = /^\d{10}$/;
    return phoneNumberPattern.test(phoneNumber);
}

function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
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

//*******************************toast message******************************
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