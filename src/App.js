import { ListaLeads } from './components/ListaLeads';
import React from 'react';
import { Login } from './components/Login';
import { Registro } from './components/Registro';
import { NovoLeadForm } from './components/NovoLeadForm';
import { AdminLogs } from './components/AdminLogs';

function App() {
  // Simulação de navegação simples para você visualizar
  // No futuro, trocaremos por um sistema de rotas automático
  const [pagina, setPagina] = React.useState('registro');

  return (
    <div>
      {/* Menu de Visualização Temporário para você testar */}
      <nav className="bg-white p-2 flex gap-4 text-[10px] border-b justify-center">
        <button onClick={() => setPagina('registro')}>1. Criar Conta (Admin)</button>
        <button onClick={() => setPagina('lista')}>5. Ver Leads</button>
        <button onClick={() => setPagina('login')}>2. Login</button>
        <button onClick={() => setPagina('leads')}>3. Gestão de Leads</button>
        <button onClick={() => setPagina('admin')}>4. Painel do Dono</button>
      </nav>

      {/* Renderização das Telas */}
      {pagina === 'registro' && <Registro />}
      {pagina === 'login' && <Login />}
      {pagina === 'leads' && <NovoLeadForm />}
      {pagina === 'admin' && <AdminLogs />}
      {pagina === 'lista' && <ListaLeads />}
    </div>
  );
}

export default App;
