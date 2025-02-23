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
        const tile = addLine(line);
        container.appendChild(tile);
    });

    //container.appendChild(ul);
}

function addLine(line){
    const tile = document.createElement('div');
    tile.className = 'option-card';
    
    const backgroundColor = ['hsl(240, 2%, 96%)'];
    tile.style.backgroundColor = getLineColor(line);
    tile.style.color = 'white';  // Use white text for all tiles disruptions

    const disruptions = line.disruptions || 'No disruption';

    tile.innerHTML = `
        <div class="option-details">
            <div class="option-title">${line.name} </div>
            <div class="option-divider"></div>
            <div class="option-subtitle">Type:${line.modeName} Status: (${line.disruptions})</div>
        </div>
    `;

    return tile;
}

function getLineColor(line){
    // Mapping of line names to their official colors
    const lineColors = {
        "Bakerloo": "#B36305",
        "Central": "#E32017",
        "Circle": "#FFD300",
        "District": "#00782A",
        "Hammersmith & City": "#F3A9BB",
        "Jubilee": "#A0A5A9",
        "Metropolitan": "#9B0056",
        "Northern": "#000000",
        "Piccadilly": "#003688",
        "Victoria": "#0098D4",
        "Waterloo & City": "#95CDBA",
        "London Overground": "#EE7C0E",
        "Liberty Line": "#EE7C0E",
        "Lioness Line": "#EE7C0E",
        "DLR": "#00A4A7",
        "Elizabeth line": "#7156A5"
    };

    return line.lineColour || lineColors[line.name] || '#000000';
    
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
