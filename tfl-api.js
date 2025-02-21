const STATION_ID = '940GZZLUALD'; // Replace with the correct station ID
const API_KEY = 'dadca3c3602d43d7abf660100d656c43'; // Replace with your actual API key

function createFilterCheckboxes(data) {

// const lineNames = [...new Set(data.map(item => item.lineName))];
// const destinations = [...new Set(data.map(item => item.destinationName))];
  
  // const filterContainer = document.createElement('div');
  // filterContainer.className = 'filter-container';
  
  // createFilterGroup(filterContainer, 'Line Names', lineNames);
  // createFilterGroup(filterContainer, 'Destinations', destinations);
  
  // document.body.insertBefore(filterContainer, document.getElementById('timetable-container'));

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
    
    const backgroundColor = getColorForDestination(arrival.destinationName);
    tile.style.backgroundColor = backgroundColor;
    tile.style.color = 'white';  // Use white text for all tiles

    const arrivalTime = new Date(arrival.expectedArrival);
    const minutesToArrival = Math.round((arrivalTime - new Date()) / 60000);

    tile.innerHTML = `

        <div class="option-details">
            <div class="option-title">${arrival.lineName} to ${cleanTitle(arrival.destinationName)}</div>
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

          container.appendChild(data);
            
            //filterTiles();
        })
        .catch(error => console.error('Error fetching arrivals:', error));
}

async function updatePageTitle() {
    const url = `https://api.tfl.gov.uk/StopPoint/${STATION_ID}?app_key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.commonName) {
            document.title = `${data.commonName} Station Timetable`;
            
            // Update the header content
            const logoElement = document.querySelector('.logo');
            logoElement.innerHTML = `${data.commonName}`;
        }
    } catch (error) {
        console.error('Error fetching station name:', error);
    }
}

const destinationColors = [
    'hsl(240, 2%, 96%)'
];

function getColorForDestination(destination) {
    const index = destination.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + acc;
    }, 0) % destinationColors.length;
    
    return destinationColors[index];
}

// List of words to remove from the title
const wordsToRemove = ['Station', 'Underground', 'Underground', 'Underground'];

// Function to clean the title by removing unwanted words
function cleanTitle(title) {
    const regex = new RegExp(`\\b(${wordsToRemove.join('|')})\\b`, 'gi'); // Create a regex pattern for all words in the list
    return title.replace(regex, '').replace(/\s+/g, ' ').trim(); // Remove extra spaces and trim
}

// Initial update
updateTiles();

document.addEventListener('DOMContentLoaded', updatePageTitle);

// Update tiles every 30 seconds
setInterval(updateTiles, 10000);
