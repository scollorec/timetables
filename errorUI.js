// errorUI.js
function showErrorMessage(error) {
    const container = document.getElementById('error-container') || createErrorContainer();

    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';

    // Customize message based on error type
    if (error.statusCode === 404) {
        errorElement.textContent = 'The requested information could not be found.';
    } else if (error.name === 'NetworkError') {
        errorElement.textContent = 'Network connection issue. Please check your connection and try again.';
    } else {
        errorElement.textContent = 'An error occurred. Please try again later.';
    }

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'error-close';
    closeButton.addEventListener('click', () => {
        container.removeChild(errorElement);
    });

    errorElement.appendChild(closeButton);
    container.appendChild(errorElement);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (container.contains(errorElement)) {
            container.removeChild(errorElement);
        }
    }, 8000);
}

function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.className = 'error-container';
    document.body.appendChild(container);
    return container;
}
