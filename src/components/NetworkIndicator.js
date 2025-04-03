import React from "react";
import "../styles/NetworkIndicator.css";
import { useIsConnected } from "../utils/helpers";

const NetworkIndicator = () => {
  const hasInternet = useIsConnected();
  if (hasInternet) return null;

  return (
    <div className="overlay">
      <div className="dot"></div>
    </div>
  );
};

export default NetworkIndicator;


