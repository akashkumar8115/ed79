// productio
import { useRef, useEffect, useState } from "react";
import { ENDPOINTS, NETWORK_CHECK_INTERVAL } from "./constants";

/**
 * Custom hook for setting up intervals
 * @param {Function} callback - Function to call on interval
 * @param {number} delay - Delay in milliseconds
 */
export function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * Generate a random alphanumeric ID
 * @param {number} length - Length of the ID
 * @returns {string} - Generated ID
 */
export function generateAlphanumericId(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get content path from media URI key
 * @param {string} mediaUriKey - Media URI key
 * @returns {string} - Full content path
 */
export function getContentPath(mediaUriKey = "") {
  return downloadFromPath(mediaUriKey);
}

/**
 * Get download path for an element
 * @param {string} element - Element to download
 * @returns {string} - Full download path
 */
export function downloadFromPath(element = "") {
  return `${ENDPOINTS.DOWNLOAD_FROM_PATH}/${element}`;
}

/**
 * Download and process items
 * @param {Array} allContent - Content items to download
 * @param {Function} setIsDownloadDataStarted - State setter for download started
 * @param {Function} setItemData - State setter for item data
 * @param {Function} setDataReady - State setter for data ready
 * @param {Function} setDownloadProgress - State setter for download progress
 * @returns {Promise<boolean>} - Success status
 */
export const downloadItems = async (
  allContent,
  setIsDownloadDataStarted,
  setItemData,
  setDataReady,
  setDownloadProgress
) => {
  try {
    if (!allContent || !Array.isArray(allContent) || allContent.length === 0) {
      console.warn("No content items to process");
      return false;
    }

    console.log("Processing items:", allContent);
    setIsDownloadDataStarted(true);

    // Process each item
    for (let index = 0; index < allContent.length; index++) {
      setDownloadProgress(`Processing ${index + 1} / ${allContent.length} items`);
      
      // Simulate processing time (in a real app, this would be actual download logic)
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Validate item has required properties
      const item = allContent[index];
      if (!item.media_url || !item.media_type) {
        console.warn(`Item at index ${index} is missing required properties:`, item);
      }
    }

    console.log("Items processing complete");
    setItemData(allContent);
    setIsDownloadDataStarted(false);
    setDataReady(true);
    return true;
  } catch (error) {
    console.error("Error in downloadItems:", error);
    setIsDownloadDataStarted(false);
    return false;
  }
};

/**
 * Custom hook to check if the device is connected to the internet
 * @returns {boolean} - Connection status
 */
export const useIsConnected = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set up periodic check for actual connectivity
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      }
    };

    const intervalId = setInterval(checkConnection, NETWORK_CHECK_INTERVAL);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
};
