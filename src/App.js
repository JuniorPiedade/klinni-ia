import React, { useState, useEffect, useMemo } from 'react';

/**
 * APP.JS - VERSÃO CONSOLIDADA E REVISADA
 * Ajustes: Cálculo de margem, Categorização e Tratamento de Erros
 */

// Estilos básicos em objeto para garantir que o layout funcione sem dependências externas
const styles = {
  container: { padding: '20px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', color: '#333' },
  header: { borderBottom: '2px solid #007bff', marginBottom: '20px', paddingBottom: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { backgroundColor: '#007bff', color: 'white', padding: '12px', textAlign: 'left' },
  td: { padding: '12px', borderBottom: '1px solid #ddd' },
  badge: (cat) => ({
    padding: '5px 10px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    backgroundColor: cat === 'Premium' ? '#d4edda' : cat === 'Standard' ? '#fff3cd' : '#f8d7da',
    color: cat === 'Premium' ? '#155724' : cat === 'Standard' ? '#856404' : '#721c24',
  }),
  loading: { textAlign: 'center', fontSize: '1.2rem', marginTop: '50px' },
  error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '5px', margin: '20px 0' }
};

export default function App() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // 1. Simulação de carregamento de dados (ou integração com sua API)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulando resposta do servidor
        const mockResponse = [
          { id: 1, data: '2026-04-01', valor_original: 1250.00 },
          { id: 2, data: '2026-04-02', valor_original: 480.00 },
          { id: 3, data: '2026-04-03', valor_original: 850.00 },
          { id: 4, data: '2026-04-04', valor_original: 150.00 }
        ];

        // Simulando delay de rede
        setTimeout(() => {
          setDados(mockResponse);
          setLoading(false);
        }, 800);

      } catch (err) {
        setErro("Não foi possível carregar os dados. Verifique a conexão.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Processamento dos dados com os novos ajustes (Cálculo +5% e Categorias)
  const dadosProcessados = useMemo(() => {
    return dados.map(item => {
      const valorAjustado = item.valor_original * 1.05;
      let categoria = 'Econômico';

      if (valorAjustado >= 1000) categoria = 'Premium';
      else if (valorAjustado >= 500) categoria = 'Standard';

      return {
        ...item,
        valor_ajustado: valorAjustado,
        categoria: categoria
      };
    });
  }, [dados]);

  // Renderização condicional para estados de carregamento e erro
  if (loading) return <div style={styles.loading}>Processando ajustes e carregando...</div>;
  if (erro) return <div style={styles.error}><strong>Erro:</strong> {erro}</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Relatório de Vendas Revisado</h1>
        <p>Ajuste inflacionário de <strong>5%</strong> aplicado sobre o valor original.</p>
      </header>

      <main>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Data</th>
              <th style={styles.th}>Valor Original</th>
              <th style={styles.th}>Valor c/ Ajuste</th>
              <th style={styles.th}>Status/Prioridade</th>
            </tr>
          </thead>
          <tbody>
            {dadosProcessados.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>{item.id}</td>
                <td style={styles.td}>{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                <td style={styles.td}>R$ {item.valor_original.toFixed(2)}</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>
                  R$ {item.valor_ajustado.toFixed(2)}
                </td>
                <td style={styles.td}>
                  <span style={styles.badge(item.categoria)}>
                    {item.categoria}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <footer style={{ marginTop: '30px', fontSize: '0.9rem', color: '#666' }}>
        <hr />
        <p>Sistema atualizado em: {new Date().toLocaleString('pt-BR')}</p>
      </footer>
    </div>
  );
}
