

async function fetchLines(errorCallback = showErrorMessage) {
    return safeApiRequest(
        () => fetch(TFL_API_URL),
        errorCallback
    );
}

async function fetchStations(lineId, errorCallback = showErrorMessage) {
    return safeApiRequest(
        () => fetch(`https://api.tfl.gov.uk/Line/${lineId}/StopPoints`),
        errorCallback
    );
}

async function fetchArrivals(stationId, errorCallback = showErrorMessage) {
    console.log(`${TFL_STOPPOINT_API}${stationId}/arrivals`);
    return safeApiRequest(
        () => fetch(`${TFL_STOPPOINT_API}${stationId}/arrivals`),
        errorCallback
    );
}

async function fetchStationById(stationId, errorCallback = showErrorMessage) {
    return safeApiRequest(
        () => fetch(`${TFL_STOPPOINT_API}${stationId}`),
        errorCallback
    );
}

async function fetchRTTArrivals(stationCode, errorCallback = showErrorMessage) {
    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa(`${RTT_USERNAME}:${RTT_PASSWORD}`));

    return safeApiRequest(
        () => fetch(`${RTT_API_URL}/search/${stationCode}/arrivals`, {
            method: 'GET',
            headers: headers
        }),
        errorCallback
    );
}



