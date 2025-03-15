// lines.js - Line Display Functions

// Global variable to store current line
//let currentLine;

// Function to display and filter lines
function displayLines(lines) {
    const container = document.getElementById('timetable-container');
    container.innerHTML = '';

    // Get favorites
    const favorites = getFavorites();

    // Display favorites section
    displayFavorites(container, favorites);

    // Create header for lines
    const linesHeader = document.createElement('div');
    linesHeader.className = 'section-header';
    linesHeader.textContent = 'Lines';
    linesHeader.id = 'lines-header';
    container.appendChild(linesHeader);

    // Create a container for line tiles
    const linesContainer = document.createElement('div');
    linesContainer.id = 'lines-container';
    container.appendChild(linesContainer);

    // Create footer with filters
    createFooterFilters(lines);

    // Filter and display lines based on active filters
    filterLines(lines);
}

function addLine(line) {
    const tile = document.createElement('div');
    tile.className = 'option-card airport-style';

    // Create the status indicator (colored dot)
    const indicator = document.createElement('div');
    indicator.className = 'status-indicator';

    // Create the main content container
    const content = document.createElement('div');
    content.className = 'line-content';

    // Create the line name/title
    const title = document.createElement('h2');
    title.className = 'line-title';
    title.textContent = line.name;

    // Create the right-side controls container
    const controls = document.createElement('div');
    controls.className = 'controls-container';

    // Check if there are disruptions
    const hasDisruption = line.disruptions && line.disruptions.length > 0;

    // Add status icon based on disruption status
    const statusIcon = document.createElement('span');
    statusIcon.className = 'status-icon';
    if (hasDisruption) {
        statusIcon.innerHTML = '⚠️'; // Warning triangle
        statusIcon.classList.add('warning');
    } else {
        statusIcon.innerHTML = '✓'; // Green check
        statusIcon.classList.add('check');
    }

    // Create the options menu button
    const options = document.createElement('button');
    options.className = 'options-button';
    options.textContent = '•••';

    // Add status icon and options button to controls
    controls.appendChild(statusIcon);
    controls.appendChild(options);

    // Determine line color for styling
    const lineColor = getLineColor(line);

    // Append elements to build the card
    content.appendChild(title);
    tile.appendChild(indicator);
    tile.appendChild(content);
    tile.appendChild(controls);

    // Apply styling based on line type
    const isOverground = isOvergroundLine(line);

    // Always set the indicator color regardless of line type
    indicator.style.backgroundColor = lineColor;

    // Add the overground class if needed
    if (isOverground) {
        tile.classList.add('overground-line');
        // Set the border color for overground lines
        tile.style.setProperty('--line-color', lineColor);
    }

    // Add click event listener directly here
    tile.addEventListener('click', () => selectLine(line));

    return tile;
}

function createFooterFilters(lines) {
    // Remove any existing footer
    const existingFooter = document.querySelector('.app-footer');
    if (existingFooter) {
        existingFooter.remove();
    }

    // Create footer element
    const footer = document.createElement('footer');
    footer.className = 'app-footer';

    // Get saved filter preferences from localStorage
    const activeFilters = getActiveFilters();

    // Create filter items for tube and overground only
    const modes = [
        { id: 'tube', name: 'Tube', icon: '⭕' },
        { id: 'overground', name: 'Overground', icon: '🔶' }
    ];

    modes.forEach(mode => {
        const footerItem = document.createElement('div');
        footerItem.className = 'footer-item';
        footerItem.dataset.mode = mode.id;

        // Set active state based on saved preferences
        if (activeFilters.includes(mode.id)) {
            footerItem.classList.add('active');
        }

        // Create icon
        const icon = document.createElement('i');
        icon.className = 'footer-icon';
        icon.textContent = mode.icon;

        // Create label
        const label = document.createElement('span');
        label.textContent = mode.name;

        // Add elements to footer item
        footerItem.appendChild(icon);
        footerItem.appendChild(label);

        // Add click event
        footerItem.addEventListener('click', function() {
            // Toggle active class on all items
            document.querySelectorAll('.footer-item').forEach(item => {
                item.classList.remove('active');
            });

            this.classList.add('active');

            // Update active filters
            const newFilters = [this.dataset.mode];
            saveActiveFilters(newFilters);

            // Update display
            filterLines(lines);
        });

        footer.appendChild(footerItem);
    });

    // Add footer to document
    document.body.appendChild(footer);
}

function displayFavorites(container, favorites) {
    // Create a section for favorite stations if there are any
    if (favorites.length > 0) {
        const favoritesHeader = document.createElement('div');
        favoritesHeader.className = 'section-header';
        favoritesHeader.textContent = 'Favorite Stations';
        container.appendChild(favoritesHeader);

        // Create list for favorites
        const favoritesList = document.createElement('div');
        favoritesList.className = 'favorites-list';

        // Fetch and display favorite stations
        favorites.forEach(stationId => {
            // Fetch station details
            fetchStationById(stationId)
                .then(station => {
                    //const stationTile = createStationTile(station, favoritesList, favoritesHeader);
                    const stationTile = createStationTileMain(station, favoritesList, favoritesHeader, 1);
                    favoritesList.appendChild(stationTile);
                })
                .catch(error => {
                    console.error('Error fetching favorite station:', error);
                });
        });

        container.appendChild(favoritesList);
    }
}

function filterLines(allLines) {
    const activeFilters = getActiveFilters();
    const linesContainer = document.getElementById('lines-container');

    // Clear existing line cards
    linesContainer.innerHTML = '';

    // If no filters are active, show all lines
    if (activeFilters.length === 0) {
        displayFilteredLines(allLines);
        return;
    }

    // Filter lines based on active filters
    const filteredLines = allLines.filter(line => {
        // Check if line matches any active filter
        return activeFilters.some(filter => {
            if (filter === 'overground') {
                return isOvergroundLine(line);
            } else if (filter === 'tube') {
                // Consider DLR and Elizabeth lines as tube lines
                return line.modeName && line.modeName.toLowerCase() === 'tube' ||
                    line.id.toLowerCase().includes('tube') ||
                    line.id.toLowerCase().includes('dlr') ||
                    line.id.toLowerCase().includes('elizabeth') ||
                    line.name.toLowerCase().includes('elizabeth');
            } else if (filter === 'train' || filter === 'national-rail') {
                return line.modeName && line.modeName.toLowerCase().includes('national-rail') ||
                    line.id.toLowerCase().includes('national-rail');
            } else {
                return line.modeName && line.modeName.toLowerCase() === filter ||
                    line.id.toLowerCase().includes(filter);
            }
        });
    });

    displayFilteredLines(filteredLines);
}



function displayFilteredLines(filteredLines) {
    const linesContainer = document.getElementById('lines-container');

    // Display filtered lines
    filteredLines.forEach(line => {
        const tile = addLine(line);
        linesContainer.appendChild(tile);
    });
}

function getActiveFilters() {
    const storedFilters = localStorage.getItem('active-filters');
    return storedFilters ? JSON.parse(storedFilters) : ['tube']; // Default to tube
}

function saveActiveFilters(filters) {
    localStorage.setItem('active-filters', JSON.stringify(filters));
}

// Function to handle line selection and fetch stations
function selectLine(line) {
    console.log('Selected line:', line.id);
    currentLine = line;

    fetchStations(line.id).then(stations => {
        displayStations(stations, line);
    });
}

function initFooterFilters(lines) {
    // Remove any existing footer
    const existingFooter = document.querySelector('.app-footer');
    if (existingFooter) {
        existingFooter.remove();
    }

    // Create footer element
    const footer = document.createElement('footer');
    footer.className = 'app-footer';

    // Get saved filter preferences from localStorage
    const activeFilters = getActiveFilters();

    // Create footer items with Font Awesome icons
    const footerItems = [
        { id: 'home', icon: 'fa-solid fa-house', name: '', active: false  },
        { id: 'tube', icon: 'fa-solid fa-train-subway', name: '', active: activeFilters.includes('tube') },
        { id: 'overground', icon: 'fa-solid fa-train-tram', name: '', active: activeFilters.includes('overground') },
        { id: 'train', icon: 'fa-solid fa-train', name: '', active: activeFilters.includes('train') },
        { id: 'bus', icon: 'fa-solid fa-bus', name: '', active: activeFilters.includes('bus') },
        { id: 'favorites', icon: 'fa-solid fa-star', name: '', active: false },
        { id: 'skull', icon: 'fa-solid fa-skull', name: '', active: false }
    ];

    footerItems.forEach(item => {
        const footerItem = document.createElement('div');
        footerItem.className = 'footer-item';
        if (item.active) footerItem.classList.add('active');
        footerItem.dataset.mode = item.id;

        // Create icon using Font Awesome
        const icon = document.createElement('i');
        icon.className = item.icon;

        // Add elements to footer item
        footerItem.appendChild(icon);

        // Add click event
        footerItem.addEventListener('click', function() {
            // Handle click events for each tab
            console.log(`Clicked on ${item.id}`);
            //showErrorMessage(`Clicked on ${item.id}`);

            if (item.id === 'tube' || item.id === 'overground' || item.id === 'train') {
                // Toggle active state for filter items
                this.classList.toggle('active');

                // Update active filters
                const activeFilters = getActiveFilters();
                if (this.classList.contains('active')) {
                    // Add to active filters if not already there
                    if (!activeFilters.includes(item.id)) {
                        activeFilters.push(item.id);
                    }
                } else {
                    // Remove from active filters
                    const index = activeFilters.indexOf(item.id);
                    if (index !== -1) {
                        activeFilters.splice(index, 1);
                    }
                }

                // Save updated filters
                saveActiveFilters(activeFilters);

                // Update display
                filterLines(lines);
            } else if (item.id === 'favorites') {
                // Toggle favorites view
                const favoritesList = document.querySelector('.favorites-list');
                const favoritesHeader = document.querySelector('.section-header:first-child');

                if (favoritesList) {
                    // Toggle visibility of existing favorites section
                    const isVisible = favoritesList.style.display !== 'none';
                    if (isVisible) {
                        favoritesList.style.display = 'none';
                        favoritesHeader.style.display = 'none';
                        this.classList.remove('active');
                    } else {
                        favoritesList.style.display = 'block';
                        favoritesHeader.style.display = 'block';
                        this.classList.add('active');
                    }
                } else {
                    // If favorites section doesn't exist but there are favorites, display them
                    const favorites = getFavorites();
                    if (favorites.length > 0) {
                        displayFavorites(document.getElementById('timetable-container'), favorites);
                        this.classList.add('active');
                    }
                }
            } else if (item.id === 'skull') {
                // Handle skull button action
                console.log('Skull button clicked');
            }
        });

        footer.appendChild(footerItem);
    });

    // Add footer to document
    document.body.appendChild(footer);
}




