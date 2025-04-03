/**
 * Local storage utility functions
 */
import { STORAGE_KEYS } from './constants';

/**
 * Set items with ID in local storage
 * @param {Array} items - The items to store
 * @param {string} uniqueId - The unique identifier
 * @returns {boolean} - Success status
 */
export const setIdItemsInLocalStorage = (items, uniqueId) => {
  try {
    if (!items || !Array.isArray(items)) {
      console.warn('Invalid items data provided to storage');
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.ITEMS_DATA, JSON.stringify(items));

    if (uniqueId) {
      localStorage.setItem(STORAGE_KEYS.UNIQUE_ID, uniqueId);
    }

    return true;
  } catch (error) {
    console.error('Error saving items to localStorage:', error);
    return false;
  }
};

/**
 * Get items data from local storage
 * @returns {Object|null} - The stored items data or null if not found
 */
export const getIdItemsDataFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving items from localStorage:', error);
    return null;
  }
};

/**
 * Get unique ID from local storage
 * @returns {string|null} - The stored unique ID or null if not found
 */
export const getUniqueIdFromLocalStorage = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.UNIQUE_ID);
  } catch (error) {
    console.error('Error retrieving unique ID from localStorage:', error);
    return null;
  }
};

// In utils/storage.js

export const saveScreenCodeToLocalStorage = (screenCode) => {
  try {
    if (!screenCode) return false;
    localStorage.setItem("screenCode", screenCode);
    return true;
  } catch (error) {
    console.error('Error saving screen code to localStorage:', error);
    return false;
  }
};

export const getScreenCodeFromLocalStorage = () => {
  try {
    return localStorage.getItem("screenCode");
  } catch (error) {
    console.error('Error retrieving screen code from localStorage:', error);
    return null;
  }
};

/**
 * Save screen code to local storage
 * @param {string} screenCode - The screen code to store
 * @returns {boolean} - Success status
 */
// export const saveScreenCodeToLocalStorage = (screenCode) => {
//   try {
//     if (!screenCode) return false;
//     localStorage.setItem(STORAGE_KEYS.SCREEN_CODE, screenCode);
//     return true;
//   } catch (error) {
//     console.error('Error saving screen code to localStorage:', error);
//     return false;
//   }
// };

// /**
//  * Get screen code from local storage
//  * @returns {string|null} - The stored screen code or null if not found
//  */
// export const getScreenCodeFromLocalStorage = () => {
//   try {
//     return localStorage.getItem(STORAGE_KEYS.SCREEN_CODE);
//   } catch (error) {
//     console.error('Error retrieving screen code from localStorage:', error);
//     return null;
//   }
// };


export const isDeviceRegistered = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.DEVICE_REGISTERED) === 'true';
  } catch (error) {
    console.error('Error checking device registration:', error);
    return false;
  }
};

/**
 * Clear all items from local storage
 * @returns {boolean} - Success status
 */
export const clearLocalStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};


// uniqueId

// itemsData
// [{"media_type":"video/mp4","media_url":"https://res.cloudinary.com/dyiqtuqle/video/upload/v1741932186/dpbimfqlsmteojx0z5to.mp4","length":17,"position":null},{"media_type":"video/mp4","media_url":"https://res.cloudinary.com/dyiqtuqle/video/upload/v1741932171/bbyx24nu9ifgajevs3b4.mp4","length":17,"position":0}]