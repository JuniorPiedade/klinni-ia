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
    <div>
      <h2>Klinni IA - Teste</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
};
