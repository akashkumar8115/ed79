import React, { useState, useEffect, useCallback, useRef } from "react";
import "./styles/App.css";
import { fetchContents } from "./utils/api";
import { checkScreenExistence, processScreenResponse } from './utils/screenService';
import {
  setIdItemsInLocalStorage,
  getIdItemsDataFromLocalStorage,
  getUniqueIdFromLocalStorage,
  saveScreenCodeToLocalStorage,
  getScreenCodeFromLocalStorage

} from "./utils/storage";
import {
  generateAlphanumericId,
  useInterval,
  downloadItems,
  useIsConnected
} from "./utils/helpers";
import {
  UPDATE_CHECK_INTERVAL,
  DEFAULTS,
  CONTENT_POLLING_INTERVAL
} from "./utils/constants";
import MediaSlider from "./components/MediaSlider";
import NetworkIndicator from "./components/NetworkIndicator";

/**
 * Main application component
 */
const App = () => {
  // State management
  const [dataReady, setDataReady] = useState(false);
  const [itemData, setItemData] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [isDownloadDataStarted, setIsDownloadDataStarted] = useState(false);
  const [uniqueId, setUniqueId] = useState("");
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [screenCode, setScreenCode] = useState("");

  // Refs
  const contentPollingRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Network status
  const isOnline = useIsConnected();

  /**
   * Process and download content
   */
  const onFetchAllContent = useCallback(async ({ allContent, uniqueId: uniqueIdLocal }) => {
    try {
      if (!allContent || !Array.isArray(allContent) || allContent.length === 0) {
        console.warn("No content to process");
        return false;
      }

      console.log("Processing content:", allContent.length, "items");

      const isDownloadComplete = await downloadItems(
        allContent,
        setIsDownloadDataStarted,
        setItemData,
        setDataReady,
        setDownloadProgress
      );

      if (isDownloadComplete) {
        console.log("Content download complete, saving to localStorage");
        setIdItemsInLocalStorage(allContent, uniqueIdLocal);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error processing content:", error);
      setError(`Failed to process content: ${error.message}`);
      return false;
    }
  }, []);

  /**
   * Initialize device identity - only once per device
   */
  useEffect(() => {
    const initializeDeviceIdentity = async () => {
      try {
        // First check if we already have a uniqueId stored
        let storedUniqueId = getUniqueIdFromLocalStorage();

        // If no uniqueId exists, generate one and save it
        if (!storedUniqueId) {
          storedUniqueId = generateAlphanumericId(12); // Generate a 12-character ID
          console.log("Generated new unique device ID:", storedUniqueId);
          localStorage.setItem("uniqueId", storedUniqueId);
        } else {
          console.log("Using existing device ID:", storedUniqueId);
        }

        // Set the uniqueId state
        setUniqueId(storedUniqueId);

        // Check if we already have a screen code
        let storedScreenCode = getScreenCodeFromLocalStorage();

        // If no screen code exists, generate one and save it
        if (!storedScreenCode) {
          // Use the first 8 characters of the uniqueId to ensure they're related
          // but add some transformation to make it different
          storedScreenCode = generateAlphanumericId(8);
          console.log("Generated new screen code:", storedScreenCode);
          saveScreenCodeToLocalStorage(storedScreenCode);
        } else {
          console.log("Using existing screen code:", storedScreenCode);
        }

        // Set the screenCode state
        setScreenCode(storedScreenCode);
      } catch (error) {
        console.error("Error initializing device identity:", error);
        setError(`Failed to initialize device: ${error.message}`);
      }
    };

    initializeDeviceIdentity();
  }, []);

  /**
   * Fetch screen data from API
   */
  const fetchScreenData = useCallback(async (isPolling = false) => {
    if (!isOnline) {
      console.log("Device is offline, skipping API fetch");
      return;
    }

    if (!screenCode) {
      console.log("No screen code available, skipping API fetch");
      return;
    }

    try {
      setError(null);

      if (!isPolling) {
        setApiResponse({ message: "Checking for content..." });
      }

      console.log("Fetching screen data for screen code:", screenCode);
      const response = await checkScreenExistence(screenCode);

      // Process the response
      const processedResponse = processScreenResponse(response);
      console.log("Processed response:", processedResponse.status);

      setApiResponse({
        message: processedResponse.message
      });

      // Handle different response types
      switch (processedResponse.status) {
        case 'content_available':
          // We have content to display
          if (processedResponse.mediaItems && processedResponse.mediaItems.length > 0) {
            // Process and save content using our permanent uniqueId
            await onFetchAllContent({
              allContent: processedResponse.mediaItems,
              uniqueId: uniqueId
            });
          }
          break;

        case 'not_registered':
          // Screen needs to be registered
          setApiResponse({
            message: "This screen needs to be registered. Please add this screen code in the admin panel."
          });
          setItemData([]);
          setDataReady(false);
          break;

        case 'no_playlist':
        case 'no_content':
          // Clear any existing content
          setItemData([]);
          setDataReady(false);
          break;

        case 'unchanged':
          // No changes needed
          console.log("No changes to content");
          break;

        default:
          console.warn("Unknown response status:", processedResponse.status);
      }

    } catch (err) {
      console.error("Error fetching screen data:", err);
      setError(`Failed to fetch content: ${err.message}`);

      // Don't clear existing content on error
      if (itemData.length > 0) {
        setDataReady(true);
      }
    }
  }, [screenCode, uniqueId, onFetchAllContent, isOnline, itemData.length]);

  /**
   * Load initial data from localStorage or API
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Only proceed if we have both uniqueId and screenCode
        if (!uniqueId || !screenCode) {
          console.log("Waiting for device identity to be established...");
          return;
        }

        console.log("Initializing app with uniqueId:", uniqueId, "and screenCode:", screenCode);

        // Try to get data from localStorage first
        const storedItems = getIdItemsDataFromLocalStorage();

        // If we have stored items, use them
        if (storedItems && Array.isArray(storedItems) && storedItems.length > 0) {
          console.log("Loading content from localStorage:", storedItems.length, "items");
          await onFetchAllContent({
            allContent: storedItems,
            uniqueId: uniqueId
          });
        }

        // Always fetch from API on initial load, even if we have stored items
        await fetchScreenData();

      } catch (error) {
        console.error("Error initializing app:", error);
        setError(`Failed to initialize: ${error.message}`);
      } finally {
        isInitialLoadRef.current = false;
      }
    };

    initializeApp();

    // Clean up function
    return () => {
      if (contentPollingRef.current) {
        contentPollingRef.current.stop();
      }
    };
  }, [fetchScreenData, onFetchAllContent, uniqueId, screenCode]);

  /**
   * Set up regular polling for content updates
   */
  useInterval(() => {
    if (isOnline && screenCode) {
      console.log("Checking for content updates...");
      fetchScreenData(true);
    }
  }, UPDATE_CHECK_INTERVAL);

  /**
   * Handle retry button click
   */
  const handleRetry = useCallback(() => {
    setError(null);
    fetchScreenData();
  }, [fetchScreenData]);

  // Render error state
  if (error) {
    return (
      <div className="container error" role="alert">
        <div className="unique-id">Screen Code: {screenCode}</div>
        <div className="text-highlight">Error: {error}</div>
        <button onClick={handleRetry} className="retry-button">
          Retry
        </button>
        <NetworkIndicator />
      </div>
    );
  }

  // Render content if ready
  if (dataReady && itemData.length > 0) {
    return (
      <>
        <MediaSlider allContent={itemData} />
        <NetworkIndicator />
      </>
    );
  }

  // Render no data state
  if (dataReady && itemData.length === 0) {
    return (
      <div className="no-data" role="status">
        No content available for display
        <NetworkIndicator />
      </div>
    );
  }

  // Render loading/registration state
  return (
    <div className="container" role="status">
      {!isDownloadDataStarted ? (
        <>
          <div className="text-highlight">
            {apiResponse?.message || "Initializing..."}
          </div>
          <div className="unique-id">Screen Code: {screenCode}</div>
          {/* {uniqueId && <div className="unique-id">Device ID: {uniqueId}</div>} */}
        </>
      ) : (
        <div className="download-info">
          <div className="text-small">Downloading Content</div>
          <div className="text-small">Please Wait...</div>
          <div className="text-big">{downloadProgress}</div>
        </div>
      )}
      <NetworkIndicator />
    </div>
  );
};

export default App;
