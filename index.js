import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Găsim elementul 'root' din HTML
const rootElement = document.getElementById('root');

// Creăm rădăcina React
const root = ReactDOM.createRoot(rootElement);

// Randăm componenta principală 'App' în interiorul 'root'
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
