import React from 'react';
import { AuthProvider } from './AuthContext';
import { Register } from './components/Register';
import ListaLeads from './components/ListaLeads';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Register />
        <ListaLeads />
      </div>
    </AuthProvider>
  );
}

export default App;
