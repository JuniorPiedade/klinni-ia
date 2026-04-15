import React, { useState } from 'react';
import { auth } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Sucesso!');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-4 shadow">
        <input 
          type="email" 
          onChange={(e) => setEmail(e.target.value)} 
          className="border p-2 w-full mb-2" 
          placeholder="Email"
          required 
        />
        <input 
          type="password" 
          onChange={(e) => setPassword(e.target.value)} 
          className="border p-2 w-full mb-2" 
          placeholder="Senha"
          required 
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">Testar Build</button>
      </form>
    </div>
  );
};
