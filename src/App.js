import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";

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

function App() {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(u ? false : false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { alert("Acesso negado: Verifique seus dados."); }
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();
    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";
    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, cep: cepLead, idade: idadeLead, categoria,
        status: "NOVO LEAD", userId: user.uid, createdAt: new Date()
      });
      setView('dashboard'); setNomeLead(''); setCepLead(''); setIdadeLead('');
    } catch (err) { alert("Erro ao salvar."); }
  };

  if (loading) return <div style={st.fullPage}>Gerando interface Klinni...</div>;

  if (!user) return (
    <div style={st.authPage}>
      <div style={st.authCard}>
        <h1 style={st.logoText}>KLINNI<span style={{fontWeight:'300'}}>IA</span></h1>
        <p style={st.authSub}>CRM Inteligente para Clínicas</p>
        <form onSubmit={handleAuth} style={st.form}>
          <input type="email" placeholder="E-mail" style={st.input} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" style={st.input} onChange={e=>setPassword(e.target.value)} required />
          <button style={st.btnPrimary}>{isRegistering ? 'Criar minha conta' : 'Entrar no Sistema'}</button>
        </form>
        <button onClick={()=>setIsRegistering(!isRegistering)} style={st.btnLink}>
          {isRegistering ? 'Já tenho acesso' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={st.dashboardWrapper}>
      <nav style={st.nav}>
        <div style={st.logoTextNav}>KLINNI<span>IA</span></div>
        <div style={st.navActions}>
          <button onClick={()=>setView('dashboard')} style={view==='dashboard'?st.navBtnActive:st.navBtn}>Leads</button>
          <button onClick={()=>setView('novoLead')} style={view==='novoLead'?st.navBtnActive:st.navBtn}>+ Novo Lead</button>
          <button onClick={()=>signOut(auth)} style={st.btnSair}>Sair</button>
        </div>
      </nav>

      <main style={st.main}>
        {view === 'dashboard' ? (
          <>
            <div style={st.welcomeArea}>
              <h2 style={st.mainTitle}>Gestão de Oportunidades</h2>
              <p style={st.mainSub}>Filtro atual: Salvador, BA</p>
            </div>

            <div style={st.grid}>
              {leads.length === 0 ? (
                <div style={st.emptyCard}>
                  <div style={st.emptyIcon}>📂</div>
                  <h3>Sua base está limpa</h3>
                  <p>Cadastre seu primeiro lead para começar a triagem.</p>
                </div>
              ) : leads.map(l => (
                <div key={l.id} style={l.categoria==='HIGH TICKET'?st.cardHigh:st.card}>
                  <div style={st.cardHeader}>
                    <span style={st.tag}>{l.status}</span>
                    <span style={l.categoria==='HIGH TICKET'?st.badgeGold:st.badge}>{l.categoria}</span>
                  </div>
                  <h3 style={st.leadName}>{l.nome}</h3>
                  <div style={st.leadMeta}>
                    <span>📍 {l.cep}</span>
                    <span>🎂 {l.idade} anos</span>
                  </div>
                  <div style={st.cardAction}>Ver Detalhes</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={st.formWrapper}>
            <div style={st.formCard}>
              <h2 style={{marginBottom:'20px'}}>Novo Cadastro</h2>
              <form onSubmit={handleNovoLead} style={st.form}>
                <input placeholder="Nome Completo" style={st.input} value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required />
                <input placeholder="CEP (ex: 40140000)" style={st.input} value={cepLead} onChange={e=>setCepLead(e.target.value)} required />
                <input placeholder="Idade" type="number" style={st.input} value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required />
                <button style={st.btnPrimary}>Classificar com IA</button>
                <button type="button" onClick={()=>setView('dashboard')} style={st.btnLink}>Voltar</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const st = {
  fullPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', background: '#f8fafc' },
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #0070f3 0%, #00a3ff 100%)' },
  authCard: { background: '#fff', padding: '50px', borderRadius: '30px', textAlign: 'center', width: '380px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  logoText: { color: '#0070f3', fontSize: '36px', marginBottom: '5px', letterSpacing: '-1px' },
  authSub: { color: '#64748b', marginBottom: '30px', fontSize: '14px' },
  dashboardWrapper: { minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 60px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', sticky: 'top', borderBottom: '1px solid #e2e8f0' },
  logoTextNav: { fontSize: '22px', fontWeight: '800', color: '#0070f3' },
  navActions: { display: 'flex', gap: '25px', alignItems: 'center' },
  navBtn: { border: 'none', background: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  navBtnActive: { border: 'none', background: 'none', color: '#0070f3', fontWeight: '800', cursor: 'pointer', fontSize: '15px', borderBottom: '2px solid #0070f3' },
  btnSair: { color: '#ef4444', border: '1px solid #fee2e2', background: '#fff', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer' },
  main: { padding: '40px 60px' },
  welcomeArea: { marginBottom: '40px' },
  mainTitle: { fontSize: '28px', color: '#1e293b', marginBottom: '5px' },
  mainSub: { color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  card: { background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: '0.3s' },
  cardHigh: { background: '#fff', padding: '25px', borderRadius: '20px', border: '2px solid #fbbf24', boxShadow: '0 10px 20px rgba(251,191,36,0.1)', position: 'relative', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  tag: { fontSize: '10px', fontWeight: '800', color: '#0070f3', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' },
  badge: { fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' },
  badgeGold: { fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' },
  leadName: { fontSize: '20px', color: '#1e293b', marginBottom: '10px' },
  leadMeta: { display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '13px', marginBottom: '20px' },
  cardAction: { textAlign: 'center', padding: '10px', borderTop: '1px solid #f1f5f9', color: '#0070f3', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  emptyCard: { gridColumn: '1/-1', textAlign: 'center', padding: '80px', background: '#fff', borderRadius: '30px', border: '2px dashed #e2e8f0' },
  emptyIcon: { fontSize: '50px', marginBottom: '20px' },
  formWrapper: { display: 'flex', justifyContent: 'center' },
  formCard: { background: '#fff', padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '16px' },
  btnPrimary: { padding: '15px', borderRadius: '12px', border: 'none', background: '#0070f3', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,112,243,0.3)' },
  btnLink: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginTop: '10px' }
};

export default App;
