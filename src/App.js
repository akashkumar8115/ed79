import React, { useState, useEffect, useCallback, useRef } from "react";
import "./styles/App.css";
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
  CONTENT_UPDATE_INTERVAL,
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
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
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
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Error processing content:", error);
      setError(`Failed to process content: ${error.message}`);
      setIsLoading(false);
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
          // Generate a new screen code
          storedScreenCode = generateAlphanumericId(6);
          console.log("Generated new screen code:", storedScreenCode);
          saveScreenCodeToLocalStorage(storedScreenCode);
        } else {
          console.log("Using existing screen code:", storedScreenCode);
        }

        // Set the screenCode state
        setScreenCode(storedScreenCode);

        // Even if we don't have data yet, we can show the screen code
        if (!dataReady && itemData.length === 0) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing device identity:", error);
        setError(`Failed to initialize device: ${error.message}`);
        setIsLoading(false);
      }
    };

    initializeDeviceIdentity();
  }, [dataReady, itemData.length]);

  /**
   * Fetch screen data from API
   */
  const fetchScreenData = useCallback(async (isPolling = false) => {
    if (!isOnline) {
      console.log("Device is offline, skipping API fetch");
      setIsLoading(false);
      return;
    }
    if (!screenCode) {
      console.log("No screen code available, skipping API fetch");
      setIsLoading(false);
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
            // Check if content has changed before updating localStorage
            const storedItems = getIdItemsDataFromLocalStorage();
            const hasContentChanged = !storedItems ||
              storedItems.length !== processedResponse.mediaItems.length ||
              JSON.stringify(storedItems) !== JSON.stringify(processedResponse.mediaItems);

            if (hasContentChanged) {
              console.log("Content has changed, updating localStorage");
              // Process and save content using our permanent uniqueId
              await onFetchAllContent({
                allContent: processedResponse.mediaItems,
                uniqueId: uniqueId
              });
            } else {
              console.log("Content unchanged, keeping existing data");
              // Just set the data ready state without updating localStorage
              setItemData(storedItems);
              setDataReady(true);
              setIsLoading(false);
            }
          } else {
            // No media items in the response
            setApiResponse({
              message: `No content available. Please add content for screen code "${screenCode}" in the admin panel.`
            });
            setItemData([]);
            setDataReady(false);
            setIsLoading(false);
          }
          break;

        case 'not_registered':
          // Screen needs to be registered
          setApiResponse({
            message: `This screen needs to be registered. Please add screen code "${screenCode}" in the admin panel.`
          });
          setItemData([]);
          setDataReady(false);
          setIsLoading(false);
          break;

        case 'no_playlist':
        case 'no_content':
          // Clear any existing content but keep showing screen code
          setApiResponse({
            message: `No content available. Please add content for screen code "${screenCode}" in the admin panel.`
          });
          setItemData([]);
          setDataReady(false);
          setIsLoading(false);
          break;

        case 'unchanged':
          // No changes needed, keep existing content
          console.log("No changes to content");
          // Make sure we're showing the stored content
          const storedItems = getIdItemsDataFromLocalStorage();
          if (storedItems && storedItems.length > 0) {
            setItemData(storedItems);
            setDataReady(true);
          } else {
            // If we have no stored items, show the screen code
            setItemData([]);
            setDataReady(false);
          }
          setIsLoading(false);
          break;

        default:
          console.warn("Unknown response status:", processedResponse.status);
          setIsLoading(false);
      }

    } catch (err) {
      console.error("Error fetching screen data:", err);
      setError(`Failed to fetch content: ${err.message}`);

      // Don't clear existing content on error
      if (itemData.length > 0) {
        setDataReady(true);
      }
      setIsLoading(false);
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
          setItemData(storedItems);
          setDataReady(true);
        } else {
          // If no stored items, make sure we're showing the screen code
          setItemData([]);
          setDataReady(false);
          setIsLoading(false);
        }

        // Always fetch from API on initial load, even if we have stored items
        await fetchScreenData();

      } catch (error) {
        console.error("Error initializing app:", error);
        setError(`Failed to initialize: ${error.message}`);
        setIsLoading(false);
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
   * Set up regular polling for content updates every 5 seconds
   */
  useInterval(() => {
    console.log("Auto-checking for content updates...");
    fetchScreenData(true);
  }, CONTENT_UPDATE_INTERVAL);

  // Render error state
  if (error) {
    return (
      <div className="container error" role="alert">
      
        <div className="unique-id">Screen Code: {screenCode}</div>
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

  // Always show screen code when no data or still loading
  return (
    <div className="container" role="status">
      {!isDownloadDataStarted ? (
        <>
          <div className="text-highlight">
            {isLoading ? "Initializing..." : (apiResponse?.message || "No content available")}
          </div>
          <div className="unique-id">Screen Code: {screenCode}</div>
          {!isLoading && (
            <div className="text-small">
              Please add this screen in the admin panel
            </div>
          )}
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
