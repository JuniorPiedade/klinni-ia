import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCv7kNOOa1AT71TmvwKLdwi8TyHHVh6htM",
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const theme = {
  primary: "#f97316",
  bg: "#f3f4f6",
  card: "#ffffff",
  text: "#1f2937",
  gray: "#6b7280"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [erroLogin, setErroLogin] = useState("");

  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);

  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "leads"), where("userId", "==", user.uid));

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setLeads(data);
    });
  }, [user]);

  const handleLogin = async () => {
    setErroLogin("");
    setLoginLoading(true);

    try {
      await signInWithEmailAndPassword(auth, "teste@teste.com", "123456");
    } catch (err) {
      console.error(err);
      setErroLogin("Erro ao logar. Verifique email/senha ou Firebase.");
    }

    setLoginLoading(false);
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();

    const idade = parseInt(idadeLead);
    if (!nomeLead || !cepLead || isNaN(idade)) {
      alert("Preencha corretamente");
      return;
    }

    setIsSaving(true);

    const nobres = ['40140','41940','40080','41810','41820','41760'];
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
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setNomeLead('');
      setCepLead('');
      setIdadeLead('');
      setView('dashboard');

    } catch (err) {
      alert(err.message);
    }

    setIsSaving(false);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: 'Inter, sans-serif' }}>

      {!user ? (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20
        }}>

          {/* LOGO NOVA */}
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            background: "linear-gradient(to right, #9ca3af, #4b5563)",
            WebkitBackgroundClip: "text",
            color: "transparent"
          }}>
            KLINNI IA
          </h1>

          <button
            onClick={handleLogin}
            disabled={loginLoading}
            style={{
              padding: 15,
              background: theme.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              width: 200
            }}
          >
            {loginLoading ? "Entrando..." : "Login"}
          </button>

          {erroLogin && (
            <p style={{ color: 'red', fontSize: 14 }}>{erroLogin}</p>
          )}

        </div>
      ) : (
        <>
          <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 20,
            background: '#fff'
          }}>
            <h2 style={{ color: theme.text }}>KLINNI IA</h2>

            <div>
              <button onClick={() => setView('dashboard')}>Dashboard</button>
              <button onClick={() => setView('novoLead')}>Novo Lead</button>
            </div>
          </nav>

          <main style={{ padding: 30 }}>
            {view === 'dashboard' ? (
              <div style={{ display: 'grid', gap: 20 }}>
                {leads.map(l => (
                  <div key={l.id} style={{
                    padding: 20,
                    background: '#fff',
                    borderRadius: 10
                  }}>
                    <b>{l.categoria}</b>
                    <h3>{l.nome}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleNovoLead}>
                <input placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} />
                <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} />
                <input placeholder="Idade" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} />
                <button type="submit">Salvar</button>
              </form>
            )}
          </main>
        </>
      )}
    </div>
  );
}
