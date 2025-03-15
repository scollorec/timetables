// Function to handle station selection and fetch arrivals
function selectStation(station) {
    console.log('Selected station:', station.id);
    fetchArrivals(station.id)
        .then(arrivals => {
            displayArrivals(arrivals, station);
        })
        .catch(error => {
            console.error('Error fetching arrivals:', error);
            showErrorMessage(error);
        });
}

// Global variable to store the refresh timer
let arrivalsRefreshTimer = null;

/**
 * Creates and returns a station header element
 * @param {Object} station - The station object
 * @param {Function} onBackClick - Callback for back button click
 * @returns {HTMLElement} The created header element
 */
function createStationHeader(station, onBackClick) {
    // Create header
    const header = document.createElement('div');
    header.className = 'station-header';

    // Create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Stations';
    backButton.className = 'back-button';
    backButton.addEventListener('click', onBackClick);

    // Create title
    const title = document.createElement('h2');
    title.textContent = station.commonName.replace(' Underground Station', '');
    title.className = 'line-title';

    // Add last updated timestamp
    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'last-updated';
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

    // Build header
    header.appendChild(backButton);
    header.appendChild(title);
    header.appendChild(lastUpdated);

    return header;
}

/**
 * Handles back button click event
 * @param {Event} e - The click event
 */
function handleBackButtonClick(e) {
    e.preventDefault();

    // Clear the refresh timer when navigating away
    clearRefreshTimer();

    // Go back to stations list
    if (currentLine) {
        fetchStations(currentLine.id)
            .then(stations => {
                displayStations(stations, currentLine);
            })
            .catch(error => {
                console.error('Error fetching stations:', error);
                showErrorMessage(error);
            });
    } else {
        init();
    }
}

function displayArrivals(arrivals, station) {
    debugStationData(station);
    debugArrivalData(arrivals);

    // Clear any existing refresh timer
    if (arrivalsRefreshTimer) {
        clearInterval(arrivalsRefreshTimer);
        arrivalsRefreshTimer = null;
    }

    const container = document.getElementById('timetable-container');

    // Create container with iOS-like styling
    const arrivalsContainer = document.createElement('div');
    arrivalsContainer.className = 'station-container';

    // Create and add header
    const header = createStationHeader(station, handleBackButtonClick);
    arrivalsContainer.appendChild(header);

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
            fetchStations(currentLine.id)
                .then(stations => {
                    displayStations(stations, currentLine);
                })
                .catch(error => {
                    console.error('Error fetching stations:', error);
                    showErrorMessage(error);
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
            filterButton.style.backgroundColor = getLineColor({ id: lineName, name: lineName });
            filterButton.style.color = 'white';

            // Add aria-label for accessibility
            filterButton.setAttribute('aria-label', `Filter ${lineName} line`);
            filterButton.setAttribute('aria-pressed', 'true');

            filterButton.addEventListener('click', function() {
                // Toggle active state
                this.classList.toggle('active');
                const isActive = this.classList.contains('active');
                this.setAttribute('aria-pressed', isActive ? 'true' : 'false');

                if (isActive) {
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
            <div class="arrival-line" style="color: ${getLineColor({ id: arrival.lineId, name: arrival.lineName })}">
              ${arrival.lineName}
            </div>
            <div class="arrival-destination">${destination}</div>

            <div class="arrival-info">
              <div class="arrival-time">${timeText}</div>
              <div class="arrival-expected">${expectedTime}</div>
            </div>
          `;

                    // Make the arrival item clickable to show detail view
                    arrivalItem.addEventListener('click', function() {
                        showArrivalDetail(arrival, station);
                    });

                    arrivalsList.appendChild(arrivalItem);
                });
            });
        }
    }

    // Initial display of arrivals
    updateArrivalsDisplay(arrivals, activeLineFilters, arrivalsList);

    arrivalsContainer.appendChild(header);
    arrivalsContainer.appendChild(arrivalsList);

    // Clear container and add new content
    container.innerHTML = '';
    container.appendChild(arrivalsContainer);

    // Set up auto-refresh every 30 seconds
    arrivalsRefreshTimer = setInterval(() => {
        console.log('Auto-refreshing arrivals data');
        apiFetchArrivals(station.id)
            .then(newArrivals => {
                if (newArrivals && newArrivals.length > 0) {
                    // Update last updated timestamp
                    const now = new Date();
                    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

                    // Update arrivals display
                    updateArrivalsDisplay(newArrivals, activeLineFilters, arrivalsList);

                    // Store the new arrivals data
                    arrivals = newArrivals;
                }
            })
            .catch(error => {
                console.error('Error auto-refreshing arrivals:', error);
                showErrorMessage(error);
            });
    }, 30000); // Refresh every 30 seconds
}

// Debug functions - these should be conditionally included based on environment
function debugStationData(station) {
    if (process.env.NODE_ENV !== 'production') {
        console.log('Station data:', station);
    }
}

function debugArrivalData(arrivals) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Received ${arrivals.length} arrivals`);
        if (arrivals.length > 0) {
            console.log('First arrival:', arrivals[0]);
        }
    }
}

function createStationTile2(station) {
    // Create a station tile element
    const tile = document.createElement('div');
    tile.className = 'airport-style';

    // Add station name
    const name = document.createElement('div');
    name.className = 'station-name';
    name.textContent = station.commonName || station.name;

    tile.appendChild(name);

    // Create the options menu button
    const options = document.createElement('button');
    options.className = 'options-button';
    options.textContent = '•••';

    tile.appendChild(options);

    // Make tile clickable
    tile.addEventListener('click', () => selectStation(station));

    return tile;
}

// Function to create a station tile
function createStationTile(station, isFavorite = false) {
    const tile = document.createElement('div');
    //tile.className = 'station-item favorite-station';
    // Add favorite-station class if it's a favorite
    tile.className = isFavorite ? 'station-item favorite-station' : 'station-item';

    // Add favorite star
    const favoriteIcon = document.createElement('span');
    favoriteIcon.className = isFavorite ? 'favorite-icon active' : 'favorite-icon';
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

function createStationTileMain(station, favoritesList, favoritesHeader, isFavorite = false) {
    const tile = document.createElement('div');
    //tile.className = 'station-item favorite-station';
    // Add favorite-station class if it's a favorite
    tile.className = isFavorite ? 'station-item favorite-station' : 'station-item';

    // Add favorite star
    const favoriteIcon = document.createElement('span');
    favoriteIcon.className = isFavorite ? 'favorite-icon active' : 'favorite-icon';
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

function createLineHeader(line, onBackClick) {
    // Create header
    const header = document.createElement('div');
    header.className = 'station-header';

    // Create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Stations';
    backButton.className = 'back-button';
    backButton.addEventListener('click', onBackClick);

    // Create title
    const title = document.createElement('h2');
    title.textContent = line.name;
    title.className = 'line-title';
    title.style.color = getLineColor(line);

    // Add last updated timestamp
    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'last-updated';
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

    // Build header
    header.appendChild(backButton);
    header.appendChild(title);
    header.appendChild(lastUpdated);

    return header;
}

// Function to get all favorites from localStorage
function getFavorites() {
    const storedFavorites = localStorage.getItem('favorite-stations');
    return storedFavorites ? JSON.parse(storedFavorites) : [];
}

function createFavoritesSection(stations){
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

}

function displayStations(stations, line) {
    // Implementation to display stations
    const container = document.getElementById('timetable-container');
    container.innerHTML = '';

    // Create and add header
    const header = createLineHeader(line, handleBackButtonClick);
    container.appendChild(header);

    // Create stations list
    const stationsList = document.createElement('ul');
    stationsList.className = 'station-list';

    // Add stations to the list
    stations.forEach(station => {
        const stationItem = document.createElement('li');
        //stationItem.className = 'station-item';
        //stationItem.textContent = station.commonName || station.name;
        //stationItem.addEventListener('click', () => selectStation(station));

        //stationsList.appendChild(stationItem);
        stationsList.appendChild(createStationTile(station));

    });

    container.appendChild(stationsList);



}
