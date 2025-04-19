// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Firebase config
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
const storage = getStorage(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Utility to show messages
function showMessage(message, id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = "block";
    el.innerText = message;
    setTimeout(() => el.style.display = "none", 4000);
  }
}

// Handle auth errors
function handleAuthError(code) {
  const errors = {
    "auth/email-already-in-use": "Email already in use.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "User not found.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many failed attempts. Try again later."
  };
  return errors[code] || "An error occurred. Try again.";
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Register functionality
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("submitSignUp");
  const loginBtn = document.getElementById("submitLogin");
  const logoutBtn = document.getElementById("logout-button");

  if (registerBtn) {
    registerBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = document.getElementById("rEmail").value.trim();
      const password = document.getElementById("rPassword").value.trim();
      const companyName = document.getElementById("rCompanyName").value.trim();

      if (!email || !password || !companyName) {
        return showMessage("All fields are required.", "signUpMessage");
      }

      if (!isValidEmail(email)) {
        return showMessage("Invalid email address.", "signUpMessage");
      }

      if (password.length < 6) {
        return showMessage("Password must be at least 6 characters.", "signUpMessage");
      }

      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save company details to Firestore
        await setDoc(doc(db, "companies", user.uid), {
          companyName,
          email,
          proofUploaded: false,
          openForOJT: false,
          uid: user.uid,
          accountType: "company",
          location: null
        });

        showMessage("Registration successful! Redirecting...", "signUpMessage");
        setTimeout(() => (window.location.href = "company-dashboard.html"), 2000);
      } catch (error) {
        showMessage(handleAuthError(error.code), "signUpMessage");
      }
    });
  }

  // Login functionality
  if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = document.getElementById("lEmail").value.trim();
      const password = document.getElementById("lPassword").value.trim();

      if (!email || !password) {
        return showMessage("Enter both email and password.", "loginMessage");
      }

      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        const docRef = doc(db, "companies", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          showMessage(`Welcome, ${docSnap.data().companyName}`, "loginMessage");
          setTimeout(() => (window.location.href = "company-dashboard.html"), 2000);
        } else {
          showMessage("Company record not found.", "loginMessage");
        }
      } catch (error) {
        showMessage(handleAuthError(error.code), "loginMessage");
      }
    });
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "company-index.html";
    });
  }
});

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;

  // If the user is not logged in and trying to access the dashboard, redirect to login
  if (!user && path.includes("company-dashboard")) {
    window.location.href = "company-index.html";
    return;
  }

  // If logged in, load the company profile page
  if (user && path.includes("company-profile")) {
    await loadCompanyProfile(user);
  }
});

// Load company profile data
async function loadCompanyProfile(user) {
  const nameEl = document.getElementById("companyName");
  const descEl = document.getElementById("companyDescription");
  const typeEl = document.getElementById("companyType");
  const openOJTEl = document.getElementById("openForOJT");
  const photoEl = document.getElementById("companyPhoto");
  const locationEl = document.getElementById("locationMessage");

  try {
    const docRef = doc(db, "companies", user.uid);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();

    nameEl.value = data.companyName || "";
    descEl.value = data.description || "";
    typeEl.value = data.type || "";
    openOJTEl.checked = !!data.openForOJT;

    if (data.photoURL) {
      photoEl.src = data.photoURL;
    } else {
      photoEl.src = "../img/sample-profile.jpg";
    }

    if (data.location) {
      locationEl.textContent = `Saved location: ${data.locationName || "Not specified"}`;
    } else {
      locationEl.textContent = "No location set.";
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// Profile image upload functionality
const uploadEl = document.getElementById("uploadPhoto");
if (uploadEl) {
  uploadEl.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return alert("No file selected.");

    try {
      const user = auth.currentUser;
      const fileRef = ref(storage, `companyPhotos/${user.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const photoURL = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "companies", user.uid), { photoURL });
      document.getElementById("companyPhoto").src = photoURL;
      alert("Photo uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Photo upload failed.");
    }
  });
}
