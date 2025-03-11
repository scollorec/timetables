// Function to handle station selection and fetch arrivals
function selectStation(station) {
    console.log('Selected station:', station.id);
    fetchArrivals(station.id).then(arrivals => {
        displayArrivals(arrivals, station);
    });
}

// Function to fetch live arrivals for a station
async function fetchArrivals(stationId) {
    try {
        const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${stationId}/arrivals`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrivals = await response.json();
        return arrivals;
    } catch (error) {
        console.error('Error fetching arrivals:', error);
        return [];
    }
}

// Global variable to store the refresh timer
let arrivalsRefreshTimer = null;

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

function displayArrivals(arrivals, station) {
    // Clear any existing refresh timer
    if (arrivalsRefreshTimer) {
        clearInterval(arrivalsRefreshTimer);
        arrivalsRefreshTimer = null;
    }
    const container = document.getElementById('timetable-container');

    // Create container with iOS-like styling
    const arrivalsContainer = document.createElement('div');
    arrivalsContainer.className = 'station-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'station-header';

    // Create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Stations';
    backButton.className = 'back-button';
    backButton.addEventListener('click', function(e) {
        e.preventDefault();
        // Clear the refresh timer when navigating away
        if (arrivalsRefreshTimer) {
            clearInterval(arrivalsRefreshTimer);
            arrivalsRefreshTimer = null;
        }
        // Go back to stations list
        if (currentLine) {
            fetchStations(currentLine.id).then(stations => {
                displayStations(stations, currentLine);
            });
        } else {
            init();
        }
    });

    // Create title
    const title = document.createElement('h2');
    title.textContent = station.commonName.replace(' Underground Station', '');
    title.className = 'line-title';

    // Add last updated timestamp
    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'last-updated';
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

    header.appendChild(backButton);
    header.appendChild(title);
    header.appendChild(lastUpdated);

    // Identify unique lines serving this station
    const uniqueLines = [...new Set(arrivals.map(arrival => arrival.lineName))];

    // Create line filters if there's more than one line
    let activeLineFilters = [...uniqueLines]; // By default, all lines are active
    if (uniqueLines.length > 1) {
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'line-filters';
        uniqueLines.forEach(lineName => {
            const filterButton = document.createElement('button');
            filterButton.className = 'line-filter active';
            filterButton.textContent = lineName;
            filterButton.style.backgroundColor = getLineColor({ name: lineName });
            filterButton.style.color = 'white';
            filterButton.addEventListener('click', function() {
                // Toggle active state
                this.classList.toggle('active');
                if (this.classList.contains('active')) {
                    // Add line to active filters
                    if (!activeLineFilters.includes(lineName)) {
                        activeLineFilters.push(lineName);
                    }
                } else {
                    // Remove line from active filters
                    activeLineFilters = activeLineFilters.filter(line => line !== lineName);
                }
                // Update display with filtered arrivals
                updateArrivalsDisplay(arrivals, activeLineFilters, arrivalsList);
            });
            filtersContainer.appendChild(filterButton);
        });
        arrivalsContainer.appendChild(filtersContainer);
    }

    // Create arrivals list
    const arrivalsList = document.createElement('ul');
    arrivalsList.className = 'station-list';

    // Function to update arrivals display based on active line filters
    function updateArrivalsDisplay(arrivals, activeLineFilters, arrivalsList) {
        // Clear current arrivals
        arrivalsList.innerHTML = '';

        // Filter arrivals by active lines
        const filteredArrivals = arrivals.filter(arrival =>
            activeLineFilters.includes(arrival.lineName)
        );

        if (filteredArrivals.length === 0) {
            const noArrivalsItem = document.createElement('li');
            noArrivalsItem.className = 'station-item no-arrivals';
            noArrivalsItem.textContent = 'No arrivals information available for selected lines';
            arrivalsList.appendChild(noArrivalsItem);
        } else {
            // Group arrivals by platform
            const platformGroups = {};
            filteredArrivals.forEach(arrival => {
                const platformName = arrival.platformName || 'Unknown Platform';
                if (!platformGroups[platformName]) {
                    platformGroups[platformName] = [];
                }
                platformGroups[platformName].push(arrival);
            });

            // Sort platforms alphabetically
            const sortedPlatforms = Object.keys(platformGroups).sort();

            // Add each platform group
            sortedPlatforms.forEach(platformName => {
                // Create platform header
                const platformHeader = document.createElement('li');
                platformHeader.className = 'platform-header';
                platformHeader.textContent = platformName;
                arrivalsList.appendChild(platformHeader);

                // Sort arrivals by time
                const platformArrivals = platformGroups[platformName];
                platformArrivals.sort((a, b) => a.timeToStation - b.timeToStation);

                // Add arrivals for this platform (limit to 5)
                platformArrivals.slice(0, 5).forEach(arrival => {
                    const arrivalItem = document.createElement('li');
                    arrivalItem.className = 'station-item';

                    // Calculate minutes until arrival
                    const minutes = Math.floor(arrival.timeToStation / 60);
                    let timeText = minutes === 0 ? 'Due' : `${minutes} min`;

                    // Format expected arrival time
                    let expectedTime = '';
                    if (arrival.expectedArrival) {
                        const arrivalDate = new Date(arrival.expectedArrival);
                        expectedTime = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } else {
                        // Calculate based on timeToStation
                        const now = new Date();
                        now.setSeconds(now.getSeconds() + arrival.timeToStation);
                        expectedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }

                    // Use 'towards' field if available, otherwise use 'destinationName'
                    const destination = arrival.towards || arrival.destinationName;

                    arrivalItem.innerHTML = `
            <div class="arrival-line" style="color: ${getLineColor({ name: arrival.lineName }).color || getLineColor({ name: arrival.lineName })}">
              ${arrival.lineName}
            </div>
            <div class="arrival-destination">${destination}</div>
            <div class="arrival-info">
              <div class="arrival-time">${timeText}</div>
              <div class="arrival-expected">${expectedTime}</div>
            </div>
          `;

                    // Add click event to show detailed view
                    arrivalItem.addEventListener('click', () => {
                        showArrivalDetail(arrival, station);
                    });

                    arrivalsList.appendChild(arrivalItem);
                });
            });
        }
    }

    // Initial display
    updateArrivalsDisplay(arrivals, activeLineFilters, arrivalsList);

    arrivalsContainer.appendChild(header);
    arrivalsContainer.appendChild(arrivalsList);
    container.innerHTML = '';
    container.appendChild(arrivalsContainer);

    // Set up auto-refresh every 30 seconds
    arrivalsRefreshTimer = setInterval(() => {
        fetchArrivals(station.id).then(newArrivals => {
            updateArrivalsDisplay(newArrivals, activeLineFilters, arrivalsList);
            // Update last updated time
            const now = new Date();
            lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        });
    }, 60000);
}
