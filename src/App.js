import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";

// --- CONFIGURAÇÃO FIREBASE ---
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
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); 
  const [leads, setLeads] = useState([]);
  const [editingLead, setEditingLead] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // States de Formulários
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CRC');
  const [isRegistering, setIsRegistering] = useState(false);

  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');

  // Monitorar Auth e Perfil de Cargo
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
        setUser(u);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Monitorar Leads em tempo real
  useEffect(() => {
    if (user) {
      const q = query(collection(db, "leads"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
      return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { email, role });
        setUserData({ email, role });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { alert("Falha na autenticação."); }
  };

  const saveLead = async (e) => {
    e.preventDefault();
    const nobres = ['40140', '41940', '40080', '41810', '41820'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";

    try {
      if (editingLead) {
        await updateDoc(doc(db, "leads", editingLead.id), { nome: nomeLead, cep: cepLead, idade: idadeLead, categoria });
        setSuccessMsg("Lead atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "leads"), {
          nome: nomeLead, cep: cepLead, idade: idadeLead, categoria,
          status: "PENDENTE", ownerId: user.uid, createdAt: new Date()
        });
        setSuccessMsg("Novo lead qualificado com sucesso!");
      }
      setTimeout(() => { setSuccessMsg(''); setView('dashboard'); }, 2000);
      setNomeLead(''); setCepLead(''); setIdadeLead(''); setEditingLead(null);
    } catch (err) { alert("Erro ao salvar."); }
  };

  const updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, "leads", id), { status: newStatus });
  };

  const editLead = (lead) => {
    setEditingLead(lead);
    setNomeLead(lead.nome);
    setCepLead(lead.cep);
    setIdadeLead(lead.idade);
    setView('novoLead');
  };

  // Cálculos da Dash
  const total = leads.length;
  const high = leads.filter(l => l.categoria === 'HIGH TICKET').length;
  const percHigh = total > 0 ? Math.round((high / total) * 100) : 0;

  if (loading) return <div style={st.fullPage}>Sincronizando Klinni IA...</div>;

  if (!user) return (
    <div style={st.authPage}>
      <div style={st.authCard}>
        <h1 style={st.logoText}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h1>
        <form onSubmit={handleAuth} style={st.form}>
          <input type="email" placeholder="E-mail" style={st.input} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" style={st.input} onChange={e=>setPassword(e.target.value)} required />
          {isRegistering && (
            <select style={st.input} onChange={e=>setRole(e.target.value)}>
              <option value="CRC">Cargo: CRC (Operacional)</option>
              <option value="GESTOR">Cargo: GESTOR (Administrativo)</option>
            </select>
          )}
          <button style={st.btnPrimary}>{isRegistering ? 'Cadastrar Colaborador' : 'Acessar CRM'}</button>
        </form>
        <button onClick={()=>setIsRegistering(!isRegistering)} style={st.btnLink}>
          {isRegistering ? 'Voltar' : 'Criar novo acesso de cargo'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={st.app}>
      <nav style={st.nav}>
        <div style={st.logoNav} onClick={()=>setView('home')}>KLINNI <span>IA</span></div>
        <div style={st.navActions}>
          <button onClick={()=>setView('dashboard')} style={view==='dashboard'?st.active:st.navBtn}>Dashboard</button>
          <button onClick={()=>setView('novoLead')} style={view==='novoLead'?st.active:st.navBtn}>+ Novo Lead</button>
          <button onClick={()=>signOut(auth)} style={st.btnSair}>Sair</button>
        </div>
      </nav>

      <main style={st.main}>
        {successMsg && <div style={st.toast}>{successMsg}</div>}

        {view === 'home' && (
          <div style={st.home}>
            <h1 style={st.title}>Olá, {userData?.role === 'GESTOR' ? 'Gestor' : 'Consultor CRC'} 🚀</h1>
            <p style={st.sub}>"{userData?.role === 'GESTOR' ? 'Vamos organizar seus leads hoje?' : 'Pronto para bater as metas de vendas hoje?'}"</p>
            <div style={st.homeGrid}>
              <button style={st.homeCard} onClick={()=>setView('dashboard')}>📊 Acessar Dashboard</button>
              <button style={st.homeCard} onClick={()=>setView('novoLead')}>➕ Cadastrar Lead</button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <>
            <div style={st.kpiRow}>
              <div style={st.kpi}><span>Leads</span><strong>{total}</strong></div>
              <div style={st.kpiGold}><span>High Ticket</span><strong>{high}</strong></div>
              <div style={st.chart}>
                <div style={{...st.donut, backgroundImage: `conic-gradient(#d4af37 ${percHigh}%, #e2e8f0 ${percHigh}%)`}}>
                  <div style={st.donutIn}>{percHigh}%</div>
                </div>
                <small>Qualificação</small>
              </div>
            </div>

            <div style={st.grid}>
              {leads.map(l => (
                <div key={l.id} style={l.categoria==='HIGH TICKET'?st.cardGold:st.card}>
                  <div style={st.cardHead}>
                    <select 
                      style={{...st.statusSelect, backgroundColor: l.status==='EM TRATAMENTO'?'#22c55e':l.status==='PENDENTE'?'#eab308':'#000'}} 
                      value={l.status} 
                      onChange={(e)=>updateStatus(l.id, e.target.value)}
                    >
                      <option value="PENDENTE">🟡 PENDENTE</option>
                      <option value="EM TRATAMENTO">🟢 TRATAMENTO</option>
                      <option value="DESISTIU">⚫ DESISTIU</option>
                    </select>
                    <button onClick={()=>editLead(l)} style={st.editBtn}>✏️</button>
                  </div>
                  <h3>{l.nome}</h3>
                  <small>📍 {l.cep} | {l.categoria}</small>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'novoLead' && (
          <div style={st.formBox}>
            <h2>{editingLead ? 'Editar Cadastro' : 'Novo Cadastro Inteligente'}</h2>
            <form onSubmit={saveLead} style={st.form}>
              <input placeholder="Nome" style={st.input} value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required />
              <input placeholder="CEP" style={st.input} value={cepLead} onChange={e=>setCepLead(e.target.value)} required />
              <input placeholder="Idade" type="number" style={st.input} value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required />
              <button style={st.btnPrimary}>{editingLead ? 'Salvar Alterações' : 'Classificar com IA'}</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

const st = {
  fullPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f8fafc', color:'#0070f3', fontFamily:'sans-serif' },
  authPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#0070f3' },
  authCard: { background:'#fff', padding:'40px', borderRadius:'24px', textAlign:'center', width:'350px' },
  logoText: { color:'#0070f3', fontSize:'32px', marginBottom:'20px' },
  app: { minHeight:'100vh', background:'#f1f5f9', fontFamily:'sans-serif' },
  nav: { display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'#fff', borderBottom:'1px solid #e2e8f0' },
  logoNav: { fontSize:'22px', fontWeight:'800', color:'#0070f3', cursor:'pointer' },
  navBtn: { border:'none', background:'none', color:'#64748b', cursor:'pointer', marginLeft:'20px', fontWeight:'600' },
  active: { border:'none', background:'none', color:'#0070f3', cursor:'pointer', marginLeft:'20px', fontWeight:'800', borderBottom:'2px solid #0070f3' },
  btnSair: { color:'red', border:'1px solid #fee2e2', padding:'5px 15px', borderRadius:'8px', background:'#fff', cursor:'pointer', marginLeft:'20px' },
  main: { padding:'40px 50px' },
  toast: { position:'fixed', top:'20px', right:'20px', background:'#22c55e', color:'#fff', padding:'15px 25px', borderRadius:'12px', boxShadow:'0 10px 20px rgba(0,0,0,0.1)', zIndex:9999 },
  home: { textAlign:'center', marginTop:'50px' },
  title: { fontSize:'36px', color:'#1e293b' },
  sub: { color:'#64748b', fontSize:'18px', marginBottom:'40px' },
  homeGrid: { display:'flex', gap:'20px', justifyContent:'center' },
  homeCard: { padding:'30px 50px', background:'#fff', borderRadius:'20px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.05)', cursor:'pointer', fontSize:'18px', fontWeight:'700', color:'#0070f3' },
  kpiRow: { display:'flex', gap:'20px', marginBottom:'40px', alignItems:'center' },
  kpi: { background:'#fff', padding:'20px', borderRadius:'20px', flex:1, boxShadow:'0 2px 10px rgba(0,0,0,0.02)' },
  kpiGold: { background:'#fff', padding:'20px', borderRadius:'20px', flex:1, border:'2px solid #fbbf24' },
  chart: { display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' },
  donut: { width:'80px', height:'80px', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center' },
  donutIn: { width:'60px', height:'60px', background:'#f1f5f9', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'bold' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px' },
  card: { background:'#fff', padding:'20px', borderRadius:'20px', boxShadow:'0 4px 10px rgba(0,0,0,0.02)' },
  cardGold: { background:'#fff', padding:'20px', borderRadius:'20px', border:'2px solid #fbbf24' },
  cardHead: { display:'flex', justifyContent:'space-between', marginBottom:'15px' },
  statusSelect: { border:'none', color:'#fff', padding:'5px 10px', borderRadius:'8px', fontSize:'10px', fontWeight:'bold', cursor:'pointer' },
  editBtn: { background:'none', border:'none', cursor:'pointer' },
  formBox: { maxWidth:'450px', margin:'0 auto', background:'#fff', padding:'40px', borderRadius:'24px' },
  form: { display:'flex', flexDirection:'column', gap:'15px' },
  input: { padding:'15px', borderRadius:'12px', border:'1px solid #e2e8f0', background:'#f8fafc' },
  btnPrimary: { padding:'15px', borderRadius:'12px', border:'none', background:'#0070f3', color:'#fff', fontWeight:'700', cursor:'pointer' },
  btnLink: { background:'none', border:'none', color:'#64748b', cursor:'pointer', marginTop:'10px' }
};

export default App;
