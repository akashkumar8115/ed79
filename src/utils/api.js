// productio
import { ENDPOINTS } from "./constants";
import { checkScreenExistence } from "./screenService";

/**
 * Log request details
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Object} data - Request data
 */
const logRequest = (method, url, data) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log("Request:", method.toUpperCase(), url, data);
  }
};

/**
 * Log response details
 * @param {number} status - HTTP status code
 * @param {Object} data - Response data
 */
const logResponse = (status, data) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log("Response:", status, data);
  }
};

/**
 * Handle fetch errors
 * @param {Error} error - The error object
 * @param {string} message - Custom error message
 * @throws {Error} - Rethrows the error
 */
const handleFetchError = (error, message) => {
  console.error(message, error);
  throw error;
};

/**
 * Generic fetch function with logging
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Response data
 */
const fetchWithLogs = async (endpoint, options = {}) => {
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${ENDPOINTS.BASE_URL}${endpoint}`;
  const method = options.method || "GET";
  const body = options.body || null;

  // Log the request
  logRequest(method, fullUrl, body);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body,
    });

    const data = await response.json();

    // Log the response
    logResponse(response.status, data);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return data;
  } catch (error) {
    handleFetchError(error, "Fetch error:");
  }
};

/**
 * Get all items in a playlist
 * @param {string} playlistId - Playlist ID
 * @returns {Promise<Object>} - Response data
 */
export const getAllItemInPlaylist = async (playlistId) => {
  if (!playlistId) {
    throw new Error("Playlist ID is required");
  }

  return fetchWithLogs(ENDPOINTS.GET_PLAYLIST_ITEMS, {
    method: "POST",
    body: JSON.stringify({ playlistId }),
  });
};

/**
 * Get playlist items for a specific ID
 * @param {string} id - The ID to fetch items for
 * @returns {Promise<Object>} - Response data
 */
export const getPlaylistItemsForId = async (id) => {
  if (!id) {
    throw new Error("ID is required");
  }

  try {
    return await fetchWithLogs(`${ENDPOINTS.GET_PLAYLIST_ITEMS_FOR_ID}/${id}`, {
      method: "GET",
    });
  } catch (err) {
    handleFetchError(err, "Error fetching playlist items for ID:");
  }
};

/**
 * Fetch content for a screen
 * @param {string} screenCode - Screen code
 * @returns {Promise<Object>} - Response data
 */
export const fetchContents = async (screenCode) => {
  if (!screenCode) {
    throw new Error("Screen code is required");
  }

  try {
    // Check screen existence
    const screenData = await checkScreenExistence(screenCode);
    console.log("Screen data:", screenData);
   
    return screenData;
  } catch (err) {
    handleFetchError(err, "Fetching content failed:");
  }
};

export default fetchWithLogs;
