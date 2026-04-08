import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";

// --- CONFIGURAÇÃO KLINNI IA ---
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
  
  // States para Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // States para Novo Lead
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error) { alert("Erro na autenticação: " + error.message); }
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();
    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760']; // Graça, RV, Vitória, Pituba, Caminho das Árvores
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";

    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, cep: cepLead, idade: idadeLead, categoria,
        status: "NOVO LEAD", userId: user.uid, createdAt: new Date()
      });
      setView('dashboard');
      setNomeLead(''); setCepLead(''); setIdadeLead('');
    } catch (error) { alert("Erro ao salvar: " + error.message); }
  };

  if (loading) return <div style={styles.loading}>Iniciando Klinni IA...</div>;

  if (!user) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h1 style={styles.brandLogo}>KLINNI <span style={{fontWeight: 300}}>IA</span></h1>
          <form onSubmit={handleAuth} style={styles.form}>
            <input type="email" placeholder="E-mail profissional" style={styles.input} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Senha" style={styles.input} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" style={styles.btnMain}>{isRegistering ? 'Criar Conta' : 'Acessar Sistema'}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} style={styles.btnSecondary}>
            {isRegistering ? 'Já tenho acesso' : 'Solicitar novo acesso'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>KLINNI IA</div>
        <div style={styles.navLinks}>
          <button onClick={() => setView('dashboard')} style={view === 'dashboard' ? styles.navActive : styles.navBtn}>Dashboard</button>
          <button onClick={() => setView('novoLead')} style={view === 'novoLead' ? styles.navActive : styles.navBtn}>+ Novo Lead</button>
          <button onClick={() => signOut(auth)} style={styles.btnExit}>Sair</button>
        </div>
      </nav>

      <main style={styles.mainContent}>
        {view === 'dashboard' ? (
          <>
            <header style={styles.header}>
              <h2>Gestão de Leads</h2>
              <p>Acompanhe suas oportunidades em Salvador</p>
            </header>
            <div style={styles.grid}>
              {leads.length === 0 ? (
                <div style={styles.empty}>Nenhum lead cadastrado. Comece no botão "+ Novo Lead".</div>
              ) : leads.map(lead => (
                <div key={lead.id} style={lead.categoria === 'HIGH TICKET' ? styles.cardHigh : styles.cardLead}>
                  <div style={styles.cardInfo}>
                    <span style={styles.statusTag}>{lead.status}</span>
                    <h3>{lead.nome}</h3>
                    <p>📍 CEP: {lead.cep} | {lead.idade} anos</p>
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={lead.categoria === 'HIGH TICKET' ? styles.badgeGold : styles.badgeNormal}>
                      {lead.categoria}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={styles.formContainer}>
            <div style={styles.formCard}>
              <h2>Novo Lead</h2>
              <form onSubmit={handleNovoLead} style={styles.form}>
                <label style={styles.label}>Nome do Paciente</label>
                <input style={styles.input} value={nomeLead} onChange={e => setNomeLead(e.target.value)} required />
                <label style={styles.label}>CEP</label>
                <input style={styles.input} value={cepLead} onChange={e => setCepLead(e.target.value)} required />
                <label style={styles.label}>Idade</label>
                <input type="number" style={styles.input} value={idadeLead} onChange={e => setIdadeLead(e.target.value)} required />
                <button type="submit" style={styles.btnMain}>Salvar Oportunidade</button>
                <button type="button" onClick={() => setView('dashboard')} style={styles.btnSecondary}>Cancelar</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  loading: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0070f3', fontSize: '1.2rem' },
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f6' },
  loginCard: { padding: '40px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', width: '340px' },
  brandLogo: { color: '#0070f3', fontSize: '32px', marginBottom: '30px', letterSpacing: '1px' },
  appContainer: { minHeight: '100vh', backgroundColor: '#f4f7f6' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 50px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  navBrand: { fontSize: '20px', fontWeight: 'bold', color: '#0070f3' },
  navLinks: { display: 'flex', gap: '20px', alignItems: 'center' },
  navBtn: { border: 'none', background: 'none', color: '#666', cursor: 'pointer', fontWeight: '500' },
  navActive: { border: 'none', background: 'none', color: '#0070f3', cursor: 'pointer', fontWeight: 'bold', borderBottom: '2px solid #0070f3' },
  btnExit: { padding: '6px 15px', borderRadius: '8px', border: '1px solid #ff4d4f', color: '#ff4d4f', background: 'none', cursor: 'pointer' },
  mainContent: { padding: '40px 50px' },
  header: { marginBottom: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  cardLead: { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #eee' },
  cardHigh: { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 8px 20px rgba(255,204,0,0.15)', border: '1px solid #ffeeba', position: 'relative' },
  statusTag: { fontSize: '10px', color: '#0070f3', fontWeight: 'bold', textTransform: 'uppercase' },
  badgeGold: { backgroundColor: '#fff9e6', color: '#d4af37', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #ffeeba' },
  badgeNormal: { backgroundColor: '#f0f0f0', color: '#888', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' },
  formContainer: { display: 'flex', justifyContent: 'center' },
  formCard: { backgroundColor: '#fff', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  label: { fontSize: '14px', color: '#666', marginBottom: '-10px' },
  input: { padding: '12px', borderRadius: '10px', border: '1px solid #eee', backgroundColor: '#fafafa', fontSize: '16px' },
  btnMain: { padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#0070f3', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  btnSecondary: { background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', marginTop: '10px' }
};

export default App;
