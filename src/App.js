import React from 'react';
import { AuthProvider } from './AuthContext';
import { Register } from './components/Register.js';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Register />
      </div>
    </AuthProvider>
  );
}

export default App;
