import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from "firebase/firestore";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCv7kNOOa1AT71TmvwKLdwi8TyHHVh6htM",
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const theme = {
  primary: "#f97316",
  text: "#0f172a",
  gray: "#64748b",
  bg: "#f8fafc",
  shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)"
};

const COLunas = ['Aberto', 'Agendado', 'Em tratamento', 'Não qualificado'];
const ORIGENS = ['Todos', 'Instagram', 'Facebook', 'WhatsApp', 'Site'];

// --- ÍCONES ---
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconLayout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const IconHistory = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('Todos');

  // Form States
  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [telLead, setTelLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qLeads = query(collection(db, "leads"), where("userId", "==", user.uid));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubLeads();
  }, [user]);

  // Função para calcular total de orçamentos (conversão de string para number)
  const totalOrcamentos = leads
    .filter(l => l.status !== 'Não qualificado')
    .reduce((acc, curr) => {
      const val = curr.valor ? parseFloat(curr.valor.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
      return acc + val;
    }, 0);

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    const payload = { nome: nomeLead, telefone: telLead, valor: valorOrcamento, userId: user.uid, status: 'Aberto', origem: 'Instagram' };
    if (idEditando) await updateDoc(doc(db, "leads", idEditando), payload);
    else await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
    setView('dashboard');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        .origin-badge { cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; font-size: 11px; font-weight: 800; color: ${theme.gray}; transition: 0.2s; }
        .origin-badge.active { border-color: ${theme.primary}; background: ${theme.primary}10; color: ${theme.primary}; }
        .search-box { position: relative; display: flex; align-items: center; width: 280px; }
        .search-box svg { position: absolute; left: 12px; color: ${theme.gray}; }
        .search-box input { width: 100%; padding: 10px 12px 10px 35px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 13px; outline: none; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '35px 25px' }}><h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2></div>
        <nav style={{ padding: '0 15px' }}>
          <button onClick={() => setView('dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'dashboard' ? `${theme.primary}15` : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer' }}><IconLayout /> Dashboard</button>
        </nav>
        <div style={{ padding: 20, position: 'absolute', bottom: 0, width: '100%' }}>
          <button onClick={() => { setIdEditando(null); setView('novoLead'); }} style={{ width: '100%', padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>+ Novo Lead</button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, padding: '40px' }}>
        {view === 'dashboard' ? (
          <div>
            {/* LINHA 1: FILTROS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {ORIGENS.map(org => (
                  <div key={org} className={`origin-badge ${filtroOrigem === org ? 'active' : ''}`} onClick={() => setFiltroOrigem(org)}>{org.toUpperCase()}</div>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: theme.gray }}>VALOR EM NEGOCIAÇÃO</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>{formatCurrency(totalOrcamentos)}</div>
              </div>
            </div>

            {/* LINHA 2: TÍTULO E BUSCA (ESQUERDA) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginBottom: 25 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: theme.text }}>
                <span style={{ color: theme.primary }}>DASH</span>BOARD
              </h1>
              <div className="search-box">
                <IconSearch />
                <input placeholder="Buscar paciente..." value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)} />
              </div>
            </div>

            {/* KANBAN */}
            <div style={{ display: 'flex', gap: 20, overflowX: 'auto' }}>
              {COLunas.map(col => (
                <div key={col} style={{ minWidth: 280, flex: 1, background: '#f1f5f9', borderRadius: 20, padding: '15px' }}>
                  <div style={{ paddingBottom: 15, borderBottom: '2px solid #cbd5e1', marginBottom: 15, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: 12, color: theme.text }}>{col.toUpperCase()}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: theme.gray }}>{leads.filter(l => l.status === col).length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {leads
                      .filter(l => l.status === col && (filtroOrigem === 'Todos' || l.origem === filtroOrigem) && l.nome.toLowerCase().includes(filtroBusca.toLowerCase()))
                      .map(l => (
                        <div key={l.id} style={{ padding: 16, background: '#fff', borderRadius: 15, boxShadow: theme.shadow }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{l.nome}</div>
                          <div style={{ color: theme.primary, fontWeight: 800, fontSize: 14, marginTop: 4 }}>{l.valor}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 400, margin: '0 auto', background: '#fff', padding: 30, borderRadius: 20 }}>
            <h3>Cadastrar Paciente</h3>
            <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input placeholder="Nome" value={nomeLead} onChange={e => setNomeLead(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
              <input placeholder="Valor (ex: R$ 1.500,00)" value={valorOrcamento} onChange={e => setValorOrcamento(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
              <button type="submit" style={{ padding: 15, background: theme.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800 }}>SALVAR</button>
              <button type="button" onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: theme.gray }}>CANCELAR</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
