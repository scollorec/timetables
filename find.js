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

    lines.forEach(line => {
        const tile = addLine(line);
        // Add click event listener to each tile
        tile.addEventListener('click', () => selectLine(line));
        container.appendChild(tile);
    });
}

function addLine(line) {
    const tile = document.createElement('div');
    tile.className = 'option-card';

    tile.style.backgroundColor = getLineColor(line);
    tile.style.color = 'white';  // Use white text for all tiles

    let disruptionText = 'Normal status';

    // Check if disruptions exist and have content
    if (line.disruptions && line.disruptions.length > 0) {
        disruptionText = line.disruptions;
    }

    tile.innerHTML = `
        <div class="option-details">
            <div class="option-title">${line.name}</div>
            <div class="option-divider"></div>
            <div class="option-line-subtitle">${disruptionText}</div>
        </div>
    `;

    return tile;
}

function getLineColor(line) {
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
        "Liberty": "#EE7C0E",
        "Lioness": "#EE7C0E",
        "Mildmay": "#EE7C0E",
        "Suffragette": "#EE7C0E",
        "Weaver": "#EE7C0E",
        "Windrush": "#EE7C0E",
        "DLR": "#00A4A7",
        "Elizabeth line": "#7156A5"
    };

    return line.lineColour || lineColors[line.name] || '#000000';
}

// Add this at the top of your script if not already there
let currentLine = null;

// And make sure to set it in your selectLine function
function selectLine(line) {
    console.log('Selected line:', line.name);
    currentLine = line; // Store the current line

    // Fetch stations for the selected line
    fetchStations(line.id).then(stations => {
        displayStations(stations, line);
    });
}

// Function to fetch stations for a line
async function fetchStations(lineId) {
    try {
        const response = await fetch(`https://api.tfl.gov.uk/Line/${lineId}/StopPoints`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stations = await response.json();
        return stations;
    } catch (error) {
        console.error('Error fetching stations:', error);
        return [];
    }
}

function displayStations(stations, line) {
    // Sort stations alphabetically by name
    stations.sort((a, b) => {
        if (a.commonName < b.commonName) return -1;
        if (a.commonName > b.commonName) return 1;
        return 0;
    });

    const container = document.getElementById('timetable-container');

    // Create container with iOS-like styling
    const stationContainer = document.createElement('div');
    stationContainer.className = 'station-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'station-header';

    // Create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Lines';
    backButton.className = 'back-button';
    backButton.addEventListener('click', init);

    // Create title
    const title = document.createElement('h2');
    title.textContent = `${line.name} Line`;
    title.className = 'line-title';
    title.style.color = getLineColor(line);

    header.appendChild(backButton);
    header.appendChild(title);

    // Create search bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    const searchBar = document.createElement('div');
    searchBar.className = 'search-bar';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search Stations';
    searchInput.addEventListener('input', function() {
        filterStations(this.value, stationList);
    });

    searchBar.appendChild(searchInput);
    searchContainer.appendChild(searchBar);

    // Create station list
    const stationList = document.createElement('ul');
    stationList.className = 'station-list';

    // Add each station to the list
// In your displayStations function, update the station item creation:
    stations.forEach(station => {
        const stationItem = document.createElement('li');
        stationItem.textContent = station.commonName.replace(' Underground Station', '');
        stationItem.className = 'station-item';
        stationItem.addEventListener('click', () => {
            selectStation(station);
        });
        stationList.appendChild(stationItem);
    });


    // Add all elements to the container
    stationContainer.appendChild(header);
    stationContainer.appendChild(searchContainer);
    stationContainer.appendChild(stationList);

    // Clear container and add our new iOS-styled container
    container.innerHTML = '';
    container.appendChild(stationContainer);
}

// Helper function to filter stations
function filterStations(query, stationList) {
    const items = stationList.getElementsByClassName('station-item');
    query = query.toLowerCase();

    for (let i = 0; i < items.length; i++) {
        const stationName = items[i].textContent.toLowerCase();
        if (stationName.includes(query)) {
            items[i].style.display = '';
        } else {
            items[i].style.display = 'none';
        }
    }
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
