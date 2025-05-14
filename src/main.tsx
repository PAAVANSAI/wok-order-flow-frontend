
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize the app with proper error handling
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");
  
  createRoot(rootElement).render(<App />);
  
  console.log("Application initialized successfully");
} catch (error) {
  console.error("Failed to initialize application:", error);
}
