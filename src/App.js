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

  // State para o Toast Minimalista
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const showNotification = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { 
      alert("Acesso negado. Verifique os dados."); 
    }
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";
    
    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, 
        cep: cepLead, 
        idade: idadeLead, 
        categoria: categoria,
        status: "NOVO LEAD", 
        userId: user.uid, 
        createdAt: serverTimestamp()
      });

      showNotification("Lead cadastrado com sucesso!");
      
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      setTimeout(() => setView('dashboard'), 800); 
    } catch (err) {
      alert("Erro ao conectar com Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalLeads = leads.length;
  const highTicketLeads = leads.filter(l => l.categoria === 'HIGH TICKET').length;
  const porcentagemHigh = totalLeads > 0 ? Math.round((highTicketLeads / totalLeads) * 100) : 0;

  if (loading) return <div style={st.fullPage}>Carregando Klinni...</div>;

  return (
    <div style={st.dashboardWrapper}>
      
      {/* TOAST MINIMALISTA GLASSMORPHISM NO CANTO SUPERIOR */}
      {toast.show && (
        <div style={st.toastContainer}>
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
            <div style={st.logoTextNav}>KLINNI <span>IA</span></div>
            <div style={st.navActions}>
              <button onClick={()=>setView('dashboard')} style={view==='dashboard'?st.navBtnActive:st.navBtn}>Dashboard</button>
              <button onClick={()=>setView('novoLead')} style={view==='novoLead'?st.navBtnActive:st.navBtn}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={st.btnSair}>Sair</button>
            </div>
          </nav>

          <main style={st.main}>
            {view === 'dashboard' ? (
              <>
                <h2 style={st.mainTitle}>Resumo Salvador</h2>
                <div style={st.kpiRow}>
                  <div style={st.kpiCard}><span style={st.kpiLabel}>Base</span><span style={st.kpiValue}>{totalLeads}</span></div>
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
  fullPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', background: '#f8fafc' },
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0070f3' },
  authCard: { background: '#fff', padding: '40px', borderRadius: '25px', width: '300px', textAlign: 'center' },
  logoText: { color: '#0070f3', fontSize: '32px', fontWeight: '800' },
  dashboardWrapper: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 50px', background: '#fff', borderBottom: '1px solid #eee' },
  navActions: { display: 'flex', gap: '20px' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', color: '#666' },
  navBtnActive: { border: 'none', background: 'none', color: '#0070f3', fontWeight: 'bold' },
  btnSair: { color: 'red', border: 'none', background: 'none', cursor: 'pointer' },
  main: { padding: '40px 50px' },
  mainTitle: { fontSize: '28px', marginBottom: '25px', fontWeight: '800' },
  kpiRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  kpiCard: { background: '#fff', padding: '20px', borderRadius: '15px', flex: 1, border: '1px solid #eee' },
  kpiCardGold: { background: '#fff', padding: '20px', borderRadius: '15px', flex: 1, border: '1px solid #fbbf24' },
  kpiLabel: { display: 'block', color: '#64748b', fontSize: '12px', fontWeight: 'bold' },
  kpiValue: { fontSize: '32px', fontWeight: '800', color: '#0070f3' },
  kpiValueGold: { fontSize: '32px', fontWeight: '800', color: '#d4af37' },
  chartCard: { background: '#fff', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center' },
  donut: { width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  donutCenter: { width: '45px', height: '45px', background: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #eee' },
  cardHigh: { background: '#fff', padding: '20px', borderRadius: '15px', border: '2px solid #fbbf24' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  tag: { fontSize: '10px', fontWeight: '800', color: '#0070f3' },
  badgeGold: { fontSize: '10px', color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: '6px' },
  badge: { fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' },
  leadName: { fontSize: '20px', fontWeight: '700', marginBottom: '8px' },
  leadMeta: { display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '13px' },
  formWrapper: { display: 'flex', justifyContent: 'center' },
  formCard: { background: '#fff', padding: '40px', borderRadius: '25px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  btnPrimary: { padding: '14px', borderRadius: '10px', border: 'none', background: '#0070f3', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  btnLink: { background: 'none', border: 'none', color: '#999', cursor: 'pointer', marginTop: '10px' },

  // TOAST GLASSMORPHISM
  toastContainer: { position: 'fixed', top: '25px', right: '25px', zIndex: '9999' },
  toastGlass: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)',
    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
  },
  toastCheck: { width: '22px', height: '22px', background: '#10b981', color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold' },
  toastText: { color: '#1e293b', fontWeight: '600', fontSize: '14px' }
};
