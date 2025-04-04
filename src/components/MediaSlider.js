// productio
import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/MediaSlider.css";
import NetworkIndicator from "./NetworkIndicator";
import { DEFAULTS } from "../utils/constants";

/**
 * Media slider component for displaying content
 * @param {Object} props - Component props
 * @param {Array} props.allContent - Array of media content items
 */
const MediaSlider = ({ allContent = [] }) => {
  const [loading, setLoading] = useState(true);
  const [sequence, setSequence] = useState(0);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Set loading state based on content
  useEffect(() => {
    if (allContent.length > 0) {
      setLoading(false);
    }
  }, [allContent]);

  // Handle media sequence
  useEffect(() => {
    if (allContent.length > 0) {
      const currentItem = allContent[sequence];

      // Skip invalid items
      if (!currentItem || !currentItem.media_url) {
        console.warn("Invalid media item at sequence", sequence);
        setSequence((prev) => (prev + 1) % allContent.length);
        return;
      }

      // Get duration from item or use default
      const duration = (currentItem?.length * 1000) || DEFAULTS.MEDIA_DURATION;

      // Set timer for next item
      timerRef.current = setTimeout(() => {
        setSequence((prev) => (prev + 1) % allContent.length);
      }, duration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [sequence, allContent]);

  // Handle video end event
  const handleVideoEnd = useCallback(() => {
    if (allContent.length === 1) {
      // Loop single video
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.play().catch(err => {
          console.error("Error playing video:", err);
          setError("Failed to play video");
        });
      }
    } else {
      // Move to next item
      setSequence((prev) => (prev + 1) % allContent.length);
    }
  }, [allContent.length]);

  // Handle media error
  const handleMediaError = useCallback((e) => {
    console.error("Media Error:", e);
    setError(`Failed to load media please check your internet connection: ${e.message || 'Unknown error'}`);

    // Move to next item if there are multiple
    if (allContent.length > 1) {
      setSequence((prev) => (prev + 1) % allContent.length);
    }
  }, [allContent.length]);

  // Render loading state
  if (loading) {
    return (
      <div className="loading-container" aria-live="polite">
        <div className="loader" aria-hidden="true"></div>
        <span>Loading content...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="error-container" aria-live="assertive">
        <div className="error-icon" aria-hidden="true">!</div>
        <span>{error}</span>
      </div>
    );
  }

  // Render empty state
  if (allContent.length === 0) {
    return <div className="no-content" aria-live="polite">No content available</div>;
  }

  // Get current media item
  const currentItem = allContent[sequence] || {};
  const isVideo = currentItem.media_type && currentItem.media_type.includes("video");

  // Render media content
  let content;
  if (isVideo) {
    content = (
      <>
        <video
          ref={videoRef}
          key={`${currentItem.media_url}-${sequence}`}
          src={currentItem.media_url}
          className="media"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleMediaError}
          aria-label="Video content"
        />
        <NetworkIndicator />
      </>
    );
  } else {
    content = (
      <>
        <img
          key={`${currentItem.media_url}-${sequence}`}
          src={currentItem.media_url || ""}
          className="media"
          alt="Media content"
          onError={handleMediaError}
          onLoad={() => {
            // Image loaded successfully
            console.log("Image loaded successfully");
          }}
        />
        <NetworkIndicator />
      </>
    );
  }

  return (
    <div className="slider-container" role="region" aria-label="Media content slider">
      {content}
    </div>
  );
};

export default React.memo(MediaSlider);
