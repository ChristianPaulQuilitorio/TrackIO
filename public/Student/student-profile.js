import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyC9z8Amm-vlNcbw-XqEnrkt_WpWHaGfwtQ",
    authDomain: "trackio-f5b07.firebaseapp.com",
    projectId: "trackio-f5b07",
    storageBucket: "trackio-f5b07.appspot.com", // Corrected bucket name
    messagingSenderId: "1083789426923",
    appId: "1:1083789426923:web:c372749a28e84ff9cd7eae",
    measurementId: "G-DSPVFG2CYW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Function to load and display the student's profile
async function loadStudentProfile(user) {
    try {
        const studentDocRef = doc(db, "students", user.uid);
        const studentDoc = await getDoc(studentDocRef);

        if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            document.getElementById("profile-first-name").value = studentData.firstName || "";
            document.getElementById("profile-last-name").value = studentData.lastName || "";
            document.getElementById("profile-email").textContent = studentData.email;

            // Load profile photo
            const profilePhoto = studentData.profilePhoto || "../img/sample-profile.jpg";
            document.getElementById("profile-photo").src = profilePhoto;

            console.log("Student profile loaded successfully:", studentData);
        } else {
            console.warn("Student document does not exist.");
        }
    } catch (error) {
        console.error("Error loading student profile:", error);
    }
}

async function updateStudentProfile(user) {
    try {
        const firstName = document.getElementById("profile-first-name").value.trim();
        const lastName = document.getElementById("profile-last-name").value.trim();
        const photoFile = document.getElementById("photo-upload").files[0];

        if (!firstName || !lastName) {
            alert("First name and last name cannot be empty.");
            return;
        }

        const studentDocRef = doc(db, "students", user.uid);

        // Update Firestore with the new names
        await updateDoc(studentDocRef, {
            firstName: firstName,
            lastName: lastName
        });

        // Handle photo upload if a file is selected
        if (photoFile) {
            const formData = new FormData();
            formData.append("file", photoFile);

            const response = await fetch("https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/uploadProfilePhoto", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload photo");
            }

            const { photoURL } = await response.json();

            // Update Firestore with the new photo URL
            await updateDoc(studentDocRef, {
                profilePhoto: photoURL
            });
        }

        alert("Profile updated successfully!");
        loadStudentProfile(user); // Reload the profile data
    } catch (error) {
        console.error("Error updating student profile:", error);
        alert("Failed to update profile. Please try again.");
    }
}

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User  is authenticated:", user);
        loadStudentProfile(user); // Load the student's profile

        // Attach event listener to the save button
        document.getElementById("save-profile-button").addEventListener("click", () => {
            updateStudentProfile(user);
        });
    } else {
        console.log("No authenticated user found. Redirecting to login page...");
        window.location.href = "/Student/student-index.html"; // Redirect to login page
    }
});

// Logout functionality
document.getElementById("logout-button").addEventListener("click", async () => {
    try {
        await signOut(auth);
        console.log("User  logged out successfully.");
        window.location.href = "/Student/student-index.html"; // Redirect to login page
    } catch (error) {
        console.error("Error logging out:", error);
        alert("Failed to log out. Please try again.");
    }
});