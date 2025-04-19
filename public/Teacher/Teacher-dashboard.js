import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

const container = document.getElementById("programs-container");
const viewStack = [];

function clearContainer() {
  container.innerHTML = '';
}

function createBackButton(onClick) {
  const backBtn = document.createElement("div");
  backBtn.className = "back-button";
  backBtn.innerHTML = "← Back";
  backBtn.addEventListener("click", onClick);
  return backBtn;
}

function createCard(text, onClick) {
  const card = document.createElement("div");
  card.className = "nav-card";
  card.textContent = text;
  card.addEventListener("click", onClick);
  return card;
}

function createStudentCard(student, onClick) {
  const card = document.createElement("div");
  card.className = "student-card";

  const img = document.createElement("img");
  img.src = student.profile_pic
    ? `http://localhost/TrackIO/${student.profile_pic}`
    : "../img/sample-profile.jpg";
  img.alt = `${student.firstName}'s Profile Photo`;

  const name = document.createElement("span");
  name.textContent = `${student.firstName} ${student.lastName}`;

  card.appendChild(img);
  card.appendChild(name);

  card.addEventListener("click", () => {
    onClick(student);  // Trigger the function to show student details
  });

  return card;
}

function groupStudents(students) {
  const grouped = {};
  students.forEach((student) => {
    const { program, block, yearLevel } = student;
    if (!program || !block || !yearLevel) return;

    if (!grouped[program]) grouped[program] = {};
    if (!grouped[program][yearLevel]) grouped[program][yearLevel] = {};
    if (!grouped[program][yearLevel][block]) grouped[program][yearLevel][block] = [];

    grouped[program][yearLevel][block].push(student);
  });
  return grouped;
}

function showPrograms(groupedData) {
  clearContainer();
  for (const program in groupedData) {
    const programCard = createCard(program, () => {
      viewStack.push(() => showPrograms(groupedData));
      showYears(groupedData[program], program);
    });
    container.appendChild(programCard);
  }
}

function showYears(programData, programName) {
  clearContainer();
  container.appendChild(createBackButton(() => {
    const prev = viewStack.pop();
    prev();
  }));

  for (const year in programData) {
    const yearCard = createCard(`${year} Year`, () => {
      viewStack.push(() => showYears(programData, programName));
      showBlocks(programData[year], programName, year);
    });
    container.appendChild(yearCard);
  }
}

function showBlocks(yearData, programName, year) {
  clearContainer();
  container.appendChild(createBackButton(() => {
    const prev = viewStack.pop();
    prev();
  }));

  for (const block in yearData) {
    const blockCard = createCard(`Block ${block}`, () => {
      viewStack.push(() => showBlocks(yearData, programName, year));
      showStudents(yearData[block], programName, year, block);
    });
    container.appendChild(blockCard);
  }
}

function showStudents(studentList, programName, year, block) {
  clearContainer();
  container.appendChild(createBackButton(() => {
    const prev = viewStack.pop();
    prev();
  }));

  studentList.forEach((student) => {
    const studentCard = createStudentCard(student, showStudentDetails);
    container.appendChild(studentCard);
  });
}

async function showStudentDetails(student) {
  clearContainer();
  container.appendChild(createBackButton(() => {
    const prev = viewStack.pop();
    prev();
  }));

  // Display the student's full profile
  const profileDiv = document.createElement("div");
  profileDiv.className = "student-profile";

  const img = document.createElement("img");
  img.src = student.profile_pic
    ? `http://localhost/TrackIO/${student.profile_pic}`
    : "../img/sample-profile.jpg";
  img.alt = `${student.firstName}'s Profile Photo`;

  const name = document.createElement("h3");
  name.textContent = `${student.firstName} ${student.lastName}`;

  const details = document.createElement("p");
  details.innerHTML = `
    <strong>Program:</strong> ${student.collegeProgram}<br>
    <strong>Year Level:</strong> ${student.yearLevel}<br>
    <strong>Block:</strong> ${student.block}<br>
    <strong>Birthday:</strong> ${student.dateOfBirth}<br>
    <strong>Contact:</strong> ${student.contactNumber}<br>
    <strong>College:</strong> ${student.collegeSchoolName}<br>
    <strong>Course:</strong> ${student.collegeCourse}
  `;

  profileDiv.appendChild(img);
  profileDiv.appendChild(name);
  profileDiv.appendChild(details);

  container.appendChild(profileDiv);

  // Fetch and display the student's calendar and location info
  const studentRef = doc(db, "students", student.id);
  const studentDoc = await getDoc(studentRef);

  if (studentDoc.exists()) {
    const studentData = studentDoc.data();

    // Display student's calendar events and locations
    const calendarDiv = document.createElement("div");
    calendarDiv.className = "student-calendar";
    calendarDiv.innerHTML = `<h4>Calendar</h4>`;

    // Example: Assume student has an array of calendar events
    if (studentData.checkInOutData && Array.isArray(studentData.checkInOutData)) {
      studentData.checkInOutData.forEach(entry => {
        const eventDiv = document.createElement("div");
        eventDiv.innerHTML = `<strong>Date:</strong> ${entry.date}<br>
                             <strong>Check-in Time:</strong> ${entry.checkInTime}<br>
                             <strong>Check-out Time:</strong> ${entry.checkOutTime}`;
        calendarDiv.appendChild(eventDiv);
      });
    } else {
      const noEventsDiv = document.createElement("div");
      noEventsDiv.textContent = "No calendar events available.";
      calendarDiv.appendChild(noEventsDiv);
    }

    // Display student's location info
    const locationDiv = document.createElement("div");
    locationDiv.className = "student-location";
    locationDiv.innerHTML = `<h4>Location</h4>`;

    if (studentData.location && studentData.location.name) {
      const locationInfo = document.createElement("div");
      locationInfo.innerHTML = `<strong>Location:</strong> ${studentData.location.name}<br>
                                <strong>Latitude:</strong> ${studentData.location.latitude}<br>
                                <strong>Longitude:</strong> ${studentData.location.longitude}`;
      locationDiv.appendChild(locationInfo);
    } else {
      const noLocationDiv = document.createElement("div");
      noLocationDiv.textContent = "No location information available.";
      locationDiv.appendChild(noLocationDiv);
    }

    container.appendChild(calendarDiv);
    container.appendChild(locationDiv);
  } else {
    console.log("No such student document!");
  }
}

async function fetchStudents() {
  try {
    const querySnapshot = await getDocs(collection(db, "students"));
    const students = [];
    querySnapshot.forEach((doc) => students.push({ ...doc.data(), id: doc.id }));

    const groupedData = groupStudents(students);
    showPrograms(groupedData);
  } catch (error) {
    console.error("Error fetching students:", error);
  }
}

fetchStudents();
