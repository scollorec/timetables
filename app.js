// Main application state and initialization
let currentLine = null;

// Initialize dark mode toggle functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Check for saved theme preference or respect OS setting
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️'; // Sun icon when in dark mode
    }
    
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Save the current theme to localStorage
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            darkModeToggle.textContent = '☀️'; // Sun icon when in dark mode
        } else {
            localStorage.setItem('theme', 'light');
            darkModeToggle.textContent = '🌙'; // Moon icon when in light mode
        }
    });
}

// Register service worker for offline support
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}

function init() {
    fetchLines().then(lines => {
        displayLines(lines);
        initFooterFilters(lines);
    });
    
    // Initialize dark mode functionality after DOM is loaded
    initDarkMode();
    
    // Register service worker for offline support
    registerServiceWorker();
}


// Event listeners and initialization
window.addEventListener('DOMContentLoaded', init);
