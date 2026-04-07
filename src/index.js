import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <--- ESSA LINHA CONECTA O DESIGN AO SITE
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
