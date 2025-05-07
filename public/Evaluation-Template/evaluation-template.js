import { getDoc, doc, getFirestore, collection, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9z8Amm-vlNcbw-XqEnrkt_WpWHaGfwtQ",
  authDomain: "trackio-f5b07.firebaseapp.com",
  projectId: "trackio-f5b07",
  storageBucket: "trackio-f5b07.appspot.com",
  messagingSenderId: "1083789426923",
  appId: "1:1083789426923:web:c372749a28e84ff9cd7eae",
  measurementId: "G-DSPVFG2CYW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM refs
const traineeName = document.getElementById("trainee-name");
const studentId = document.getElementById("student-id");
const course = document.getElementById("course");
const jobAssignment = document.getElementById("job-assignment");
const trainingHours = document.getElementById("training-hours");
const companyName = document.getElementById("company-name");
const criteriaBody = document.getElementById("criteria-body");
const commentBox = document.getElementById("evaluation-comment");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is logged in
    console.log('User is logged in:', user);
    loadEvaluationTemplate();
  } else {
    // User is not logged in
    console.log('User not logged in.');
    alert("User not logged in.");
    // Optionally redirect to login page if user is not logged in
    window.location.href = "../Teacher/Teacher-evaluation.html";  // Replace with your login page URL
  }
});


// 🔽 Load the evaluation template from the `EvaluationTemplate` collection
async function loadEvaluationTemplate() {
  const templateRef = doc(db, "EvaluationTemplate", "evaluationData");
  const docSnap = await getDoc(templateRef);

  if (docSnap.exists()) {
    const templateData = docSnap.data();

    // Apply template data to the fields
    traineeName.textContent = templateData.traineeName || "";
    studentId.textContent = templateData.studentId || "";
    course.textContent = templateData.course || "";
    jobAssignment.textContent = templateData.jobAssignment || "";
    trainingHours.textContent = templateData.trainingHours || "";
    companyName.textContent = templateData.companyName || "";

    criteriaBody.innerHTML = "";
    (templateData.criteria || []).forEach(item => {
      addCriteria(item.name, item.rating);
    });

    commentBox.value = templateData.comment || "";
  } else {
    console.log("No template found.");
  }
}

// ➕ Add criteria row to table
window.addCriteria = function (name = "", rating = "") {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input type="text" class="criteria-name" value="${name}" /></td>
    <td>
      <select class="criteria-rating" style="display:none;">
        <option value="">Select</option>
        <option value="5" ${rating == 5 ? "selected" : ""}>5 - Excellent</option>
        <option value="4" ${rating == 4 ? "selected" : ""}>4 - Very Good</option>
        <option value="3" ${rating == 3 ? "selected" : ""}>3 - Good</option>
        <option value="2" ${rating == 2 ? "selected" : ""}>2 - Fair</option>
        <option value="1" ${rating == 1 ? "selected" : ""}>1 - Poor</option>
      </select>
    </td>
    <td><span class="remove-btn" onclick="removeRow(this)">🗑️</span></td>
  `;

  criteriaBody.appendChild(tr);
  document.getElementById("new-criteria").value = "";
};

// 🗑️ Remove a criteria row
window.removeRow = function (elem) {
  elem.closest("tr").remove();
};

// 💾 Save filled evaluation to Firestore for the logged-in student and EvaluationTemplate collection
window.saveEvaluation = async function () {
  const criteriaRows = criteriaBody.querySelectorAll("tr");
  const criteria = [];

  criteriaRows.forEach(row => {
    const name = row.querySelector(".criteria-name").value.trim();
    const rating = row.querySelector(".criteria-rating").value;
    if (name) {
      criteria.push({ name, rating });
    }
  });

  const payload = {
    traineeName: traineeName.textContent,
    studentId: studentId.textContent,
    course: course.textContent,
    jobAssignment: jobAssignment.textContent,
    trainingHours: trainingHours.textContent,
    companyName: companyName.textContent,
    criteria,
    comment: commentBox.value.trim(),
    timestamp: new Date()
  };

// Step 1: Save the template to the EvaluationTemplate collection (central template)
const templateRef = doc(db, "EvaluationTemplate", "evaluationData");
await setDoc(templateRef, payload);

// Step 2: Copy the template to each student's EvaluationTemplate subcollection
const studentsRef = collection(db, "students");
const querySnapshot = await getDocs(studentsRef);

querySnapshot.forEach(async (studentDoc) => { // Renamed 'doc' to 'studentDoc'
  const studentId = studentDoc.id;
  const studentTemplateRef = doc(db, "students", studentId, "EvaluationTemplate", "evaluationData");
  await setDoc(studentTemplateRef, payload);
});

alert("Evaluation saved successfully.");

};

// 📤 Export to PDF (same as previous)
window.generatePDF = function () {
  const table = document.querySelector(".criteria-table");

  let actionColIndex = -1;
  const headerCells = table.querySelectorAll("thead tr th");
  headerCells.forEach((th, index) => {
    if (th.textContent.trim() === "Action") {
      actionColIndex = index;
      th.style.display = "none";
    }
  });

  const allRows = table.querySelectorAll("tbody tr");
  allRows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (actionColIndex >= 0 && cells[actionColIndex]) {
      cells[actionColIndex].style.display = "none";
    }
  });

  const allSelects = table.querySelectorAll("select");
  allSelects.forEach(select => {
    select.style.display = 'none';
  });

  document.querySelector('.add-criteria').style.display = 'none';

  const element = document.querySelector('.evaluation-form');

  // CSS Fix: Ensure that tables and content fit within page width
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],  // Smaller margins to fit content better
    filename: 'evaluation-form.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      logging: true,   // Enable logging for debugging
      useCORS: true,   // Handle CORS
      x: 0,
      y: 0,
      width: 600,      // Set the width for rendering (adjust this based on your content)
      height: 800,     // Set the height for rendering
    },
    jsPDF: {
      unit: 'in',
      format: 'letter',
      orientation: 'portrait',
      compress: true,
      autoPaging: true,  // Enable automatic page breaks
      margin: [0.5, 0.5, 0.5, 0.5],  // Adjust margins if necessary
    }
  };

  // Check the height of the content dynamically before generating the PDF
  html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
    const totalPages = pdf.internal.pages.length;

    // If there are more pages than expected (overflow), trigger a page break manually
    if (totalPages > 1) {
      pdf.addPage();
    }

    // Save the PDF after making necessary adjustments
    pdf.save('evaluation-form.pdf');

    // Restore visibility of elements after PDF generation
    if (actionColIndex >= 0) {
      headerCells[actionColIndex].style.display = "";
      allRows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells[actionColIndex]) {
          cells[actionColIndex].style.display = "";
        }
      });
    }

    allSelects.forEach(select => {
      select.style.display = '';
    });

    document.querySelector('.add-criteria').style.display = 'block';
  });
};





