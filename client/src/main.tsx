import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW registered successfully:', registration.scope);
        
        // Trigger user engagement for PWA installability
        setTimeout(() => {
          document.dispatchEvent(new Event('click'));
        }, 1000);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('New service worker available');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available, please refresh');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
