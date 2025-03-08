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

    // Get favorites
    const favorites = getFavorites();

    // Create a section for favorite stations if there are any
    if (favorites.length > 0) {
        const favoritesHeader = document.createElement('div');
        favoritesHeader.className = 'section-header';
        favoritesHeader.textContent = 'Favorite Stations';
        container.appendChild(favoritesHeader);

        // Create list for favorites
        const favoritesList = document.createElement('div');
        favoritesList.className = 'favorites-list';

        // Fetch and display favorite stations
        favorites.forEach(stationId => {
            // Fetch station details
            fetch(`https://api.tfl.gov.uk/StopPoint/${stationId}`)
                .then(response => response.json())
                .then(station => {
                    const stationTile = createStationTile(station);
                    favoritesList.appendChild(stationTile);
                })
                .catch(error => {
                    console.error('Error fetching favorite station:', error);
                });
        });

        container.appendChild(favoritesList);
    }

    // Create header for lines
    const linesHeader = document.createElement('div');
    linesHeader.className = 'section-header';
    linesHeader.textContent = 'Lines';
    container.appendChild(linesHeader);

    // Display lines
    lines.forEach(line => {
        const tile = addLine(line);
        // Add click event listener to each tile
        tile.addEventListener('click', () => selectLine(line));
        container.appendChild(tile);
    });

    // Function to create a station tile
    function createStationTile(station) {
        const tile = document.createElement('div');
        tile.className = 'station-item favorite-station';

        // Add favorite star
        const favoriteIcon = document.createElement('span');
        favoriteIcon.className = 'favorite-icon active';
        favoriteIcon.innerHTML = '★';
        favoriteIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFavorite(station.id);
            // Remove this tile if unfavorited
            if (!isStationFavorite(station.id)) {
                tile.remove();
                // If no more favorites, remove the header
                if (favoritesList.children.length === 0) {
                    favoritesHeader.remove();
                    favoritesList.remove();
                }
            }
        });

        // Add station name
        const stationName = document.createElement('span');
        stationName.className = 'station-name';
        stationName.textContent = station.commonName.replace(' Underground Station', '');

        tile.appendChild(favoriteIcon);
        tile.appendChild(stationName);

        // Add click event to select station
        tile.addEventListener('click', () => {
            selectStation(station);
        });

        return tile;
    }
}

function addLine(line) {
    const tile = document.createElement('div');
    tile.className = 'option-card';

    // Determine if this is an Overground line
    const isOverground = line.id.toLowerCase().includes('overground') ||
        line.name.toLowerCase().includes('overground') ||
        line.name.toLowerCase().includes('lioness') ||
        line.name.toLowerCase().includes('mildmay') ||
        line.name.toLowerCase().includes('windrush') ||
        line.name.toLowerCase().includes('weaver') ||
        line.name.toLowerCase().includes('suffragette') ||
        line.name.toLowerCase().includes('liberty');

    // Apply different styling for Overground lines
    if (isOverground) {
        tile.classList.add('overground-line');
        const lineColor = getLineColor(line);
        tile.style.setProperty('--line-color', lineColor);
    } else {
        tile.style.backgroundColor = getLineColor(line);
        tile.style.color = 'white';
    }

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




// Function to handle line selection
function selectLine(line) {
    console.log('Selected line:', line.id);
    currentLine = line; // Store current line globally
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
        // Filter to only include tube stations
        return stations.filter(station =>
            station.modes.includes('tube') ||
            station.modes.includes('overground') ||
            station.modes.includes('dlr') ||
            station.modes.includes('elizabeth-line')
        );
    } catch (error) {
        console.error('Error fetching stations:', error);
        return [];
    }
}

// Function to check if a station is favorited
function isStationFavorite(stationId) {
    const favorites = getFavorites();
    return favorites.includes(stationId);
}

// Function to get all favorites from localStorage
function getFavorites() {
    const storedFavorites = localStorage.getItem('favorite-stations');
    return storedFavorites ? JSON.parse(storedFavorites) : [];
}

// Function to toggle favorite status
function toggleFavorite(stationId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(stationId);

    if (index === -1) {
        // Add to favorites
        favorites.push(stationId);
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
    }

    // Save updated favorites to localStorage
    localStorage.setItem('favorite-stations', JSON.stringify(favorites));
}

// Function to display stations for a line
function displayStations(stations, line) {
    const container = document.getElementById('timetable-container');
    container.innerHTML = ''; // Clear existing content

    // Get favorites
    const favorites = getFavorites();

    // Sort stations with favorites at the top
    stations.sort((a, b) => {
        const aIsFavorite = favorites.includes(a.id);
        const bIsFavorite = favorites.includes(b.id);

        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;

        // If both are favorites or both are not, sort alphabetically
        return a.commonName.localeCompare(b.commonName);
    });

    // Create header
    const header = document.createElement('div');
    header.className = 'station-header';

    // Create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Lines';
    backButton.className = 'back-button';
    backButton.addEventListener('click', function() {
        init(); // Go back to lines list
    });

    // Create title
    const title = document.createElement('h2');
    title.textContent = line.name;
    title.className = 'line-title';
    title.style.color = getLineColor(line);

    header.appendChild(backButton);
    header.appendChild(title);

    // Create station container
    const stationContainer = document.createElement('div');
    stationContainer.className = 'station-container';
    stationContainer.appendChild(header);

    // Create a section for favorites if there are any
    const favoritesStations = stations.filter(station => favorites.includes(station.id));
    if (favoritesStations.length > 0) {
        const favoritesHeader = document.createElement('div');
        favoritesHeader.className = 'section-header';
        favoritesHeader.textContent = 'Favorite Stations';
        stationContainer.appendChild(favoritesHeader);

        // Create list for favorites
        const favoritesList = document.createElement('ul');
        favoritesList.className = 'station-list';

        // Add favorite stations
        favoritesStations.forEach(station => {
            const stationItem = createStationItem(station, true);
            favoritesList.appendChild(stationItem);
        });

        stationContainer.appendChild(favoritesList);
    }

    // Create header for all stations
    const allStationsHeader = document.createElement('div');
    allStationsHeader.className = 'section-header';
    allStationsHeader.textContent = 'All Stations';
    stationContainer.appendChild(allStationsHeader);

    // Create list for all stations
    const stationsList = document.createElement('ul');
    stationsList.className = 'station-list';

    // Add all stations
    stations.forEach(station => {
        if (!favorites.includes(station.id)) {
            const stationItem = createStationItem(station, false);
            stationsList.appendChild(stationItem);
        }
    });

    stationContainer.appendChild(stationsList);
    container.appendChild(stationContainer);

    // Function to create a station list item
    function createStationItem(station, isFavorite) {
        const stationItem = document.createElement('li');
        stationItem.className = 'station-item' + (isFavorite ? ' favorite-station' : '');

        // Add favorite star
        const favoriteIcon = document.createElement('span');
        favoriteIcon.className = 'favorite-icon' + (isFavorite ? ' active' : '');
        favoriteIcon.innerHTML = '★';
        favoriteIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFavorite(station.id);
            // Refresh the station list to update order
            displayStations(stations, line);
        });

        // Add station name
        const stationName = document.createElement('span');
        stationName.className = 'station-name';
        stationName.textContent = station.commonName.replace(' Underground Station', '');

        stationItem.appendChild(favoriteIcon);
        stationItem.appendChild(stationName);

        // Add click event to select station
        stationItem.addEventListener('click', () => {
            selectStation(station);
        });

        return stationItem;
    }
}

// Function to get color for a line
function getLineColor(line) {
    const colors = {
        // Tube lines
        'bakerloo': '#B36305',
        'central': '#E32017',
        'circle': '#FFD300',
        'district': '#00782A',
        'hammersmith-city': '#F3A9BB',
        'jubilee': '#A0A5A9',
        'metropolitan': '#9B0056',
        'northern': '#000000',
        'piccadilly': '#003688',
        'victoria': '#0098D4',
        'waterloo-city': '#95CDBA',
        'dlr': '#00A4A7',
        'elizabeth': '#6950A1',
        'tram': '#84B817',

        // New Overground lines
        'london-overground': '#EE7C0E', // Original orange - for backward compatibility
        'lioness': '#FFC72C', // Yellow
        'mildmay': '#0019A8', // Blue
        'windrush': '#DA291C', // Red
        'weaver': '#9B0058', // Maroon
        'suffragette': '#00843D', // Green
        'liberty': '#6B6B6C' // Grey
    };

    // Check if the line name or id matches any of our defined colors
    const lineId = line.id ? line.id.toLowerCase() : '';
    const lineName = line.name ? line.name.toLowerCase() : '';

    if (colors[lineId]) return colors[lineId];

    // Check for partial matches in the name
    if (lineName.includes('bakerloo')) return colors['bakerloo'];
    if (lineName.includes('central')) return colors['central'];
    if (lineName.includes('circle')) return colors['circle'];
    if (lineName.includes('district')) return colors['district'];
    if (lineName.includes('hammersmith') || lineName.includes('city')) return colors['hammersmith-city'];
    if (lineName.includes('jubilee')) return colors['jubilee'];
    if (lineName.includes('metropolitan')) return colors['metropolitan'];
    if (lineName.includes('northern')) return colors['northern'];
    if (lineName.includes('piccadilly')) return colors['piccadilly'];
    if (lineName.includes('victoria')) return colors['victoria'];
    if (lineName.includes('waterloo')) return colors['waterloo-city'];
    if (lineName.includes('dlr')) return colors['dlr'];
    if (lineName.includes('elizabeth')) return colors['elizabeth'];
    if (lineName.includes('tram')) return colors['tram'];

    // Check for partial matches for the new Overground lines
    if (lineName.includes('lioness')) return colors['lioness'];
    if (lineName.includes('mildmay')) return colors['mildmay'];
    if (lineName.includes('windrush')) return colors['windrush'];
    if (lineName.includes('weaver')) return colors['weaver'];
    if (lineName.includes('suffragette')) return colors['suffragette'];
    if (lineName.includes('liberty')) return colors['liberty'];

    // Default to original Overground orange for any remaining Overground references
    if (lineName.includes('overground')) return colors['london-overground'];

    // Default color if no match is found
    return '#007AC9';
}



// Global variable to store the current line
let currentLine = null;

// Initialize the app
function init() {
    fetchLines().then(lines => {
        displayLines(lines);
    });
}

// Start the app when the page loads
window.addEventListener('DOMContentLoaded', init);
