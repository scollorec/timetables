// Global variables
let detailRefreshTimer = null;
let countdownInterval = null;
let currentArrival = null;
let currentStation = null;

// Function to show detailed view of an arrival with Apple Watch style
function showArrivalDetail_new(arrival, station) {
    console.log('showArrivalDetail called with:', { arrival, stationId: station.id });

    // Store current arrival and station for refreshing
    currentArrival = JSON.parse(JSON.stringify(arrival)); // Deep copy to avoid reference issues
    currentStation = station;

    // Clear any existing timers
    if (detailRefreshTimer) {
        console.log('Clearing existing detail refresh timer');
        clearInterval(detailRefreshTimer);
    }

    if (countdownInterval) {
        console.log('Clearing existing countdown interval');
        clearInterval(countdownInterval);
    }

    const container = document.getElementById('timetable-container');
    console.log('Container found:', !!container);

    // Create detail container
    const detailContainer = document.createElement('div');
    detailContainer.className = 'watch-container';
    detailContainer.id = 'watch-detail-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'watch-header';

    // Create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'watch-back-button';
    backButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Back button clicked, returning to arrivals list');

        // Clear timers when navigating away
        if (detailRefreshTimer) {
            clearInterval(detailRefreshTimer);
            detailRefreshTimer = null;
        }

        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        // Go back to arrivals list
        console.log('Fetching arrivals for station:', station.id);
        fetchArrivals(station.id)
            .then(arrivals => {
                console.log(`Received ${arrivals.length} arrivals for station ${station.id}`);
                displayArrivals(arrivals, station);
            })
            .catch(error => {
                console.error('Error fetching arrivals in back button handler:', error);
            });
    });

    header.appendChild(backButton);

    // Create watch face
    const watchFace = document.createElement('div');
    watchFace.className = 'watch-face';

    // Create countdown circle
    const countdownCircle = document.createElement('div');
    countdownCircle.className = 'countdown-circle';

    // Create countdown display
    const countdownDisplay = document.createElement('div');
    countdownDisplay.className = 'countdown-display';
    countdownDisplay.id = 'countdown-display';

    // Calculate minutes and seconds
    const minutes = Math.floor(arrival.timeToStation / 60);
    const seconds = arrival.timeToStation % 60;
    console.log('Time to station:', { minutes, seconds, totalSeconds: arrival.timeToStation });

    countdownDisplay.innerHTML = `
    <div class="time">${minutes}:${seconds.toString().padStart(2, '0')}</div>
    <div class="label">until arrival</div>
  `;

    // Create train info
    const trainInfo = document.createElement('div');
    trainInfo.className = 'train-info';

    // Line name with color
    const lineName = document.createElement('div');
    lineName.className = 'line-name';
    lineName.textContent = arrival.lineName;
    lineName.style.color = getLineColor({ id: arrival.lineId, name: arrival.lineName });
    console.log('Line info:', {
        name: arrival.lineName,
        id: arrival.lineId,
        color: getLineColor({ id: arrival.lineId, name: arrival.lineName })
    });

    // Destination
    const destination = document.createElement('div');
    destination.className = 'destination';
    destination.textContent = arrival.towards || arrival.destinationName || 'Unknown destination';
    console.log('Destination:', arrival.towards || arrival.destinationName || 'Unknown destination');

    // Platform
    const platform = document.createElement('div');
    platform.className = 'platform';
    platform.textContent = arrival.platformName || 'Unknown platform';
    console.log('Platform:', arrival.platformName || 'Unknown platform');

    // Vehicle ID if available
    if (arrival.vehicleId) {
        const vehicleId = document.createElement('div');
        vehicleId.className = 'vehicle-id';
        vehicleId.textContent = `Train ID: ${arrival.vehicleId}`;
        trainInfo.appendChild(vehicleId);
        console.log('Vehicle ID:', arrival.vehicleId);
    }

    // Current location if available
    if (arrival.currentLocation) {
        const currentLocation = document.createElement('div');
        currentLocation.className = 'current-location';
        currentLocation.textContent = `Current location: ${arrival.currentLocation}`;
        trainInfo.appendChild(currentLocation);
        console.log('Current location:', arrival.currentLocation);
    }

    // Add all elements to the train info section
    trainInfo.appendChild(lineName);
    trainInfo.appendChild(destination);
    trainInfo.appendChild(platform);

    // Add elements to watch face
    countdownCircle.appendChild(countdownDisplay);
    watchFace.appendChild(countdownCircle);

    // Add elements to detail container
    detailContainer.appendChild(header);
    detailContainer.appendChild(watchFace);
    detailContainer.appendChild(trainInfo);

    // Clear container and add detail view
    container.innerHTML = '';
    container.appendChild(detailContainer);

    // Set up countdown interval
    let remainingSeconds = arrival.timeToStation;
    console.log('Setting up countdown interval, starting with', remainingSeconds, 'seconds');

    countdownInterval = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            console.log('Countdown reached zero, clearing interval');
            clearInterval(countdownInterval);
            countdownInterval = null;

            // Show "Arrived" message
            countdownDisplay.innerHTML = `
        <div class="time">Arrived</div>
        <div class="label">at station</div>
      `;
            return;
        }

        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;

        countdownDisplay.innerHTML = `
      <div class="time">${mins}:${secs.toString().padStart(2, '0')}</div>
      <div class="label">until arrival</div>
    `;

        // Update the circle progress
        const progress = (arrival.timeToStation - remainingSeconds) / arrival.timeToStation;
        countdownCircle.style.background = `conic-gradient(#4CAF50 ${progress * 360}deg, #f0f0f0 0deg)`;

    }, 1000);

    // Set up auto-refresh every 30 seconds
    console.log('Setting up auto-refresh timer for every 30 seconds');
    detailRefreshTimer = setInterval(() => {
        console.log('Auto-refreshing arrival data');
        refreshArrivalDetail();
    }, 30000);
}

function showArrivalDetail(arrival, station) {
    // Store current arrival and station for refreshing
    currentArrival = JSON.parse(JSON.stringify(arrival)); // Deep copy to avoid reference issues
    currentStation = station;

    // Clear any existing timers
    if (detailRefreshTimer) {
        clearInterval(detailRefreshTimer);
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    const container = document.getElementById('timetable-container');

    // Create detail container
    const detailContainer = document.createElement('div');
    detailContainer.className = 'watch-container';
    detailContainer.id = 'watch-detail-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'watch-header';

    // Create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'watch-back-button';
    backButton.addEventListener('click', function(e) {
        e.preventDefault();
        // Clear timers when navigating away
        if (detailRefreshTimer) {
            clearInterval(detailRefreshTimer);
            detailRefreshTimer = null;
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        // Go back to arrivals list
        fetchArrivals(station.id).then(arrivals => {
            displayArrivals(arrivals, station);
        });
    });

    header.appendChild(backButton);

    // Create watch face
    const watchFace = document.createElement('div');
    watchFace.className = 'watch-face';

    // Create countdown circle
    const countdownCircle = document.createElement('div');
    countdownCircle.className = 'countdown-circle';

    // Create countdown display
    const countdownDisplay = document.createElement('div');
    countdownDisplay.className = 'countdown-display';
    countdownDisplay.id = 'countdown-display';

    // Calculate minutes and seconds
    const minutes = Math.floor(arrival.timeToStation / 60);
    const seconds = arrival.timeToStation % 60;

    countdownDisplay.innerHTML = `
        <div class="countdown-time">${minutes}<span class="countdown-unit">m</span> ${seconds}<span class="countdown-unit">s</span></div>
        <div class="countdown-label">until arrival</div>
    `;

    // Create progress ring (SVG)
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "countdown-ring");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.id = "countdown-svg";

    // Background circle
    const bgCircle = document.createElementNS(svgNS, "circle");
    bgCircle.setAttribute("cx", "50");
    bgCircle.setAttribute("cy", "50");
    bgCircle.setAttribute("r", "45");
    bgCircle.setAttribute("fill", "none");
    bgCircle.setAttribute("stroke", "rgba(255, 255, 255, 0.2)");
    bgCircle.setAttribute("stroke-width", "5");

    // Progress circle
    const progressCircle = document.createElementNS(svgNS, "circle");
    progressCircle.setAttribute("cx", "50");
    progressCircle.setAttribute("cy", "50");
    progressCircle.setAttribute("r", "45");
    progressCircle.setAttribute("fill", "none");
    progressCircle.setAttribute("stroke", getLineColor({ name: arrival.lineName }));
    progressCircle.setAttribute("stroke-width", "5");
    progressCircle.setAttribute("stroke-dasharray", "283");
    progressCircle.id = "progress-circle";

    // Calculate initial stroke-dashoffset based on time remaining
    // Full circle circumference is 2πr = 2 * π * 45 ≈ 283
    const circumference = 2 * Math.PI * 45;
    const maxTime = 20 * 60; // 20 minutes in seconds (typical max display time)
    const timeRatio = Math.min(arrival.timeToStation / maxTime, 1);
    const dashOffset = circumference * (1 - timeRatio);
    progressCircle.setAttribute("stroke-dashoffset", dashOffset);

    svg.appendChild(bgCircle);
    svg.appendChild(progressCircle);

    countdownCircle.appendChild(svg);
    countdownCircle.appendChild(countdownDisplay);

    // Create arrival info
    const arrivalInfo = document.createElement('div');
    arrivalInfo.className = 'watch-info';
    arrivalInfo.id = 'watch-info';

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

    arrivalInfo.innerHTML = `
        <div class="watch-line" style="color: ${getLineColor({ name: arrival.lineName })}">
            ${arrival.lineName}
        </div>
        <div class="watch-destination">${destination}</div>
        <div class="watch-platform">${arrival.platformName || 'Unknown Platform'}</div>
        <div class="watch-expected" id="watch-expected">Expected: ${expectedTime}</div>
        <div class="watch-last-updated" id="watch-last-updated">Last updated: ${new Date().toLocaleTimeString()}</div>
    `;

    // Add all elements to watch face
    watchFace.appendChild(countdownCircle);
    watchFace.appendChild(arrivalInfo);

    // Add header and watch face to container
    detailContainer.appendChild(header);
    detailContainer.appendChild(watchFace);

    // Clear container and add our watch-style detail view
    container.innerHTML = '';
    container.appendChild(detailContainer);

    // Set up a countdown interval to update every second
    countdownInterval = setInterval(() => {
        // Decrement time to station
        currentArrival.timeToStation--;

        // Update the countdown display
        const minutes = Math.floor(currentArrival.timeToStation / 60);
        const seconds = currentArrival.timeToStation % 60;

        const countdownDisplay = document.getElementById('countdown-display');
        if (countdownDisplay) {
            countdownDisplay.innerHTML = `
                <div class="countdown-time">${minutes}<span class="countdown-unit">m</span> ${seconds}<span class="countdown-unit">s</span></div>
                <div class="countdown-label">until arrival</div>
            `;
        }

        // Update the progress ring
        const progressCircle = document.getElementById('progress-circle');
        if (progressCircle) {
            const timeRatio = Math.min(currentArrival.timeToStation / maxTime, 1);
            const dashOffset = circumference * (1 - timeRatio);
            progressCircle.setAttribute("stroke-dashoffset", dashOffset);
        }

        // If countdown reaches zero, refresh data
        if (currentArrival.timeToStation <= 0) {
            clearInterval(countdownInterval);
            fetchArrivals(station.id).then(arrivals => {
                // Find the next arrival for this line and destination
                const nextArrival = findNextArrival(arrivals, currentArrival);
                if (nextArrival) {
                    showArrivalDetail(nextArrival, station);
                } else {
                    displayArrivals(arrivals, station);
                }
            });
        }
    }, 1000);

    // Set up a timer to refresh the arrival data every 15 seconds
    detailRefreshTimer = setInterval(() => {
        fetchArrivals(station.id).then(arrivals => {
            // Find the updated version of the current arrival
            const updatedArrival = findUpdatedArrival(arrivals, currentArrival);
            if (updatedArrival) {
                // Store the original timeToStation to check if it changed
                const originalTime = currentArrival.timeToStation;

                // Update only specific properties of the current arrival
                currentArrival.expectedArrival = updatedArrival.expectedArrival;

                // Only update timeToStation if it's not drastically different
                // This prevents jumping to a different train
                const timeDifference = Math.abs(updatedArrival.timeToStation - originalTime);
                if (timeDifference < 60) { // If difference is less than 60 seconds
                    currentArrival.timeToStation = updatedArrival.timeToStation;
                }

                // Update expected time display
                let expectedTime = '';
                if (updatedArrival.expectedArrival) {
                    const arrivalDate = new Date(updatedArrival.expectedArrival);
                    expectedTime = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    const now = new Date();
                    now.setSeconds(now.getSeconds() + currentArrival.timeToStation);
                    expectedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                // Update only the text elements, not rebuild the entire view
                const watchExpected = document.getElementById('watch-expected');
                if (watchExpected) {
                    watchExpected.textContent = `Expected: ${expectedTime}`;
                }

                // Update last updated timestamp
                const lastUpdated = document.getElementById('watch-last-updated');
                if (lastUpdated) {
                    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
                }
            }
        });
    }, 15000); // 15 seconds refresh
}


// Function to refresh arrival detail
function refreshArrivalDetail() {
    if (!currentStation || !currentArrival) {
        console.error('Cannot refresh: missing currentStation or currentArrival');
        return;
    }

    console.log('Refreshing arrival detail for station:', currentStation.id);

    fetchArrivals(currentStation.id)
        .then(arrivals => {
            console.log(`Received ${arrivals.length} arrivals for refresh`);

            // Find the matching arrival (same vehicle/line/destination)
            const matchingArrival = arrivals.find(arrival =>
                arrival.vehicleId === currentArrival.vehicleId &&
                arrival.lineId === currentArrival.lineId &&
                arrival.destinationName === currentArrival.destinationName
            );

            if (matchingArrival) {
                console.log('Found matching arrival for refresh:', matchingArrival);
                // Update the detail view with fresh data
                showArrivalDetail(matchingArrival, currentStation);
            } else {
                console.log('No matching arrival found, train may have arrived or been canceled');
                // If no matching arrival is found, the train might have arrived or been canceled
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }

                const countdownDisplay = document.getElementById('countdown-display');
                if (countdownDisplay) {
                    countdownDisplay.innerHTML = `
            <div class="time">No data</div>
            <div class="label">train may have arrived</div>
          `;
                }
            }
        })
        .catch(error => {
            console.error('Error refreshing arrival detail:', error);
        });
}

// Add these debug functions to help troubleshoot

function debugArrivalData(arrival) {
    console.group('Arrival Data Debug');
    console.log('Full arrival object:', arrival);
    console.log('ID:', arrival.id);
    console.log('Line ID:', arrival.lineId);
    console.log('Line Name:', arrival.lineName);
    console.log('Platform Name:', arrival.platformName);
    console.log('Direction:', arrival.direction);
    console.log('Destination Name:', arrival.destinationName);
    console.log('Towards:', arrival.towards);
    console.log('Expected Arrival:', arrival.expectedArrival);
    console.log('Time to Station (seconds):', arrival.timeToStation);
    console.log('Mode Name:', arrival.modeName);
    console.log('Vehicle ID:', arrival.vehicleId);
    console.log('Current Location:', arrival.currentLocation);
    console.groupEnd();
}

function debugStationData(station) {
    console.group('Station Data Debug');
    console.log('Full station object:', station);
    console.log('ID:', station.id);
    console.log('Name:', station.commonName);
    console.log('Modes:', station.modes);
    console.log('Lines:', station.lines);
    console.groupEnd();
}

function displayRTTArrivals(data, station) {
    // Clear any existing refresh timer
    if (arrivalsRefreshTimer) {
        clearInterval(arrivalsRefreshTimer);
        arrivalsRefreshTimer = null;
    }

    const container = document.getElementById('timetable-container');

    // Create container with iOS-like styling
    const arrivalsContainer = document.createElement('div');
    arrivalsContainer.className = 'station-container';

    // Create header (similar to your existing code)
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
    title.textContent = station.commonName;
    title.className = 'line-title';

    // Add last updated timestamp
    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'last-updated';
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

    header.appendChild(backButton);
    header.appendChild(title);
    header.appendChild(lastUpdated);

    // Create arrivals list
    const arrivalsList = document.createElement('ul');
    arrivalsList.className = 'station-list';

    // Check if there are any services
    if (!data.services || data.services.length === 0) {
        const noArrivalsItem = document.createElement('li');
        noArrivalsItem.className = 'station-item no-arrivals';
        noArrivalsItem.textContent = 'No arrivals information available';
        arrivalsList.appendChild(noArrivalsItem);
    } else {
        // Process and display each service
        data.services.forEach(service => {
            const arrivalItem = document.createElement('li');
            arrivalItem.className = 'station-item';

            // Get arrival time
            let timeText = 'Due';
            if (service.locationDetail && service.locationDetail.realtimeArrival) {
                const arrivalTime = service.locationDetail.realtimeArrival;
                const hours = arrivalTime.substring(0, 2);
                const minutes = arrivalTime.substring(2, 4);
                timeText = `${hours}:${minutes}`;
            }

            // Get platform
            const platform = service.locationDetail && service.locationDetail.platform ?
                `Platform ${service.locationDetail.platform}` : 'Unknown platform';

            // Get destination
            const destination = service.destination && service.destination.length > 0 ?
                service.destination[0].description : 'Unknown destination';

            // Get operator
            const operator = service.atocName || 'Unknown operator';

            arrivalItem.innerHTML = `
        <div class="arrival-time">${timeText}</div>
        <div class="arrival-details">
          <div class="arrival-destination">${destination}</div>
          <div class="arrival-info">${operator} - ${platform}</div>
        </div>
      `;

            arrivalsList.appendChild(arrivalItem);
        });
    }

    arrivalsContainer.appendChild(header);
    arrivalsContainer.appendChild(arrivalsList);

    // Clear container and add arrivals view
    container.innerHTML = '';
    container.appendChild(arrivalsContainer);

    // Set up auto-refresh every 60 seconds
    arrivalsRefreshTimer = setInterval(() => {
        const rttCode = convertToRTTCode(station.id);
        fetchRTTArrivals(rttCode).then(data => {
            displayRTTArrivals(data, station);
        });
    }, 60000);
}
