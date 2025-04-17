import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth();

// Debounce function to limit the rate of function execution
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Reusable function to get the authenticated user
function getAuthenticatedUser(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            callback(user);
        } else {
            alert("No user is signed in. Please log in.");
        }
    });
}

// Function to save remaining hours to Firestore
async function saveRemainingHoursToFirestore(userId, remainingHours) {
    try {
        await setDoc(doc(db, "students", userId), { remainingHours });
        alert("Remaining hours saved successfully!");
    } catch (error) {
        console.error("Error saving remaining hours: ", error);
    }
}

// Function to fetch remaining hours from Firestore
async function fetchRemainingHoursFromFirestore(userId) {
    try {
        const docRef = doc(db, "students", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().remainingHours;
        } else {
            console.log("No such document!");
            return 200; // Default value
        }
    } catch (error) {
        console.error("Error fetching remaining hours: ", error);
        return 200; // Default value
    }
}

// Fetch remaining hours on page load
window.addEventListener('load', () => {
    getAuthenticatedUser(async (user) => {
        const userId = user.uid; // Get the authenticated user's unique ID
        const remainingHours = await fetchRemainingHoursFromFirestore(userId);

        const remainingHoursInput = document.getElementById('remaining-hours-input');
        remainingHoursInput.value = remainingHours;
    });
});

// Event listener for save button with debounce and validation
const saveButton = document.getElementById('save-remaining-hours');
saveButton.addEventListener('click', debounce(() => {
    getAuthenticatedUser(async (user) => {
        const userId = user.uid; // Get the authenticated user's unique ID
        const remainingHoursInput = document.getElementById('remaining-hours-input');
        const remainingHours = parseInt(remainingHoursInput.value, 10);

        if (isNaN(remainingHours) || remainingHours < 0) {
            alert("Please enter a valid number for remaining hours.");
            return;
        }

        try {
            await saveRemainingHoursToFirestore(userId, remainingHours);
        } catch (error) {
            alert("Failed to save remaining hours. Please try again later.");
        }
    });
}, 300));