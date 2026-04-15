import React, { useState } from 'react'; import { auth } from '../firebase/config'; import { createUserWithEmailAndPassword } from 'firebase/auth';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Klinni IA: Conta criada!');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div style={{padding: '20px', textAlign: 'center'}}>
      <form onSubmit={handleRegister}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required style={{display: 'block', margin: '10px auto', padding: '10px'}} />
        <input type="password" placeholder="Senha" onChange={(e) => setPassword(e.target.value)} required style={{display: 'block', margin: '10px auto', padding: '10px'}} />
        <button type="submit" style={{padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px'}}>Acessar Sistema</button>
      </form>
    </div>
  );
};
