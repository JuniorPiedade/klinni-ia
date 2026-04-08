import React, { useState } from 'react';

/**
 * APP.JS - VERSÃO COMPLETA COM NAVEGAÇÃO (DASHBOARD)
 */
export default function App() {
  // Estado para controlar se estamos na Dashboard ou no Relatório
  const [telaAtual, setTelaAtual] = useState('relatorio'); 

  // Dados fictícios baseados nos seus ajustes
  const [dados] = useState([
    { id: 1, data: '2026-03-31', valor_original: 1250.00 },
    { id: 2, data: '2026-04-01', valor_original: 480.00 },
    { id: 3, data: '2026-04-02', valor_original: 850.00 },
    { id: 4, data: '2026-04-03', valor_original: 150.00 }
  ]);

  // Lógica de processamento (Margem de 5% + Categorias)
  const dadosProcessados = dados.map(item => {
    const valorAjustado = item.valor_original * 1.05;
    let categoria = 'Econômico';
    if (valorAjustado >= 1000) categoria = 'Premium';
    else if (valorAjustado >= 500) categoria = 'Standard';
    return { ...item, valor_ajustado: valorAjustado, categoria };
  });

  // --- COMPONENTE DA DASHBOARD (TELA INICIAL) ---
  const Dashboard = () => (
    <div style={styles.card}>
      <h1 style={{ color: '#2c3e50' }}>🏠 Dashboard Principal</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Bem-vindo ao sistema de gestão 2026.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <button 
          onClick={() => setTelaAtual('relatorio')}
          style={styles.btnPrimary}
        >
          Ver Relatório de Vendas
        </button>
        <button style={styles.btnSecondary}>Configurações</button>
      </div>
    </div>
  );

  // --- COMPONENTE DO RELATÓRIO (TELA DE DADOS) ---
  const Relatorio = () => (
    <div style={styles.card}>
      <header style={styles.headerRelatorio}>
        <button 
          onClick={() => setTelaAtual('dashboard')} 
          style={styles.btnVoltar}
        >
          ← Voltar para Dashboard
        </button>
        <div>
          <h1 style={{ margin: '10px 0 5px 0' }}>Relatório de Vendas Revisado</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Ajuste inflacionário de <b>5%</b> aplicado.</p>
        </div>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
