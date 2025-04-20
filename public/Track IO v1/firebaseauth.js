// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(() => {
        messageDiv.style.opacity = 0;
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    const signUp = document.getElementById('submitSignUp');
    if (signUp) {
        signUp.addEventListener('click', async (event) => {
            event.preventDefault();

            const email = document.getElementById('rEmail').value;
            const password = document.getElementById('rPassword').value;
            const firstname = document.getElementById('rFirstName').value;
            const lastname = document.getElementById('rLastName').value;

            // Validate password length
            if (password.length < 6) {
                showMessage("Password must be at least 6 characters long", 'signUpMessage');
                return;
            }

            const auth = getAuth();
            const db = getFirestore();

            try {
                // Create user with email and password
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log('User registered:', user);

                // Add user data to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstname,
                    lastName: lastname,
                    email: email
                });

                showMessage("User registered successfully", 'signUpMessage');
                window.location.href = "index.html"; // Redirect after successful registration
            } catch (error) {
                console.error("Error during registration:", error);
                if (error.code === 'auth/email-already-in-use') {
                    showMessage("Email already in use", 'signUpMessage');
                } else if (error.code === 'auth/invalid-email') {
                    showMessage("Invalid email", 'signUpMessage');
                } else if (error.code === 'auth/weak-password') {
                    showMessage("Password must be at least 6 characters long", 'signUpMessage');
                } else {
                    showMessage("Registration failed", 'signUpMessage');
                }
            }
        });
    }
});
