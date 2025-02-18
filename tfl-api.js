const STATION_ID = '940GZZLUCRI'; // Replace with the correct station ID
const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key

function createFilterCheckboxes(data) {
  const lineNames = [...new Set(data.map(item => item.lineName))];
  const destinations = [...new Set(data.map(item => item.destinationName))];
  
  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter-container';
  
  createFilterGroup(filterContainer, 'Line Names', lineNames);
  createFilterGroup(filterContainer, 'Destinations', destinations);
  
  document.body.insertBefore(filterContainer, document.getElementById('timetable-container'));
}

function createFilterGroup(container, title, items) {
  const group = document.createElement('div');
  group.className = 'filter-group';
  
  const titleElement = document.createElement('div');
  titleElement.className = 'filter-title';
  titleElement.textContent = title;
  titleElement.addEventListener('click', () => {
    optionsContainer.style.display = optionsContainer.style.display === 'none' ? 'grid' : 'none';
  });
  
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'filter-options';
  
  items.forEach(item => {
    const option = document.createElement('div');
    option.className = 'filter-option';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${title}-${item}`;
    checkbox.value = item;
    checkbox.checked = true;
    checkbox.addEventListener('change', filterTiles);
    
    const label = document.createElement('label');
    label.htmlFor = `${title}-${item}`;
    label.textContent = item;
    
    option.appendChild(checkbox);
    option.appendChild(label);
    optionsContainer.appendChild(option);
  });
  
  group.appendChild(titleElement);
  group.appendChild(optionsContainer);
  container.appendChild(group);
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

function filterTiles() {
    const selectedLines = Array.from(document.querySelectorAll('.filter-options input[id^="Line Names-"]:checked')).map(cb => cb.value);
    const selectedDestinations = Array.from(document.querySelectorAll('.filter-options input[id^="Destinations-"]:checked')).map(cb => cb.value);
    
    console.log('Selected Lines:', selectedLines);
    console.log('Selected Destinations:', selectedDestinations);
    
    const tiles = document.querySelectorAll('.option-card');
    
    tiles.forEach(tile => {
        const [lineName, destination] = tile.querySelector('.option-title').textContent.split(' to ');
        
        const lineMatch = selectedLines.includes(lineName);
        const destinationMatch = selectedDestinations.includes(destination);
        
        console.log(`Tile: ${lineName} to ${destination}, Line Match: ${lineMatch}, Destination Match: ${destinationMatch}`);
        
        tile.style.display = (lineMatch && destinationMatch) ? 'flex' : 'none';
    });
}


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

// Initial update
updateTiles();

// Update tiles every 30 seconds
setInterval(updateTiles, 60000);
