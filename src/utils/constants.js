// API configuration
export const BASE_URL = "https://digital-signage-be-production.up.railway.app";
export const CUSTOMER_ID = "e6c2b37c72024610b08a4a7dac307693";

// Polling intervals (in milliseconds)
export const UPDATE_CHECK_INTERVAL = 300000; // 5 minutes
export const CONTENT_POLLING_INTERVAL = 30000; // 30 seconds
export const NETWORK_CHECK_INTERVAL = 10000; // 10 seconds
export const CONTENT_UPDATE_INTERVAL = 10000; // 10 seconds

// API endpoints
export const ENDPOINTS = {
  SCREEN_EXISTENCE: `${BASE_URL}/v1/screens/existScreenWithScreenCode`,
  GET_PLAYLIST_ITEMS: `${BASE_URL}/getAllItemsInPlaylist`,
  GET_PLAYLIST_ITEMS_FOR_ID: `${BASE_URL}/getPlaylistItemsForId`,
  DOWNLOAD_FROM_PATH: `${BASE_URL}/android/media/download/${CUSTOMER_ID}`
};

// Local storage keys
export const STORAGE_KEYS = {
  UNIQUE_ID: "uniqueId",
  ITEMS_DATA: "itemsData",
  SCREEN_CODE: "screenCode",
  DEVICE_REGISTERED: "deviceRegistered",
  SCREEN_REGISTRATION_STATUS: "screenRegistrationStatus",
  LAST_SCREEN_CHECK_TIME: "lastScreenCheckTime"
};

// Default values
export const DEFAULTS = {
  // MEDIA_DURATION: 50000, // 5 seconds
  MAX_POLLING_ATTEMPTS: 30,
  UNREGISTERED_POLL_MULTIPLIER: 3 // Poll 3x less frequently for unregistered screens
};
