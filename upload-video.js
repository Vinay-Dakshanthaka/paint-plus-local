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
    arrayUnion
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
    uploadBytesResumable,
    getDownloadURL,
} from './assets/repository/initialize.js'

const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var userData = null;
var loggedIn = false;

// Function to check if the user is logged in
function isUserLoggedIn() {
    return !!auth.currentUser;
}

//--------------------------------------Event Listenser------------------------------------------- 
confirmLogoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});


//--------------------------------------------------------------------------//
//-----------------------------cart dependency----------------------------//
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
async function postPageLoadFunctions() {
    await updateCart();
    // await fetchNavCategories();
}

//------------------------------loading and role access-----------------------------
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
                roleAccess(userData.role);
                updateProfileName(userData.role, userData.firstName);
                updateProfilePicture(userData.role, userData.profilePicture)
            }
        });
    } else {
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none')
         })
        document.querySelector('#logout-btn').style.display = 'none';
        window.location.href = "login.html";
    }
    await postPageLoadFunctions();
});

function roleAccess(role) {
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
}

function updateProfileName(role, fullName) {
    console.log(fullName)
    let profileNameElement;
    switch (role) {
        case 'CUSTOMER':
            profileNameElement = document.getElementById('customerAppbar').querySelector('.profile-name');
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

const uploadVideoBtn1 = document.getElementById('uploadVideoButton1');
uploadVideoBtn1.addEventListener('click', (e) => {
    (handleVideoUpload1(document.querySelector('#productVideo1'), e))
})

const uploadVideoBtn2 = document.getElementById('uploadVideoButton2');
uploadVideoBtn2.addEventListener('click', (e) => {
    (handleVideoUpload2(document.querySelector('#productVideo2'), e))
});

// Function to handle video upload for Video Upload 1
async function handleVideoUpload1(target, event) {
    const files = target.files;
    if (files.length === 0) {
        console.error('No file selected.');
        return;
    }

    const uploadBtn = event.target
    const videoFile = target.files[0];
    const progressSpan = document.getElementById('progress1');
    // const videoName = document.getElementById('videoName1');

    uploadBtn.disabled = true
    uploadBtn.textContent = 'Uploading...'
    progressSpan.textContent = ''

    try {
        // Create a storage reference
        const storageRef = ref(storage, 'product_videos/video1.mp4');

        // Delete existing 'video1' if it exists
        await deleteObject(storageRef).catch((error) => {
            // Ignore error if the object doesn't exist
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
        });

        const uploadTask = uploadBytesResumable(storageRef, videoFile);

        // Listen for state changes, errors, and completion of the upload.
        let progress = 0
        uploadTask.on('state_changed',
            (snapshot) => {
                // Update progress bar during the upload
                progress = Math.trunc((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                progressSpan.textContent = progress + "%";
            },
            (error) => {
                // Handle errors
                console.error('Error uploading video:', error);
            },
            async () => {
                // Upload complete, get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // Update video details in Firestore (using a fixed document ID)
                const docRef = doc(firestore, 'videos', 'video1');
                await setDoc(docRef, {
                    // videoName: videoName.value,
                    fileName: videoFile.name,
                    url: downloadURL,
                });

                console.log('Video 1 uploaded successfully!');
                displayMessage('Video 1 uploaded successfully!', 'success');
                uploadBtn.disabled = false
                uploadBtn.textContent = 'Upload Video'
                if (progress == 100) {
                    progressSpan.textContent = 'Completed!'
                }

                // Reset input fields
                target.value = '';
                // videoName.value = '';

                // Reset progress span
                setTimeout(() => {
                    progressSpan.textContent = '';
                }, 2000);
            });
    } catch (error) {
        console.error('Error handling video upload:', error);
        uploadBtn.disabled = false
        uploadBtn.textContent = 'Upload Video'
    }
}

// Function to handle video upload for Video Upload 2
async function handleVideoUpload2(target, event) {
    const files = target.files;
    if (files.length === 0) {
        console.error('No file selected.');
        return;
    }

    const progressSpan = document.getElementById('progress2');
    progressSpan.textContent = ''
    const uploadBtn = event.target
    const videoFile = target.files[0];
    // const videoName = document.getElementById('videoName2');

    uploadBtn.disabled = true
    uploadBtn.textContent = 'uploading...'

    try {
        // Create a storage reference
        const storageRef = ref(storage, 'product_videos/video2.mp4');

        // Delete existing 'video1' if it exists
        await deleteObject(storageRef).catch((error) => {
            // Ignore error if the object doesn't exist
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
        });

        const uploadTask = uploadBytesResumable(storageRef, videoFile);

        // Listen for state changes, errors, and completion of the upload.
        let progress = 0
        uploadTask.on('state_changed',
            (snapshot) => {
                // Update progress bar during the upload
                progress = Math.trunc((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                progressSpan.textContent = progress + "%";
            },
            (error) => {
                // Handle errors
                console.error('Error uploading video:', error);
            },
            async () => {
                // Upload complete, get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // Update video details in Firestore (using a fixed document ID)
                const docRef = doc(firestore, 'videos', 'video2');
                await setDoc(docRef, {
                    // videoName: videoName.value,
                    fileName: videoFile.name,
                    url: downloadURL,
                });

                console.log('Video 2 uploaded successfully!');
                displayMessage('Video 2 uploaded successfully!', 'success');
                uploadBtn.disabled = false
                uploadBtn.textContent = 'Upload Video'
                if (progress == 100) {
                    progressSpan.textContent = 'Completed!'
                }

                // Reset input fields
                target.value = '';
                // videoName.value = '';

                // Reset progress span
                setTimeout(() => {
                    progressSpan.textContent = '';
                }, 2000);
            });
    } catch (error) {
        console.error('Error handling video upload:', error);
        uploadBtn.disabled = false
        uploadBtn.textContent = 'Upload Video'
    }
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