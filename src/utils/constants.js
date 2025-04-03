// API configuration
export const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
export const CUSTOMER_ID = process.env.REACT_APP_CUSTOMER_ID || "e6c2b37c72024610b08a4a7dac307693";

// Polling intervals (in milliseconds)
export const UPDATE_CHECK_INTERVAL = 300000; // 5 minutes
export const CONTENT_POLLING_INTERVAL = 30000; // 30 seconds
export const NETWORK_CHECK_INTERVAL = 10000; // 10 seconds

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
  DEVICE_REGISTERED: "deviceRegistered"

};

// Default values
export const DEFAULTS = {
  // SCREEN_CODE: "iYkWH8",
  MEDIA_DURATION: 5000, // 5 seconds
  MAX_POLLING_ATTEMPTS: 30
};
