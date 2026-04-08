import React, { useState } from 'react';

export default function App() {
  // O estado começa como 'home'. Assim a primeira coisa que aparece é a Dashboard.
  const [tela, setTela] = useState('home');

  // Seus dados sem cálculos extras, exatamente como você precisa
  const dadosIniciais = [
    { id: 1, data: '2026-03-31', valor: 1250.00 },
    { id: 2, data: '2026-04-01', valor: 480.00 },
    { id: 3, data: '2026-04-02', valor: 850.00 },
    { id: 4, data: '2026-04-03', valor: 150.00 }
  ];

  // Estilos simples para garantir que nada fique amontoado
  const estilos = {
    container: { padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' },
    card: { backgroundColor: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' },
    botao: { padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '20px' },
    tabela: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { borderBottom: '2px solid #eee', padding: '10px' },
    td: { borderBottom: '1px solid #eee', padding: '10px' }
  };

  return (
    <div style={estilos.container}>
      
      {tela === 'home' ? (
        /* --- TELA 1: DASHBOARD --- */
        <div style={estilos.card}>
          <h1>Dashboard</h1>
          <p>Bem-vindo ao sistema.</p>
          <button style={estilos.botao} onClick={() => setTela('relatorio')}>
            Ir para Relatório
          </button>
        </div>
      ) : (
        /* --- TELA 2: RELATÓRIO --- */
        <div style={estilos.card}>
          <h1>Relatório</h1>
          <table style={estilos.tabela}>
            <thead>
              <tr>
                <th style={estilos.th}>ID</th>
                <th style={estilos.th}>Data</th>
                <th style={estilos.th}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {dadosIniciais.map(item => (
                <tr key={item.id}>
                  <td style={estilos.td}>{item.id}</td>
                  <td style={estilos.td}>{item.data}</td>
                  <td style={estilos.td}>R$ {item.valor.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{...estilos.botao, backgroundColor: '#6c757d'}} onClick={() => setTela('home')}>
            Voltar para Dashboard
          </button>
        </div>
      )}

    </div>
  );
}
