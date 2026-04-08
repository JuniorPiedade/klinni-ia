import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy 
} from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE (DADOS DO SEU PROJETO) ---
const firebaseConfig = {
  apiKey: "AIzaSyBQRYB3vMi4QG34Pe9xQeNVpTJGS2hyD4", 
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

// --- COMPONENTE PRINCIPAL ---
function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('login'); // login, registro, dashboard, novoLead
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form de novo lead
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');

  // Monitorar Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) setView('dashboard');
    });
    return () => unsubscribe();
  }, []);

  // Monitorar Leads do Banco de Dados
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "leads"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeads(dados);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Lógica de Autenticação
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (view === 'registro') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert("Erro na autenticação: " + error.message);
    }
  };

  // Lógica de Cadastro de Lead com "Inteligência Klinni"
  const handleNovoLead = async (e) => {
    e.preventDefault();
    
    // Lógica High Ticket (Bairros Nobres de Salvador)
    const bairrosNobres = ['40140', '41940', '40080']; // Graça, Rio Vermelho, Vitória
    const prefixoCEP = cepLead.substring(0, 5);
    
    let categoria = "Ticket Médio";
    if (bairrosNobres.includes(prefixoCEP) && parseInt(idadeLead) >= 20) {
      categoria = "HIGH TICKET";
    }

    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead,
        cep: cepLead,
        idade: idadeLead,
        categoria: categoria,
        status: "NOVO LEAD",
        userId: user.uid,
        createdAt: new Date()
      });
      setView('dashboard');
      setNomeLead(''); setCepLead(''); setIdadeLead('');
    } catch (error) {
      alert("Erro ao salvar lead: " + error.message);
    }
  };

  if (loading) return <div style={styles.container}>Carregando Klinni IA...</div>;

  // --- TELA DE LOGIN / REGISTRO ---
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.logo}>KLINNI IA</h1>
          <p style={styles.subtitle}>{view === 'login' ? 'Entre no seu CRM' : 'Crie sua conta profissional'}</p>
          <form onSubmit={handleAuth} style={styles.form}>
            <input 
              type="email" placeholder="Seu e-mail" style={styles.input}
              value={email} onChange={(e) => setEmail(e.target.value)} required 
            />
            <input 
              type="password" placeholder="Sua senha" style={styles.input}
              value={password} onChange={(e) => setPassword(e.target.value)} required 
            />
            <button type="submit" style={styles.btnPrimary}>
              {view === 'login' ? 'Acessar Sistema' : 'Finalizar Cadastro'}
            </button>
          </form>
          <button onClick={() => setView(view === 'login' ? 'registro' : 'login')} style={styles.btnLink}>
            {view === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tenho conta. Voltar ao login'}
          </button>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div style={styles.dashboardContainer}>
      <nav style={styles.nav}>
        <span style={styles.navLogo}>KLINNI IA</span>
        <div>
          <button onClick={() => setView('dashboard')} style={styles.navBtn}>LEADS</button>
          <button onClick={() => setView('novoLead')} style={styles.navBtn}>+ NOVO</button>
          <button onClick={() => signOut(auth)} style={styles.btnSair}>Sair</button>
        </div>
      </nav>

      <div style={styles.content}>
        {view === 'dashboard' ? (
          <>
            <h2>Gestão de Oportunidades</h2>
            <div style={styles.grid}>
              {leads.length === 0 ? <p>Nenhum lead cadastrado ainda.</p> : leads.map(lead => (
                <div key={lead.id} style={lead.categoria === 'HIGH TICKET' ? styles.cardHigh : styles.cardLead}>
                  <div style={styles.cardHeader}>
                    <strong>{lead.nome}</strong>
                    <span style={styles.badge}>{lead.categoria}</span>
                  </div>
                  <p>Status: {lead.status}</p>
                  <p>Localidade (CEP): {lead.cep}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={styles.cardForm}>
            <h2>Cadastrar Novo Lead</h2>
            <form onSubmit={handleNovoLead} style={styles.form}>
              <input placeholder="Nome do Paciente/Cliente" style={styles.input} value={nomeLead} onChange={e => setNomeLead(e.target.value)} required />
              <input placeholder="CEP (Apenas números)" style={styles.input} value={cepLead} onChange={e => setCepLead(e.target.value)} required />
              <input placeholder="Idade" type="number" style={styles.input} value={idadeLead} onChange={e => setIdadeLead(e.target.value)} required />
              <button type="submit" style={styles.btnPrimary}>Salvar e Classificar</button>
              <button type="button" onClick={() => setView('dashboard')} style={styles.btnLink}>Cancelar</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS (AESTHETIC CLEAN & FUTURISTIC) ---
const styles = {
  container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
  dashboardContainer: { minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' },
  card: { padding: '40px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width: '350px' },
  logo: { color: '#0070f3', fontSize: '28px', marginBottom: '10px', letterSpacing: '2px' },
  subtitle: { color: '#666', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' },
  btnPrimary: { padding: '12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  btnLink: { marginTop: '15px', backgroundColor: 'transparent', border: 'none', color: '#0070f3', cursor: 'pointer' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#fff', borderBottom: '1px solid #eee' },
  navLogo: { fontWeight: 'bold', color: '#0070f3', fontSize: '20px' },
  navBtn: { marginLeft: '15px', border: 'none', backgroundColor: 'transparent', color: '#333', fontWeight: 'bold', cursor: 'pointer' },
  btnSair: { marginLeft: '15px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #ff4d4f', color: '#ff4d4f', backgroundColor: 'transparent', cursor: 'pointer' },
  content: { padding: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  cardLead: { padding: '20px', backgroundColor: '#fff', borderRadius: '10px', borderLeft: '5px solid #ccc', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  cardHigh: { padding: '20px', backgroundColor: '#fff', borderRadius: '10px', borderLeft: '5px solid #ffcc00', boxShadow: '0 4px 10px rgba(255, 204, 0, 0.2)', backgroundImage: 'linear-gradient(to right, #fffcf0, #fff)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  badge: { fontSize: '10px', backgroundColor: '#eee', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' },
  cardForm: { maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
};

export default App;
