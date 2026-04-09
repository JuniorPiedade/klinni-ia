import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCv7kNOOa1AT71TmvwKLdwi8TyHHVh6htM",
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
  storageBucket: "klinni-ia.firebasestorage.app",
  messagingSenderId: "761229946691",
  appId: "1:761229946691:web:feeceb3caed42445be09f6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🎨 THEME NOVO
const theme = {
  primary: "#f97316", // laranja
  secondary: "#ea580c",
  bg: "#f3f4f6",
  card: "#ffffff",
  text: "#1f2937",
  gray: "#6b7280"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);

  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [aviso, setAviso] = useState({ visivel: false, texto: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // 🔥 REMOVI orderBy para evitar erro de índice
    const q = query(
      collection(db, "leads"),
      where("userId", "==", user.uid)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // ordena no front (seguro)
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setLeads(data);
    });
  }, [user]);

  const handleNovoLead = async (e) => {
    e.preventDefault();

    if (isSaving) return;

    if (!nomeLead || !cepLead || !idadeLead) {
      alert("Preencha todos os campos");
      return;
    }

    const idade = parseInt(idadeLead);

    if (isNaN(idade)) {
      alert("Idade inválida");
      return;
    }

    setIsSaving(true);

    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];

    const categoria =
      nobres.includes(cepLead.substring(0, 5)) && idade >= 20
        ? "HIGH TICKET"
        : "Ticket Médio";

    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead,
        cep: cepLead,
        idade,
        categoria,
        status: "NOVO LEAD",
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setAviso({
        visivel: true,
        texto: `Lead ${nomeLead} salvo como ${categoria}`
      });

      setNomeLead('');
      setCepLead('');
      setIdadeLead('');

      setTimeout(() => {
        setAviso({ visivel: false, texto: '' });
        setView('dashboard');
        setIsSaving(false);
      }, 2500);

    } catch (err) {
      console.error(err);
      alert("Erro real: " + err.message);
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Carregando...</div>;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: 'sans-serif' }}>

      {/* TOAST */}
      {aviso.visivel && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'rgba(255,255,255,0.9)',
          padding: '14px 20px',
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          borderLeft: `5px solid ${theme.primary}`
        }}>
          <b>{aviso.texto}</b>
        </div>
      )}

      {!user ? (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.primary
        }}>
          <button
            onClick={() => signInWithEmailAndPassword(auth, "teste@teste.com", "123456")}
            style={{
              padding: 20,
              borderRadius: 10,
              border: 'none',
              background: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <>
          {/* NAV */}
          <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '20px 40px',
            background: '#fff',
            borderBottom: '1px solid #eee'
          }}>
            <h2 style={{ color: theme.primary }}>KLINNI IA</h2>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setView('dashboard')}>Dashboard</button>
              <button onClick={() => setView('novoLead')}>+ Lead</button>
            </div>
          </nav>

          <main style={{ padding: 40 }}>
            {view === 'dashboard' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20
              }}>
                {leads.map(l => (
                  <div key={l.id} style={{
                    padding: 20,
                    background: theme.card,
                    borderRadius: 12,
                    borderLeft: `6px solid ${l.categoria === 'HIGH TICKET' ? theme.primary : '#9ca3af'}`
                  }}>
                    <b style={{ color: theme.primary }}>{l.categoria}</b>
                    <h3>{l.nome}</h3>
                    <p style={{ color: theme.gray }}>CEP: {l.cep}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                maxWidth: 400,
                margin: '0 auto',
                background: theme.card,
                padding: 30,
                borderRadius: 12
              }}>
                <h2>Novo Lead</h2>

                <form onSubmit={handleNovoLead} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <input placeholder="Nome" value={nomeLead} onChange={e => setNomeLead(e.target.value)} />
                  <input placeholder="CEP" value={cepLead} onChange={e => setCepLead(e.target.value)} />
                  <input type="number" placeholder="Idade" value={idadeLead} onChange={e => setIdadeLead(e.target.value)} />

                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      padding: 12,
                      background: theme.primary,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Lead'}
                  </button>
                </form>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
