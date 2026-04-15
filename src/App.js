import React from 'react';
import { AuthProvider } from './AuthContext';
import { Login } from './components/Login';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        {/* O Login agora está protegido pelo AuthProvider */}
        <Login />
      </div>
    </AuthProvider>
  );
}

export default App;
