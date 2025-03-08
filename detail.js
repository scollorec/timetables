// Global variables
let detailRefreshTimer = null;
let countdownInterval = null;
let currentArrival = null;
let currentStation = null;

// Function to show detailed view of an arrival with Apple Watch style
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

// Helper function to find the updated version of the current arrival
function findUpdatedArrival(arrivals, currentArrival) {
    // First try to find an exact match including vehicle ID if available
    let exactMatch = null;
    if (currentArrival.vehicleId) {
        exactMatch = arrivals.find(arrival =>
            arrival.vehicleId === currentArrival.vehicleId &&
            arrival.timeToStation > 0
        );
        if (exactMatch) return exactMatch;
    }

    // If no exact match by vehicle ID, try to match by other properties
    // Sort potential matches by how close their timeToStation is to the current one
    const potentialMatches = arrivals.filter(arrival =>
        arrival.lineName === currentArrival.lineName &&
        (arrival.towards === currentArrival.towards ||
            arrival.destinationName === currentArrival.destinationName) &&
        arrival.platformName === currentArrival.platformName &&
        arrival.timeToStation > 0
    );

    if (potentialMatches.length === 0) return null;// Global variables
    let detailRefreshTimer = null;
    let countdownInterval = null;
    let currentArrival = null;
    let currentStation = null;

// Function to show detailed view of an arrival with Apple Watch style
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

// Helper function to find the updated version of the current arrival
    function findUpdatedArrival(arrivals, currentArrival) {
        // First try to find an exact match including vehicle ID if available
        let exactMatch = null;
        if (currentArrival.vehicleId) {
            exactMatch = arrivals.find(arrival =>
                arrival.vehicleId === currentArrival.vehicleId &&
                arrival.timeToStation > 0
            );
            if (exactMatch) return exactMatch;
        }

        // If no exact match by vehicle ID, try to match by other properties
        // Sort potential matches by how close their timeToStation is to the current one
        const potentialMatches = arrivals.filter(arrival =>
            arrival.lineName === currentArrival.lineName &&
            (arrival.towards === currentArrival.towards ||
                arrival.destinationName === currentArrival.destinationName) &&
            arrival.platformName === currentArrival.platformName &&
            arrival.timeToStation > 0
        );

        if (potentialMatches.length === 0) return null;

        // Sort by smallest time difference to find the closest match
        potentialMatches.sort((a, b) => {
            const diffA = Math.abs(a.timeToStation - currentArrival.timeToStation);
            const diffB = Math.abs(b.timeToStation - currentArrival.timeToStation);
            return diffA - diffB;
        });

        // Return the closest match by time
        return potentialMatches[0];
    }

// Helper function to find the next arrival for the same line and destination
    function findNextArrival(arrivals, currentArrival) {
        // Sort by time to station
        const sortedArrivals = arrivals.filter(arrival =>
            arrival.lineName === currentArrival.lineName &&
            (arrival.towards === currentArrival.towards ||
                arrival.destinationName === currentArrival.destinationName) &&
            arrival.platformName === currentArrival.platformName &&
            arrival.timeToStation > 0
        ).sort((a, b) => a.timeToStation - b.timeToStation);

        // Return the first arrival with a time greater than 0
        return sortedArrivals[0];
    }


    // Sort by smallest time difference to find the closest match
    potentialMatches.sort((a, b) => {
        const diffA = Math.abs(a.timeToStation - currentArrival.timeToStation);
        const diffB = Math.abs(b.timeToStation - currentArrival.timeToStation);
        return diffA - diffB;
    });

    // Return the closest match by time
    return potentialMatches[0];
}

// Helper function to find the next arrival for the same line and destination
function findNextArrival(arrivals, currentArrival) {
    // Sort by time to station
    const sortedArrivals = arrivals.filter(arrival =>
        arrival.lineName === currentArrival.lineName &&
        (arrival.towards === currentArrival.towards ||
            arrival.destinationName === currentArrival.destinationName) &&
        arrival.platformName === currentArrival.platformName &&
        arrival.timeToStation > 0
    ).sort((a, b) => a.timeToStation - b.timeToStation);

    // Return the first arrival with a time greater than 0
    return sortedArrivals[0];
}
