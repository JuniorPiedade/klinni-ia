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
  // States de Sessão e App
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // States de Formulário (Auth e Cadastro)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Observer de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync de Dados em Tempo Real (Firestore)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "leads"), 
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Erro no Snapshot:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Handler: Autenticação
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Falha na autenticação: Verifique suas credenciais.");
    }
  };

  // Handler: Cadastro de Lead (Triagem Inteligente)
  const handleNovoLead = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    // Regra de Triagem de Salvador
    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) 
      ? "HIGH TICKET" 
      : "Ticket Médio";
    
    setIsSaving(true);

    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead,
        cep: cepLead,
        idade: idadeLead,
        categoria: categoria,
        status: "NOVO LEAD",
        userId: user.uid,
        createdAt: serverTimestamp() // Uso de serverTimestamp para precisão
      });

      // Fluxo de Confirmação Profissional
      alert(`✅ SUCESSO!\n\nPaciente: ${nomeLead}\nClassificação: ${categoria}`);
      
      // Reset de estado após o OK do usuário
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      setView('dashboard');
    } catch (err) {
      console.error(err);
      alert("Erro crítico ao salvar no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculos de KPI
  const totalLeads = leads.length;
  const highTicketLeads = leads.filter(l => l.categoria === 'HIGH TICKET').length;
  const porcentagemHigh = totalLeads > 0 ? Math.round((highTicketLeads / totalLeads) * 100) : 0;

  if (loading) return <div style={st.fullPage}>Iniciando Klinni IA...</div>;

  if (!user) return (
    <div style={st.authPage}>
      <div style={st.authCard}>
        <h1 style={st.logoText}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h1>
        <p style={st.authSub}>CRM Inteligente para Clínicas</p>
        <form onSubmit={handleAuth} style={st.form}>
          <input type="email" placeholder="E-mail" style={st.input} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" style={st.input} onChange={e=>setPassword(e.target.value)} required />
          <button style={st.btnPrimary}>{isRegistering ? 'Criar Conta' : 'Acessar Sistema'}</button>
        </form>
        <button onClick={()=>setIsRegistering(!isRegistering)} style={st.btnLink}>
          {isRegistering ? 'Já tenho acesso' : 'Solicitar Cadastro'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={st.dashboardWrapper}>
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
              <h2 style={st.mainTitle}>Visão Geral da Operação</h2>
              <p style={st.mainSub}>Salvador, BA</p>
            </div>

            <div style={st.kpiRow}>
              <div style={st.kpiCard}>
                <span style={st.kpiLabel}>Base Total</span>
                <span style={st.kpiValue}>{totalLeads}</span>
              </div>
              <div style={st.kpiCardGold}>
                <span style={st.kpiLabel}>Potencial High Ticket</span>
                <span style={st.kpiValueGold}>{highTicketLeads}</span>
              </div>
              <div style={st.chartCard}>
                <div style={{...st.donut, backgroundImage: `conic-gradient(#d4af37 ${porcentagemHigh}%, #eff6ff ${porcentagemHigh}%)`}}>
                  <div style={st.donutCenter}>{porcentagemHigh}%</div>
                </div>
              </div>
            </div>

            <div style={st.grid}>
              {leads.length === 0 ? (
                <div style={st.emptyCard}>Aguardando novos leads...</div>
              ) : leads.map(l => (
                <div key={l.id} style={l.categoria==='HIGH TICKET'?st.cardHigh:st.card}>
                  <div style={st.cardHeader}>
                    <span style={st.tag}>{l.status}</span>
                    <span style={l.categoria==='HIGH TICKET'?st.badgeGold:st.badge}>{l.categoria}</span>
                  </div>
                  <h3 style={st.leadName}>{l.nome}</h3>
                  <div style={st.leadMeta}>
                    <span>📍 CEP {l.cep}</span>
                    <span>🎂 {l.idade} anos</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={st.formWrapper}>
            <div style={st.formCard}>
              <h2 style={{marginBottom:'25px', color: '#1e293b'}}>Cadastrar Oportunidade</h2>
              <form onSubmit={handleNovoLead} style={st.form}>
                <input placeholder="Nome Completo" style={st.input} value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required />
                <input placeholder="CEP (ex: 40140000)" style={st.input} value={cepLead} onChange={e=>setCepLead(e.target.value)} required />
                <input placeholder="Idade" type="number" style={st.input} value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required />
                <button type="submit" style={st.btnPrimary} disabled={isSaving}>
                  {isSaving ? 'Processando...' : 'Classificar com IA'}
                </button>
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
  fullPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', background: '#f8fafc', color: '#0070f3' },
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #0070f3 0%, #1e293b 100%)' },
  authCard: { background: '#fff', padding: '50px', borderRadius: '30px', textAlign: 'center', width: '380px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' },
  logoText: { color: '#0070f3', fontSize: '38px', marginBottom: '5px', letterSpacing: '-1.5px', fontWeight: '800' },
  authSub: { color: '#64748b', marginBottom: '35px', fontSize: '15px' },
  dashboardWrapper: { minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 60px', background: '#fff', borderBottom: '1px solid #e2e8f0' },
  logoTextNav: { fontSize: '24px', fontWeight: '800', color: '#0070f3' },
  navActions: { display: 'flex', gap: '25px' },
  navBtn: { border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600' },
  navBtnActive: { border: 'none', background: 'none', color: '#0070f3', fontWeight: '800', borderBottom: '2px solid #0070f3' },
  btnSair: { color: '#ef4444', border: '1px solid #fee2e2', background: '#fff', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer' },
  main: { padding: '50px 60px' },
  welcomeArea: { marginBottom: '40px' },
  mainTitle: { fontSize: '32px', color: '#1e293b', fontWeight: '800' },
  mainSub: { color: '#64748b', fontSize: '16px' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '30px' },
  kpiCard: { background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  kpiCardGold: { background: '#fff', padding: '25px', borderRadius: '20px', border: '2px solid #fbbf24' },
  kpiLabel: { color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' },
  kpiValue: { color: '#0070f3', fontSize: '48px', fontWeight: '800' },
  kpiValueGold: { color: '#d4af37', fontSize: '48px', fontWeight: '800' },
  chartCard: { background: '#fff', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  donut: { width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  donutCenter: { width: '55px', height: '55px', background: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  card: { background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  cardHigh: { background: '#fff', padding: '25px', borderRadius: '20px', border: '2px solid #fbbf24', boxShadow: '0 10px 25px rgba(251,191,36,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  tag: { fontSize: '10px', fontWeight: '800', color: '#0070f3', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' },
  badgeGold: { fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' },
  badge: { fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' },
  leadName: { fontSize: '22px', color: '#1e293b', fontWeight: '700' },
  leadMeta: { display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '14px' },
  emptyCard: { gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '20px', color: '#64748b' },
  formWrapper: { display: 'flex', justifyContent: 'center' },
  formCard: { background: '#fff', padding: '45px', borderRadius: '30px', width: '100%', maxWidth: '480px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  input: { padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '16px' },
  btnPrimary: { padding: '16px', borderRadius: '12px', border: 'none', background: '#0070f3', color: '#fff', fontWeight: '700', cursor: 'pointer' },
  btnLink: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginTop: '10px' }
};
