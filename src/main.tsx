
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import React from 'react' // Explicitly import React

// Ensure React is correctly imported and used
createRoot(document.getElementById("root")!).render(
  <App />
);
