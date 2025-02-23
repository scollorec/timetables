// find.js

// TfL API endpoint for lines
const TFL_API_URL = 'https://api.tfl.gov.uk/Line/Mode/tube,overground,dlr,elizabeth-line';

// Function to fetch lines from TfL API
async function fetchLines() {
    try {
        const response = await fetch(TFL_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching lines:', error);
        return [];
    }
}

// Function to create and display the line list
function displayLines(lines) {
    const container = document.getElementById('timetable-container');
    container.innerHTML = ''; // Clear existing content

    const ul = document.createElement('ul');
    ul.className = 'line-list';

    lines.forEach(line => {
        const li = document.createElement('li');
        li.className = 'line-item';
        li.style.color = line.lineColour || '#000';
        li.textContent = line.name;
        li.addEventListener('click', () => selectLine(line));
        ul.appendChild(li);
    });

    container.appendChild(ul);
}

// Function to handle line selection
function selectLine(line) {
    console.log('Selected line:', line.name);
    // Here you can add code to fetch and display the timetable for the selected line
}

// Main function to initialize the page
async function init() {
    const lines = await fetchLines();
    displayLines(lines);
    
    // Update the logo
    const logoElement = document.querySelector('.logo');
    logoElement.textContent = 'London Transport Lines';
}

// Run the initialization when the page loads
window.addEventListener('load', init);
