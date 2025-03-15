// Global variables
let arrivalsRefreshTimer = null;
let currentLine = null;

/**
 * Function to handle station selection and fetch arrivals
 * @param {Object} station - The selected station object
 */
function selectStation(station) {
    console.log('Selected station:', station.id);

    // Clear any existing refresh timer
    clearRefreshTimer();

    fetchArrivals(station.id)
        .then(arrivals => {
            displayArrivals(arrivals, station);
        })
        .catch(error => {
            console.error('Error fetching arrivals:', error);
            showErrorMessage(error);
        });
}

/**
 * Clears the arrivals refresh timer if it exists
 */
function clearRefreshTimer() {
    if (arrivalsRefreshTimer) {
        clearInterval(arrivalsRefreshTimer);
        arrivalsRefreshTimer = null;
    }
}

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

/**
 * Updates the arrivals display based on active line filters
 * @param {Array} arrivals - The arrivals data
 * @param {Array} activeLineFilters - Currently active line filters
 * @param {HTMLElement} arrivalsList - The list element to update
 */
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
        return;
    }

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

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Add each platform group
    sortedPlatforms.forEach(platformName => {
        // Create platform header
        const platformHeader = document.createElement('li');
        platformHeader.className = 'platform-header';
        platformHeader.textContent = platformName;
        fragment.appendChild(platformHeader);

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
                expectedTime = arrivalDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                // Calculate based on timeToStation
                const now = new Date();
                now.setSeconds(now.getSeconds() + arrival.timeToStation);
                expectedTime = now.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            // Use 'towards' field if available, otherwise use 'destinationName'
            const destination = arrival.towards || arrival.destinationName;

            // Set the inner HTML
            arrivalItem.innerHTML = `<div class="arrival-info">
        <span class="destination">${destination}</span>
        <span class="time">${timeText}</span>
      </div>
      <div class="expected-time">${expectedTime}</div>`;

            fragment.appendChild(arrivalItem);
        });
    });

    // Append all elements at once
    arrivalsList.appendChild(fragment);
}

/**
 * Displays arrivals for a station
 * @param {Array} arrivals - The arrivals data
 * @param {Object} station - The station object
 */
function displayArrivals(arrivals, station) {
    debugStationData(station);
    debugArrivalData(arrivals);

    // Clear any existing refresh timer
    clearRefreshTimer();

    const container = document.getElementById('timetable-container');
    if (!container) {
        console.error('Timetable container not found');
        return;
    }

    // Clear previous content
    container.innerHTML = '';

    // Create container with iOS-like styling
    const arrivalsContainer = document.createElement('div');
    arrivalsContainer.className = 'station-container';

    // Create and add header
    const header = createStationHeader(station, handleBackButtonClick);
    arrivalsContainer.appendChild(header);

    // Identify unique lines serving this station
    const uniqueLines = [...new Set(arrivals.map(arrival => arrival.lineName))];

    // By default, all lines are active
    let activeLineFilters = [...uniqueLines];

    // Create line filters if there's more than one line
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

    // Initial display of arrivals
    updateArrivalsDisplay(arrivals, activeLineFilters, arrivalsList);

    arrivalsContainer.appendChild(arrivalsList);
    container.appendChild(arrivalsContainer);

    // Set up auto-refresh every 30 seconds
    arrivalsRefreshTimer = setInterval(() => {
        fetchArrivals(station.id)
            .then(newArrivals => {
                // Update just the arrivals list, not the whole display
                updateArrivalsDisplay(newArrivals, activeLineFilters, arrivalsList);

                // Update the last updated timestamp
                const lastUpdated = header.querySelector('.last-updated');
                if (lastUpdated) {
                    const now = new Date();
                    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
                }
            })
            .catch(error => {
                console.error('Error refreshing arrivals:', error);
            });
    }, 30000);
}
