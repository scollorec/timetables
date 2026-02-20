// Main application state and initialization
let currentLine = null;

function init() {
    fetchLines().then(lines => {
        displayLines(lines);
        initFooterFilters(lines);
    });
}


// Event listeners and initialization
window.addEventListener('DOMContentLoaded', init);
