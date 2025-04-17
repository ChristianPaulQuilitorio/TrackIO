// Import Firebase modules
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    signOut,
    sendEmailVerification,
    updatePassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Initialize Firebase only if not already initialized
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);  // Initialize Firebase if not yet done
} else {
    app = getApp();  // Use the already initialized app
}

const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Persistence set"))
    .catch((error) => console.error("Persistence error:", error));

// Show feedback message
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

// Fetch user profile from local database via PHP API
async function fetchUserProfile(uid) {
    try {
        const response = await fetch(`../../PHP/get-student-profile.php?uid=${uid}`);
        const data = await response.json();
        if (data.status === "success") {
            return data.profile;  // Return profile data
        } else {
            throw new Error(data.message || "Error fetching profile");
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;  // Rethrow to handle further in the calling code
    }
}

// Validate form fields
function validateEmailAndPassword(email, password) {
    if (!email || !password) {
        return "Email and password are required.";
    }
    if (password.length < 6) {
        return "Password must be at least 6 characters long.";
    }
    return null;
}

// DOM Ready Logic
document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.currentUser;  // Get the logged-in user
    const userNameSpan = document.getElementById("user-name");
    const userEmailSpan = document.getElementById("user-email");

    // Check if the user is authenticated
    if (user) {
        userEmailSpan.textContent = user.email;  // Display the email

        // Fetch user data from the PHP backend
        try {
            const userProfile = await fetchUserProfile(user.uid);
            const firstName = userProfile.firstName;
            const lastName = userProfile.lastName;

            // Display the first and last name
            userNameSpan.textContent = `${firstName} ${lastName}`;
        } catch (error) {
            console.error("Error fetching user data:", error);
            userNameSpan.textContent = "Guest";  // Default fallback
        }
    } else {
        // If no user is logged in, show "Guest"
        userNameSpan.textContent = "Guest";
        userEmailSpan.textContent = "Not Available";
    }

    const loginButton = document.getElementById('submitLogin');
    const logoutButton = document.getElementById('logout-button');

    // Login
    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const email = document.getElementById('lEmail').value.trim();
            const password = document.getElementById('lPassword').value.trim();

            const validationMessage = validateEmailAndPassword(email, password);
            if (validationMessage) {
                showMessage(validationMessage, 'loginMessage');
                return;
            }

            try {
                const studentCredential = await signInWithEmailAndPassword(auth, email, password);
                const student = studentCredential.user;

                if (!student.emailVerified) {
                    await signOut(auth);
                    showMessage("Please verify your email before logging in.", 'loginMessage');
                    return;
                }

                window.location.href = "student-dashboard.html";
            } catch (error) {
                console.error("Login error:", error);
                showMessage("Login failed. Please try again.", 'loginMessage');
            }
        });
    }

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                localStorage.removeItem("pendingVerificationEmail");
                localStorage.removeItem("tempFirstName");
                localStorage.removeItem("tempLastName");
                localStorage.removeItem("tempUID");

                window.location.href = "/Student/student-login.html";
            } catch (error) {
                console.error("Logout error:", error);
                showMessage("Logout failed. Please try again.", 'loginMessage');
            }
        });
    }

    // Prefill form fields if temp data exists
    if (localStorage.getItem("pendingVerificationEmail")) {
        const email = localStorage.getItem("pendingVerificationEmail");
        const firstName = localStorage.getItem("tempFirstName");
        const lastName = localStorage.getItem("tempLastName");

        const emailField = document.getElementById('rEmail');
        const firstNameField = document.getElementById('rFirstName');
        const lastNameField = document.getElementById('rLastName');

        if (emailField && firstNameField && lastNameField) {
            emailField.value = email;
            firstNameField.value = firstName;
            lastNameField.value = lastName;
        }
    }

    // Final profile completion with password
    const completeProfileForm = document.getElementById("completeProfileForm");
    if (completeProfileForm) {
        completeProfileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = localStorage.getItem("pendingVerificationEmail");
            const firstName = document.getElementById("rFirstName").value.trim();
            const lastName = document.getElementById("rLastName").value.trim();
            const password = document.getElementById("rPassword").value.trim();
            const confirmPassword = document.getElementById("rConfirmPassword").value.trim();

            if (!email || !firstName || !lastName || !password || !confirmPassword) {
                showMessage("All fields are required.", 'registerMessage');
                return;
            }

            if (password !== confirmPassword) {
                showMessage("Passwords do not match.", 'registerMessage');
                return;
            }

            try {
                const user = auth.currentUser;

                if (!user) {
                    showMessage("No authenticated user found. Please log in again.", 'registerMessage');
                    return;
                }

                // Ensure user is authenticated before proceeding
                if (!user.emailVerified) {
                    showMessage("Please verify your email first.", 'registerMessage');
                    return;
                }

                // Update password
                await updatePassword(user, password);

                // Update profile display name
                await updateProfile(user, {
                    displayName: `${firstName} ${lastName}`
                });

                // Add user data to Firestore
                const studentData = {
                    firstName,
                    lastName,
                    email: user.email,
                    uid: user.uid,
                    accountType: "student",
                    emailVerified: user.emailVerified
                };

                // Save student data in Firestore and check for errors
                await setDoc(doc(db, "students", user.uid), studentData)
                    .then(() => {
                        localStorage.removeItem("pendingVerificationEmail");
                        localStorage.removeItem("tempFirstName");
                        localStorage.removeItem("tempLastName");
                        localStorage.removeItem("tempUID");
                        showMessage("Profile completed successfully!", 'registerMessage');
                        window.location.href = "student-dashboard.html";
                    })
                    .catch((error) => {
                        console.error("Firestore error:", error);
                        showMessage("Error saving profile. Try again.", 'registerMessage');
                    });

            } catch (error) {
                console.error("Complete Registration Error:", error);
                showMessage(error.message, 'registerMessage');
            }
        });
    }
});
