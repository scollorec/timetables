// Replace these with your actual TfL API credentials
//const APP_ID = 'YOUR_APP_ID';
const API_KEY = 'dadca3c3602d43d7abf660100d656c43';

// Cricklewood station NAPTAN code
const STATION_ID = '940GZZLUWIG';
//const STATION_ID = '490001075Q';


function updateTiles() {
    fetch(`https://api.tfl.gov.uk/StopPoint/${STATION_ID}/Arrivals?app_key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('timetable-container');
            
            // Create new tile elements
            const newTiles = data.map(arrival => createTileElement(arrival));
            
            // Add new tiles to the top of the container
            newTiles.forEach(tile => container.insertBefore(tile, container.firstChild));
        })
        .catch(error => console.error('Error fetching arrivals:', error));
}


function createTileElement(arrival) {
    const tile = document.createElement('div');
    tile.className = 'option-card';
    
    const arrivalTime = new Date(arrival.expectedArrival);
    const minutesToArrival = Math.round((arrivalTime - new Date()) / 60000);

    tile.innerHTML = `
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
    
    return tile;
}


document.addEventListener('DOMContentLoaded', updatePageTitle);
