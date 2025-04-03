// import React from 'react';
// import ReactDOM from 'react-dom'; // Changed from 'react-dom/client'
// import './index.css';
// import App from './App';
// import reportWebVitals from './reportWebVitals';

// // React 17 uses ReactDOM.render instead of createRoot
// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

// reportWebVitals();

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "core-js/stable"; // Polyfill for Chrome 79
import "whatwg-fetch"; // Polyfill for fetch API

ReactDOM.render(<App />, document.getElementById("root"));