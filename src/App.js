import React, { useState, useEffect } from 'react';
import { db } from './firebase/config';
import { useAuth } from './AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";

// Importação dos Componentes Modulares
import { Login } from './components/Login';
import ListaLeads from './components/ListaLeads';
import { NovoLeadForm } from './components/NovoLeadForm';
import { AdminLogs } from './components/AdminLogs';

const THEME = {
  primary: '#f97316',
  secondary: '#09090b',
  bg: '#fafafa',
  border: '#e4e4e7',
  font: '"Inter", sans-serif'
};

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listener em tempo real para os leads do Dr. Leonardo
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "leads"), 
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Erro Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return null;

  // Se não estiver logado, exibe a tela de Login (SMS)
  if (!user) return <Login />;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, fontFamily: THEME.font }}>
      {/* Menu Superior Premium */}
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          <div style={styles.navBrand}>
            KLINNI <span style={{color: THEME.primary}}>IA</span>
          </div>
          <div style={styles.navLinks}>
            <button 
              onClick={() => setView('dashboard')} 
              style={{...styles.navBtn, color: view === 'dashboard' ? THEME.primary : '#71717a'}}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('novo')} 
              style={{...styles.navBtn, color: view === 'novo' ? THEME.primary : '#71717a'}}
            >
              + Novo Lead
            </button>
            <button 
              onClick={() => setView('admin')} 
              style={{...styles.navBtn, color: view === 'admin' ? THEME.primary : '#71717a'}}
            >
              Logs
            </button>
          </div>
          <button style={styles.btnExit} onClick={logout}>Sair</button>
        </div>
      </nav>

      {/* Área de Conteúdo Dinâmico */}
      <main style={styles.main}>
        {view === 'dashboard' && (
          <>
            <header style={styles.headerRow}>
              <div style={styles.statBox}>
                <label style={styles.statLabel}>Leads Ativos</label>
                <strong style={styles.statValue}>{leads.length}</strong>
              </div>
              <div style={styles.statBox}>
                <label style={styles.statLabel}>Volume Estimado</label>
                <strong style={styles.statValue}>
                  R$ {leads.reduce((a, b) => a + (Number(b.valor) || 0), 0).toLocaleString('pt-BR')}
                </strong>
              </div>
            </header>
            <ListaLeads leads={leads} />
          </>
        )}

        {view === 'novo' && (
          <div style={styles.centerContent}>
            <NovoLeadForm onComplete={() => setView('dashboard')} />
          </div>
        )}

        {view === 'admin' && (
          <AdminLogs leads={leads} />
        )}
      </main>
    </div>
  );
}

const styles = {
  nav: { height: 70, background: '#fff', borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 },
  navContent: { maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '0 20px', alignItems: 'center' },
  navBrand: { fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', gap: '25px' },
  navBtn: { background: 'none', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: '0.2s' },
  btnExit: { background: '#f4f4f5', border: 'none', padding: '8px 15px', borderRadius: '8px', color: '#71717a', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '40px 20px' },
  headerRow: { display: 'flex', gap: '20px', marginBottom: '40px' },
  statBox: { flex: 1, background: '#fff', padding: '25px', borderRadius: '24px', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  statLabel: { display: 'block', fontSize: '11px', fontWeight: '800', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '8px' },
  statValue: { fontSize: '24px', fontWeight: '900', color: THEME.secondary },
  centerContent: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px' }
};
