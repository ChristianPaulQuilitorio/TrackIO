import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDlb3OuUZCmKKXfCZ0HN-lTS7Px3LTpEnY",
    authDomain: "track-io-c06e4.firebaseapp.com",
    projectId: "track-io-c06e4",
    storageBucket: "track-io-c06e4.appspot.com",
    messagingSenderId: "298561401488",
    appId: "1:298561401488:web:c46ac57407eeddda125e15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Example: Add interactivity to the navigation bar
document.addEventListener('DOMContentLoaded', () => {
    const navbarLinks = document.querySelectorAll('.navbar a');
    const burgerButton = document.querySelector('.burger-button');
    const navbar = document.querySelector('.navbar');

    navbarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            console.log(`Navigating to: ${event.target.getAttribute('href')}`);
        });
    });

    // Toggle navbar visibility when the burger button is clicked
    burgerButton.addEventListener('click', (event) => {
        navbar.classList.toggle('visible'); // Toggle the visibility of the navbar
        event.stopPropagation(); // Prevent the click from propagating to the document
    });

    // Hide the navbar when clicking outside of it
    document.addEventListener('click', (event) => {
        if (!navbar.contains(event.target) && !burgerButton.contains(event.target)) {
            navbar.classList.remove('visible'); // Hide the navbar
        }
    });

    const notificationIcon = document.getElementById('notification-icon');
    const notificationPopup = document.getElementById('notification-popup');

    // Sample notification data
    const notifications = [
        {
            name: "John Doe",
            description: "Kindly accomplish your documentation in your OJT.",
            logo: "../img/profile.png"
        },
        {
            name: "Jane Smith",
            description: "Commented on your recent post.",
            logo: "../img/profile.png"
        }
    ];

    // Function to render notifications
    function renderNotifications() {
        notificationPopup.innerHTML = ""; // Clear existing notifications
        notifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.classList.add('notification-item');

            notificationItem.innerHTML = `
                <img src="${notification.logo}" alt="User Icon" class="notification-logo">
                <div class="notification-content">
                    <p class="notification-name">${notification.name}</p>
                    <p class="notification-description">${notification.description}</p>
                </div>
            `;

            notificationPopup.appendChild(notificationItem);
        });
    }

    // Toggle notification pop-up visibility
    notificationIcon.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click from propagating to the document
        notificationPopup.classList.toggle('hidden');
        renderNotifications(); // Render notifications when the pop-up is toggled
    });

    // Hide notification pop-up when clicking outside
    document.addEventListener('click', () => {
        notificationPopup.classList.add('hidden');
    });

    const checkInButton = document.getElementById('check-in-button');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const remainingHoursElement = document.getElementById('remaining-hours');
    const locationElement = document.getElementById('location');
    const logoutButton = document.getElementById('logout-button');

    let isCheckedIn = false;
    let remainingHours = 200;
    let watchId = null; // ID for the geolocation watcher

    // Function to get the current date and time in MM/DD/YY and 12-hour format
    function getCurrentDateTime() {
        const now = new Date();
        const options = { month: '2-digit', day: '2-digit', year: '2-digit' };
        const date = now.toLocaleDateString('en-US', options);
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `${date} ${time}`;
    }

    // Function to calculate hours between two times
    function calculateHours(start, end) {
        const startTime = new Date(`01/01/2000 ${start}`);
        const endTime = new Date(`01/01/2000 ${end}`);
        const diff = (endTime - startTime) / (1000 * 60 * 60); // Convert milliseconds to hours
        return diff;
    }

    // Function to start location tracking
    function startLocationTracking(user) {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        if (!user || !user.uid) {
            console.error("No authenticated user found or user UID is undefined.");
            return;
        }

        // Start watching the user's location
        watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                console.log("Real-time location:", { latitude, longitude });

                try {
                    // Update the user's location in Firestore
                    const userDocRef = doc(db, "users", user.uid);
                    await updateDoc(userDocRef, {
                        location: {
                            latitude: latitude,
                            longitude: longitude,
                            timestamp: new Date().toISOString(),
                        },
                    });

                    console.log("Real-time location updated in Firestore.");
                } catch (error) {
                    console.error("Error updating location in Firestore:", error);
                }
            },
            (error) => {
                console.error("Error fetching real-time location:", error);
            },
            {
                enableHighAccuracy: true, // Request high accuracy for better precision
                timeout: 10000, // Timeout after 10 seconds
                maximumAge: 0, // Do not use cached location
            }
        );

        console.log("Real-time location tracking started.");
    }

    // Function to stop location tracking
    function stopLocationTracking(user) {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId); // Stop tracking
            watchId = null;

            console.log("Real-time location tracking stopped.");

            // Remove location from Firestore
            if (user && user.uid) {
                const userDocRef = doc(db, "users", user.uid);
                updateDoc(userDocRef, {
                    location: null, // Clear the location field
                })
                    .then(() => {
                        console.log("Location removed from Firestore.");
                    })
                    .catch((error) => {
                        console.error("Error removing location from Firestore:", error);
                    });
            }
        }
    }

    // Event listener for Check In/Check Out button
    checkInButton.addEventListener('click', () => {
        console.log('Button clicked'); // Debugging log
        if (!isCheckedIn) {
            // Check In
            const currentTime = getCurrentDateTime();
            startTimeInput.value = currentTime;
            checkInButton.textContent = 'Check Out';
            checkInButton.classList.add('checked-out');
            isCheckedIn = true;

            // Start location tracking
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    startLocationTracking(user);
                }
            });
        } else {
            // Check Out
            const currentTime = getCurrentDateTime();
            endTimeInput.value = currentTime;

            // Calculate hours worked and update remaining hours
            const startTime = startTimeInput.value.split(' ')[1]; // Extract time from Start Time
            const endTime = endTimeInput.value.split(' ')[1]; // Extract time from End Time
            const hoursWorked = calculateHours(startTime, endTime);

            remainingHours -= hoursWorked;
            remainingHoursElement.textContent = Math.max(0, remainingHours).toFixed(2);

            // Reset for next Check In
            checkInButton.textContent = 'Check In';
            checkInButton.classList.remove('checked-out');
            isCheckedIn = false;

            // Stop location tracking
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    stopLocationTracking(user);
                }
            });
        }
    });

    // Geolocation functionality
    const mapContainer = document.getElementById('map');

    let map; // Leaflet map instance
    let marker; // Leaflet marker instance
    let lastFetchedLocation = null; // Cache for the last fetched location
    let lastApiCallTime = 0; // Timestamp for throttling API calls

    function updateLocation(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const currentTime = Date.now();

        // Fallback to show latitude and longitude immediately
        locationElement.textContent = `Fetching location name... (Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)})`;

        // Check if the location is already cached
        if (lastFetchedLocation && lastFetchedLocation.latitude === latitude && lastFetchedLocation.longitude === longitude) {
            locationElement.textContent = `Location: ${lastFetchedLocation.name}`;
            return;
        }

        // Throttle API calls to once every 10 seconds
        if (currentTime - lastApiCallTime < 10000) {
            return;
        }
        lastApiCallTime = currentTime;

        // Fetch the exact location name using the Nominatim API
        const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        fetch(geocodingUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const locationName = data.display_name || "Location not found";
                locationElement.textContent = `Location: ${locationName}`;
                lastFetchedLocation = { latitude, longitude, name: locationName }; // Cache the location
            })
            .catch(error => {
                console.error("Error fetching location name:", error);
                locationElement.textContent = "Unable to fetch location name.";
            });

        // Initialize the map if it hasn't been created yet
        if (!map) {
            map = L.map(mapContainer).setView([latitude, longitude], 18); // Set initial view with higher zoom level

            // Add satellite tile layer
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
                maxZoom: 23 // Allow zooming further if supported by the tile layer
            }).addTo(map);
        } else {
            map.setView([latitude, longitude], 18); // Re-center the map on the new location
        }

        // Add or update the marker with a custom icon
        const customIcon = L.icon({
            iconUrl: '../img/sample-profile.jpg', // Path to your custom logo
            iconSize: [50, 50], // Adjust the size of the icon
            iconAnchor: [25, 50], // Anchor point of the icon (center-bottom)
        });

        if (marker) {
            marker.setLatLng([latitude, longitude]); // Update marker position
        } else {
            marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map); // Add new marker
        }
    }

    function handleLocationError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                locationElement.textContent = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                locationElement.textContent = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                locationElement.textContent = "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                locationElement.textContent = "An unknown error occurred.";
                break;
        }
    }

    if (navigator.geolocation) {
        // Use watchPosition for real-time tracking
        navigator.geolocation.watchPosition(updateLocation, handleLocationError, {
            enableHighAccuracy: true, // Request high accuracy for better precision
            timeout: 10000, // Timeout after 10 seconds
            maximumAge: 0 // Do not use cached location
        });
    } else {
        locationElement.textContent = "Geolocation is not supported by this browser.";
    }

    // Function to fetch and store the user's location
    async function storeLocation() {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        // Get the current user
        const user = auth.currentUser;
        if (!user) {
            console.error("No authenticated user found.");
            return;
        }

        try {
            // Fetch the user's details from Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                console.error("User document does not exist in Firestore.");
                return;
            }

            const userData = userDoc.data(); // Retrieve user data (e.g., firstName, lastName, email)

            // Fetch the user's location
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    console.log("User's location:", { latitude, longitude });

                    // Store the location in Firestore under the user's document
                    await updateDoc(userDocRef, {
                        location: {
                            latitude: latitude,
                            longitude: longitude,
                            timestamp: new Date().toISOString(),
                        },
                    });

                    console.log("Location stored successfully in Firestore for user:", userData);
                },
                (error) => {
                    console.error("Error fetching location:", error);
                }
            );
        } catch (error) {
            console.error("Error fetching user details or storing location:", error);
        }
    }

    // Call the function to store the location
    storeLocation();

    // Function to start real-time location tracking
    function startRealTimeLocationTracking(user) {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        if (!user || !user.uid) {
            console.error("No authenticated user found or user UID is undefined.");
            return;
        }

        // Start watching the user's location
        watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                console.log("Real-time location:", { latitude, longitude });

                try {
                    // Update the user's location in Firestore
                    const userDocRef = doc(db, "users", user.uid);
                    await updateDoc(userDocRef, {
                        location: {
                            latitude: latitude,
                            longitude: longitude,
                            timestamp: new Date().toISOString(),
                        },
                    });

                    console.log("Real-time location updated in Firestore.");
                } catch (error) {
                    console.error("Error updating location in Firestore:", error);
                }
            },
            (error) => {
                console.error("Error fetching real-time location:", error);
            },
            {
                enableHighAccuracy: true, // Request high accuracy for better precision
                timeout: 10000, // Timeout after 10 seconds
                maximumAge: 0, // Do not use cached location
            }
        );

        console.log("Real-time location tracking started.");
    }

    // Function to stop real-time location tracking
    function stopRealTimeLocationTracking() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId); // Stop tracking
            watchId = null;
            console.log("Real-time location tracking stopped.");
        }
    }

    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is authenticated:", user);

            // Start real-time location tracking
            startRealTimeLocationTracking(user);

            // Logout functionality
            logoutButton.addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    console.log("User logged out successfully.");
                    stopRealTimeLocationTracking(); // Stop tracking on logout
                    window.location.href = "../index.html"; // Redirect to login page
                } catch (error) {
                    console.error("Error logging out:", error);
                }
            });
        } else {
            console.error("No authenticated user found.");
            window.location.href = "../index.html"; // Redirect to login page if not authenticated
        }
    });

    // Example: Start tracking when the page loads
    startRealTimeLocationTracking();

    // Example: Stop tracking when the user logs out or navigates away
    window.addEventListener("beforeunload", () => {
        stopRealTimeLocationTracking();
    });

    // Logout functionality
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth); // Sign out the user
            console.log("User logged out successfully.");
            window.location.href = "../index.html"; // Redirect to login page
        } catch (error) {
            console.error("Error logging out:", error);
        }
    });
});