// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signOut, onAuthStateChanged, sendEmailVerification} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Persistence set"))
    .catch((error) => console.error("Persistence error:", error));

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

// Common form validation function
function validateEmailAndPassword(email, password) {
    if (!email || !password) {
        return "Email and password are required.";
    }
    if (password.length < 6) {
        return "Password must be at least 6 characters long.";
    }
    return null;
}

// Authentication state handler
onAuthStateChanged(auth, (student) => {
    const currentPath = window.location.pathname;

    if (!student) {
        if (!currentPath.includes("student-index.html") && !currentPath.includes("verification.html")) {
            window.location.href = "student-index.html";
        }
    } else {
        if (!student.emailVerified) {
            if (!currentPath.includes("verification.html")) {
                window.location.href = "verification.html";
            }
        } else {
            if (currentPath.includes("student-index.html")) {
                window.location.href = "student-dashboard.html";
            }
        }
    }
});

// Register Form Logic
document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('submitSignUp');
    const loginButton = document.getElementById('submitLogin');
    const logoutButton = document.getElementById('logout-button');

    if (signUpButton) {
        signUpButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const email = document.getElementById('rEmail').value.trim();
            const password = document.getElementById('rPassword').value.trim();
            const firstName = document.getElementById('rFirstName').value.trim();
            const lastName = document.getElementById('rLastName').value.trim();

            const validationMessage = validateEmailAndPassword(email, password);
            if (validationMessage) {
                showMessage(validationMessage, 'signUpMessage');
                return;
            }

            if (!firstName || !lastName) {
                showMessage("All fields are required.", 'signUpMessage');
                return;
            }

            try {
                const studentCredential = await createUserWithEmailAndPassword(auth, email, password);
                const student = studentCredential.user;

                const verificationCode = Math.random().toString(36).substring(2, 15);

                const studentData = {
                    firstName,
                    lastName,
                    email,
                    uid: student.uid,
                    accountType: "student",
                    emailVerified: false,
                    verificationCode
                };

                await setDoc(doc(db, "students", student.uid), studentData);

                // Send email verification and redirect
                showMessage("Verification email sent!", 'signUpMessage');
                await sendEmailVerification(student);

                // Send user data to PHP for registration in the local DB
                await fetch("../../PHP/verification.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        uid: student.uid,
                        email,
                        firstName,
                        lastName,
                        verificationCode
                    })
                });

                // Sign out the user to block access until verified
                await signOut(auth);

                // Store email for later use on the verification page
                localStorage.setItem("pendingVerificationEmail", email);

                // Redirect to verification page
                window.location.href = `verification.html?uid=${student.uid}`;

            } catch (error) {
                console.error("Registration error:", error);
                showMessage("Registration failed. Please try again.", 'signUpMessage');
            }
        });
    }

    // Login Form Logic
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

    // Logout Logic
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                localStorage.removeItem("pendingVerificationEmail");
                window.location.href = "/Student/student-index.html";
            } catch (error) {
                console.error("Logout error:", error);
                showMessage("Logout failed. Please try again.", 'loginMessage');
            }
        });
    }
});
