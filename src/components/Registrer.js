import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pegamos a função de cadastro do nosso AuthContext
  const { signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    // Validação básica de senha
    if (password !== confirmPassword) {
      return setError('As senhas não coincidem.');
    }

    if (password.length < 6) {
      return setError('A senha deve ter pelo menos 6 caracteres.');
    }

    try {
      setError('');
      setLoading(true);
      
      // Chamada oficial ao Firebase via Contexto
      await signup(email, password);
      
      alert('Conta Klinni IA criada com sucesso!');
      // Aqui, futuramente, redirecionaremos para o Dashboard
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else {
        setError('Falha ao criar conta. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white p-10 rounded-[32px] shadow-xl border border-gray-100">
        
        {/* Logo Klinni IA */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">
            Klinni <span className="text-orange-500">IA</span>
          </h1>
          <p className="text-gray-400 text-xs mt-2 font-medium tracking-widest uppercase">
            Lead Management SaaS
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm text-center border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de E-mail */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wider">
              E-mail da Clínica
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="exemplo@clinica.com" 
              className="w-full p-4 mt-1 rounded-2xl bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all duration-300 shadow-sm"
            />
          </div>

          {/* Campo de Senha */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wider">
              Nova Senha
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••" 
              className="w-full p-4 mt-1 rounded-2xl bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all duration-300 shadow-sm"
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-2 tracking-wider">
              Confirmar Senha
            </label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="••••••••" 
              className="w-full p-4 mt-1 rounded-2xl bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all duration-300 shadow-sm"
            />
          </div>

          {/* Botão de Ação */}
          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'Criar Conta Premium'}
          </button>
        </form>

        {/* Rodapé do Card */}
        <div className="mt-8 text-center text-gray-400 text-xs">
          Já possui uma conta? <span className="text-orange-500 font-bold cursor-pointer hover:underline">Fazer Login</span>
        </div>
      </div>
    </div>
  );
};
