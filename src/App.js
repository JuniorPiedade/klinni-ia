import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

// --- CONFIGURAÇÃO OFICIAL KLINNI IA ---
const firebaseConfig = {
  apiKey: "AIzaSyCv7kNOOa1AT71TmvwKLdwi8TyHHVh6htM", 
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
  storageBucket: "klinni-ia.firebasestorage.app",
  messagingSenderId: "761229946691",
  appId: "1:761229946691:web:feeceb3caed42445be09f6",
  measurementId: "G-D22KSD4C7C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // State da Notificação (Toast)
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { alert("Acesso negado."); }
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";
    
    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, cep: cepLead, idade: idadeLead, categoria,
        status: "NOVO LEAD", userId: user.uid, createdAt: serverTimestamp()
      });

      // 1. DISPARA O TOAST PRIMEIRO
      setToast({ show: true, message: `Lead ${nomeLead} triado com sucesso!` });
      
      // 2. LIMPA OS CAMPOS
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      
      // 3. AGUARDA 3 SEGUNDOS PARA O USUÁRIO VER E ENTÃO FECHA E MUDA DE TELA
      setTimeout(() => {
        setToast({ show: false, message: '' });
        setView('dashboard');
      }, 3000);

    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const highTicketLeads = leads.filter(l => l.categoria === 'HIGH TICKET').length;
  const porcentagemHigh = leads.length > 0 ? Math.round((highTicketLeads / leads.length) * 100) : 0;

  if (loading) return <div style={st.fullPage}>KLINNI IA...</div>;

  return (
    <div style={st.dashboardWrapper}>
      
      {/* TOAST GLASSMORPHISM - POSIÇÃO ABSOLUTA NO TOPO DO APP */}
      {toast.show && (
        <div style={st.toastWrapper}>
          <div style={st.toastGlass}>
            <div style={st.toastCheck}>✓</div>
            <span style={st.toastText}>{toast.message}</span>
          </div>
        </div>
      )}

      {!user ? (
        <div style={st.authPage}>
          <div style={st.authCard}>
            <h1 style={st.logoText}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h1>
            <form onSubmit={handleAuth} style={st.form}>
              <input type="email" placeholder="E-mail" style={st.input} onChange={e=>setEmail(e.target.value)} required />
              <input type="password" placeholder="Senha" style={st.input} onChange={e=>setPassword(e.target.value)} required />
              <button style={st.btnPrimary}>{isRegistering ? 'Criar Conta' : 'Acessar'}</button>
            </form>
            <button onClick={()=>setIsRegistering(!isRegistering)} style={st.btnLink}>
              {isRegistering ? 'Voltar' : 'Cadastrar'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <nav style={st.nav}>
            <div style={st.logoTextNav}>KLINNI <span style={{fontWeight:'300'}}>IA</span></div>
            <div style={st.navActions}>
              <button onClick={()=>setView('dashboard')} style={view==='dashboard'?st.navBtnActive:st.navBtn}>Dashboard</button>
              <button onClick={()=>setView('novoLead')} style={view==='novoLead'?st.navBtnActive:st.navBtn}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={st.btnSair}>Sair</button>
            </div>
          </nav>

          <main style={st.main}>
            {view === 'dashboard' ? (
              <>
                <h2 style={st.mainTitle}>Performance Salvador</h2>
                <div style={st.kpiRow}>
                  <div style={st.kpiCard}><span style={st.kpiLabel}>Base</span><span style={st.kpiValue}>{leads.length}</span></div>
                  <div style={st.kpiCardGold}><span style={st.kpiLabel}>High Ticket</span><span style={st.kpiValueGold}>{highTicketLeads}</span></div>
                  <div style={st.chartCard}>
                    <div style={{...st.donut, backgroundImage: `conic-gradient(#d4af37 ${porcentagemHigh}%, #eff6ff ${porcentagemHigh}%)`}}>
                      <div style={st.donutCenter}>{porcentagemHigh}%</div>
                    </div>
                  </div>
                </div>

                <div style={st.grid}>
                  {leads.map(l => (
                    <div key={l.id} style={l.categoria==='HIGH TICKET'?st.cardHigh:st.card}>
                      <div style={st.cardHeader}>
                        <span style={st.tag}>{l.status}</span>
                        <span style={l.categoria==='HIGH TICKET'?st.badgeGold:st.badge}>{l.categoria}</span>
                      </div>
                      <h3 style={st.leadName}>{l.nome}</h3>
                      <div style={st.leadMeta}><span>📍 {l.cep}</span><span>🎂 {l.idade} anos</span></div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={st.formWrapper}>
                <div style={st.formCard}>
                  <h2 style={{marginBottom:'25px'}}>Novo Lead</h2>
                  <form onSubmit={handleNovoLead} style={st.form}>
                    <input placeholder="Nome" style={st.input} value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required />
                    <input placeholder="CEP" style={st.input} value={cepLead} onChange={e=>setCepLead(e.target.value)} required />
                    <input placeholder="Idade" type="number" style={st.input} value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required />
                    <button type="submit" style={st.btnPrimary} disabled={isSaving}>
                      {isSaving ? 'Registrando...' : 'Classificar com IA'}
                    </button>
                    <button type="button" onClick={()=>setView('dashboard')} style={st.btnLink}>Cancelar</button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

const st = {
  // CONFIGURAÇÃO DE UI MANTIDA
  fullPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', background: '#f8fafc' },
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0070f3', width: '100%' },
  authCard: { background: '#fff', padding: '50px', borderRadius: '30px', width: '350px', textAlign: 'center' },
  logoText: { color: '#0070f3', fontSize: '38px', fontWeight: '800' },
  dashboardWrapper: { minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif', position: 'relative' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '20px 60px', background: '#fff', alignItems: 'center', borderBottom: '1px solid #e2e8f0' },
  logoTextNav: { fontSize: '24px', fontWeight: '800', color: '#0070f3' },
  navActions: { display: 'flex', gap: '30px', alignItems: 'center' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' },
  navBtnActive: { border: 'none', background: 'none', color: '#0070f3', fontWeight: '800', borderBottom: '2px solid #0070f3' },
  btnSair: { color: '#ef4444', border: '1px solid #fee2e2', background: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  main: { padding: '50px 60px' },
  mainTitle: { fontSize: '32px', color: '#1e293b', fontWeight: '800', marginBottom: '30px' },
  kpiRow: { display: 'flex', gap: '25px', marginBottom: '40px' },
  kpiCard: { background: '#fff', padding: '25px', borderRadius: '20px', flex: 1, border: '1px solid #e2e8f0' },
  kpiCardGold: { background: '#fff', padding: '25px', borderRadius: '20px', flex: 1, border: '2px solid #fbbf24' },
  kpiLabel: { color: '#64748b', fontSize: '14px' },
  kpiValue: { fontSize: '40px', fontWeight: '800', color: '#0070f3', display: 'block' },
  kpiValueGold: { fontSize: '40px', fontWeight: '800', color: '#d4af37', display: 'block' },
  chartCard: { background: '#fff', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0' },
  donut: { width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  donutCenter: { width: '55px', height: '55px', background: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  card: { background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  cardHigh: { background: '#fff', padding: '25px', borderRadius: '20px', border: '2px solid #fbbf24' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  tag: { fontSize: '10px', fontWeight: '800', color: '#0070f3' },
  badgeGold: { fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' },
  badge: { fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' },
  leadName: { fontSize: '22px', color: '#1e293b', fontWeight: '700' },
  leadMeta: { display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '14px' },
  formWrapper: { display: 'flex', justifyContent: 'center' },
  formCard: { background: '#fff', padding: '50px', borderRadius: '30px', width: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  input: { padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  btnPrimary: { padding: '16px', borderRadius: '12px', border: 'none', background: '#0070f3', color: '#fff', fontWeight: '700', cursor: 'pointer' },
  btnLink: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },

  // TOAST FIXADO NO TOPO (Z-INDEX MÁXIMO)
  toastWrapper: { 
    position: 'fixed', 
    top: '40px', 
    right: '40px', 
    zIndex: 99999, // Força estar acima de tudo
    pointerEvents: 'none' 
  },
  toastGlass: {
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px', 
    padding: '16px 28px',
    background: 'rgba(255, 255, 255, 0.85)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '24px', 
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
    pointerEvents: 'auto'
  },
  toastCheck: { 
    width: '30px', 
    height: '30px', 
    background: '#10b981', 
    color: '#fff', 
    borderRadius: '50%', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    fontSize: '16px', 
    fontWeight: 'bold' 
  },
  toastText: { color: '#1e293b', fontWeight: '700', fontSize: '16px' }
};
