import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importando App, que deve ser o nome do seu arquivo
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
