import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await signup(email, password);
      alert('Cadastro realizado com sucesso!');
    } catch (err) {
      setError('Falha ao criar conta. Verifique os dados.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white shadow-sm rounded-2xl border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Klinni IA</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Seu email"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Sua senha"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="w-full bg-blue-400 text-white font-bold p-3 rounded-xl hover:bg-blue-500 transition-colors shadow-sm"
          >
            Acessar Sistema
          </button>
        </div>
      </form>
    </div>
  );
};
