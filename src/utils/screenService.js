// producctio
import { ENDPOINTS, STORAGE_KEYS,DEFAULTS  } from './constants';

/**
 * Check if a screen exists with the given screen code
 * @param {string} screenCode - The screen code to check
 * @returns {Promise<Object>} - Response data
 */
export let notScreenExist = false;
export const checkScreenExistence = async (screenCode) => {
  try {
    // Validate input
    if (!screenCode || typeof screenCode !== 'string') {
      throw new Error('Invalid screenCode: must be a non-empty string');
    }

    const response = await fetch(ENDPOINTS.SCREEN_EXISTENCE, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ screen_code: screenCode }),
    });

    // Handle different response statuses
    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.detail || JSON.stringify(errorData)}`;
      } catch {
        errorMessage += ` - ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Screen check response:", data.message);

    // If screen is not registered, clear local storage
    if (data.message === "Please Add This Screen") {
      notScreenExist = true;
      // Clear item data from localStorage when screen is not registered
      localStorage.removeItem(STORAGE_KEYS.ITEMS_DATA);

      // Set a flag in localStorage to prevent multiple API calls
      const lastCheckTime = Date.now();
      localStorage.setItem('lastScreenCheckTime', lastCheckTime);
      localStorage.setItem('screenRegistrationStatus', 'not_registered');
    } else {
      notScreenExist = false;
      localStorage.setItem('screenRegistrationStatus', 'registered');
    }

    return data;
  } catch (error) {
    console.error('Error checking screen existence:', error.message);
    throw error;
  }
};

/**
 * Poll for screen content updates
 * @param {string} screenCode - The screen code to check
 * @param {Function} onSuccess - Callback for successful responses
 * @param {Function} onError - Callback for errors
 * @param {number} interval - Polling interval in milliseconds
 * @returns {Object} - Control object with stop method
 */
export const pollScreenContent = (screenCode, onSuccess, onError, interval = 30000) => {
  let isPolling = true;
  let timeoutId = null;

  const checkContent = async () => {
    if (!isPolling) return;

    // Check if we've recently determined the screen is not registered
    const screenRegistrationStatus = localStorage.getItem('screenRegistrationStatus');
    const lastCheckTime = parseInt(localStorage.getItem('lastScreenCheckTime') || '0', 10);
    const now = Date.now();

    // If screen is not registered and we checked recently (within 30 seconds), skip the API call
    if (screenRegistrationStatus === 'not_registered' && (now - lastCheckTime < 30000)) {
      console.log("Screen recently found to be not registered, skipping API call");
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess({ message: "Please Add This Screen" });
      }

      // Still set up the next poll, but with a longer interval
      if (isPolling) {
        timeoutId = setTimeout(checkContent, interval * DEFAULTS.UNREGISTERED_POLL_MULTIPLIER);
      }
      return;
    }

    try {
      const data = await checkScreenExistence(screenCode);
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(data);
      }
    } catch (error) {
      if (onError && typeof onError === 'function') {
        onError(error);
      }
    } finally {
      if (isPolling) {
        // Use a longer interval if screen is not registered
        const pollingInterval = notScreenExist ?
          interval * DEFAULTS.UNREGISTERED_POLL_MULTIPLIER : interval;
        timeoutId = setTimeout(checkContent, pollingInterval);
      }
    }
  };

  // Start polling immediately
  checkContent();

  // Return control object
  return {
    stop: () => {
      isPolling = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };
};

/**
 * Process media content from API response
 * @param {Object} response - The API response
 * @returns {Object} - Processed content information
 */
export const processScreenResponse = (response) => {
  // Handle empty response (no changes needed)
  if (!response || Object.keys(response).length === 0) {
    return { status: 'unchanged', message: 'No changes needed' };
  }

  // Handle different message types
  if (response.message === "Please Add This Screen") {
    // Clear item data from localStorage when screen is not registered
    localStorage.removeItem(STORAGE_KEYS.ITEMS_DATA);

    return {
      status: 'not_registered',
      message: 'Screen not registered. Please add this screen in the admin panel.'
    };
  }

  if (response.message === "Please Add Playlist") {
    return {
      status: 'no_playlist',
      message: 'No playlist assigned to this screen.'
    };
  }

  if (response.message === "Please Add Content To Playlist") {
    return {
      status: 'no_content',
      message: 'No content in the assigned playlist.'
    };
  }

  // If we have data, return the media items
  if (response.message === "Data found successfully" && response.data && Array.isArray(response.data)) {
    return {
      status: 'content_available',
      message: 'Content available for display',
      mediaItems: response.data
    };
  }

  // Default case for unexpected responses
  return {
    status: 'unknown',
    message: response.message || 'Unknown response from server'
  };
};
