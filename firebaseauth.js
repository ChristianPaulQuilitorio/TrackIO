// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

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
                console.log('User registered successfully:', user);

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
});

// Handle Login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signInMessage = document.getElementById('signInMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent form submission

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            // Validate input fields
            if (!email || !password) {
                signInMessage.style.display = 'block';
                signInMessage.textContent = 'Please fill in all fields.';
                return;
            }

            try {
                // Sign in with email and password
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log('User logged in successfully:', user);

                // Redirect to student dashboard
                window.location.href = 'Student/student-dashboard.html';
            } catch (error) {
                console.error('Error during login:', error);
                if (error.code === 'auth/user-not-found') {
                    signInMessage.style.display = 'block';
                    signInMessage.textContent = 'No user found with this email.';
                } else if (error.code === 'auth/wrong-password') {
                    signInMessage.style.display = 'block';
                    signInMessage.textContent = 'Incorrect password.';
                } else if (error.code === 'auth/invalid-email') {
                    signInMessage.style.display = 'block';
                    signInMessage.textContent = 'Invalid email address.';
                } else {
                    signInMessage.style.display = 'block';
                    signInMessage.textContent = 'Login failed. Please try again.';
                }
            }
        });
    }
});
