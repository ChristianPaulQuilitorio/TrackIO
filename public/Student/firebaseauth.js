// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
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
    if (messageDiv) {
        messageDiv.style.display = "block";
        messageDiv.innerHTML = message;
        setTimeout(() => {
            messageDiv.style.display = "none";
        }, 5000);
    }
}

// Handle authentication state
onAuthStateChanged(auth, (student) => {
    const currentPath = window.location.pathname;

    if (!student) {
        console.log("No authenticated student found.");
        if (currentPath !== "/Student/student-index.html") {
            window.location.href = "/Student/student-index.html"; // Redirect to login page
        }
    } else {
        console.log("Student is authenticated:", student);

        if (currentPath === "/Student/student-index.html") {
            window.location.href = "/Student/student-dashboard.html"; // Redirect to dashboard
        } else if (currentPath === "/Student/student-dashboard.html") {
            loadStudentProfile(student);
        }
    }
});

// Event listener for registration and login
document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('submitSignUp');
    const loginButton = document.getElementById('submitLogin');
    const logoutButton = document.getElementById('logout-button');

    // Student Registration
    if (signUpButton) {
        signUpButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const email = document.getElementById('rEmail').value.trim();
            const password = document.getElementById('rPassword').value.trim();
            const firstName = document.getElementById('rFirstName').value.trim();
            const lastName = document.getElementById('rLastName').value.trim();

            if (!email || !password || !firstName || !lastName) {
                showMessage("All fields are required.", 'signUpMessage');
                return;
            }

            if (password.length < 6) {
                showMessage("Password must be at least 6 characters long.", 'signUpMessage');
                return;
            }

            try {
                const studentCredential = await createUserWithEmailAndPassword(auth, email, password);
                const student = studentCredential.user;

                console.log("Student registered successfully:", student);

                // Save user data in the "students" collection
                const studentData = {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    uid: student.uid,
                    accountType: "student",
                };

                await setDoc(doc(db, "students", student.uid), studentData); // Ensure it uses the "students" collection
                console.log("Student document created successfully in Firestore.");

                showMessage("Registration successful! Redirecting...", 'signUpMessage');
                setTimeout(() => {
                    window.location.href = "student-dashboard.html";
                }, 2000);
            } catch (error) {
                console.error("Error during registration:", error);
                const errorMessages = {
                    'auth/email-already-in-use': "This email is already registered.",
                    'auth/invalid-email': "Please enter a valid email address.",
                    'auth/weak-password': "Password must be at least 6 characters long.",
                    'auth/network-request-failed': "Network error. Please try again later."
                };
                showMessage(errorMessages[error.code] || "Registration failed. Please try again.", 'signUpMessage');
            }
        });
    }

    // Student Login
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
                const studentCredential = await signInWithEmailAndPassword(auth, email, password);
                const student = studentCredential.user;

                console.log("Student logged in successfully:", student);

                const studentDocRef = doc(db, "students", student.uid);
                const studentDoc = await getDoc(studentDocRef);

                if (studentDoc.exists()) {
                    const studentData = studentDoc.data();
                    const studentName = `${studentData.firstName} ${studentData.lastName}`;

                    console.log("Student data retrieved:", studentData);

                    showMessage(`Welcome back, ${studentName}! Redirecting...`, 'loginMessage');
                    setTimeout(() => {
                        window.location.href = "student-dashboard.html";
                    }, 2000);
                } else {
                    console.warn("Student document does not exist. Creating a new document...");
                    await setDoc(studentDocRef, {
                        firstName: "Unknown",
                        lastName: "Student",
                        email: student.email,
                        uid: student.uid,
                        accountType: "student"
                    });

                    showMessage("Welcome! Your profile has been created. Redirecting...", 'loginMessage');
                    setTimeout(() => {
                        window.location.href = "student-dashboard.html";
                    }, 2000);
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

    // Student Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("Student user logged out successfully.");
                window.location.href = "/Student/student-index.html"; // Redirect to login page
            } catch (error) {
                console.error("Error logging out:", error);
                showMessage("Failed to log out. Please try again.", 'logoutMessage');
            }
        });
    }
});

