// Functions for managing favorites and filters

function getFavorites() {
    const storedFavorites = localStorage.getItem('favorite-stations');
    return storedFavorites ? JSON.parse(storedFavorites) : [];
}

function isStationFavorite(stationId) {
    const favorites = getFavorites();
    return favorites.includes(stationId);
}

function toggleFavorite(stationId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(stationId);

    if (index === -1) {
        favorites.push(stationId);
    } else {
        favorites.splice(index, 1);
    }

    localStorage.setItem('favorite-stations', JSON.stringify(favorites));
}

function getActiveFilters() {
    const storedFilters = localStorage.getItem('active-filters');
    return storedFilters ? JSON.parse(storedFilters) : ['tube', 'overground', 'train', 'favorites'];
}

function saveActiveFilters(filters) {
    localStorage.setItem('active-filters', JSON.stringify(filters));
}
