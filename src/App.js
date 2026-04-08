import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('login'); 
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form de novo lead
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) setView('dashboard');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeads(dados);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (view === 'registro') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert("Erro: " + error.message);
    }
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();
    const bairrosNobres = ['40140', '41940', '40080', '41810', '41820']; // Graça, Rio Vermelho, Vitória, Pituba
    const prefixoCEP = cepLead.substring(0, 5);
    let categoria = (bairrosNobres.includes(prefixoCEP) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";

    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, cep: cepLead, idade: idadeLead, categoria: categoria,
        status: "NOVO LEAD", userId: user.uid, createdAt: new Date()
      });
      setView('dashboard');
      setNomeLead(''); setCepLead(''); setIdadeLead('');
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  if (loading) return <div style={styles.container}>Carregando Klinni IA...</div>;

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.logo}>KLINNI IA</h1>
          <form onSubmit={handleAuth} style={styles.form}>
            <input type="email" placeholder="E-mail" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Senha" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" style={styles.btnPrimary}>{view === 'login' ? 'Entrar' : 'Cadastrar'}</button>
          </form>
          <button onClick={() => setView(view === 'login' ? 'registro' : 'login')} style={styles.btnLink}>
            {view === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboardContainer}>
      <nav style={styles.nav}>
        <span style={styles.navLogo}>KLINNI IA</span>
        <div>
          <button onClick={() => setView('dashboard')} style={styles.navBtn}>DASHBOARD</button>
          <button onClick={() => setView('novoLead')} style={styles.navBtn}>+ NOVO LEAD</button>
          <button onClick={() => signOut(auth)} style={styles.btnSair}>Sair</button>
        </div>
      </nav>
      <div style={styles.content}>
        {view === 'dashboard' ? (
          <div style={styles.grid}>
            {leads.map(lead => (
              <div key={lead.id} style={lead.categoria === 'HIGH TICKET' ? styles.cardHigh : styles.cardLead}>
                <strong>{lead.nome}</strong> - <small>{lead.categoria}</small>
                <p>Status: {lead.status} | CEP: {lead.cep}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.cardForm}>
            <h2>Novo Lead</h2>
            <form onSubmit={handleNovoLead} style={styles.form}>
              <input placeholder="Nome" style={styles.input} value={nomeLead} onChange={e => setNomeLead(e.target.value)} required />
              <input placeholder="CEP" style={styles.input} value={cepLead} onChange={e => setCepLead(e.target.value)} required />
              <input placeholder="Idade" type="number" style={styles.input} value={idadeLead} onChange={e => setIdadeLead(e.target.value)} required />
              <button type="submit" style={styles.btnPrimary}>Classificar Lead</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
  dashboardContainer: { minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' },
  card: { padding: '40px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width: '320px' },
  logo: { color: '#0070f3', fontSize: '28px', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd' },
  btnPrimary: { padding: '12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnLink: { marginTop: '10px', backgroundColor: 'transparent', border: 'none', color: '#0070f3', cursor: 'pointer' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 30px', backgroundColor: '#fff', borderBottom: '1px solid #eee' },
  navLogo: { fontWeight: 'bold', color: '#0070f3' },
  navBtn: { marginLeft: '15px', border: 'none', cursor: 'pointer', background: 'none' },
  btnSair: { color: 'red', border: 'none', cursor: 'pointer', background: 'none', marginLeft: '10px' },
  content: { padding: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' },
  cardLead: { padding: '15px', backgroundColor: '#fff', borderRadius: '8px', borderLeft: '4px solid #ccc' },
  cardHigh: { padding: '15px', backgroundColor: '#fff', borderRadius: '8px', borderLeft: '4px solid #ffcc00', boxShadow: '0 2px 8px rgba(255,204,0,0.3)' },
  cardForm: { maxWidth: '400px', margin: '0 auto', backgroundColor: '#fff', padding: '20px', borderRadius: '8px' }
};

export default App;
