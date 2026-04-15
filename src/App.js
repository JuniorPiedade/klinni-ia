import React from 'react';
import { AuthProvider } from './AuthContext';
import Login from './components/Login'; // Vamos criar este componente a seguir
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        {/* Por enquanto, vamos renderizar apenas o Login para testar */}
        <Login />
      </div>
    </AuthProvider>
  );
}

export default App;
