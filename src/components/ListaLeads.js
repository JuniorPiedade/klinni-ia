import React from 'react';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const ListaLeads = ({ leads }) => {
  const updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, "leads", id), { status: newStatus });
  };

  return (
    <div style={styles.grid}>
      {leads.map((lead) => (
        <div key={lead.id} style={{
          ...styles.card, 
          borderLeft: lead.categoria === 'HIGH TICKET' ? '4px solid #f97316' : '4px solid #e4e4e7'
        }}>
          <div style={styles.cardHeader}>
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <h3 style={styles.nome}>{lead.nome}</h3>
                {lead.categoria === 'HIGH TICKET' && (
                  <span style={styles.badgeNobre}>💎 ALTO PADRÃO</span>
                )}
              </div>
              <p style={styles.info}>{lead.bairro} • {lead.whatsapp}</p>
            </div>
            <select 
              value={lead.status} 
              onChange={(e) => updateStatus(lead.id, e.target.value)}
              style={styles.selectStatus}
            >
              <option value="Pendente">Pendente</option>
              <option value="Agendado">Agendado</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
          <div style={styles.iaBox}>
            <p style={styles.iaLabel}>SUGESTÃO DE ABORDAGEM:</p>
            <p style={styles.iaTexto}>"Olá {lead.nome.split(' ')[0]}, vi que você é da {lead.bairro} e buscou informações..."</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: '#fff', padding: '20px', borderRadius: '18px', border: '1px solid #e4e4e7' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  nome: { fontSize: '16px', fontWeight: '800', margin: 0 },
  info: { fontSize: '12px', color: '#a1a1aa', marginTop: '4px' },
  badgeNobre: { fontSize: '9px', background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '100px', fontWeight: '900' },
  selectStatus: { fontSize: '10px', border: '1px solid #e4e4e7', borderRadius: '6px', padding: '4px' },
  iaBox: { marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0' },
  iaLabel: { fontSize: '9px', fontWeight: '900', color: '#64748b', marginBottom: '4px' },
  iaTexto: { fontSize: '13px', color: '#334155', fontStyle: 'italic' }
};

export default ListaLeads;
