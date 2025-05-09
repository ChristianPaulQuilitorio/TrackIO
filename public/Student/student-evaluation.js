import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth();

let selectedCompanyEmail = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/public/Student/student-login.html";
        return;
    }

    try {
        const studentRef = doc(db, "students", user.uid);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
            const data = studentSnap.data();
            const traineeName = `${data.lastName}, ${data.firstName} ${data.middleName || ""}`.trim();
            const studentId = data.studentId || "N/A";
            const course = data.program || "N/A";
            const trainingHours = data.remainingHours ?? "N/A";
            const companyName = data.companyName || "N/A";
            const jobAssignment = data.jobAssignment || "N/A";

            document.addEventListener("DOMContentLoaded", function () {
                const companyNameInput = document.getElementById("company-name");
                const jobAssignmentInput = document.getElementById("job-assignment");
                const studentIdInput = document.getElementById("student-id");

                if (jobAssignmentInput && studentIdInput) {
                    jobAssignmentInput.value = jobAssignment;
                    studentIdInput.value = studentId;
                } else {
                    console.error("Missing input elements.");
                }
            });

            document.getElementById("trainee-name").textContent = traineeName;
            document.getElementById("course").textContent = course;
            document.getElementById("training-hours").textContent = trainingHours;
            document.getElementById("trainee-name-display").textContent = traineeName;

            const evaluationRef = collection(db, "students", user.uid, "EvaluationTemplate");
            const evaluationSnap = await getDocs(evaluationRef); // <-- You forgot this line

if (!evaluationSnap.empty) {
    const evaluationData = evaluationSnap.docs[0].data();
    const criteriaTableBody = document.getElementById("criteria-body");

    evaluationData.criteria.forEach((criterion) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${criterion.name}</td>
            <td>${criterion.rating || "N/A"}</td>
        `;
        criteriaTableBody.appendChild(row);
    });

    document.getElementById("evaluation-comment").textContent = evaluationData.comment || "No comment provided";

    const savedCompanyName = evaluationData.selectedCompanyName;
    const savedCompanyEmail = evaluationData.selectedCompanyEmail;

    if (savedCompanyName && savedCompanyEmail) {
        selectedCompanyEmail = savedCompanyEmail;
        document.getElementById("company-search").value = savedCompanyName;
        document.getElementById("company-confirmed-name").textContent = savedCompanyName;
    }
}
 else {
    console.warn("No evaluation data found.");
}

            // Live company search
            const companySearchInput = document.getElementById("company-search");
            const suggestionsContainer = document.getElementById("suggestions");

            companySearchInput.addEventListener("input", async () => {
                const keyword = companySearchInput.value.trim().toLowerCase();
                suggestionsContainer.innerHTML = "";

                if (keyword.length === 0) return;

                const companiesRef = collection(db, "companies");
                const allCompaniesSnap = await getDocs(companiesRef);

                allCompaniesSnap.forEach(docSnap => {
                    const company = docSnap.data();
                    const name = company.name?.toLowerCase() || "";

                    if (name.includes(keyword)) {
                        const suggestion = document.createElement("div");
                        suggestion.textContent = company.name;
                        suggestion.classList.add("suggestion-item");

suggestion.addEventListener("click", async () => {
    selectedCompanyEmail = docSnap.id;
    const selectedCompanyName = company.name;

    document.getElementById("company-confirmed-name").textContent = selectedCompanyName;
    suggestionsContainer.innerHTML = "";
    companySearchInput.value = selectedCompanyName;

    // Save selected company to Firestore
    const evaluationTemplateRef = doc(db, "students", user.uid, "EvaluationTemplate", "evaluationData");
    await updateDoc(evaluationTemplateRef, {
        selectedCompanyName: selectedCompanyName,
        selectedCompanyEmail: selectedCompanyEmail
    }, { merge: true });
});


                        suggestionsContainer.appendChild(suggestion);
                    }
                });
            });

            // Save changes locally
            document.getElementById("save-button").addEventListener("click", async () => {
                const updatedCompanyName = document.getElementById("company-search").value;
                const updatedJobAssignment = document.getElementById("job-assignment").value;
                const updatedStudentId = document.getElementById("student-id").value;

                const evaluationTemplateRef = doc(db, "students", user.uid, "EvaluationTemplate", "evaluationData");
                await updateDoc(evaluationTemplateRef, {
                    companyName: updatedCompanyName,
                    jobAssignment: updatedJobAssignment,
                    studentId: updatedStudentId,
                }, { merge: true });
                console.log("Saved successfully.");
                alert("Changes saved to evaluation template!");
            });

            // Send evaluation to selected company
            document.getElementById("confirm-company-button").addEventListener("click", async () => {
                if (!selectedCompanyEmail) {
                    alert("Please select a company first.");
                    return;
                }

                try {
                    const evaluationTemplateRef = doc(db, "students", user.uid, "EvaluationTemplate", "evaluationData");
                    const evaluationSnap = await getDoc(evaluationTemplateRef);

                    if (evaluationSnap.exists()) {
                        const evaluation = evaluationSnap.data();

                        const evalToSend = {
                            course: evaluation.course,
                            trainingHours: evaluation.trainingHours,
                            traineeName: `${data.lastName}, ${data.firstName} ${data.middleName || ""}`.trim(),
                            studentId: evaluation.studentId,
                            companyName: evaluation.companyName,
                            jobAssignment: evaluation.jobAssignment,
                            comment: evaluation.comment || "",
                            criteria: evaluation.criteria || [],
                            timestamp: new Date()
                        };

                        const companyEvalRef = doc(db, "companies", selectedCompanyEmail, "evaluations", user.uid);
                        await setDoc(companyEvalRef, evalToSend);

                        alert("Evaluation sent to the company successfully!");
                    } else {
                        alert("Evaluation template is missing.");
                    }
                } catch (err) {
                    console.error("Error sending evaluation to company:", err);
                    alert("Failed to send evaluation. Check console.");
                }
            });

        } else {
            console.warn("Student profile not found.");
        }
    } catch (err) {
        console.error("Failed to fetch student profile or evaluation data:", err);
    }
});
