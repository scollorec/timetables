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

    // Create filter buttons
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'mode-filters';

    // Get saved filter preferences from localStorage
    const activeFilters = getActiveFilters();

    // Create filter buttons for different modes
    const modes = [
        { id: 'tube', name: 'Tube' },
        { id: 'overground', name: 'Overground' },
        { id: 'dlr', name: 'DLR' },
        { id: 'elizabeth-line', name: 'Elizabeth Line' }
    ];

    modes.forEach(mode => {
        const filterButton = document.createElement('button');
        filterButton.className = 'mode-filter';
        filterButton.dataset.mode = mode.id;
        filterButton.textContent = mode.name;

        // Set active state based on saved preferences
        if (activeFilters.includes(mode.id)) {
            filterButton.classList.add('active');
        }

        filterButton.addEventListener('click', function() {
            this.classList.toggle('active');
            updateActiveFilters();
            filterLines(lines);
        });

        filtersContainer.appendChild(filterButton);
    });

    container.appendChild(filtersContainer);

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
                    const stationTile = createStationTile(station, favoritesList, favoritesHeader);
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
    linesHeader.id = 'lines-header'; // Add ID for easy reference
    container.appendChild(linesHeader);

    // Create a container for line tiles
    const linesContainer = document.createElement('div');
    linesContainer.id = 'lines-container';
    container.appendChild(linesContainer);

    // Filter and display lines based on active filters
    filterLines(lines);

    // Function to create a station tile
    function createStationTile(station, favoritesList, favoritesHeader) {
        const tile = document.createElement('div');
        tile.className = 'option-card airport-style favorite-station';

        // Create the status indicator (colored dot)
        const indicator = document.createElement('div');
        indicator.className = 'status-indicator';
        indicator.style.backgroundColor = '#FFD700'; // Gold color for favorites

        // Create the main content container
        const content = document.createElement('div');
        content.className = 'line-content';

        // Create the station name/title
        const title = document.createElement('h2');
        title.className = 'line-title';
        title.textContent = station.commonName.replace(' Underground Station', '');

        // Create the right-side controls container
        const controls = document.createElement('div');
        controls.className = 'controls-container';

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

        // Create the options menu button
        const options = document.createElement('button');
        options.className = 'options-button';
        options.textContent = '•••';

        // Add favorite icon and options button to controls
        controls.appendChild(favoriteIcon);
        controls.appendChild(options);

        // Append elements to build the card
        content.appendChild(title);

        tile.appendChild(indicator);
        tile.appendChild(content);
        tile.appendChild(controls);

        // Add click event to select station
        tile.addEventListener('click', () => {
            selectStation(station);
        });

        return tile;
    }

    // Function to update active filters in localStorage
    function updateActiveFilters() {
        const activeFilters = Array.from(document.querySelectorAll('.mode-filter.active'))
            .map(button => button.dataset.mode);
        localStorage.setItem('active-filters', JSON.stringify(activeFilters));
    }

    // Function to filter lines based on active filters
    function filterLines(allLines) {
        const activeFilters = getActiveFilters();
        const linesContainer = document.getElementById('lines-container');

        // Clear existing line cards
        linesContainer.innerHTML = '';

        // If no filters are active, show all lines
        if (activeFilters.length === 0) {
            displayFilteredLines(allLines);
            return;
        }

        // Filter lines based on active filters
        const filteredLines = allLines.filter(line => {
            // Check if line matches any active filter
            return activeFilters.some(filter => {
                if (filter === 'overground') {
                    return line.id.toLowerCase().includes('overground') ||
                        line.name.toLowerCase().includes('overground') ||
                        line.name.toLowerCase().includes('lioness') ||
                        line.name.toLowerCase().includes('mildmay') ||
                        line.name.toLowerCase().includes('windrush') ||
                        line.name.toLowerCase().includes('weaver') ||
                        line.name.toLowerCase().includes('suffragette') ||
                        line.name.toLowerCase().includes('liberty');
                } else if (filter === 'elizabeth-line') {
                    return line.id.toLowerCase().includes('elizabeth') ||
                        line.name.toLowerCase().includes('elizabeth');
                } else {
                    return line.modeName && line.modeName.toLowerCase() === filter ||
                        line.id.toLowerCase().includes(filter);
                }
            });
        });

        displayFilteredLines(filteredLines);
    }

    // Function to display filtered lines
    function displayFilteredLines(filteredLines) {
        const linesContainer = document.getElementById('lines-container');

        // Display filtered lines
        filteredLines.forEach(line => {
            const tile = addLine(line);
            // Add click event listener to each tile
            tile.addEventListener('click', () => selectLine(line));
            linesContainer.appendChild(tile);
        });
    }
}

// Function to get active filters from localStorage
function getActiveFilters() {
    const storedFilters = localStorage.getItem('active-filters');
    // Default to all filters active if none are stored
    return storedFilters ? JSON.parse(storedFilters) : ['tube', 'overground', 'dlr', 'elizabeth-line'];
}

function addLine(line) {
    const tile = document.createElement('div');
    tile.className = 'option-card airport-style';

    // Create the status indicator (colored dot)
    const indicator = document.createElement('div');
    indicator.className = 'status-indicator';

    // Create the main content container
    const content = document.createElement('div');
    content.className = 'line-content';

    // Create the line name/title
    const title = document.createElement('h2');
    title.className = 'line-title';
    title.textContent = line.name;

    // Create the right-side controls container
    const controls = document.createElement('div');
    controls.className = 'controls-container';

    // Check if there are disruptions
    const hasDisruption = line.disruptions && line.disruptions.length > 0;

    // Add status icon based on disruption status
    const statusIcon = document.createElement('span');
    statusIcon.className = 'status-icon';

    if (hasDisruption) {
        statusIcon.innerHTML = '⚠️'; // Warning triangle
        statusIcon.classList.add('warning');
    } else {
        statusIcon.innerHTML = '✓'; // Green check
        statusIcon.classList.add('check');
    }

    // Create the options menu button
    const options = document.createElement('button');
    options.className = 'options-button';
    options.textContent = '•••';

    // Add status icon and options button to controls
    controls.appendChild(statusIcon);
    controls.appendChild(options);

    // Determine line color for styling
    const lineColor = getLineColor(line);

    // Append elements to build the card
    content.appendChild(title);

    tile.appendChild(indicator);
    tile.appendChild(content);
    tile.appendChild(controls);

    // Apply styling based on line type
    const isOverground = line.id.toLowerCase().includes('overground') ||
        line.name.toLowerCase().includes('overground') ||
        line.name.toLowerCase().includes('lioness') ||
        line.name.toLowerCase().includes('mildmay') ||
        line.name.toLowerCase().includes('windrush') ||
        line.name.toLowerCase().includes('weaver') ||
        line.name.toLowerCase().includes('suffragette') ||
        line.name.toLowerCase().includes('liberty');

    // Always set the indicator color regardless of line type
    indicator.style.backgroundColor = lineColor;

    // Add the overground class if needed
    if (isOverground) {
        tile.classList.add('overground-line');
        // Set the border color for overground lines
        tile.style.setProperty('--line-color', lineColor);
    }

    return tile;
}

// Function to select a line and fetch its stations
function selectLine(line) {
    console.log('Selected line:', line.id);
    currentLine = line;
    fetchStations(line.id).then(stations => {
        displayStations(stations, line);
    });
}

// Function to get color for a line
function getLineColor(line) {
    const colors = {
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
        'london-overground': '#EE7C0E',
        'dlr': '#00A4A7',
        'elizabeth': '#9364CD',
        'tram': '#84B817'
    };

    // Check for specific Overground lines
    if (line.name.toLowerCase().includes('lioness')) return '#EE7C0E';
    if (line.name.toLowerCase().includes('mildmay')) return '#EE7C0E';
    if (line.name.toLowerCase().includes('windrush')) return '#EE7C0E';
    if (line.name.toLowerCase().includes('weaver')) return '#EE7C0E';
    if (line.name.toLowerCase().includes('suffragette')) return '#EE7C0E';
    if (line.name.toLowerCase().includes('liberty')) return '#EE7C0E';

    // For standard lines, look up by ID
    for (const [key, color] of Object.entries(colors)) {
        if (line.id.toLowerCase().includes(key)) {
            return color;
        }
    }

    // Default color if no match found
    return '#7B7B7B';
}

// Initialize the app
let currentLine = null;

async function init() {
    const lines = await fetchLines();
    displayLines(lines);
}

// Start the app when the page loads
window.addEventListener('DOMContentLoaded', init);
