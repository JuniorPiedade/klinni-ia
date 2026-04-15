// 📝 Registro de Usuário Simples - Klinni IA
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('As senhas não coincidem.');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      alert('Conta criada com sucesso!');
    } catch (err) {
      setError('Falha ao criar conta. Verifique os dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-brand-gray-50 min-h-screen flex items-center justify-center p-6 font-inter">
      <div className="max-w-md w-full bg-white p-10 rounded-[24px] shadow-2xl border border-gray-100">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-brand-gray-900 tracking-tighter italic">
            KLINNI <span className="text-brand-orange">IA</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-light italic">Crie seu acesso premium</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-xs text-center border border-red-100 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">E-mail Profissional</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="exemplo@clinica.com" 
              className="w-full p-4 mt-1 rounded-xl bg-gray-50 border border-transparent focus:border-brand-orange focus:bg-white outline-none transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Sua Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••" 
              className="w-full p-4 mt-1 rounded-xl bg-gray-50 border border-transparent focus:border-brand-orange focus:bg-white outline-none transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Confirmar Senha</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="••••••••" 
              className="w-full p-4 mt-1 rounded-xl bg-gray-50 border border-transparent focus:border-brand-orange focus:bg-white outline-none transition-all shadow-sm"
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-brand-orange text-white p-4 rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-[#e66000] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? 'Criando Conta...' : 'Finalizar Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
};
