// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
  
localStorage.setItem('firebase:debug', 'true');
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Test Firebase initialization
console.log("Firebase App Name:", app.name); // Should log "[DEFAULT]" if Firebase is initialized correctly

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

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
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(() => {
        messageDiv.style.opacity = 0;
        messageDiv.style.display = "none";
    }, 5000);
}

// Event listener for registration
document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('submitSignUp');
    const signUpMessage = document.getElementById('signUpMessage');

    if (signUpButton) {
        signUpButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default button behavior

            const email = document.getElementById('rEmail').value.trim();
            const password = document.getElementById('rPassword').value.trim();
            const firstName = document.getElementById('rFirstName').value.trim();
            const lastName = document.getElementById('rLastName').value.trim();

            console.log("Attempting to register user with email:", email);

            // Validate input fields
            if (!firstName || !lastName || !email || !password) {
                showMessage("All fields are required.", 'signUpMessage');
                return;
            }

            // Validate password length
            if (password.length < 6) {
                showMessage("Password must be at least 6 characters long.", 'signUpMessage');
                return;
            }

            try {
                // Create user with email and password
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log('User registered successfully with UID:', user.uid, 'and email:', user.email);

                // Add user data to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstName,
                    lastName: lastName,
                    email: email
                });

                console.log("User data saved to Firestore");
                showMessage("User registered successfully!", 'signUpMessage');

                // Redirect to login page
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 2000);
            } catch (error) {
                console.error("Error during registration:", error);
                if (error.code === 'auth/email-already-in-use') {
                    showMessage("Email already in use.", 'signUpMessage');
                } else if (error.code === 'auth/invalid-email') {
                    showMessage("Invalid email address.", 'signUpMessage');
                } else if (error.code === 'auth/weak-password') {
                    showMessage("Password must be at least 6 characters long.", 'signUpMessage');
                } else {
                    showMessage("Registration failed. Please try again.", 'signUpMessage');
                }
            }
        });
    }

    const loginButton = document.getElementById('submitLogin');
    const loginMessage = document.getElementById('loginMessage');

    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default button behavior
    
            const email = document.getElementById('lEmail').value.trim();
            const password = document.getElementById('lPassword').value.trim();
            
            const allowedDomain = "@gordongollege.edu.ph";
            if (email.endsWith(allowedDomain)) {
                window.location.href = "./student-dashboard.html";
                return;
                        }
            try {
                                // Sign in user with email and password
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log('User logged in successfully with UID:', user.uid, 'and email:', user.email);
    
                // Fetch user data from Firestore
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
    
                if (userDoc.exists()) {
                    console.log("User data from Firestore:", userDoc.data());
                    showMessage("Login successful! Redirecting...", 'loginMessage');
    
                    // Redirect to Student dashboard
                    setTimeout(() => {
                        window.location.href = "./student-dashboard.html";
                    }, 2000);
                } else {
                    console.error("No user data found in Firestore for UID:", user.uid);
                    showMessage("User data not found. Please contact support.", 'loginMessage');
                }
            } catch (error) {
                console.error("Error during login:", error.code, error.message, error);
                if (error.code === 'auth/user-not-found') {
                    showMessage("No user found with this email.", 'loginMessage');
                } else if (error.code === 'auth/wrong-password') {
                    showMessage("Incorrect password. Please try again.", 'loginMessage');
                } else if (error.code === 'auth/invalid-email') {
                    showMessage("Invalid email address. Please check and try again.", 'loginMessage');
                } else if (error.code === 'auth/too-many-requests') {
                    showMessage("Too many failed login attempts. Please try again later.", 'loginMessage');
                } else {
                    showMessage(`Login failed: ${error.message}`, 'loginMessage');
                }
            }
        });
    }
});

