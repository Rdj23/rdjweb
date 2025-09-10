import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css'; 
// 1. Get the root DOM element from index.html
const rootElement = document.getElementById('root');

// 2. Create a React root attached to that element
const root = ReactDOM.createRoot(rootElement);

// 3. Render your entire App component within the BrowserRouter
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
