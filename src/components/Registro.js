import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, setDoc, doc, query, limit } from 'firebase/firestore';

export const Registro = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleRegistro = async (e) => {
    e.preventDefault();
    try {
      // 1. Cria o usuário no sistema de login
      const res = await createUserWithEmailAndPassword(auth, email, senha);
      const user = res.user;

      // 2. LÓGICA DE OURO: Verifica se já existe algum usuário no banco
      const usuariosRef = collection(db, "users");
      const q = query(usuariosRef, limit(1));
      const snapshot = await getDocs(q);

      // Se o banco estiver vazio, você é o ADMIN. Se não, é CRC.
      const userRole = snapshot.empty ? 'admin' : 'crc';

      // 3. Salva o perfil no banco de dados
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        role: userRole,
        created_at: new Date()
      });

      alert(`Sucesso! Você foi registrado como: ${userRole.toUpperCase()}`);
    } catch (error) {
      alert("Erro ao registrar: " + error.message);
    }
  };

  return (
    <div className="bg-[#F4F7F6] min-h-screen flex items-center justify-center p-6 font-inter">
      <div className="max-w-md w-full bg-white p-8 rounded-[24px] shadow-sm">
        <h2 className="text-[#7FA9D1] text-2xl font-bold mb-6 text-center">Criar Conta Klinni IA</h2>
        <form onSubmit={handleRegistro} className="space-y-4">
          <input 
            type="email" 
            placeholder="Seu melhor e-mail" 
            className="w-full p-4 rounded-xl bg-gray-50 border border-transparent focus:border-[#7FA9D1] outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Crie uma senha forte" 
            className="w-full p-4 rounded-xl bg-gray-50 border border-transparent focus:border-[#7FA9D1] outline-none"
            onChange={(e) => setSenha(e.target.value)}
          />
          <button className="w-full bg-[#7FA9D1] text-white p-4 rounded-xl font-bold hover:bg-[#9BB8CD] transition-all">
            Finalizar Cadastro
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-6 text-center">
          O primeiro usuário cadastrado receberá permissões de Administrador automaticamente.
        </p>
      </div>
    </div>
  );
};
