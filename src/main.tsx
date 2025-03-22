
import React from 'react'; // Explicitly import React
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Mount the app with proper error boundaries
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
