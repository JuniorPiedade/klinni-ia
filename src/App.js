import React from 'react';

export const AdminLogs = ({ logs = [] }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Painel de Controle</h1>
          <p style={styles.sub}>Histórico de Auditoria • Klinni IA</p>
        </div>
        <button style={styles.btnExport}>
          📥 Baixar Relatório CSV
        </button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>USUÁRIO</th>
              <th style={styles.th}>AÇÃO</th>
              <th style={styles.th}>LEAD</th>
              <th style={styles.th}>DATA/HORA</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? logs.map((log, i) => (
              <tr key={i} style={styles.tr}>
                <td style={styles.td}><b>{log.usuario}</b></td>
                <td style={styles.td}>{log.acao}</td>
                <td style={styles.td}>{log.lead}</td>
                <td style={styles.td}>{log.data}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" style={{...styles.td, textAlign: 'center', color: '#a1a1aa'}}>
                  Nenhuma atividade registrada hoje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px 0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { fontSize: '22px', fontWeight: '900', color: '#09090b' },
  sub: { fontSize: '13px', color: '#71717a' },
  btnExport: { 
    padding: '10px 20px', borderRadius: '10px', border: '1px solid #f97316', 
    background: '#fff', color: '#f97316', fontWeight: '800', cursor: 'pointer', fontSize: '12px' 
  },
  tableWrapper: { background: '#fff', borderRadius: '20px', border: '1px solid #e4e4e7', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { background: '#fafafa', borderBottom: '1px solid #e4e4e7' },
  th: { padding: '15px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#a1a1aa' },
  tr: { borderBottom: '1px solid #f4f4f5' },
  td: { padding: '15px', fontSize: '13px', color: '#27272a' }
};
