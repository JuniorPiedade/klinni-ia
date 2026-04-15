import React from 'react';
import { AuthProvider } from './AuthContext';
// Note as chaves { } em volta do Login. Agora está correto!
import { Login } from './components/Login'; 
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        {/* Renderiza a tela de login da Klinni IA */}
        <Login />
      </div>
    </AuthProvider>
  );
}

export default App;
