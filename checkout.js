import {
    onAuthStateChanged,
    signOut,
    firestore,
    auth
} from "./assets/repository/initialize.js";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    addDoc,
    deleteDoc,
    getCountFromServer,
    doc
} from "./assets/repository/initialize.js";
import {
    ref,
    uploadBytes
} from "./assets/repository/initialize.js";
import { firebaseErrorHandler } from './assets/js/error.js'
import { getProductPrice } from "./assets/repository/products/products.js";


var loggedIn = false
var summary = null
let cartList = null
let bill = null
let orderId = generateOrderId()
let productSnapshot = null
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

const urlParam = new URLSearchParams(window.location.search)
if (sessionStorage.getItem('bill')) {
    bill = JSON.parse(sessionStorage.getItem('bill'))
    sessionStorage.removeItem('bill')
    console.log(bill)
}
else {
    window.location.href = 'cart.html'
}


let amount = 500
let options = {
    "key": "rzp_test_URpF9Gekqvl3jD", // Enter the Key ID generated from the Dashboard
    "amount": amount * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    "currency": "INR",
    "name": "Paint Plus", //your business name
    "description": "Test Transaction",
    "image": "./assets/img/logo/logo.png",
    //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    "handler": function (response) {
        console.log(response.razorpay_payment_id + "Payment successfull");
        window.sessionStorage.href = 'products.html'
    },
    "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
        "name": "Gaurav Kumar", //your customer's name
        "email": "gaurav.kumar@example.com",
        "contact": "9000090000"  //Provide the customer's phone number for better conversion rates 
    }
};


/**
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions() {
    document.querySelector('.order-id').textContent = orderId
    await updateCart();
    // await fetchNavCategories();
    await postPageLoadAddressAction()
    await updateSummary()
}

/**
 * Necessary event listeners to call after pageload
 * 
 * @author dev
 */
async function postPageLoadEventListener() {
    document.querySelectorAll('.address-option').forEach(input => {
        input.addEventListener('change', changeAddressTab)
    })

    document.querySelector('#rzp-button1').addEventListener('click', payment)
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

/**
 * check loggedIn or loggedOut state
 * Use onAuthStateChanged to control access to admin dashboard
 */
onAuthStateChanged(auth, async (user) => {
    const adminAppbar = document.getElementById("adminAppbar");
    const userAppbar = document.getElementById("userAppbar");
    // const agentAppbar = document.getElementById("agentAppbar");

    if (user) {
        //check if local storage has cart information
       
        if (!localStorage.getItem('checkoutSummary')) {
            // location.href = 'cart.html'
        }
        // User is logged in
        onLoggedIn();

        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        var userData = null;
        loggedIn = true
        console.log('onauth', 3)
        console.log('onauth', 5)
        docSnap.then((docSnapshot) => {
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                roleAccess(userData.role);
                onLoggedIn();
                updateProfileName(userData.role, userData.firstName);
                updateProfilePicture(userData.role, userData.profilePicture);

            }
        });
    } else {
        onLoggedOut();
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
        loggedIn = false;
    }
    console.log('onauth', 6)
    await postPageLoadFunctions()
    await postPageLoadEventListener()
});

/**
 * 
 * @param {*} role 
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
 * 
 * @param {*} role 
 * @param {*} fullName 
 * @returns 
 */
function updateProfileName(role, fullName) {
    console.log(fullName)
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

/**
 * 
 * @param {*} role 
 * @param {*} profilePicture 
 * @returns 
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
    } else {
        profilePictureElement.src = defaultProfilePicture;
    }
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

function showLoader(value1, value2) {
    const overlayContainer = document.querySelector(".overlay-container")
    document.querySelector("#overlay").classList.remove("hidden");
    document.querySelector("#main").classList.add("hidden");

    var waitBox = document.querySelector('.wait-box').cloneNode(true)
    waitBox.querySelector('.wait-box-content').textContent = value1
    waitBox.style.display = 'block'
    overlayContainer.appendChild(waitBox)

    setTimeout(() => {
        waitBox = document.querySelector('.wait-box').cloneNode(true)
        waitBox.querySelector('.wait-box-content').textContent = value2
        waitBox.style.display = 'block'
        overlayContainer.appendChild(waitBox)
    }, 5000);
}


//****************************Fetch saved address**********************
async function fetchAllAddress() {
    //get the user doc id
    const uid = auth.currentUser.uid

    //get the addresses
    const addressSanpshot = await getDocs(collection(firestore, 'users', uid, 'addresses'))
    const addressContainer = document.querySelector('.saved-addresses')
    addressContainer.innerHTML = ''

    if (addressSanpshot.empty) {
        document.querySelector('#addAddressForm').style.display = 'block'
        document.querySelector('.saved-address-container').style.display = 'none'
        addressContainer.appendChild(document.querySelector('.no-address-msg').cloneNode(true))
        document.querySelector('.no-address-msg').classList.remove('d-none')
        return
    }
    else {
        document.querySelector('#addAddressForm').style.display = 'none'
        document.querySelector('.saved-address-container').style.display = 'block'
        document.querySelector('.no-address-msg').classList.add('d-none')
        // document.querySelector('.no-address-msg').style.display = 'none'
        // console.log(document.querySelector('.no-address-msg').style.display)
    }

    //hide address form
    document.querySelector('#addAddressForm').style.display = 'none'

    addressSanpshot.forEach(doc => {
        //get address container

        //address data
        const addressData = doc.data()

        // Create a Bootstrap card for each address
        const card = document.createElement("div");
        card.classList.add('selected-address')
        card.innerHTML = `
                        <div class="row rounded mb-3 justify-content-center">
                            <div class="card card-animation shadow col-9">
                                <div class="card-body" data-id="${doc.id}">
                                    <div class="d-flex justify-content-between">
                                        <h5 class="card-title">${addressData.fullName}</h5>
                                        <div class="${addressData.isDefault ? '' : 'd-none'}"><h6 class="badge bg-success d-inline">Default</h6></div>
                                    </div>
                                    <h6 class="card-subtitle text-muted">${addressData.mobileNumber}</h6>
                                    <p class="card-text">${addressData.houseBuilding}, ${addressData.roadAreaColony}<br>${addressData.pinCode}, ${addressData.city}, ${addressData.state}</p>
                                    <p class="card-text">Type: ${addressData.addressType}</p>
                                </div>
                            </div>
                        </div>
                        `;

        //add the address to container
        addressContainer.appendChild(card)

        card.addEventListener('click', (event) => {
            const deliverAddressContainer = document.querySelector('.deliver-address-container')
            deliverAddressContainer.innerHTML = ''
            deliverAddressContainer.appendChild(event.target.closest('.selected-address').cloneNode(true))

        })

        if (addressData.isDefault) {
            card.click()
        }
    })
}
//************************************************************************************

//******************************create checkout summary*******************************
// function checkoutSummary() {
//     console.log('inside checkout summary')
//     summary = JSON.parse(localStorage.getItem('checkoutSummary'))
//     localStorage.removeItem('checkoutSummary')
//     console.log(summary)
//     const itemsContainer = document.querySelector('.items')
//     const billContainer = document.querySelector('.bill')

//     summary.items.forEach(item => {
//         //create checkout item
//         console.log('1')
//         const checkoutItem = document.querySelector('.checkout-item').cloneNode(true)
//         checkoutItem.setAttribute('id', `product-${item.productId}`)
//         checkoutItem.querySelector('.product-name').textContent = item.productName
//         checkoutItem.querySelector('.product-categoryName').textContent = item.productCategory
//         checkoutItem.querySelector('.product-color').textContent = item.productColor
//         checkoutItem.querySelector('.product-colorShadeName').textContent = item.productColorShade
//         checkoutItem.querySelector('.product-size').textContent = item.productSize
//         checkoutItem.querySelector('.product-price').textContent = item.productPrice
//         checkoutItem.querySelector('.product-total').textContent = item.productTotal
//         checkoutItem.querySelector('.product-quantity').textContent = item.productQuantity
//         checkoutItem.style.display = 'block'

//         //add to container 
//         itemsContainer.appendChild(checkoutItem)
//     })

//     // create bill summary
//     const billSummary = document.querySelector('.bill-summary').cloneNode(true)
//     billSummary.querySelector('.bill-subtotal').textContent = summary.billSummary.subTotal
//     billSummary.querySelector('.bill-delivery-fee').textContent = summary.billSummary.deliveryFee
//     billSummary.querySelector('.bill-grand-total').textContent = summary.billSummary.grandTotal
//     billSummary.style.display = 'block'

//     //add to summary
//     billContainer.appendChild(billSummary)

//     //add referral id
//     if (summary.referralId) {
//         const referral = document.querySelector('.referral-id').cloneNode(true)
//         referral.querySelector('.user-referral').textContent = summary.referralId
//         referral.classList.remove('d-none')

//         document.querySelector('.referral-container').appendChild(referral)
//     }

//     document.querySelector('#checkout-overlay').classList.add('hidden')

// }

//****************************add new address************************************

//event for phone number validation
document.querySelector("#phone").addEventListener("keyup", () => {
    if (!isValidPhoneNumber(document.querySelector("#phone").value)) {
        document.getElementById("phoneError").textContent =
            "*Phone number must be 10 digits.";
        document.getElementById("phoneError").style.scale = "1"
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

// Event listener for the address form submission
document.querySelector(".addressForm").addEventListener("submit", async function (event) {

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
        await updateDoc(newAddressRef, { addressId: newAddressRef.id });

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
        document.querySelector(".addressForm").reset();
        showOverlay()
        await postPageLoadAddressAction()
        hideOverlay()
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


function getAddress() {
    const deliverAddressContainer = document.querySelector('.deliver-address-container')
    const addressElement = deliverAddressContainer.querySelector('.selected-address')
    const fullName = addressElement.querySelector('.card-title').textContent;
    const mobileNumber = addressElement.querySelector('.card-subtitle').textContent;
    var addressLines = addressElement.querySelector('.card-text').innerHTML;
    addressLines = addressLines.replace(/<br>/gi, '\n');
    addressLines = addressLines.split('\n')
    const addressType = addressElement.querySelector('.card-text:last-child').textContent.split(': ')[1];

    // Format the address as a single string
    const formattedAddress = `${fullName}\n${mobileNumber}\n${addressLines[0]}\n${addressLines[1]}\n${addressType}`;

    return formattedAddress;

}

async function createOrder(event) {
    if (!document.querySelector('.deliver-address-container .selected-address')) {
        displayMessage('Pls provide a delivery address!', 'danger')
        return
    }

    await deleteCartItems()

    showLoader('Placing order. Please wait ...', 'Its taking longer than expected.')
    elementSpinner(event.target, true, '')
    console.log(event.target)
    //object skeleton
    // const itemPrototype = {
    //     productName: "",
    //     productPrice: "",
    //     productQuantity: 0
    // }
    // const checkoutSummary = {
    //     referralId: 
    //     items: [],
    //     billSummary: {
    //         subTotal: 0,
    //         deliveryFee: 0,
    //         grandTotal: 0
    //     }
    // }

    const currentDate = new Date()
    const orderRef = collection(firestore, 'orders')
    const productRef = collection(firestore, 'products')
    const userRef = collection(firestore, 'users', auth.currentUser.uid, 'orders')

    //orderId
    const orderId = getUniqueOrderId();

    // Format the time to AM/PM format
    const currentTime = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Use 12-hour clock with AM/PM
    });

    const result = await addDoc(orderRef,
        {
            summary: summary,
            address: getAddress(),
            paymentMethod: 'credit/debit',
            orderId: orderId,
            state: 'order_placed',
            date: currentDate.toLocaleDateString(),
            time: currentTime,
            customer: doc(firestore, 'users', auth.currentUser.uid),
            calculatedCommission: summary.referralId ? await getCalculatedCommission(summary.billSummary.subTotal) : null
        }
    )

    await addDoc(userRef, {
        orderId: orderId,
        orderRef: doc(orderRef, result.id),
        date: currentDate.toLocaleDateString(),
        time: currentTime,
    })

    summary.items.forEach(async (item) => {
        const itemSnapshot = await getDocs(query(productRef, where('productId', "==", item.productId)))
        var productData = itemSnapshot.docs[0].data()
        productData.quantity -= item.productQuantity
        console.log(itemSnapshot.docs[0].ref)
        await updateDoc(itemSnapshot.docs[0].ref, productData)
    })


    elementSpinner(event.target, false, 'Pay now')
    localStorage.removeItem('checkoutSummary')
    document.querySelector('#main').style.display = 'none'
    document.querySelector('#success').style.display = 'block'
    document.querySelector('#overlay').style.display = 'none'
}

//show spinner in element
function elementSpinner(element, state, value) {
    if (state) {
        const width = getComputedStyle(element).width
        const height = getComputedStyle(element).height

        //disable button
        element.disabled = true

        //show loader
        element.innerHTML = `<div class="d-flex justify-content-center align-items-center">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                </div>`

        element.style.height = height
        // element.style.margin = '0'
        element.style.padding = '0'
        element.style.width = width
        element.querySelector('.spinner-border').style.scale = `0.7`
    }
    else {
        element.disabled = false
        element.innerHTML = value
    }

}

async function deleteCartItems() {
    return new Promise(async (resolve) => {
        summary.items.forEach(async (item) => {
            const cartSnapshot = await getDocs(query(collection(firestore, 'users', auth.currentUser.uid, 'cart'), where('productId', '==', item.productId)))

            if (!cartSnapshot.empty) {
                await deleteDoc(cartSnapshot.docs[0].ref)
            }
        })
        resolve()
    })
}

// async function getCalculatedCommission(subTotal) {
//     //get commission snapshot
//     const commissionSnapshot = await getDocs(query(collection(firestore, 'commission'), where('post', '==', 'AGENT')))

//     return (commissionSnapshot.docs[0].data().commission / 100) * subTotal;
// }

/**
 * 
 * @returns promise
 * 
 * requires: 
 * getCart()
 * 
 * @author dev
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
 * @returns Promise<cart<Array>>
 * 
 * @author dev
 */
async function getCart() {
    return new Promise(async (resolve) => {
        let cart = []
        if (loggedIn) {
            console.log("form getCArt()")
            const cartSnapshot = await getDocs(collection(firestore, 'users', auth.currentUser.uid, 'cart'))
            console.log("form getCArt(1.1)")
            if (cartSnapshot.empty) {
                console.log("form getCArt(1.2)")
                resolve([])
            }
            console.log("form getCArt(1.3)")
            cartSnapshot.forEach(doc => {
                cart.push(doc.data())
            })
            console.log("form getCArt(1.4)")
        }
        else {
            console.log("form getCArt1)")
            const cartSnapshot = JSON.parse(sessionStorage.getItem('cart'))
            if (!cartSnapshot) {
                console.log('from true')
                resolve([])
                return
            }
            let cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc)
            })
        }
        cartList = cart
        resolve(cart)
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

async function checkForExistingAddress() {
    if (!loggedIn) {

    }
    try {
        const countSnapshot = await getCountFromServer(getAddressRef())
        return countSnapshot.data().count
    } catch (error) {
        firebaseErrorHandler(error)
    }
}

/**
 * 
 * @returns address subcollection ref
 */
function getAddressRef() {
    return collection(firestore, 'users', auth.currentUser.uid, 'addresses')
}

async function postPageLoadAddressAction() {
    const result = await checkForExistingAddress()

    if (!result) {
        toogleAddressOptions(false, true)
    }
    else {
        await embedAddress()
        toogleAddressOptions(true, false)
        changeAddressTab()
    }
}

function toogleAddressOptions(toggle = false, disable = false) {
    const addressNew = document.querySelector('.address-option-new')
    const addressExisting = document.querySelector('.address-option-existing')

    if (toggle) {
        if (addressNew.checked) {
            addressNew.checked = false
            addressExisting.checked = true
        }
        else {
            addressNew.checked = true
            addressExisting.checked = false
        }
    }

    if (disable) {
        if (addressNew.checked) {
            addressExisting.disabled = true
        }
        else {
            addressNew.disabled = true
        }
    }

}

function changeAddressTab() {
    console.log('from change address')
    const addressNew = document.querySelector('.address-option-new')

    if (addressNew.checked) {
        document.getElementById('address-option-existing-tab').classList.add('dev-transition', 'opacity-0', 'scale-0')
        document.getElementById('address-option-new-tab').classList.add('dev-transition', 'opacity-0', 'scale-0')
        setTimeout(() => {
            document.getElementById('address-option-existing-tab').classList.add('d-none')
            document.getElementById('address-option-new-tab').classList.remove('d-none')
            setTimeout(() => {
                document.getElementById('address-option-new-tab').classList.remove('opacity-0', 'scale-0')
            }, 200);
            // document.getElementById('address-option-new-tab').classList.add('opacity-1','scale-1')
        }, 200);
    }
    else {
        document.getElementById('address-option-new-tab').classList.add('dev-transition', 'opacity-0', 'scale-0')
        document.getElementById('address-option-existing-tab').classList.add('dev-transition', 'opacity-0', 'scale-0')
        setTimeout(() => {
            document.getElementById('address-option-new-tab').classList.add('d-none')
            document.getElementById('address-option-existing-tab').classList.remove('d-none')
            setTimeout(() => {
                document.getElementById('address-option-existing-tab').classList.remove('opacity-0', 'scale-0')
            }, 200);
            // document.getElementById('address-option-existing-tab').classList.add('opacity-1','scale-1')
        }, 200);
    }


}

async function getAddresses() {
    let addressSanpshot = null
    try {
        addressSanpshot = await getDocs(getAddressRef())
    } catch (error) {
        firebaseErrorHandler(error)
    }
    return addressSanpshot.docs
}

async function embedAddress() {
    const addressDocs = await getAddresses()
    if (addressDocs.empty) {
        displayMessage('No saved address. !', 'danger')
        return
    }
    const addressContainer = document.querySelector('.address-container')
    addressContainer.innerHTML = ``
    
    addressDocs.forEach(doc => {
        const addressCard = document.createElement('div')
        addressCard.classList.add('col-md-6')
        addressCard.innerHTML = `
                            <div class="text-manrope bg-white card addresses-item mb-4 shadow-sm second dev-transition">
                                <div class="gold-members p-4">
                                    <div class="media">
                                        <div class="mr-3"><i
                                                class="icofont-briefcase icofont-3x"></i>
                                        </div>
                                        <div class="media-body position-relative">
                                            <span class="position-absolute top-0 end-0 badge bg-success text-bold ${doc.data().isDefault ? '' : 'd-none'}">Default</span>
                                            <h6 class="mb-1 text-capitalize">${doc.data().addressType}</h6>
                                            <p class="text-capitalize"><span>${doc.data().fullName}, </span><span>${doc.data().mobileNumber}</span></p>
                                            <p class="text-capitalize">
                                                <span class="address-house-building">${doc.data().houseBuilding}</span>,
                                                <span class="address-road-area-colony">${doc.data().roadAreaColony}</span>, 
                                                <span class="address-city">${doc.data().city}</span>, 
                                                <span class="address-state">${doc.data().state}</span>, 
                                                <span class="address-pincode text-bold">${doc.data().pinCode}</span>
                                            </p>
                                            <div class="mb-0 text-black font-weight-bold d-flex flex-wrap gap-3">
                                                <a class="align-self-center mr-3 gi-btn-1" href="saved_addresses.html">EDIT <i
                                                        class="fi-rr-pencil"></i></a>
                                                <a class="align-self-center gi-btn-2 address-select-btn" href="javascript:void(0)">SELECT</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
    `
        addressContainer.appendChild(addressCard)
        addressCard.querySelector('.address-select-btn').addEventListener('click', selectAddress.bind(this, doc))
        if (doc.data().isDefault) selectAddress(doc)
    })

}

function selectAddress(addressDoc, e) {
    const shippingAddressContainer = document.querySelector('.shipping-address')
    const alreadySelectedAddress = document.querySelector('.selected-address')
    console.log(alreadySelectedAddress)
    if (alreadySelectedAddress) {
        alreadySelectedAddress.remove()
    }
    const selectedAddress = document.createElement('div')
    selectedAddress.classList.add('selected-address')
    selectedAddress.setAttribute('data-id', addressDoc.id)
    selectedAddress.innerHTML = `
                    <div class="text-manrope bg-white card addresses-item mb-4 shadow-sm second dev-transition">
                        <div class="gold-members p-4">
                            <div class="media">
                                <div class="mr-3"><i
                                        class="icofont-briefcase icofont-3x"></i>
                                </div>
                                <div class="media-body position-relative">
                                    <span class="position-absolute top-0 end-0 badge bg-success text-bold ${addressDoc.data().isDefault ? '' : 'd-none'}">Default</span>
                                    <h6 class="mb-1 text-capitalize">${addressDoc.data().addressType}</h6>
                                    <p class="text-capitalize"><span>${addressDoc.data().fullName}, </span><span>${addressDoc.data().mobileNumber}</span></p>
                                    <p class="text-capitalize">
                                        <span class="address-house-building">${addressDoc.data().houseBuilding}</span>,
                                        <span class="address-road-area-colony">${addressDoc.data().roadAreaColony}</span>, 
                                        <span class="address-city">${addressDoc.data().city}</span>, 
                                        <span class="address-state">${addressDoc.data().state}</span>, 
                                        <span class="address-pincode text-bold">${addressDoc.data().pinCode}</span>
                                    </p>
                                    <div class="mb-0 text-black font-weight-bold d-flex flex-wrap gap-3">
                                        <a class="align-self-center mr-3 gi-btn-1" href="saved_addresses.html">EDIT <i
                                                class="fi-rr-pencil"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    `
    shippingAddressContainer.appendChild(selectedAddress)
}

async function updateSummary() {
    const checkoutSummaryTotal = document.querySelector('.checkout-summary-total')
    const checkoutSummaryDelivery = document.querySelector('.checkout-summary-delivery')
    const checkoutSummarySubtotal = document.querySelector('.checkout-summary-subtotal')

    checkoutSummaryDelivery.textContent = bill.deliveryFee
    checkoutSummarySubtotal.textContent = bill.subTotal
    checkoutSummaryTotal.textContent = bill.total
    await embedSummaryproductCards()
}

function getProductsIds() {
    let productIds = []
    cartList.forEach(item => productIds.push(item.productId))
    return productIds
}

async function embedSummaryproductCards() {
    if (!cartList) {
        cartList = await getCart()
        if (!cartList.length) {
            window.location.href = 'products.html'
        }
    }
    console.log(cartList)
    let productsIds = getProductsIds()

    const q = query(collection(firestore, 'products'), where('productId', 'in', productsIds))

    productSnapshot = await getDocs(q)

    const checkoutSummaryProducts = document.querySelector('.checkout-summary-products')

    productSnapshot.forEach(doc => {
        const productCard = document.createElement('div')
        productCard.classList.add("col-sm-12", "mb-6")
        productCard.innerHTML = `
                                    <div class="gi-product-inner">
                                        <div class="gi-pro-image-outer">
                                            <div class="gi-pro-image" style="width: 150px;">
                                                <a href="products.html" class="image">
                                                    <img class="main-image"
                                                        src="${doc.data().imageUrl}"
                                                        alt="Product">
                                                </a>
                                            </div>
                                        </div>
                                        <div class="gi-pro-content">
                                            <h5 class="gi-pro-title"><a href="products.html">
                                                    ${doc.data().name}</a></h5>
                                            <!-- <span class="gi-price">
                                                <span class="new-price"><span>&#8377;</span><span>${doc.data().price}</span></span>
                                            </span> -->
                                        </div>
                                    </div>
        `
        checkoutSummaryProducts.appendChild(productCard)
    })

}

/**
 * 
 * @param {Object} {basePrice, colorPrice, size, quantity}
 * @returns {number} number
 * 
 * @author dev
 */
function getProductCalcPrice({basePrice = null, quantity = 1} = {}){
    // const formattedSize = parseInt(size)
    const formattedBasePrice = parseFloat(basePrice)
    // const formattedColorPrice = parseFloat(colorPrice)
        return parseFloat(formattedBasePrice) * parseFloat(quantity);
}

function generateOrderId() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // You can customize this based on your requirements
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000);
    const randomLetter = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    const orderId = `${randomLetter}${timestamp}${randomNum}`;

    return orderId;
}


async function payment(e) {
    const addressCard = document.querySelector('.selected-address')
    if (!addressCard) {
        displayMessage('Please give a address. !', 'danger')
        return
    }

    const addressId = addressCard.getAttribute('data-id')

    options.amount = bill.total * 100
    //get the usre details
    const userSnapshot = await getDoc(doc(firestore, 'users', auth.currentUser.uid))
    options.prefill.name = userSnapshot.data().firstName + " " + userSnapshot.data().lastName
    options.prefill.email = userSnapshot.data().email
    options.prefill.contact = userSnapshot.data().phoneNumber

    console.log(options, userSnapshot.data())
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Use 12-hour clock with AM/PM
    });

    //create suceess callback function
    options.handler = async function (response) {
        showOverlay()
        cartList.forEach(item => {
            console.log('from forEach')
            const res = productSnapshot.docs.findIndex(product => product.data().productId === item.productId)
            if (res >= 0) {
                console.log('from forEach if ')
                const res1 = cartList.findIndex(item1 => item1.productId === item.productId)
                console.log('from forEach if if')
                if (res1 >= 0) {
                    console.log(cartList[res1], productSnapshot.docs[res].data().price)
                    cartList[res1].price = productSnapshot.docs[res].data().price
                    cartList[res1].name = productSnapshot.docs[res].data().name
                }
            }
        })
        console.log(1)
        await setDoc(doc(collection(firestore, 'users', auth.currentUser.uid, 'orders'), orderId), {
            orderId: orderId,
            productsDetails: await getCalcCartList(cartList),
            bill: bill,
            addressRef: doc(firestore, 'users', auth.currentUser.uid, 'addresses', addressId),
            mop: ['rzp', response],
            status: 'Order Confirmed',
            orderDate: currentDate.toLocaleDateString(),
            orderTime: currentTime,
        })
        console.log(2)
        const cartSnapshot = await getDocs(collection(firestore, 'users', auth.currentUser.uid, 'cart'))
        const allPromise = cartSnapshot.docs.map(async (cartItem) => {
            const productSnapshot = await getDocs(query(collection(firestore, 'products'), where('productId', '==', cartItem.data().productId)))
            const productDoc = productSnapshot.docs[0]
            await updateDoc(productDoc.ref, { quantity: productDoc.data().quantity - 1 })
            await deleteDoc(cartItem.ref)
        })
        await Promise.all(allPromise)
        await updateCart()
        console.log(3)
        displayMessage('Payment Successfull. !', 'success')
        console.log(response)
        hideOverlay()
        hideCheckout()
        setTimeout(() => {
            showCompleteOrderGif()
        }, 1000);
    }
    var rzp1 = new Razorpay(options);

    rzp1.open();
    e.preventDefault();

    rzp1.on('payment.failed', function (response) {
        displayMessage('Please retry payment. !', 'danger')
    });
}

function hideCheckout() {
    const checkoutSection = document.querySelector('.gi-checkout-section')
    checkoutSection.classList.add('opacity-0', 'scale-0')
    setTimeout(() => {
        checkoutSection.classList.add('d-none')
        document.querySelector('.gi-back-to-top').dispatchEvent(new Event('click'))
    }, 1000);
}

function showCompleteOrderGif() {
    console.log('form show')
    const orderCompleteSection = document.querySelector('.order-complete')
    orderCompleteSection.style.height = '400px'
    const orderCompleteImg = document.querySelector('.order-complete img')
    orderCompleteImg.classList.remove('d-none', 'opacity-0', 'scale-0')
    orderCompleteImg.classList.add('show-order-complete-animation')
    orderCompleteSection.classList.remove('d-none', 'opacity-0', 'scale-0')

}

/**
 * @author dev
 */
function showOverlay() {
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('show-loader')
    overlay.classList.remove('hide-loader')
    overlay.classList.remove('d-none')
    overlay.classList.add('show-loader')
}

/**
 * @author dev
 */
function hideOverlay() {
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('show')
    overlay.classList.remove('hide-loader')
    overlay.classList.add('hide-loader')
    setTimeout(() => {
        document.getElementById('overlay').classList.add('d-none')
        overlay.classList.remove('hide-loader')
    }, 500);
}
// document.querySelector('.address-option-existing-tab').classList.remove('border-primary', 'border', 'shadow-lg')
// document.querySelector('.address-option-new-tab').classList.add('border-primary', 'border', 'shadow-lg')

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


//final cart details
async function getCalcCartList(cartList){
    const calcCartList = []

    const allPromises = cartList.map(async (item) => {
        const itemObject = {...item}

        const basePrice = await getProductPrice(item.productId)

        itemObject.cPrice = getProductCalcPrice(
            {
                basePrice: basePrice,
                quantity: item.quantity
            }
        )
        calcCartList.push(itemObject)
    })
    await Promise.all(allPromises)

    return calcCartList
}