import React from 'react';
import { AuthProvider } from './AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        {/* Ative apenas um por vez para testar */}
        <Register />
      </div>
    </AuthProvider>
  );
}

export default App;
