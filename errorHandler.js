// errorHandler.js
class AppError extends Error {
    constructor(message, statusCode, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error types
class NetworkError extends AppError {
    constructor(message, details = {}) {
        super(message, 503, details);
        this.name = 'NetworkError';
    }
}

class APIError extends AppError {
    constructor(message, statusCode = 500, details = {}) {
        super(message, statusCode, details);
        this.name = 'APIError';
    }
}

// Centralized error handler
function handleError(error, userFeedbackCallback) {
    console.error(`${error.name}: ${error.message}`, error.details || '');

    // Provide user feedback
    if (userFeedbackCallback && typeof userFeedbackCallback === 'function') {
        userFeedbackCallback(error);
    }

    // Optional: log to monitoring service
    // logErrorToService(error);
}

// API request wrapper with error handling
async function safeApiRequest(requestFn, errorCallback) {
    try {
        const response = await requestFn();

        if (!response.ok) {
            throw new APIError(
                `Request failed with status ${response.status}`,
                response.status,
                { url: response.url }
            );
        }

        return await response.json();
    } catch (error) {
        if (error instanceof AppError) {
            handleError(error, errorCallback);
        } else {
            // Convert generic errors to AppError
            const appError = new AppError(
                error.message || 'An unexpected error occurred',
                500
            );
            handleError(appError, errorCallback);
        }
        return null;
    }
}


