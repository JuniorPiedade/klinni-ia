import React, { useState } from 'react';

/**
 * APP.JS - VERSÃO INTEGRAL CORRIGIDA
 * Removido: Lógica de 5% e Categorias não solicitadas.
 * Mantido: Navegação entre Dashboard e Relatório.
 */
export default function App() {
  const [paginaAtiva, setPaginaAtiva] = useState('dashboard');

  // Seus dados originais
  const dadosIniciais = [
    { id: 1, data: '2026-03-31', valor: 1250.00 },
    { id: 2, data: '2026-04-01', valor: 480.00 },
    { id: 3, data: '2026-04-02', valor: 850.00 },
    { id: 4, data: '2026-04-03', valor: 150.00 }
  ];

  const s = {
    wrapper: { padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', justifyContent: 'center' },
    card: { backgroundColor: '#fff', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '800px', alignSelf: 'flex-start' },
    btnPrincipal: { padding: '12px 24px', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#2c3e50', color: 'white', fontWeight: 'bold' },
    btnVoltar: { padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee', color: '#333' },
    td: { padding: '12px', borderBottom: '1px solid #eee', color: '#555' }
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        
        {paginaAtiva === 'dashboard' ? (
          /* --- TELA DASHBOARD --- */
          <div style={{ textAlign: 'center' }}>
            <h1>Dashboard Inicial</h1>
            <p style={{ marginBottom: '30px' }}>Selecione uma opção para visualizar os dados.</p>
            <button onClick={() => setPaginaAtiva('relatorio')} style={s.btnPrincipal}>
              Ver Relatório de Vendas
            </button>
          </div>
        ) : (
          /* --- TELA RELATÓRIO --- */
          <div>
            <button onClick={() => setPaginaAtiva('dashboard')} style={s.btnVoltar}>
              ← Voltar para Dashboard
            </button>
            
            <h2 style={{ marginBottom: '20px' }}>Relatório de Vendas</h2>

            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>Data</th>
                  <th style={s.th}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {dadosIniciais.map(item => (
                  <tr key={item.id}>
                    <td style={s.td}>#{item.id}</td>
                    <td style={s.td}>{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                    <td style={s.td}>R$ {item.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
