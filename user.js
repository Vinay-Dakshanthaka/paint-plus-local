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
document.querySelector("#phone").addEventListener("keyup", () => {
    // Validate phone number

    if (!isValidPhoneNumber(document.querySelector("#phone").value)) {
        // Display an error message
        document.getElementById("phoneError").textContent =
            "*Phone number must have 10 digits.";
        document.getElementById("phoneError").style.scale = "1"
        // Stop the function execution if validation fails
    } else {
        document.getElementById("phoneError").textContent = "";
    }
});

//event for firstName validation
document.querySelector("#displayName").addEventListener("keyup", () => {
    if (!isValidFirstName(document.querySelector("#displayName").value.split(' ')[0])) {
        // Display an error message
        document.getElementById("nameError").textContent =
            "*Name must have atleast 3 characters.";
    }
    else {
        document.getElementById("nameError").textContent = ''
    }
});

document.querySelector("#newPassword").addEventListener("keyup", () => {
    if (!isValidPassword(document.querySelector("#newPassword").value)) {
        // Display an error message
        document.getElementById("passwordError").textContent =
            "*Password must have atleast 6 characters."
    }
    else {
        document.getElementById("passwordError").textContent = ''
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


/**
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions(){
    await updateCart();
    // await fetchNavCategories();
}

//*****************************loading and role access************************************
// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, async (user) => {
    if (user) {
        loggedIn = true
        onLoggedIn();

        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.remove('d-none')
         })
        // User is authenticated
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then(async (docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                roleAccess(userData.role);
                populateShownDetails();
                populateProfileData(userData);
                console.log(auth.currentUser.uid);
                getUserRealTime();
            }
        });
    } else {
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
        window.location.href = "login.html";
    }

    await postPageLoadFunctions()
});

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

function updateProfileName(role, fullName) {
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


//Fetch order details by customer 
async function fetchAndDisplayAllOrders(userId) {
    const viewOrderBtn = document.querySelector('.view-orders-btn')
    viewOrderBtn.disabled = true
    viewOrderBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span role="status">fetching orders...</span>
            `
    //Method call
    const orders = await fetchOrdersForUser(userId);

    if (Array.isArray(orders) && orders.length > 0) {
        // Create an array to store order details
        const orderDetailsList = [];

        //variable to only order ids
        const orderIds = []
        //loop get the ids
        orders.forEach(async (order) => {
            orderIds.push(order.orderId)
        })
        //get the docs where order ids matched in list
        const orderSnapshot = await getDocs(query(collection(firestore, 'orders'), where('orderId', 'in', orderIds)))
        //return if empty
        if (orderSnapshot.empty) return
        //push all json data in one list
        orderSnapshot.forEach(doc => {
            orderDetailsList.push(doc.data())
        })


        console.log(orderDetailsList);
        // Display all order details in the modal
        await displayAllOrders(orderDetailsList);
        viewOrderBtn.disabled = false
        viewOrderBtn.innerHTML = `View orders`
    } else {
        // Handle the case where there are no orders for the customer
        displayAllOrders([]);
        displayMessage('No orders found for this customer.', 'danger');
        viewOrderBtn.disabled = false
        viewOrderBtn.innerHTML = `View orders`
    }
}

// Function to fetch total Purchases for a user
async function totalAmountPurchases(userId) {
    console.log(userId)
    // Fetch orders for the user
    const orders = await fetchOrdersForUser(userId);
    var orderDetailsList = [];
    if (Array.isArray(orders) && orders.length > 0) {
        // Create an array to store order details
        //variable to only order ids
        const orderIds = []
        //loop get the ids
        orders.forEach(async (order) => {
            orderIds.push(order.orderId)
        })
        //get the docs where order ids matched in list
        const orderSnapshot = await getDocs(query(collection(firestore, 'orders'), where('orderId', 'in', orderIds)))
        //return if empty
        if (orderSnapshot.empty) return
        //push all json data in one list
        orderSnapshot.forEach(doc => {
            orderDetailsList.push(doc.data())
        });
    }

    console.log(orderDetailsList);

    if (!orderDetailsList || orderDetailsList.length === 0) {
        return 0; // Return 0 if there are no orders or orders is undefined
    }

    // Calculate the total commission based on the 'calculatedCommission' field for each order
    // The parseFloat function is used to convert the grandTotal string to a floating-point number before adding it to the sum.
    const totalPurchases = orderDetailsList.reduce((sum, orderDetailsList) => sum + parseFloat(orderDetailsList.summary.billSummary.grandTotal || 0), 0);
    console.log(totalPurchases);
    return totalPurchases;
}

async function calculateTotalOrders(userId) {
    const totalorders = await fetchOrdersForUser(userId);
    console.log(totalorders.length);
    return totalorders.length;
}

// Function to fetch orders for a specific user
async function fetchOrdersForUser(userId) {
    const userRef = doc(firestore, "users", userId);
    const ordersRef = collection(userRef, "orders");

    try {
        const querySnapshot = await getDocs(ordersRef);
        const orders = [];

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const orderData = doc.data();
                // console.log(orderData);
                orders.push(orderData);
            });
        }
        return orders;
    } catch (error) {
        console.error("Error fetching orders for user:", error);
        return [];
    }
}

// Function to display all orders for a customer in the modal
async function displayAllOrders(orders) {
    return new Promise(async (resolve) => {
        // Sort the orders array by date and time in descending order
        orders.sort((a, b) => {
            // Convert date and time strings to Date objects for comparison
            const dateA = convertToDate(a.date, a.time);
            // console.log(dateA);
            const dateB = convertToDate(b.date, b.time);
            // console.log(dateB);
            return new Date(dateB) - new Date(dateA); // Sort in descending order (latest first)
        });

        console.log(orders)
        const orderModalContent = document.getElementById("orderModalContent");

        if (Array.isArray(orders) && orders.length > 0) {
            // Create a container to hold all order details
            const ordersContainer = document.createElement("div");

            // Iterate through the orders and create a dropdown for each order
            for (const order of orders) {
                const orderContainer = document.createElement("div");
                orderContainer.className = "order-container";

                // Create and append elements for order ID, date, and time
                const orderInfoContainer = document.createElement("div");
                orderInfoContainer.className = "order-info-container";

                const orderIDElement = document.createElement("div");
                orderIDElement.className = "order-field";
                orderIDElement.innerHTML = `<strong> Order ID:</strong> ${order.orderId} `;

                const orderDateElement = document.createElement("div");
                orderDateElement.className = "order-field";
                orderDateElement.innerHTML = `<strong> Order Date:</strong> ${order.date || ""} `;

                const orderTimeElement = document.createElement("div");
                orderTimeElement.className = "order-field";
                orderTimeElement.innerHTML = `<strong> Order Time:</strong> ${order.time || ""} `;

                orderInfoContainer.appendChild(orderIDElement);
                orderInfoContainer.appendChild(orderDateElement);
                orderInfoContainer.appendChild(orderTimeElement);

                orderContainer.appendChild(orderInfoContainer);

                // Create and append elements for remaining order details
                // const orderDetailsContainer = document.createElement("div");
                // orderDetailsContainer.className = "order-details";
                // orderDetailsContainer.style.display = "none"; // Initially hide the details

                // Create and append elements for order details
                const orderDetailsContainer = document.createElement("div");
                orderDetailsContainer.className = "order-details";

                // Iterate through the productsDetails array and display product information
                for (const product of order.productsDetails) {
                    const productElement = document.createElement("div");
                    productElement.innerHTML = `<strong>Product ID:</strong> ${product.productId}<br>
                     <strong>Quantity:</strong> ${product.quantity}`;
                    orderDetailsContainer.appendChild(productElement);
                }
                orderContainer.appendChild(orderDetailsContainer);

                // Create and append elements for bill details
                const billDetailsContainer = document.createElement("div");
                billDetailsContainer.className = "bill-details";

                const deliveryFeeElement = document.createElement("div");
                deliveryFeeElement.innerHTML = `<strong>Delivery Fee:</strong> ${order.bill.deliveryFee || ""}`;

                const subTotalElement = document.createElement("div");
                subTotalElement.innerHTML = `<strong>Subtotal:</strong> ${order.bill.subTotal || ""}`;

                const totalElement = document.createElement("div");
                totalElement.innerHTML = `<strong>Total:</strong> ${order.bill.total || ""}`;

                billDetailsContainer.appendChild(deliveryFeeElement);
                billDetailsContainer.appendChild(subTotalElement);
                billDetailsContainer.appendChild(totalElement);
                orderContainer.appendChild(billDetailsContainer);

                // Create and append elements for payment details
                const paymentDetailsContainer = document.createElement("div");
                paymentDetailsContainer.className = "payment-details";
                const mopElement = document.createElement("div");
                if (order.mop.length > 1) {
                    const razorpayPaymentIdElement = document.createElement("div");
                    razorpayPaymentIdElement.innerHTML = `<strong>Razorpay Payment ID:</strong> ${order.mop[1].razorpay_payment_id || ""}`;
                    paymentDetailsContainer.appendChild(razorpayPaymentIdElement);
                }
                paymentDetailsContainer.appendChild(mopElement);
                orderContainer.appendChild(paymentDetailsContainer);


                // Fetch and display the dynamic order details for this order
                // fetchAndDisplayOrderDetails(order, orderDetailsContainer);

                // Append a "View Details" button
                // const viewDetailsButton = document.createElement("button");
                // viewDetailsButton.className = "btn btn-primary view-details-btn";
                // viewDetailsButton.textContent = "View Details";

                // Add a click event listener to toggle order details visibility
                // viewDetailsButton.addEventListener("click", () => {
                //     orderDetailsContainer.style.display = orderDetailsContainer.style.display === "none" ? "block" : "none";
                // });

                // Append the "View Details" button and dynamic order details to the order container
                // orderContainer.appendChild(viewDetailsButton);
                orderContainer.appendChild(orderDetailsContainer);

                // Append a horizontal line after each order
                const horizontalLine = document.createElement("hr");
                horizontalLine.className = "impressive-hr";
                orderContainer.appendChild(horizontalLine);

                // Append the order container to the orders container
                ordersContainer.appendChild(orderContainer);
            }

            // Set the content of the order modal to the orders container
            orderModalContent.innerHTML = "";
            orderModalContent.appendChild(ordersContainer);

            // Open the modal
            const orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
            orderModal.show();
        } else {
            // Handle the case where there are no orders to display
            orderModalContent.innerHTML = "<p>No orders found for this customer.</p>";
        }
        resolve()
    })
}

// Function to convert date and time strings to a Date object
function convertToDate(dateString, timeString) {
    // Split the date and time strings
    const dateParts = dateString.split("/");
    const timeParts = timeString.split(" ");

    // Parse the time parts
    const time = timeParts[0];
    const isPM = timeParts[1].toLowerCase() === "pm";

    // Extract hours, minutes, and seconds
    const timeParts2 = time.split(":");
    let hours = parseInt(timeParts2[0]);
    const minutes = parseInt(timeParts2[1]);

    // Convert to 24-hour format if PM
    if (isPM && hours !== 12) {
        hours += 12;
    } else if (!isPM && hours === 12) {
        hours = 0;
    }

    // Format the time as HH:mm for proper sorting
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${formattedTime}`;
}

// Function to fetch and display order details for a specific order
async function fetchAndDisplayOrderDetails(order, orderDetailsContainer) {
    try {
        // const orderDetails = await fetchOrderDetailsByOrderId(orderId);

        if (order) {
            // Create HTML to display order details
            const orderDetailsHTML = `
                    <div class="order-field">
                        <strong>Order State:</strong> ${order.state || ""}
                        </div>
                        <div class="order-field">
                            <strong>Payment Method:</strong> ${order.paymentMethod || ""}
                        </div>
                        <div class="order-field">
                            <strong>Shipping Address:</strong> <pre>${order.address || ""}</pre>
                        </div>
                        <div class="order-field ${order.summary.referralId ? '' : 'd-none'}">
                            <strong>Referral Id:</strong> <pre>${order.summary.referralId || ""}</pre>
                        </div>
                        <h3>Items Purchased</h3>
                        <ul>
                            ${order.summary.items && Array.isArray(order.summary.items)
                    ? order.summary.items.map((item) => `
                                    <li>
                                        <strong>Product ID:</strong> ${item.productId || ""}<br>
                                        <strong>Product Name:</strong> ${item.productName || ""}<br>
                                        <strong>Product Category:</strong> ${item.productCategory || ""}<br>
                                        <strong>Product Color:</strong> ${item.productColor || ""}<br>
                                        <strong>Product Color Shade:</strong> ${item.productColorShade || ""}<br>
                                        <strong>Product Size:</strong> ${item.productSize || ""} Ltrs. <br>
                                        <strong>Product Price:</strong> Rs. ${item.productPrice || ""}<br>
                                        <strong>Product Quantity:</strong> ${item.productQuantity || ""} No's
                                    </li><br>`
                    ).join('')
                    : "<li>No items found</li>"
                }
                        </ul>
                        <h3>Bill Summary</h3>
                        <div class="order-field">
                            <strong>Subtotal:</strong> Rs. ${order.summary.billSummary.subTotal || ""}
                        </div>
                        <div class="order-field ${order.calculatedCommission ? '' : 'd-none'}">
                            <strong>Calculated commission :</strong> Rs. ${order.calculatedCommission || ""}
                        </div>
                        <div class="order-field">
                            <strong>Delivery Fee:</strong> Rs. ${order.summary.billSummary.deliveryFee || ""}
                        </div>
                        <div class="order-field">
                            <strong>Grand Total:</strong> Rs. ${order.summary.billSummary.grandTotal || ""}
                        </div><br>
                    `;

            // Set the HTML content of the order details container
            orderDetailsContainer.innerHTML = orderDetailsHTML;
        } else {
            // Handle the case where order details are not found
            orderDetailsContainer.innerHTML = "<p>Order details not found.</p>";
        }
    } catch (error) {
        console.error("Error fetching order details:", error);
    }
}

//******************************************************************************************

function populateProfileData(userData) {
    // document.getElementById("profile-avatar").src = userData.profilePic || "default-profile-pic.jpg";
    document.getElementById("displayName").value =
        userData.firstName + " " + userData.lastName || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("phone").value = userData.phoneNumber || "";
    // document.getElementById("referralCode").value = userData.referralCode || "";
}

// // Function to validate the referralCode format
// function isValidReferralCode(referralCode) {
//     // const referralCodeRegex = /^[a-zA-Z0-9]{20}$/;
//     const referralCodeRegex = /^[a-zA-Z0-9]{12}$/;
//     return referralCodeRegex.test(referralCode);
// }

// Function to update the user profile
async function updateProfile(uid, profileData) {
    // Check if the referralCode is empty
    // if (profileData.referralCode.trim() === "") {
    //     // If it's empty, proceed with saving the profile
    //     saveUserProfile(uid, profileData);
    // } else {
    //     // Validate referralCode format
    //     if (!isValidReferralCode(profileData.referralCode)) {
    //         displayMessage("Referral code must have 20 alphanumeric characters.", "danger");
    //         document.querySelector('#saveProfileChangesBtn').disabled = false;
    //         document.querySelector('#saveProfileChangesBtn').textContent = 'Save Changes';
    //     } else {
    //         // Check if the referralCode matches any AGENT's membershipId
    //         const isReferralCodeValid = await validateReferralCode(profileData.referralCode);

    //         if (!isReferralCodeValid) {
    //             displayMessage("AGENT not found with this referralCode. Please try again.", "danger");
    //             document.querySelector('#saveProfileChangesBtn').disabled = false;
    //             document.querySelector('#saveProfileChangesBtn').textContent = 'Save Changes';
    //         } else {
    //             // Referral code is valid, proceed with saving the profile
                saveUserProfile(uid, profileData);
            // }
        // }
    // }
}

async function saveUserProfile(uid, profileData) {
    const docRef = doc(firestore, "users", uid);
    setDoc(docRef, profileData, { merge: true })
        .then(async () => {
            displayMessage("Profile updated successfully!", "success");
            console.log("Profile updated successfully");

            document.querySelector('#saveProfileChangesBtn').disabled = false;
            document.querySelector('#saveProfileChangesBtn').textContent = 'Save Changes';
            userData = await getUpdatedUserData();
            populateShownDetails();

            // Update referredStatus to true if a referral code is added
            // if (profileData.referralCode) {
            //     await setDoc(docRef, { referredStatus: true }, { merge: true });
            // }
        })
        .catch((error) => {
            displayMessage("Error updating profile. Please try again.", "danger");
            document.querySelector('#saveProfileChangesBtn').disabled = false
            document.querySelector('#saveProfileChangesBtn').textContent = 'Save Changes'

            console.error("Error updating profile:", error);
        });
}

// Function to validate referralCode against AGENT roles
// async function validateReferralCode(referralCode) {
//     const agentsCollection = collection(firestore, "users");
//     const q = query(agentsCollection, where("role", "==", "AGENT"), where("membershipId", "==", referralCode));

//     const querySnapshot = await getDocs(q);
//     return !querySnapshot.empty;
// }

// Event listener for the "Edit Profile" button
// document.getElementById("edit-profile").addEventListener("click", () => {
//     // Get the current user

//     if (userData) {
//         // Populate the modal with the user's current data
//         populateProfileData(userData);
//     }
// });

//populate shown details
function populateShownDetails() {
    if (userData) {
        // const shownEmail = document.getElementById("shown-email");
        // const shownPhoneNumber = document.getElementById("shown-phoneNumber");
        // const shownName = document.getElementById("shown-name");
        // const shownRole = document.getElementById("shown-role");
        // const shownReferralCode = document.getElementById("shown-referralCode");
        const shownProfilePicture = document.getElementById("shown-profilePicture");


        // Populate the elements with user information
        // shownEmail.textContent = userData.email || "";
        // shownPhoneNumber.textContent = userData.phoneNumber || "";
        // shownName.textContent = (userData.firstName || "") + " " + (userData.lastName || "");
        // shownRole.textContent = userData.role || "";
        // shownReferralCode.textContent = userData.referralCode || "No Referral Id";
        shownProfilePicture.src = userData.profilePicture || "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp";
    }
}

// Function to handle file input change and update the profile picture preview
function handleProfilePictureChange() {
    const profilePictureInput = document.getElementById("profilePicture");
    const shownProfilePicture = document.getElementById("shown-profilePicture");

    const file = profilePictureInput.files[0];

    if (file) {
        // Read the selected file as a data URL
        const reader = new FileReader();
        reader.onload = function (e) {
            shownProfilePicture.src = e.target.result; // Set the preview image source
        };

        reader.readAsDataURL(file);
    } else {
        // If no file is selected, reset the preview to the default image
        shownProfilePicture.src =
            "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp";
    }
}

// Attach the event listener to the file input
document.getElementById("profilePicture").addEventListener("change", handleProfilePictureChange);

// Event listener for the "Save Changes" button in the edit profile modal
document.getElementById("saveProfileChangesBtn").addEventListener("click", async () => {
    // Get the current user
    const user = auth.currentUser;
    if (user) {
        //fields to be saved
        // displayMessage("Updating!", 'success');
        document.querySelector('#saveProfileChangesBtn').disabled = true
        document.querySelector('#saveProfileChangesBtn').textContent = 'Updating Profile....'
        const [firstName, lastName] = document
            .getElementById("displayName")
            .value.split(" ");
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;
        // const referralCode = document.getElementById("referralCode").value;
        const profilePictureInput = document.getElementById("profilePicture");
        const profilePictureFile = profilePictureInput.files[0];

        // Validate first name (minimum 3 characters)
        if (!isValidFirstName(firstName) || (!isValidPhoneNumber(phone))) {
            document.querySelector('#saveProfileChangesBtn').disabled = false
            document.querySelector('#saveProfileChangesBtn').textContent = 'Save Changes'
            displayMessage('Please check your entered values!', 'danger')
            return; // Stop the function execution if validation fails
        }

        // If a new profile picture is selected, upload it to Firebase Storage
        if (profilePictureFile) {
            const storageRef = ref(storage, "avatars/" + user.uid + '.' + 'jpeg');
            const uploadTask = await uploadBytes(storageRef, profilePictureFile);
            const url = await getDownloadURL(uploadTask.ref)
            const userJson = {
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phone,
                email: email,
                // referralCode: referralCode,
                profilePicture: url, // Add the download URL to user data
            };
            // Update the user's profile data (including the profile picture URL)
            updateProfile(user.uid, userJson);
            // uploadTask.then((snapshot) => {
            //     getDownloadURL(snapshot.ref).then((downloadURL) => {
            //     // Include the profile picture URL in the user's profile data
            //     const userJson = {
            //       firstName: firstName,
            //       lastName: lastName,
            //       phoneNumber: phone,
            //       email: email,
            //       profilePicture: downloadURL, // Add the download URL to user data
            //     };

            //       // Update the user's profile data (including the profile picture URL)
            //       updateProfile(user.uid, userJson);
            //   });
            // });
        } else {
            // If no new profile picture is selected, update the user's profile data without the picture

            const userJson = {
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phone,
                email: email,
                // referralCode: referralCode,
            };
            // Update the user's profile data
            updateProfile(user.uid, userJson);
        }
    }
});

// Event listener for changing the password
document
    .getElementById("changePasswordBtn")
    .addEventListener("click", () => {
        document.querySelector('#changePasswordBtn').disabled = true
        document.querySelector('#changePasswordBtn').textContent = 'Updating Password....'
        // Get the current user
        const user = auth.currentUser;
        if (user) {
            const currentPassword =
                document.getElementById("currentPassword").value;
            const newPassword = document.getElementById("newPassword").value;
            const confirmNewPassword =
                document.getElementById("confirmNewPassword").value;

            // Verify that the current password and new password match
            if (currentPassword === newPassword) {
                displayMessage(
                    "Current password and new password should not be the same.",
                    "danger"
                );
                document.querySelector('#changePasswordBtn').disabled = false
                document.querySelector('#changePasswordBtn').textContent = 'Change Password'
                return;
            }

            // Verify that the new password and confirm new password match
            if (newPassword !== confirmNewPassword) {
                displayMessage(
                    "New password and confirm new password do not match.",
                    "danger"
                );
                document.querySelector('#changePasswordBtn').disabled = false
                document.querySelector('#changePasswordBtn').textContent = 'Change Password'
                // alert("New password and confirm new password do not match.");
                return;
            }

            // Change the user's password
            updatePasswordFn(user, currentPassword, newPassword);

            // Close the change password modal
            const changePasswordModal = new bootstrap.Modal(
                document.getElementById("changePasswordModalLabel")
            );
            changePasswordModal.hide();
        }
    });

// Function to update the user's password
function updatePasswordFn(user, currentPassword, newPassword) {
    //check new password validity, else return
    if (!isValidPassword(document.querySelector("#newPassword").value)) return;

    const credentials = EmailAuthProvider.credential(
        user.email,
        currentPassword
    );

    // Reauthenticate the user with their current password
    reauthenticateWithCredential(user, credentials)
        .then(() => {
            // Password reauthentication successful, now update the password
            updatePassword(user, newPassword)
                .then(() => {
                    displayMessage("Password updated successfully!", "success");
                    document.querySelector('#changePasswordBtn').disabled = false
                    document.querySelector('#changePasswordBtn').textContent = 'Change Password'
                    // Close the change password modal
                    const changePasswordModal = new bootstrap.Modal(
                        document.getElementById("changePasswordModalLabel")
                    );
                    changePasswordModal.hide();
                })
                .catch((error) => {
                    console.error("Error updating password:", error);
                    displayMessage(
                        "Error updating password. Please try again.",
                        "danger"
                    );
                    document.querySelector('#changePasswordBtn').disabled = false
                    document.querySelector('#changePasswordBtn').textContent = 'Change Password'
                });
        })
        .catch((error) => {
            console.error("Error reauthenticating user:", error);
            displayMessage(
                "Error reauthenticating user. Please check your current password.",
                "danger"
            );
            document.querySelector('#changePasswordBtn').disabled = false
            document.querySelector('#changePasswordBtn').textContent = 'Change Password'
        });
}

// Function to toggle password visibility
function togglePasswordVisibility(inputId, toggleBtnId) {
    const passwordInput = document.getElementById(inputId);
    const toggleBtn = document.getElementById(toggleBtnId);

    toggleBtn.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleBtn.innerHTML = '<i class="fi-rr-eye-crossed"></i>'; // Change the icon to an eye-slash
        } else {
            passwordInput.type = "password";
            toggleBtn.innerHTML = '<i class="fi-rr-eye"></i>'; // Change the icon back to an eye
        }
    });
}

// Toggle password visibility for current password and new password fields
togglePasswordVisibility("currentPassword", "currentPasswordToggle");
togglePasswordVisibility("newPassword", "newPasswordToggle");

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

//*************************Real Time***************************
function getUserRealTime() {
    onSnapshot(doc(firestore, 'users', auth.currentUser.uid), (doc) => {
        userData = doc.data();
        populateShownDetails();
        updateProfileName(userData.role, userData.firstName);
        updateProfilePicture(userData.role, userData.profilePicture);
    })
}
//*************************************************************

//*************************Validation**************************
// Function to validate first name (minimum 3 characters)
function isValidFirstName(name) {
    return name.length >= 3;
}

// Function to validate phone number (must be exactly 10 digits)
function isValidPhoneNumber(phone) {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phone);
}

function isValidPassword(password) {
    return password.length >= 6;
}

async function getUpdatedUserData() {
    return new Promise(async (resolve) => {
        const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid))
        resolve(userDoc.data())
    })
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