
import React from 'react'; // Explicitly import React
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Mount the app with proper error boundaries
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <App />
  );
}
