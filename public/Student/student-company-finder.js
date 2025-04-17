import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
const db = getFirestore(app);

let map;
let marker;
let customDataset = []; // Custom dataset for companies

// Initialize the map
function initializeMap() {
    map = L.map('map').setView([14.5995, 120.9842], 13); // Default location (Manila)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Add a marker to the map
function addMarker(company) {
    if (company.businessLocation && company.businessLocation.lat && company.businessLocation.lng) {
        const marker = L.marker([company.businessLocation.lat, company.businessLocation.lng]).addTo(map);
        marker.bindPopup(`<strong>${company.companyName}</strong><br>${company.businessLocation.lat}, ${company.businessLocation.lng}`);
    } else {
        console.warn(`Invalid business location for company: ${company.companyName}`);
    }
}

// Fetch companies from Firestore
async function fetchCompaniesFromFirestore() {
    const querySnapshot = await getDocs(collection(db, "companies"));
    querySnapshot.forEach((doc) => {
        const company = doc.data();
        if (company.businessLocation) {
            customDataset.push(company);
            addMarker(company); // Add a marker for each company
        }
    });
}

// Fetch and display companies open for OJT
async function fetchOpenForOJTCompanies() {
    try {
        const querySnapshot = await getDocs(collection(db, "companies"));
        const openForOJTCompanies = [];

        querySnapshot.forEach((doc) => {
            const company = doc.data();
            if (company.openForOJT && company.businessLocation) {
                openForOJTCompanies.push(company);
                addMarker(company); // Add a marker for each company on the map
            }
        });

        const ojtCompanyList = document.getElementById('ojt-company-list');
        if (ojtCompanyList) {
            if (openForOJTCompanies.length === 0) {
                ojtCompanyList.innerHTML = '<p>No companies are currently open for OJT.</p>';
            } else {
                ojtCompanyList.innerHTML = openForOJTCompanies
                    .map(
                        (company) => `
                        <div class="ojt-company-card">
                            <img src="../img/company-icon.png" alt="Company Icon" class="ojt-company-icon">
                            <div class="ojt-company-info">
                                <h3>${company.companyName}</h3>
                                <p>Location: ${company.businessLocation.lat}, ${company.businessLocation.lng}</p>
                            </div>
                        </div>
                        `
                    )
                    .join('');
            }
        } else {
            console.error("Element with ID 'ojt-company-list' not found in the DOM.");
        }
    } catch (error) {
        console.error("Error fetching companies open for OJT:", error);
    }
}

// Initialize the map and fetch data
document.addEventListener('DOMContentLoaded', async () => {
    const companySearchInput = document.getElementById('company-search');
    const companyResults = document.getElementById('company-results');
    const companyFinderForm = document.getElementById('company-finder-form'); // Form element
    const mapContainer = document.getElementById('map');

    // Initialize the map
    initializeMap();

    // Fetch companies from Firestore and display them on the map
    await fetchCompaniesFromFirestore();
    await fetchOpenForOJTCompanies();

    // Fetch location suggestions from OpenStreetMap Nominatim
    async function fetchLocationSuggestions(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=PH`;
        const response = await fetch(url);
        const data = await response.json();

        return data.map((location) => ({
            name: location.display_name,
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lon),
        }));
    }

    // Perform the search and display combined suggestions
    async function performSearch(query) {
        if (!query) {
            companyResults.innerHTML = '<p>Please enter a search query.</p>';
            companyResults.classList.remove('visible'); // Hide the container if no query
            return;
        }

        // Filter custom dataset
        const filteredCompanies = customDataset.filter((company) =>
            company.companyName.toLowerCase().includes(query.toLowerCase())
        );

        // Fetch location suggestions from Nominatim
        const locationSuggestions = await fetchLocationSuggestions(query);

        // Combine results
        const combinedResults = [
            ...filteredCompanies.map((company) => ({
                type: 'company',
                name: company.companyName,
                lat: company.businessLocation.lat,
                lng: company.businessLocation.lng,
                address: `${company.businessLocation.lat}, ${company.businessLocation.lng}`,
            })),
            ...locationSuggestions.map((location) => ({
                type: 'location',
                name: location.name,
                lat: location.lat,
                lng: location.lng,
                address: 'Location',
            })),
        ];

        if (combinedResults.length === 0) {
            companyResults.innerHTML = '<p>No results found.</p>';
            companyResults.classList.add('visible'); // Show the container even if no results
        } else {
            companyResults.innerHTML = combinedResults
                .map(
                    (result, index) =>
                        `<p class="company-result" data-lat="${result.lat}" data-lng="${result.lng}" data-index="${index}">
                            <strong>${result.name}</strong> - ${result.address}
                        </p>`
                )
                .join('');
            companyResults.classList.add('visible'); // Show the container with results

            // Add click events to the results
            document.querySelectorAll('.company-result').forEach((result) => {
                result.addEventListener('click', (e) => {
                    const lat = parseFloat(result.getAttribute('data-lat'));
                    const lng = parseFloat(result.getAttribute('data-lng'));

                    // Move the map to the selected location
                    map.setView([lat, lng], 15);

                    // Add or move the marker
                    if (marker) {
                        marker.setLatLng([lat, lng]);
                    } else {
                        marker = L.marker([lat, lng]).addTo(map);
                    }

                    console.log(`Selected location: Latitude ${lat}, Longitude ${lng}`);

                    // Hide the suggestions after selection
                    companyResults.classList.remove('visible');
                });
            });
        }
    }

    // Handle form submission to select the first suggestion or set a default location
    companyFinderForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the form from reloading the page

        const firstResult = document.querySelector('.company-result');
        if (firstResult) {
            // Simulate a click on the first suggestion
            firstResult.click();
        } else {
            // If no suggestions, set a default location (e.g., Manila)
            const defaultLat = 14.5995;
            const defaultLng = 120.9842;

            map.setView([defaultLat, defaultLng], 15);

            if (marker) {
                marker.setLatLng([defaultLat, defaultLng]);
            } else {
                marker = L.marker([defaultLat, defaultLng]).addTo(map);
            }

            console.log(`Default location set: Latitude ${defaultLat}, Longitude ${defaultLng}`);
        }
    });

    // Attach input event listener with debouncing
    let debounceTimeout;
    companySearchInput.addEventListener('input', (event) => {
        const query = event.target.value.trim();

        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            performSearch(query);
        }, 300); // 300ms debounce delay
    });
});