import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";

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

  // Estado da mensagem de confirmação
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
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
    } catch (err) { alert("Acesso negado."); }
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
      
      // EXIBIR CONFIRMAÇÃO IMEDIATA
      setShowSuccess(true);
      
      // Limpar campos
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      
      // Esperar 2.5 segundos para o usuário ler e então voltar à dash
      setTimeout(() => {
        setShowSuccess(false);
        setView('dashboard');
      }, 2500);

    } catch (err) { 
      alert("Erro ao salvar lead."); 
    }
  };

  const totalLeads = leads.length;
  const highTicketLeads = leads.filter(l => l.categoria === 'HIGH TICKET').length;
  const porcentagemHigh = totalLeads > 0 ? Math.round((highTicketLeads / totalLeads) * 100) : 0;

  if (loading) return <div style={st.fullPage}>Carregando Klinni...</div>;

  if (!user) return (
    <div style={st.authPage}>
      <div style={st.authCard}>
        <h1 style={st.logoText}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h1>
        <form onSubmit={handleAuth} style={st.form}>
          <input type="email" placeholder="E-mail" style={st.input} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" style={st.input} onChange={e=>setPassword(e.target.value)} required />
          <button style={st.btnPrimary}>{isRegistering ? 'Cadastrar' : 'Acessar'}</button>
        </form>
        <button onClick={()=>setIsRegistering(!isRegistering)} style={st.btnLink}>
          {isRegistering ? 'Voltar ao Login' : 'Criar Conta'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={st.dashboardWrapper}>
      {/* MENSAGEM DE SUCESSO FLUTUANTE (OVERLAY) */}
      {showSuccess && (
        <div style={st.overlay}>
          <div style={st.successCard}>
            <div style={st.successIcon}>✓</div>
            <h2 style={{color: '#065f46', margin: '10px 0'}}>Lead Cadastrado!</h2>
            <p style={{color: '#047857'}}>A triagem foi concluída com sucesso.</p>
          </div>
        </div>
      )}

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
              <h2 style={st.mainTitle}>Visão Geral</h2>
              <p style={st.mainSub}>Salvador, BA</p>
            </div>

            <div style={st.kpiRow}>
              <div style={st.kpiCard}><span style={st.kpiLabel}>Total</span><span style={st.kpiValue}>{totalLeads}</span></div>
              <div style={st.kpiCardGold}><span style={st.kpiLabel}>High Ticket</span><span style={st.kpiValueGold}>{highTicketLeads}</span></div>
              <div style={st.chartCard}>
                <div style={st.chartFlex}>
                  <div style={{...st.donut, backgroundImage: `conic-gradient(#d4af37 ${porcentagemHigh}%, #eff6ff ${porcentagemHigh}%)`}}>
                    <div style={st.donutCenter}>{porcentagemHigh}%</div>
                  </div>
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
                <button type="submit" style={st.btnPrimary}>Salvar e Triar</button>
                <button type="button" onClick={()=>setView('dashboard')} style={st.btnLink}>Cancelar</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const st = {
  // Estilos base mantidos
  fullPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' },
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0070f3' },
  authCard: { background: '#fff', padding: '40px', borderRadius: '20px', textAlign: 'center', width: '320px' },
  logoText: { color: '#0070f3', fontSize: '32px', fontWeight: '800' },
  dashboardWrapper: { minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 40px', background: '#fff', borderBottom: '1px solid #ddd' },
  logoTextNav: { fontSize: '20px', fontWeight: '800', color: '#0070f3' },
  navActions: { display: 'flex', gap: '20px' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  navBtnActive: { border: 'none', background: 'none', color: '#0070f3', fontWeight: 'bold', borderBottom: '2px solid #0070f3' },
  btnSair: { color: 'red', border: 'none', background: 'none', cursor: 'pointer' },
  main: { padding: '30px 40px' },
  kpiRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  kpiCard: { background: '#fff', padding: '20px', borderRadius: '15px', flex: 1 },
  kpiCardGold: { background: '#fff', padding: '20px', borderRadius: '15px', flex: 1, border: '1px solid gold' },
  kpiValue: { fontSize: '30px', fontWeight: 'bold', display: 'block' },
  kpiValueGold: { fontSize: '30px', fontWeight: 'bold', display: 'block', color: 'gold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#fff', padding: '20px', borderRadius: '15px' },
  cardHigh: { background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid gold' },
  formWrapper: { display: 'flex', justifyContent: 'center' },
  formCard: { background: '#fff', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd' },
  btnPrimary: { padding: '12px', borderRadius: '8px', border: 'none', background: '#0070f3', color: '#fff', cursor: 'pointer' },
  btnLink: { background: 'none', border: 'none', color: '#666', cursor: 'pointer' },
  donut: { width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  donutCenter: { width: '40px', height: '40px', background: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' },

  // ESTILOS DO OVERLAY DE SUCESSO (O QUE ESTAVA FALTANDO)
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 9999
  },
  successCard: {
    background: '#fff', padding: '40px', borderRadius: '25px',
    textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    animation: 'popIn 0.3s ease-out'
  },
  successIcon: {
    width: '50px', height: '50px', background: '#d1fae5',
    color: '#059669', borderRadius: '50%', display: 'flex',
    justifyContent: 'center', alignItems: 'center', margin: '0 auto',
    fontSize: '24px', fontWeight: 'bold'
  }
};

export default App;
