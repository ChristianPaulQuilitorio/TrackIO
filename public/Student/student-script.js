import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC9z8Amm-vlNcbw-XqEnrkt_WpWHaGfwtQ",
    authDomain: "trackio-f5b07.firebaseapp.com",
    projectId: "trackio-f5b07",
    storageBucket: "trackio-f5b07.firebasestorage.app",
    messagingSenderId: "1083789426923",
    appId: "1:1083789426923:web:c372749a28e84ff9cd7eae",
    measurementId: "G-DSPVFG2CYW"
};

// Consolidate Firestore initialization
const db = getFirestore(initializeApp(firebaseConfig));
const auth = getAuth();

// Reusable function to fetch Firestore documents
async function fetchCollectionDocs(collectionName) {
    try {
        const collectionRef = collection(db, collectionName);
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching documents from ${collectionName}:`, error);
        throw new Error(`Failed to fetch data from ${collectionName}`);
    }
}

// Enhanced function to fetch all students
async function fetchAllStudents() {
    try {
        const students = await fetchCollectionDocs("students");
        students.forEach(student => {
            console.log(`Student ID: ${student.id}, Data:`, student);
        });
    } catch (error) {
        console.error("Error fetching students:", error);
    }
}

// Improved date formatting function
function getCurrentDate() {
    return new Date().toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Enhanced 12-hour to 24-hour time conversion
function convertTo24HourFormat(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    hours = modifier === 'PM' && hours !== '12' ? parseInt(hours, 10) + 12 : hours;
    hours = modifier === 'AM' && hours === '12' ? '00' : hours;
    return `${hours}:${minutes}`;
}

// Example usage of the fetchAllStudents function
fetchAllStudents();

// Improved navigation interactivity
function setupNavbar() {
    const navbarLinks = document.querySelectorAll('.navbar a');
    const burgerButton = document.querySelector('.burger-button');
    const navbar = document.querySelector('.navbar');

    navbarLinks.forEach(link => {
        link.addEventListener('click', event => {
            console.log(`Navigating to: ${event.target.getAttribute('href')}`);
        });
    });

    burgerButton.addEventListener('click', event => {
        navbar.classList.toggle('visible');
        event.stopPropagation();
    });

    document.addEventListener('click', event => {
        if (!navbar.contains(event.target) && !burgerButton.contains(event.target)) {
            navbar.classList.remove('visible');
        }
    });
}

// Initialize navbar interactivity
setupNavbar();

// Example: Add interactivity to the navigation bar
document.addEventListener('DOMContentLoaded', () => {
    const notificationIcon = document.getElementById('notification-icon');
    const notificationPopup = document.getElementById('notification-popup');

    // Function to fetch notifications
    async function fetchNotifications(user) {
        if (!user || !user.uid) {
            console.error("No authenticated user found.");
            return;
        }

        try {
            const notificationsRef = collection(db, "notifications");
            const querySnapshot = await getDocs(notificationsRef);

            const notifications = [];
            querySnapshot.forEach((doc) => {
                notifications.push(doc.data());
            });

            renderNotifications(notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }

    // Function to render notifications
    function renderNotifications(notifications) {
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

    // Fetch notifications when the notification icon is clicked
    notificationIcon.addEventListener('click', async (event) => {
        event.stopPropagation(); // Prevent click from propagating to the document
        notificationPopup.classList.toggle('hidden');
        const user = auth.currentUser;
        if (user) {
            await fetchNotifications(user);
        }
    });

    const checkInButton = document.getElementById('check-in-button');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const remainingHoursElement = document.getElementById('remaining-hours');
    const locationElement = document.getElementById('location');
    const logoutButton = document.getElementById('logout-button');

    let isCheckedIn = false;
    let remainingHours = 200;

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

    // Function to store or update check-in and check-out data in Firestore
    async function storeCheckInOutData(user, checkInTime, checkOutTime) {
        if (!user || !user.uid) {
            console.error("No authenticated user found.");
            return;
        }

        try {
            const studentDocRef = doc(db, "students", user.uid);
            const studentDoc = await getDoc(studentDocRef);
            let checkInOutData = [];

            if (studentDoc.exists()) {
                console.log("Student document found:", studentDoc.data());
                checkInOutData = studentDoc.data().checkInOutData || [];
            } else {
                console.warn("Student document does not exist for UID:", user.uid);
            }

            const currentDate = getCurrentDate(); // Use the helper function to get the current date

            // Add a new entry for the current date
            checkInOutData.push({
                checkInTime: checkInTime || null,
                checkOutTime: checkOutTime || null,
                date: currentDate
            });

            // Update Firestore with the modified data
            await updateDoc(studentDocRef, {
                checkInOutData: checkInOutData
            });

            console.log("Check-in and check-out data added successfully in Firestore.");
        } catch (error) {
            console.error("Error storing check-in and check-out data in Firestore:", error);
        }
    }

    // Function to reset data for the current date in Firestore
    async function resetDataForCurrentDate(user) {
        if (!user || !user.uid) {
            console.error("No authenticated user found.");
            return;
        }

        try {
            const studentDocRef = doc(db, "students", user.uid);
            const studentDoc = await getDoc(studentDocRef);
            let checkInOutData = [];

            if (studentDoc.exists()) {
                console.log("Student document found:", studentDoc.data());
                checkInOutData = studentDoc.data().checkInOutData || [];
            } else {
                console.warn("Student document does not exist for UID:", user.uid);
                return;
            }

            const currentDate = getCurrentDate(); // Use the helper function to get the current date

            // Filter out entries for the current date
            const updatedCheckInOutData = checkInOutData.filter(entry => entry.date !== currentDate);

            // Update Firestore with the modified data
            await updateDoc(studentDocRef, {
                checkInOutData: updatedCheckInOutData
            });

            console.log(`Data for ${currentDate} reset successfully in Firestore.`);
        } catch (error) {
            console.error("Error resetting data for the current date in Firestore:", error);
        }
    }

    // Modify the Check In/Check Out button event listener
    checkInButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to check in.");
            return;
        }

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

        if (!isCheckedIn) {
            // Check-In Logic
            checkInTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // Format with AM/PM
            startTimeInput.value = checkInTime;
            console.log(`Checked In at: ${checkInTime}`);
            checkInButton.textContent = 'Check Out';
            isCheckedIn = true;

            // Save check-in time to Firestore
            await storeCheckInOutData(user, checkInTime, null);
        } else {
            // Check-Out Logic
            checkOutTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // Format with AM/PM
            endTimeInput.value = checkOutTime;
            console.log(`Checked Out at: ${checkOutTime}`);
            checkInButton.textContent = 'Confirm Save';

            // Change button behavior to save the data
            checkInButton.addEventListener('click', async () => {
                await storeCheckInOutData(user, null, checkOutTime);
                alert("Check-in and check-out saved successfully!");
                loadCalendarEvents(user); // Reload calendar events
                checkInButton.textContent = 'Check In';
                isCheckedIn = false;
                checkInTime = null;
                checkOutTime = null;
                startTimeInput.value = '';
                endTimeInput.value = '';
                endTimeInput.value = '';
            }, { once: true });
        }
    });

    // Add a reset button functionality
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.id = 'reset-button';
    resetButton.style.marginTop = '10px';

    // Append the reset button to the check-in container
    const checkInContainer = document.querySelector('.check-in-container');
    checkInContainer.appendChild(resetButton);

    // Function to store reset data in Firestore with a new timestamp
    async function storeResetData(user) {
        if (!user || !user.uid) {
            console.error("No authenticated user found.");
            return;
        }

        const resetTimestamp = new Date().toISOString(); // Get current timestamp

        try {
            const userDocRef = doc(db, "users", user.uid);

            // Add a new reset entry with the timestamp
            await updateDoc(userDocRef, {
                resets: arrayUnion({
                    timestamp: resetTimestamp
                })
            });

            console.log("Reset data stored successfully in Firestore with timestamp:", resetTimestamp);
        } catch (error) {
            console.error("Error storing reset data in Firestore:", error);
        }
    }

    // Add event listener to reset button
    resetButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to reset data.");
            return;
        }

        // Reset the UI
        startTimeInput.value = '';
        endTimeInput.value = '';
        checkInTime = null;
        checkOutTime = null;
        isCheckedIn = false;
        checkInButton.textContent = 'Check In';
        console.log("Check-in and check-out reset.");

        // Reset data for the current date in Firestore
        await resetDataForCurrentDate(user);

        // Reload calendar events to reflect the changes
        await loadCalendarEvents(user);
    });

// Geolocation functionality
const mapContainer = document.getElementById('map');
let map = null; // Leaflet map instance
let marker = null; // Leaflet marker instance
let watchId = null; // ID for the geolocation watcher
let isSatelliteView = false; // Track the current map view (default is standard)

// Function to fetch the location name using reverse geocoding
async function fetchLocationName(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const address = data.address;
        const locationName = `${address.village || address.town || address.city}, ${address.state}, ${address.postcode}`;
        console.log("Fetched location name:", locationName);
        return locationName;
    } catch (error) {
        console.error("Error fetching location name:", error);
        return "Unknown Location";
    }
}

// Function to initialize or update the map
function initializeMap(latitude, longitude, firstName, lastName, locationName) {
    if (!map) {
        // Initialize the map if it doesn't exist
        map = L.map('map').setView([latitude, longitude], 13); // Set initial view with zoom level 13
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);
    }

    if (marker) {
        // Remove the existing marker
        map.removeLayer(marker);
    }

    // Define a custom icon for the marker
    const customIcon = L.icon({
        iconUrl: '../img/sample-profile.jpg', // Path to the custom marker image
        iconSize: [40, 40], // Size of the icon [width, height]
        iconAnchor: [20, 40], // Anchor point of the icon [x, y]
        popupAnchor: [0, -40], // Position of the popup relative to the icon [x, y]
    });

    // Add a new marker at the updated location with the custom icon
    marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
        <strong>${firstName} ${lastName}</strong><br>
        Location: ${locationName}<br>
        Latitude: ${latitude}, Longitude: ${longitude}
    `).openPopup();
}

// Function to update the user's location on the map and in Firestore
async function updateLocation(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy; // Accuracy in meters

    console.log("Real-time location:", { latitude, longitude, accuracy });

    // Update the location element
    const locationElement = document.getElementById('location');
    locationElement.textContent = `Latitude: ${latitude}, Longitude: ${longitude}, Accuracy: ${accuracy} meters`;

    const user = auth.currentUser; // Get the current user
    if (!user || !user.uid) {
        console.error("No authenticated user found.");
        return;
    }

    const studentDocRef = doc(db, "students", user.uid);

    try {
        const studentDoc = await getDoc(studentDocRef);

        let studentData = {};
        if (studentDoc.exists()) {
            studentData = studentDoc.data();
        } else {
            console.warn("Student document does not exist. Creating a new document...");
            studentData = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                uid: user.uid,
                accountType: "student",
            };
            await setDoc(studentDocRef, studentData);
            console.log("Default student document created in Firestore:", studentData);
        }

        // Fetch the location name using reverse geocoding
        const locationName = await fetchLocationName(latitude, longitude);

        // Update Firestore with the location data
        await updateDoc(studentDocRef, {
            location: {
                latitude: latitude,
                longitude: longitude,
                name: locationName,
                timestamp: new Date().toISOString(),
            },
        });
        console.log("Location updated in Firestore.");

        // Initialize or update the map
        initializeMap(latitude, longitude, studentData.firstName, studentData.lastName, locationName);
    } catch (error) {
        console.error("Error fetching location name or updating Firestore:", error);
    }
}

// Function to handle location errors
function handleLocationError(error) {
    const locationElement = document.getElementById('location');
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.error("User denied the request for Geolocation.");
            locationElement.textContent = "Location access denied. Please enable location permissions.";
            break;
        case error.POSITION_UNAVAILABLE:
            console.error("Location information is unavailable.");
            locationElement.textContent = "Unable to determine location. Please try again later.";
            break;
        case error.TIMEOUT:
            console.error("The request to get user location timed out.");
            locationElement.textContent = "Location request timed out. Please ensure you have a stable connection.";
            break;
        default:
            console.error("An unknown error occurred.", error);
            locationElement.textContent = "An unknown error occurred while fetching location.";
            break;
    }

    // Stop real-time location tracking as a fallback
    stopRealTimeLocationTracking();
}

// Function to start real-time location tracking
function startRealTimeLocationTracking() {
    if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        const locationElement = document.getElementById('location');
        locationElement.textContent = "Geolocation is not supported by this browser.";
        return;
    }

    watchId = navigator.geolocation.watchPosition(updateLocation, handleLocationError, {
        enableHighAccuracy: true, // Request high accuracy for better precision
        timeout: 10000, // Timeout after 10 seconds
        maximumAge: 0, // Do not use cached location
    });

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

// Start tracking when the page loads
startRealTimeLocationTracking();

// Stop tracking when the user navigates away
window.addEventListener("beforeunload", () => {
    stopRealTimeLocationTracking();
});

// Add a button to toggle between satellite and standard views
const toggleViewButton = document.createElement('button');
toggleViewButton.textContent = 'Toggle Map View';
toggleViewButton.style.marginTop = '10px';
toggleViewButton.addEventListener('click', toggleMapView);
mapContainer.parentElement.appendChild(toggleViewButton);

// Function to toggle between satellite and standard map views
function toggleMapView() {
    if (!map) {
        console.error("Map is not initialized.");
        return;
    }

    if (isSatelliteView) {
        // Switch to standard view
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);
        console.log("Switched to standard map view.");
    } else {
        // Switch to satellite view
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
            maxZoom: 23,
        }).addTo(map);
        console.log("Switched to satellite map view.");
    }

    isSatelliteView = !isSatelliteView; // Toggle the view state
}
});

// Enhanced error handling and logging for fetching user data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.warn("User document does not exist. Creating a new document...");
            const defaultData = {
                firstName: "Unknown",
                lastName: "User",
                email: user.email,
                uid: user.uid,
                accountType: "student",
            };

            await setDoc(userDocRef, defaultData);
            console.log("Default user document created in Firestore:", defaultData);
        }
    } else {
        console.error("No authenticated user found.");
        window.location.href = "./index.html"; // Redirect to login page if not authenticated
    }
});

// Function to fetch and display all users in the student dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const userListElement = document.getElementById('user-list'); // Ensure this element exists in student-dashboard.html

    if (!userListElement) {
        return;
    }

    try {
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(usersCollection);

        userListElement.innerHTML = ""; // Clear any existing content

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const userItem = document.createElement('div');
            userItem.classList.add('user-item');

            userItem.innerHTML = `
                <p><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
            `;

            userListElement.appendChild(userItem);
        });

        console.log("Users fetched and displayed successfully.");
    } catch (error) {
        console.error("Error fetching users from Firestore:", error);
    }
});

// Ensure proper cleanup of resources during page unload
window.addEventListener("beforeunload", () => {
    stopRealTimeLocationTracking();
});

// Consolidated logout functionality specific to the Student context
const logoutButton = document.getElementById('logout-button');
if (logoutButton && window.location.pathname.includes('student-dashboard.html')) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth); // Sign out the user
            console.log("User logged out successfully.");

            stopRealTimeLocationTracking(); // Stop tracking on logout

            window.location.href = './student-login.html'; // Redirect to the student login page
        } catch (error) {
            console.error("Error during logout:", error);
        }
    });
}

// Function to load student profile
async function loadStudentProfile(user) {
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');

    try {
        const studentDocRef = doc(db, "students", user.uid);
        const studentDoc = await getDoc(studentDocRef);

        if (!studentDoc.exists()) {
            console.warn("Student document does not exist. Creating a new document...");
            const defaultData = {
                firstName: "Unknown",
                lastName: "User",
                email: user.email,
                uid: user.uid,
                accountType: "student",
            };

            await setDoc(studentDocRef, defaultData);
            console.log("Default student document created in Firestore:", defaultData);

            userNameElement.textContent = `${defaultData.lastName}, ${defaultData.firstName}`;
            userEmailElement.textContent = defaultData.email;
        } else {
            const studentData = studentDoc.data();
            console.log("Student document found:", studentData);

            userNameElement.textContent = `${studentData.lastName}, ${studentData.firstName}`;
            userEmailElement.textContent = studentData.email;
        }
    } catch (error) {
        console.error("Error loading student profile:", error);
        userNameElement.textContent = "Unknown User";
        userEmailElement.textContent = "Not Available";
    }
}

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadStudentProfile(user); // Load the profile when the user is authenticated
    } else {
        console.error("No authenticated user found.");
        window.location.href = "student-login.html"; // Redirect to login if not authenticated
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const calendarEl = document.getElementById('calendar');
    const checkInButton = document.getElementById('check-in-button');
    const resetButton = document.getElementById('reset-button');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');

    let isCheckedIn = false;
    let checkInTime = null;
    let checkOutTime = null;

    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [] // Events will be dynamically loaded
    });
    calendar.render();

    // Function to fetch and display events on the calendar
    async function loadCalendarEvents(user) {
        if (!user || !user.uid) return;

        try {
            const studentDocRef = doc(db, "students", user.uid);
            const studentDoc = await getDoc(studentDocRef);

            if (studentDoc.exists()) {
                const checkInOutData = studentDoc.data().checkInOutData || [];
                const events = checkInOutData.flatMap((entry, index) => {
                    const date = entry.date; // Date in YYYY-MM-DD format
                    const checkInEvent = entry.checkInTime
                        ? {
                            id: `${index}-checkIn`, // Unique ID for the event
                            title: `Check-In: ${entry.checkInTime}`,
                            start: `${date}T${convertTo24HourFormat(entry.checkInTime)}`, // Combine date and time
                            color: '#4CAF50', // Green for Check-In
                            extendedProps: { index, type: 'checkIn' }, // Custom properties
                        }
                        : null;
                    const checkOutEvent = entry.checkOutTime
                        ? {
                            id: `${index}-checkOut`, // Unique ID for the event
                            title: `Check-Out: ${entry.checkOutTime}`,
                            start: `${date}T${convertTo24HourFormat(entry.checkOutTime)}`, // Combine date and time
                            color: '#f44336', // Red for Check-Out
                            extendedProps: { index, type: 'checkOut' }, // Custom properties
                        }
                        : null;
                    return [checkInEvent, checkOutEvent].filter(event => event !== null);
                });

                calendar.removeAllEvents(); // Clear existing events
                calendar.addEventSource(events); // Add new events
            } else {
                console.warn("Student document does not exist for UID:", user.uid);
            }
        } catch (error) {
            console.error("Error loading calendar events:", error);
        }
    }

    // Function to store check-in and check-out data in Firestore
    async function storeCheckInOutData(user, checkInTime, checkOutTime) {
        if (!user || !user.uid) {
            console.error("No authenticated user found.");
            return;
        }

        try {
            const studentDocRef = doc(db, "students", user.uid);
            const studentDoc = await getDoc(studentDocRef);
            let checkInOutData = [];

            if (studentDoc.exists()) {
                console.log("Student document found:", studentDoc.data());
                checkInOutData = studentDoc.data().checkInOutData || [];
            } else {
                console.warn("Student document does not exist for UID:", user.uid);
            }

            const currentDate = getCurrentDate(); // Use the helper function to get the current date

            // Add a new entry for the current date
            checkInOutData.push({
                checkInTime: checkInTime || null,
                checkOutTime: checkOutTime || null,
                date: currentDate
            });

            // Update Firestore with the modified data
            await updateDoc(studentDocRef, {
                checkInOutData: checkInOutData
            });

            console.log("Check-in and check-out data added successfully in Firestore.");
        } catch (error) {
            console.error("Error storing check-in and check-out data in Firestore:", error);
        }
    }

    // Function to delete an event from Firestore
    async function deleteEvent(user, eventId) {
        if (!user || !user.uid) {
            console.error("No authenticated user found.");
            return;
        }

        try {
            const studentDocRef = doc(db, "students", user.uid);
            const studentDoc = await getDoc(studentDocRef);

            if (studentDoc.exists()) {
                let checkInOutData = studentDoc.data().checkInOutData || [];
                const [index] = eventId.split('-'); // Extract index from event ID

                // Remove the entire entry for the selected day
                checkInOutData.splice(index, 1);

                // Update Firestore with the modified data
                await updateDoc(studentDocRef, {
                    checkInOutData: checkInOutData
                });

                console.log(`Data for the selected day (index: ${index}) deleted successfully.`);
            } else {
                console.warn("Student document does not exist for UID:", user.uid);
            }
        } catch (error) {
            console.error("Error deleting event from Firestore:", error);
        }
    }

    // Add event click handler to the calendar
    calendar.on('eventClick', async (info) => {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to delete events.");
            return;
        }

        const eventId = info.event.id; // Get the event ID
        const confirmDelete = confirm(`Are you sure you want to delete all data for this day?`);
        if (confirmDelete) {
            await deleteEvent(user, eventId); // Delete the entire day's data from Firestore
            await loadCalendarEvents(user); // Reload calendar events
        }
    });

    // Handle Check-In and Check-Out
    checkInButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to check in.");
            return;
        }

        if (!isCheckedIn) {
            // Check-In Logic
            const now = new Date();
            checkInTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // Format with AM/PM
            startTimeInput.value = checkInTime;
            console.log(`Checked In at: ${checkInTime}`);
            checkInButton.textContent = 'Check Out';
            isCheckedIn = true;
        } else {
            // Check-Out Logic
            const now = new Date();
            checkOutTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // Format with AM/PM
            endTimeInput.value = checkOutTime;
            console.log(`Checked Out at: ${checkOutTime}`);
            checkInButton.textContent = 'Confirm Save';

            // Change button behavior to save the data
            checkInButton.addEventListener('click', async () => {
                await storeCheckInOutData(user, checkInTime, checkOutTime);
                alert("Check-in and check-out saved successfully!");
                loadCalendarEvents(user); // Reload calendar events
                checkInButton.textContent = 'Check In';
                isCheckedIn = false;
                checkInTime = null;
                checkOutTime = null;
                startTimeInput.value = '';
                endTimeInput.value = '';
            }, { once: true });
        }
    });

    // Handle Reset
    resetButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to reset data.");
            return;
        }

        // Reset the UI
        startTimeInput.value = '';
        endTimeInput.value = '';
        checkInTime = null;
        checkOutTime = null;
        isCheckedIn = false;
        checkInButton.textContent = 'Check In';
        console.log("Check-in and check-out reset.");

        // Reset data for the current date in Firestore
        await resetDataForCurrentDate(user);

        // Reload calendar events to reflect the changes
        await loadCalendarEvents(user);
    });

    // Load calendar events on page load
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadCalendarEvents(user);
        }
    });
});