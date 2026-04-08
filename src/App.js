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
  
  // States de Formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // NOVO STATE: Toast Notification
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

  const showNotification = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

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

      // Feedback Visual Minimalista
      showNotification(`Lead ${nomeLead} registrado!`);
      
      // Limpeza e Redirecionamento
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      setTimeout(() => setView('dashboard'), 500); 
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div style={st.fullPage}>Klinni IA...</div>;

  return (
    <div style={st.dashboardWrapper}>
      
      {/* COMPONENTE TOAST GLASSMORPHISM */}
      {toast.show && (
        <div style={st.toastContainer}>
          <div style={st.toastGlass}>
            <div style={st.toastIcon}>✓</div>
            <span style={st.toastText}>{toast.message}</span>
          </div>
        </div>
      )}

      {!user ? (
        <div style={st.authPage}>
          <div style={st.authCard}>
            <h1 style={st.logoText}>KLINNI <span>IA</span></h1>
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
                <div style={st.welcomeArea}>
                  <h2 style={st.mainTitle}>Operação Salvador</h2>
                  <p style={st.mainSub}>{totalLeads} leads na base</p>
                </div>

                <div style={st.kpiRow}>
                  <div style={st.kpiCard}><span style={st.kpiLabel}>Base</span><span style={st.kpiValue}>{totalLeads}</span></div>
                  <div style={st.kpiCardGold}><span style={st.kpiLabel}>High Ticket</span><span style={st.kpiValueGold}>{highTicketLeads}</span></div>
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
                  <h2 style={{marginBottom:'25px'}}>Cadastrar Lead</h2>
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
  // CONFIGURAÇÕES DE ESTILO PROFISSIONAL
  fullPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' },
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0070f3' },
  authCard: { background: '#fff', padding: '40px', borderRadius: '25px', width: '320px', textAlign: 'center' },
  logoText: { color: '#0070f3', fontSize: '32px', fontWeight: '800' },
  dashboardWrapper: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 50px', background: '#fff', borderBottom: '1px solid #eee' },
  navActions: { display: 'flex', gap: '20px' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', color: '#666' },
  navBtnActive: { border: 'none', background: 'none', color: '#0070f3', fontWeight: 'bold' },
  btnSair: { color: 'red', border: 'none', background: 'none', cursor: 'pointer' },
  main: { padding: '40px 50px' },
  kpiRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  kpiCard: { background: '#fff', padding: '20px', borderRadius: '15px', flex: 1, border: '1px solid #eee' },
  kpiCardGold: { background: '#fff', padding: '20px', borderRadius: '15px', flex: 1, border: '2px solid gold' },
  kpiValue: { fontSize: '36px', fontWeight: 'bold', display: 'block', color: '#0070f3' },
  kpiValueGold: { fontSize: '36px', fontWeight: 'bold', display: 'block', color: 'gold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #eee' },
  cardHigh: { background: '#fff', padding: '20px', borderRadius: '15px', border: '2px solid gold' },
  formWrapper: { display: 'flex', justifyContent: 'center' },
  formCard: { background: '#fff', padding: '40px', borderRadius: '25px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '14px', borderRadius: '10px', border: '1px solid #ddd' },
  btnPrimary: { padding: '14px', borderRadius: '10px', border: 'none', background: '#0070f3', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  btnLink: { background: 'none', border: 'none', color: '#999', cursor: 'pointer', marginTop: '10px' },

  // ESTILOS DO TOAST (CANTO SUPERIOR DIREITO - GLASSMORPHISM)
  toastContainer: {
    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
    animation: 'slideIn 0.3s ease-out'
  },
  toastGlass: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 20px', borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  toastIcon: {
    width: '24px', height: '24px', borderRadius: '50%',
    background: '#22c55e', color: '#fff',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontSize: '14px', fontWeight: 'bold'
  },
  toastText: { color: '#1e293b', fontWeight: '600', fontSize: '14px' }
};
