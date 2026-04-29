import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

export const NovoLeadForm = ({ onComplete }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ nome: '', whatsapp: '', bairro: '', notas: '', valor: '' });
  const [loading, setLoading] = useState(false);

  const salvarLead = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bairrosNobres = ['pituba', 'horto', 'vitoria', 'caminho das arvores', 'barra', 'rio vermelho', 'graca'];
      const eNobre = bairrosNobres.includes(formData.bairro.toLowerCase().trim());
      
      await addDoc(collection(db, "leads"), {
        ...formData,
        categoria: eNobre ? 'HIGH TICKET' : 'TICKET MÉDIO',
        status: 'Pendente',
        userId: user.uid,
        createdAt: serverTimestamp() // Unificado para createdAt
      });
      onComplete();
    } catch (error) { alert("Erro ao salvar."); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.formCard}>
      <h2 style={{fontWeight: 800, marginBottom: 20}}>Novo Registro</h2>
      <form onSubmit={salvarLead} style={styles.flexCol}>
        <input style={styles.input} placeholder="Nome do Paciente" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
        <input style={styles.input} placeholder="WhatsApp (71...)" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
        <input style={styles.input} placeholder="Bairro (Ex: Pituba)" required value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} />
        <input style={styles.input} type="number" placeholder="Valor Estimado (R$)" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
        <textarea style={{...styles.input, height: 80}} placeholder="Observações" value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} />
        <button type="submit" disabled={loading} style={styles.btnPrimary}>
          {loading ? "Salvando..." : "Cadastrar Lead"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  formCard: { background: '#fff', padding: 30, borderRadius: 24, border: '1px solid #e4e4e7', width: '100%', maxWidth: '450px' },
  flexCol: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px', borderRadius: '10px', border: '1px solid #e4e4e7', outline: 'none' },
  btnPrimary: { padding: '14px', borderRadius: '10px', border: 'none', background: '#f97316', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }
};
