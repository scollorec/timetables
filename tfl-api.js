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
            if (!document.querySelector('.filter-container')) {
                createFilterCheckboxes(data);
            }
            
            // Sort the data by expected arrival time
            data.sort((a, b) => new Date(a.expectedArrival) - new Date(b.expectedArrival));
            
            const container = document.getElementById('timetable-container');
            
            // Clear existing tiles
            container.innerHTML = '';
            
            // Create and add new tiles in sorted order
            data.forEach(arrival => {
                const tile = createTileElement(arrival);
                container.appendChild(tile);
            });
            
            filterTiles();
        })
        .catch(error => console.error('Error fetching arrivals:', error));
}


function filterTiles() {
    const selectedLines = Array.from(document.querySelectorAll('.line-filter input:checked')).map(cb => cb.value);
    const selectedDestinations = Array.from(document.querySelectorAll('.destination-filter input:checked')).map(cb => cb.value);
    
    const tiles = document.querySelectorAll('.option-card');
    
    tiles.forEach(tile => {
        const lineName = tile.querySelector('.option-title').textContent.split(' to ')[0];
        const destination = tile.querySelector('.option-title').textContent.split(' to ')[1];
        
        const lineMatch = selectedLines.includes(lineName);
        const destinationMatch = selectedDestinations.includes(destination);
        
        tile.style.display = (lineMatch && destinationMatch) ? 'flex' : 'none';
    });
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

function createFilterCheckboxes(data) {
    const lineNames = [...new Set(data.map(item => item.lineName))];
    const destinations = [...new Set(data.map(item => item.destinationName))];
    
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    
    // Create line name checkboxes
    const lineNameContainer = createCheckboxGroup(lineNames, 'line');
    lineNameContainer.querySelector('h3').textContent = 'Line Names';
    filterContainer.appendChild(lineNameContainer);
    
    // Create destination checkboxes
    const destinationContainer = createCheckboxGroup(destinations, 'destination');
    destinationContainer.querySelector('h3').textContent = 'Destinations';
    filterContainer.appendChild(destinationContainer);
    
    document.body.insertBefore(filterContainer, document.getElementById('timetable-container'));
}

function createCheckboxGroup(items, type) {
    const container = document.createElement('div');
    container.className = `${type}-filter`;
    const title = document.createElement('h3');
    container.appendChild(title);
    
    items.forEach(item => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${type}-${item}`;
        checkbox.value = item;
        checkbox.checked = true;
        checkbox.addEventListener('change', filterTiles);
        
        const label = document.createElement('label');
        label.htmlFor = `${type}-${item}`;
        label.textContent = item;
        
        container.appendChild(checkbox);
        container.appendChild(label);
    });
    
    return container;
}


async function updatePageTitle() {
    const url = `https://api.tfl.gov.uk/StopPoint/${STATION_ID}?app_key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.commonName) {
            document.title = `${data.commonName} Station Timetable`;
            document.querySelector('.logo').textContent = data.commonName;
        }
    } catch (error) {
        console.error('Error fetching station name:', error);
    }
}

// Update tiles every 30 seconds
setInterval(updateTiles, 20000);

// Initial update
updateTiles();


document.addEventListener('DOMContentLoaded', updatePageTitle);
