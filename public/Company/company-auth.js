// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9z8Amm-vlNcbw-XqEnrkt_WpWHaGfwtQ",
    authDomain: "trackio-f5b07.firebaseapp.com",
    projectId: "trackio-f5b07",
    storageBucket: "trackio-f5b07.firebasestorage.app",
    messagingSenderId: "1083789426923",
    appId: "1:1083789426923:web:c372749a28e84ff9cd7eae",
    measurementId: "G-DSPVFG2CYW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set persistence to local (persists even after the browser is closed)
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Authentication state persistence set to local.");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

// Function to display messages
function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    if (messageDiv) {
        messageDiv.style.display = "block";
        messageDiv.innerHTML = message;
        setTimeout(() => {
            messageDiv.style.display = "none";
        }, 5000);
    }
}

// Handle authentication state
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;

    if (!user) {
        console.log("No authenticated user found.");
        if (currentPath !== "/Company/company-index.html") {
            window.location.href = "/Company/company-index.html"; // Redirect to login page
        }
    } else {
        console.log("User is authenticated:", user);

        if (currentPath === "/Company/company-profile.html") {
            loadCompanyProfile(user);
        }
    }
});

// Event listener for registration and login
document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('submitSignUp');
    const loginButton = document.getElementById('submitLogin');
    const logoutButton = document.getElementById('logout-button');

    if (signUpButton) {
        signUpButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const email = document.getElementById('rEmail').value.trim();
            const password = document.getElementById('rPassword').value.trim();
            const companyName = document.getElementById('rCompanyName').value.trim();

            if (!email || !password || !companyName) {
                showMessage("All fields are required.", 'signUpMessage');
                return;
            }

            if (password.length < 6) {
                showMessage("Password must be at least 6 characters long.", 'signUpMessage');
                return;
            }

            try {
                console.log("Attempting to create user...");
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                console.log("User created successfully:", user);

                await setDoc(doc(db, "companies", user.uid), {
                    companyName,
                    email,
                    proofUploaded: false,
                    openForOJT: false,
                    uid: user.uid,
                    accountType: "company",
                    location: null
                });

                console.log("Company data saved successfully to Firestore.");
                showMessage("Registration successful! Redirecting...", 'signUpMessage');
                setTimeout(() => {
                    window.location.href = "company-dashboard.html";
                }, 2000);
            } catch (error) {
                console.error("Error during registration:", error);
                const errorMessages = {
                    'auth/email-already-in-use': "Email already in use.",
                    'auth/invalid-email': "Invalid email address.",
                    'auth/weak-password': "Password must be at least 6 characters long."
                };
                showMessage(errorMessages[error.code] || "Registration failed. Please try again.", 'signUpMessage');
            }
        });
    }

    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const email = document.getElementById('lEmail').value.trim();
            const password = document.getElementById('lPassword').value.trim();

            if (!email || !password) {
                showMessage("Please enter both email and password.", 'loginMessage');
                return;
            }

            try {
                console.log("Attempting to log in...");
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                console.log("User logged in successfully:", user);

                const companyDocRef = doc(db, "companies", user.uid);
                const companyDoc = await getDoc(companyDocRef);

                if (companyDoc.exists()) {
                    const companyData = companyDoc.data();
                    const companyName = companyData.companyName || "Your Company";

                    console.log("Company data retrieved:", companyData);

                    showMessage(`Welcome back, ${companyName}! Redirecting...`, 'loginMessage');
                    setTimeout(() => {
                        window.location.href = "company-dashboard.html";
                    }, 2000);
                } else {
                    console.error("Company data not found in Firestore.");
                    showMessage("Company data not found. Please contact support.", 'loginMessage');
                }
            } catch (error) {
                console.error("Error during login:", error);
                const errorMessages = {
                    'auth/user-not-found': "No user found with this email.",
                    'auth/wrong-password': "Incorrect password. Please try again.",
                    'auth/invalid-email': "Invalid email address. Please check and try again.",
                    'auth/too-many-requests': "Too many failed login attempts. Please try again later."
                };
                showMessage(errorMessages[error.code] || `Login failed: ${error.message}`, 'loginMessage');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("User logged out successfully.");
                window.location.href = "/Company/company-index.html"; // Redirect to login page
            } catch (error) {
                console.error("Error logging out:", error);
            }
        });
    }
});

// Load company profile and display the photo
async function loadCompanyProfile(user) {
    const companyPhoto = document.getElementById('companyPhoto');
    const uploadPhoto = document.getElementById('uploadPhoto');
    const companyName = document.getElementById('companyName');
    const companyDescription = document.getElementById('companyDescription');
    const companyType = document.getElementById('companyType');
    const openForOJT = document.getElementById('openForOJT');
    const locationMessage = document.getElementById('locationMessage');
    const locationSearch = document.getElementById('locationSearch');
    const searchLocationButton = document.getElementById('searchLocation');
    const saveLocation = document.getElementById('saveLocation');
    const satelliteToggle = document.getElementById('satelliteToggle');
    const saveProfile = document.getElementById('saveProfile');
    const logoutButton = document.getElementById('logout-button');
    const mapContainer = document.getElementById('map');

    let map, marker;

    // Declare debounceTimer as a global variable
    let debounceTimer;

    // Create the suggestion list container dynamically
    const suggestionList = document.createElement('div');
    suggestionList.classList.add('results-container');
    locationSearch.parentNode.appendChild(suggestionList);

    // Wait for Firebase Authentication to initialize
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.error("No authenticated user found. Redirecting to login page...");
            window.location.href = "../index.html";
            return;
        }

        try {
            const companyRef = doc(db, "companies", user.uid);
            const companyDoc = await getDoc(companyRef);

            if (companyDoc.exists()) {
                const companyData = companyDoc.data();

                companyName.value = companyData.companyName || "";
                companyDescription.value = companyData.description || "";
                companyType.value = companyData.type || "";
                openForOJT.checked = companyData.openForOJT || false;

                // Display the photo if it exists in Firestore
                if (companyData.photoURL) {
                    companyPhoto.src = companyData.photoURL;
                } else {
                    companyPhoto.src = "../img/sample-profile.jpg"; // Default photo
                }

                if (companyData.location) {
                    const { lat, lng } = companyData.location;
                    initializeMap(lat, lng);
                    locationMessage.textContent = `Saved location: ${companyData.locationName || "Not set"}`;
                } else {
                    initializeMap(14.5995, 120.9842); // Default to Manila
                }
            } else {
                console.error("Company data not found in Firestore.");
                initializeMap(14.5995, 120.9842); // Default to Manila
            }
        } catch (error) {
            console.error("Error fetching company data:", error);
        }
    });

    // Initialize map
    function initializeMap(lat, lng) {
        map = L.map(mapContainer).setView([lat, lng], 15);

        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        marker = L.marker([lat, lng], { draggable: true }).addTo(map);

        marker.on('dragend', () => {
            const position = marker.getLatLng();
            locationMessage.textContent = `Selected location: Latitude ${position.lat.toFixed(6)}, Longitude ${position.lng.toFixed(6)}`;
        });

        satelliteToggle.addEventListener('change', () => {
            if (satelliteToggle.checked) {
                tileLayer.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
            } else {
                tileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
            }
        });

        // Add a button to mark the location manually
        const markLocationButton = document.createElement('button');
        markLocationButton.textContent = "Mark Location";
        markLocationButton.classList.add('mark-location-button');
        mapContainer.parentNode.insertBefore(markLocationButton, mapContainer.nextSibling);

        markLocationButton.addEventListener('click', () => {
            const center = map.getCenter(); // Get the center of the map
            marker.setLatLng(center); // Move the marker to the center
            locationMessage.textContent = `Selected location: Latitude ${center.lat.toFixed(6)}, Longitude ${center.lng.toFixed(6)}`;
        });
    }

    // Debounced location search with suggestion list
    locationSearch.addEventListener('input', () => {
        const query = locationSearch.value.trim();
        if (!query) {
            suggestionList.innerHTML = ""; // Clear suggestions if input is empty
            suggestionList.style.display = "none";
            return;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchLocationWithSuggestions(query);
        }, 300); // 300ms debounce delay
    });

    // Handle "Enter" key to select the first suggestion
    locationSearch.addEventListener('keydown', (event) => {
        if (event.key === "Enter") {
            const firstSuggestion = suggestionList.querySelector('.suggestion-item');
            if (firstSuggestion) {
                firstSuggestion.click(); // Trigger click on the first suggestion
            }
        }
    });

    async function searchLocationWithSuggestions(query) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const results = await response.json();

            suggestionList.innerHTML = ""; // Clear previous suggestions

            if (results.length > 0) {
                results.forEach((result, index) => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = result.display_name;

                    // Highlight the first suggestion as default
                    if (index === 0) {
                        suggestionItem.classList.add('default-suggestion');
                    }

                    // Add click event to update map and marker
                    suggestionItem.addEventListener('click', () => {
                        const { lat, lon, display_name } = result;
                        map.setView([lat, lon], 15);
                        marker.setLatLng([lat, lon]);
                        locationMessage.textContent = `Selected location: ${display_name}`;
                        suggestionList.innerHTML = ""; // Clear suggestions after selection
                    });

                    suggestionList.appendChild(suggestionItem);
                });

                suggestionList.style.display = "block"; // Show the suggestion list
            } else {
                suggestionList.style.display = "none"; // Hide if no results
            }
        } catch (error) {
            console.error("Error fetching location suggestions:", error);
            locationMessage.textContent = "Error fetching location suggestions.";
        }
    }

    // Hide suggestion list when clicking outside
    document.addEventListener('click', (event) => {
        if (!locationSearch.contains(event.target) && !suggestionList.contains(event.target)) {
            suggestionList.style.display = "none";
        }
    });

    // Save profile
    saveProfile.addEventListener('click', async () => {
        const user = auth.currentUser;
        const position = marker.getLatLng();

        const companyData = {
            companyName: companyName.value,
            description: companyDescription.value,
            type: companyType.value,
            openForOJT: openForOJT.checked,
            location: {
                lat: position.lat,
                lng: position.lng
            },
            locationName: locationMessage.textContent.replace("Selected location: ", ""),
            photoURL: companyPhoto.src
        };

        try {
            await updateDoc(doc(db, "companies", user.uid), companyData);
            alert("Profile saved successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
        }
    });

    // Upload profile picture
    uploadPhoto.addEventListener('change', async (event) => {
        const file = event.target.files[0]; // Get the selected file
        if (file) {
            try {
                const user = auth.currentUser; // Get the authenticated user
                const storageRef = ref(storage, `companyPhotos/${user.uid}/${file.name}`); // Create a reference in Firebase Storage
                await uploadBytes(storageRef, file); // Upload the file to Firebase Storage
                const photoURL = await getDownloadURL(storageRef); // Get the download URL of the uploaded file

                // Update the company photo in Firestore
                await updateDoc(doc(db, "companies", user.uid), {
                    photoURL: photoURL
                });

                // Update the photo on the page
                const companyPhoto = document.getElementById('companyPhoto'); // Ensure the image element exists
                if (companyPhoto) {
                    companyPhoto.src = photoURL; // Update the image source
                }

                alert("Photo uploaded and displayed successfully!");
            } catch (error) {
                console.error("Error uploading photo:", error);
                alert("Failed to upload photo. Please try again.");
            }
        } else {
            alert("No file selected.");
        }
    });
}
