import React from 'react';
import { AuthProvider } from './AuthContext';
import { Register } from './components/Register'; // GAranta que NÃO está ReRegister
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
