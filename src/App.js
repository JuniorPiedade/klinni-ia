import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut 
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, query, where, onSnapshot, 
  serverTimestamp, doc, updateDoc, getDoc, setDoc, deleteDoc, limit 
} from "firebase/firestore";

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
  danger: "#ef4444",
  success: "#10b981",
  info: "#3b82f6",
  bg: "#f1f5f9",
  card: "#ffffff",
  text: "#0f172a",
  gray: "#64748b",
  shadow: "0 4px 15px -3px rgba(0, 0, 0, 0.07)"
};

// --- ÍCONES ---
const IconLayout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // Form States
  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [telLead, setTelLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [statusLead, setStatusLead] = useState('Aberto');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- AUTENTICAÇÃO ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const d = await getDoc(doc(db, "users", u.uid));
        setUserData(d.data());
        setUser(u);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const email = `${whatsapp.replace(/\D/g, '')}@klinni.ia`;
    try {
      if (authMode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = { uid: res.user.uid, whatsapp, role: 'gestor', clinicId: res.user.uid, createdAt: new Date() };
        await setDoc(doc(db, "users", res.user.uid), newUser);
        setUserData(newUser);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { alert("Erro: Verifique seus dados."); }
    setLoading(false);
  };

  // --- BUSCA DE DADOS ---
  useEffect(() => {
    if (!user || !userData) return;
    const qLeads = query(collection(db, "leads"), where("clinicId", "==", userData.clinicId));
    const unsub = onSnapshot(qLeads, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, userData]);

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { 
      nome: nomeLead, telefone: telLead, cep: cepLead, idade: parseInt(idadeLead), 
      valor: valorOrcamento, status: statusLead, clinicId: userData.clinicId,
      dataAgendamento: statusLead === 'Agendado' ? dataAgendamento : null,
      horaAgendamento: statusLead === 'Agendado' ? horaAgendamento : null
    };
    try {
      if (idEditando) await updateDoc(doc(db, "leads", idEditando), payload);
      else await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
      setView('dashboard'); setIdEditando(null);
    } catch (err) { alert("Erro ao salvar."); }
    setIsSaving(false);
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm("Deseja excluir permanentemente este lead?")) {
      await deleteDoc(doc(db, "leads", id));
    }
  };

  if (loading) return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:theme.bg}}>Carregando Klinni...</div>;

  // --- TELA DE LOGIN ---
  if (!user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 32, boxShadow: theme.shadow, width: '90%', maxWidth: 400, textAlign: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 10 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2>
          <p style={{ color: theme.gray, fontSize: 14, marginBottom: 25 }}>{authMode === 'login' ? 'Acesse sua conta' : 'Crie sua conta (Gestor)'}</p>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <input required placeholder="WhatsApp (apenas números)" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} style={{ padding: 16, borderRadius: 14, border: '1.5px solid #eee' }} />
            <input required type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} style={{ padding: 16, borderRadius: 14, border: '1.5px solid #eee' }} />
            <button style={{ padding: 16, background: theme.primary, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer' }}>
              {authMode === 'login' ? 'ENTRAR' : 'CADASTRAR'}
            </button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: theme.gray, marginTop: 20, cursor: 'pointer', fontSize: 13 }}>
            {authMode === 'login' ? 'Novo por aqui? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </div>
    );
  }

  // --- APP PRINCIPAL ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '35px 25px' }}><h2 style={{ fontSize: 20, fontWeight: 800 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2></div>
        <nav style={{ padding: '0 15px' }}>
          <button onClick={() => setView('dashboard')} style={{ width: '100%', display: 'flex', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'dashboard' ? `${theme.primary}15` : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer' }}><IconLayout /> Dashboard</button>
          <button onClick={() => signOut(auth)} style={{ width: '100%', marginTop: 20, padding: 10, background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: 12 }}>Sair da Conta</button>
        </nav>
        <div style={{ padding: 20, position: 'absolute', bottom: 0, width: '100%' }}>
          <button onClick={() => { setIdEditando(null); setNomeLead(''); setView('novoLead'); }} style={{ width: '100%', padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>+ Novo Lead</button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, padding: '40px 5%' }}>
        {view === 'dashboard' ? (
          <div>
            <header style={{ marginBottom: 30 }}>
              <h3 style={{ margin: 0 }}>Olá, {userData?.role === 'gestor' ? 'Dr(a)' : 'CRC'}</h3>
              <p style={{ color: theme.gray, fontSize: 14 }}>Aqui está o resumo da sua clínica.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {leads.map(l => (
                <div key={l.id} style={{ padding: 22, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: theme.info, background: `${theme.info}15`, padding: '4px 8px', borderRadius: 6 }}>{l.status}</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setIdEditando(l.id); setNomeLead(l.nome); setStatusLead(l.status); setView('novoLead'); }} style={{ border: 'none', background: 'none', color: theme.primary, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>EDITAR</button>
                        {/* REGRA DE NEGÓCIO: Só Gestor remove */}
                        {userData?.role === 'gestor' && (
                          <button onClick={() => handleDeleteLead(l.id)} style={{ border: 'none', background: 'none', color: theme.danger, cursor: 'pointer' }}><IconTrash /></button>
                        )}
                    </div>
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 500 }}>{l.nome}</h4>
                  <p style={{ margin: '5px 0', color: theme.success, fontWeight: 600 }}>{l.valor}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', padding: 40, borderRadius: 28, boxShadow: theme.shadow }}>
            <h3 style={{ marginBottom: 25, fontWeight: 800 }}>{idEditando ? "Editar" : "Novo"} Lead</h3>
            <form onSubmit={handleSalvarLead} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #eee', gridColumn: 'span 2' }}>
                <option>Aberto</option><option>Agendado</option><option>Em tratamento</option><option>Não qualificado</option>
              </select>
              
              {statusLead === 'Agendado' && (
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, background: '#f8fafc', padding: 15, borderRadius: 12 }}>
                  <input type="date" value={dataAgendamento} onChange={e=>setDataAgendamento(e.target.value)} style={{ flex: 1, padding: 8 }} />
                  <input type="time" value={horaAgendamento} onChange={e=>setHoraAgendamento(e.target.value)} style={{ flex: 1, padding: 8 }} />
                </div>
              )}

              <input required placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ gridColumn: 'span 2', padding: 15, borderRadius: 12, border: '1.5px solid #eee' }} />
              <input required placeholder="WhatsApp" value={telLead} onChange={e=>setTelLead(e.target.value)} style={{ gridColumn: 'span 2', padding: 15, borderRadius: 12, border: '1.5px solid #eee' }} />
              <input required placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #eee' }} />
              <input required placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #eee' }} />
              <input placeholder="Valor R$" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{ gridColumn: 'span 2', padding: 15, borderRadius: 12, border: '1.5px solid #eee' }} />

              <button disabled={isSaving} style={{ gridColumn: 'span 2', padding: 18, background: theme.primary, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>CONFIRMAR</button>
              <button type="button" onClick={() => setView('dashboard')} style={{ gridColumn: 'span 2', background: 'none', border: 'none', color: theme.gray, cursor: 'pointer' }}>CANCELAR</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
