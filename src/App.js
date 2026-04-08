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
  
  // States para Novo Lead
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');

  // --- NOVO ESTADO PARA MENSAGEM DE SUCESSO ---
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
      
      // --- LÓGICA DA MENSAGEM DE CONFIRMAÇÃO ---
      setShowSuccess(true);
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      
      // Esconde a mensagem e volta para dash após 2 segundos
      setTimeout(() => {
        setShowSuccess(false);
        setView('dashboard');
      }, 2000);

    } catch (err) { alert("Erro ao salvar lead."); }
  };

  const totalLeads = leads.length;
  const highTicketLeads = leads.filter(l => l.categoria === 'HIGH TICKET').length;
  const porcentagemHigh = totalLeads > 0 ? Math.round((highTicketLeads / totalLeads) * 100) : 0;

  if (loading) return <div style={st.fullPage}>Carregando Klinni...</div>;

  if (!user) return (
    <div style={st.authPage}>
      <div style={st.authCard}>
        <h1 style={st.logoText}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h1>
        <p style={st.authSub}>CRM Inteligente para Clínicas de Alto Padrão</p>
        <form onSubmit={handleAuth} style={st.form}>
          <input type="email" placeholder="E-mail profissional" style={st.input} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" style={st.input} onChange={e=>setPassword(e.target.value)} required />
          <button style={st.btnPrimary}>{isRegistering ? 'Criar minha conta' : 'Acessar Sistema'}</button>
        </form>
        <button onClick={()=>setIsRegistering(!isRegistering)} style={st.btnLink}>
          {isRegistering ? 'Já tenho acesso' : 'Não tem conta? Solicitar Cadastro'}
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
                <span style={st.kpiSub}>Leads Cadastrados</span>
              </div>
              <div style={st.kpiCardGold}>
                <span style={st.kpiLabel}>Potencial</span>
                <span style={st.kpiValueGold}>{highTicketLeads}</span>
                <span style={st.kpiSub}>Leads High Ticket</span>
              </div>
              
              <div style={st.chartCard}>
                <h4 style={st.chartTitle}>Qualificação da Base</h4>
                <div style={st.chartFlex}>
                  <div style={{...st.donut, backgroundImage: `conic-gradient(#d4af37 ${porcentagemHigh}%, #eff6ff ${porcentagemHigh}%)`}}>
                    <div style={st.donutCenter}>{porcentagemHigh}%</div>
                  </div>
                  <div style={st.chartLegend}>
                    <div style={st.legendItem}><span style={st.dotGold}></span> High Ticket</div>
                    <div style={st.legendItem}><span style={st.dotBlue}></span> Ticket Médio</div>
                  </div>
                </div>
              </div>
            </div>

            <h3 style={{marginTop:'40px', marginBottom:'20px', color: '#1e293b'}}>Últimas Oportunidades</h3>
            <div style={st.grid}>
              {leads.length === 0 ? (
                <div style={st.emptyCard}>
                  <h3>Nenhum lead em triagem</h3>
                  <p>Inicie o cadastro no botão "+ Novo Lead".</p>
                </div>
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
              {/* EXIBIÇÃO DA MENSAGEM DE SUCESSO */}
              {showSuccess ? (
                <div style={st.successMessage}>
                  <div style={st.successIcon}>✓</div>
                  <h2 style={{color: '#065f46'}}>Lead Criado com Sucesso!</h2>
                  <p style={{color: '#047857'}}>A triagem IA já classificou o paciente.</p>
                </div>
              ) : (
                <>
                  <h2 style={{marginBottom:'25px', color: '#1e293b'}}>Cadastrar Oportunidade</h2>
                  <form onSubmit={handleNovoLead} style={st.form}>
                    <input placeholder="Nome Completo do Paciente" style={st.input} value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required />
                    <input placeholder="CEP (ex: 40140000)" style={st.input} value={cepLead} onChange={e=>setCepLead(e.target.value)} required />
                    <input placeholder="Idade" type="number" style={st.input} value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required />
                    <button type="submit" style={st.btnPrimary}>Classificar com IA</button>
                    <button type="button" onClick={()=>setView('dashboard')} style={st.btnLink}>Voltar</button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const st = {
  // ... (Todos os estilos anteriores mantidos iguais) ...
  fullPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', background: '#f8fafc', color: '#0070f3' },
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #0070f3 0%, #1e293b 100%)' },
  authCard: { background: '#fff', padding: '50px', borderRadius: '30px', textAlign: 'center', width: '380px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' },
  logoText: { color: '#0070f3', fontSize: '38px', marginBottom: '5px', letterSpacing: '-1.5px', fontWeight: '800' },
  authSub: { color: '#64748b', marginBottom: '35px', fontSize: '15px' },
  dashboardWrapper: { minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 60px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', sticky: 'top', borderBottom: '1px solid #e2e8f0', zIndex: '1000' },
  logoTextNav: { fontSize: '24px', fontWeight: '800', color: '#0070f3' },
  navActions: { display: 'flex', gap: '25px', alignItems: 'center' },
  navBtn: { border: 'none', background: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '15px', padding: '10px 0' },
  navBtnActive: { border: 'none', background: 'none', color: '#0070f3', fontWeight: '800', cursor: 'pointer', fontSize: '15px', borderBottom: '2px solid #0070f3', padding: '10px 0' },
  btnSair: { color: '#ef4444', border: '1px solid #fee2e2', background: '#fff', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' },
  main: { padding: '50px 60px' },
  welcomeArea: { marginBottom: '40px' },
  mainTitle: { fontSize: '32px', color: '#1e293b', marginBottom: '5px', fontWeight: '800' },
  mainSub: { color: '#64748b', fontSize: '16px' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '30px' },
  kpiCard: { background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' },
  kpiCardGold: { background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(212,175,55,0.1)', border: '2px solid #fbbf24' },
  kpiLabel: { display: 'block', color: '#64748b', fontSize: '14px', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase' },
  kpiValue: { display: 'block', color: '#0070f3', fontSize: '48px', fontWeight: '800', marginBottom: '5px' },
  kpiValueGold: { display: 'block', color: '#d4af37', fontSize: '48px', fontWeight: '800', marginBottom: '5px' },
  kpiSub: { color: '#94a3b8', fontSize: '13px' },
  chartCard: { background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  chartTitle: { color: '#1e293b', marginBottom: '15px', fontSize: '16px' },
  chartFlex: { display: 'flex', alignItems: 'center', gap: '20px' },
  donut: { width: '100px', height: '100px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #e2e8f0', transition: '0.5s' },
  donutCenter: { width: '70px', height: '70px', background: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '20px', color: '#1e293b' },
  chartLegend: { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  dotGold: { width: '10px', height: '10px', background: '#d4af37', borderRadius: '50%' },
  dotBlue: { width: '10px', height: '10px', background: '#eff6ff', borderRadius: '50%', border: '1px solid #d4af37' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  card: { background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  cardHigh: { background: '#fff', padding: '25px', borderRadius: '20px', border: '2px solid #fbbf24', boxShadow: '0 10px 25px rgba(251,191,36,0.1)', position: 'relative' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  tag: { fontSize: '10px', fontWeight: '800', color: '#0070f3', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' },
  badge: { fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' },
  badgeGold: { fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' },
  leadName: { fontSize: '22px', color: '#1e293b', marginBottom: '10px', fontWeight: '700' },
  leadMeta: { display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '14px' },
  emptyCard: { gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#64748b' },
  formWrapper: { display: 'flex', justifyContent: 'center', paddingTop: '30px' },
  formCard: { background: '#fff', padding: '45px', borderRadius: '30px', width: '100%', maxWidth: '480px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  input: { padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '16px', textAlign: 'left' },
  btnPrimary: { padding: '16px', borderRadius: '12px', border: 'none', background: '#0070f3', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,112,243,0.3)' },
  btnLink: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginTop: '10px', fontSize: '15px' },
  
  // NOVOS ESTILOS PARA CONFIRMAÇÃO
  successMessage: { padding: '20px', animation: 'fadeIn 0.5s ease' },
  successIcon: { width: '60px', height: '60px', background: '#d1fae5', color: '#059669', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', margin: '0 auto 20px auto', fontWeight: 'bold' }
};

export default App;
