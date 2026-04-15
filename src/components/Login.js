// 🚪 Portal de Acesso - Klinni IA (Revisado e Funcional)
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Redirecionamento automático acontece pelo estado do AuthContext no App.js
    } catch (err) {
      setError('Acesso negado. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-brand-gray-50 min-h-screen font-inter flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[24px] shadow-2xl border border-gray-100">
        
        {/* Branding Premium - Ajustado para Laranja */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-brand-gray-900 tracking-tighter">
            KLINNI <span className="text-brand-orange">IA</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-light">Sistemas de Gestão de Alto Padrão</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-xs text-center border border-red-100 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">E-mail Profissional</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@clinica.com" 
              className="w-full p-4 mt-1 rounded-xl bg-gray-50 border border-transparent focus:border-brand-orange focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-4 mt-1 rounded-xl bg-gray-50 border border-transparent focus:border-brand-orange focus:bg-white outline-none transition-all"
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-brand-orange text-white p-4 rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-[#e66000] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Validando Acesso...' : 'Acessar Sistema'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button className="text-[11px] text-brand-orange font-bold hover:underline mb-4">
            Esqueceu sua senha?
          </button>
          <p className="text-[11px] text-gray-300">
            Acesso restrito a colaboradores autorizados.<br/>
            Klinni IA • Tecnologia & Performance
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
