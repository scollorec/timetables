// Replace these with your actual TfL API credentials
//const APP_ID = 'YOUR_APP_ID';
const API_KEY = 'dadca3c3602d43d7abf660100d656c43';

// Cricklewood station NAPTAN code
//const STATION_ID = '940GZZLUCRI';
const STATION_ID = '62586110';


async function fetchTimetableData() {
    const url = `https://cors-anywhere.herokuapp.com/https://api.tfl.gov.uk/StopPoint/${STATION_ID}/Arrivals?app_key=${API_KEY}`;
    console.log('Debug: API URL:', url);

    try {
        const response = await fetch(url);
        console.log('Debug: Response status:', response.status);
        console.log('Debug: Response headers:', response.headers);

        const data = await response.json();
        console.log('Debug: Response data:', JSON.stringify(data, null, 2));

        if (data.length === 0) {
            console.log('Debug: No arrivals data available');
        }

        return data;
    } catch (error) {
        console.error('Debug: Error fetching data:', error);
        return [];
    }
}


function createTimetableCard(arrival) {
    const card = document.createElement('div');
    card.className = 'option-card';
    
    const arrivalTime = new Date(arrival.expectedArrival);
    const minutesToArrival = Math.round((arrivalTime - new Date()) / 60000);

    card.innerHTML = `
        <div class="option-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 15.5C4 17.985 6.015 20 8.5 20L6 22.5V23H18V22.5L15.5 20C17.985 20 20 17.985 20 15.5V5C20 2.515 17.985 1 15.5 1H8.5C6.015 1 4 2.515 4 5V15.5ZM6 15.5V5C6 3.62 7.12 2.5 8.5 2.5H15.5C16.88 2.5 18 3.62 18 5V15.5C18 16.88 16.88 18 15.5 18H8.5C7.12 18 6 16.88 6 15.5ZM8 14.5H16V6.5H8V14.5Z" fill="black"/>
            </svg>
        </div>
        <div class="option-details">
            <div class="option-title">${arrival.lineName} to ${arrival.destinationName}</div>
            <div class="option-subtitle">Arriving in ${minutesToArrival} minutes</div>
            <div class="option-divider"></div>
            <div class="option-subtitle">Platform: ${arrival.platformName || 'N/A'}</div>
            <div class="option-subtitle">Status: ${arrival.currentLocation}</div>
        </div>
    `;
    
    return card;
}

async function updateTimetable() {
    const container = document.getElementById('timetable-container');
    container.innerHTML = '<p>Loading...</p>';

    const timetableData = await fetchTimetableData();
    
    if (timetableData.length === 0) {
        container.innerHTML = '<p>No arrivals data available.</p>';
        return;
    }

    container.innerHTML = '';
    timetableData
        .sort((a, b) => new Date(a.expectedArrival) - new Date(b.expectedArrival))
        .slice(0, 5)  // Display only the next 5 arrivals
        .forEach(arrival => {
            const card = createTimetableCard(arrival);
            container.appendChild(card);
        });
}

// Update the timetable every 30 seconds
setInterval(updateTimetable, 300000);

// Initial update
updateTimetable();
