import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const NovoLeadForm = () => {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bairro, setBairro] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const salvarLead = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Classificação Simples (Salvador) - Direto no código para não dar erro
      const bairrosNobres = ['pituba', 'horto', 'vitoria', 'caminho das arvores', 'barra', 'rio vermelho', 'graca'];
      const eNobre = bairrosNobres.includes(bairro.toLowerCase().trim());
      const categoria = eNobre ? 'HIGH TICKET' : 'TICKET MÉDIO';

      await addDoc(collection(db, "leads"), {
        nome,
        whatsapp,
        bairro,
        notas,
        categoria,
        status: 'NOVO LEAD',
        criadoEm: serverTimestamp()
      });

      alert(`✅ Sucesso! Lead ${categoria} cadastrado.`);
      
      setNome('');
      setWhatsapp('');
      setBairro('');
      setNotas('');

    } catch (error) {
      console.error(error);
      alert("Erro ao salvar. Verifique a conexão.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-[#9BB8CD] text-xl font-bold mb-4">Novo Lead - Klinni IA</h2>
      <form onSubmit={salvarLead} className="space-y-3">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do Paciente" className="w-full p-2 border rounded" required />
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full p-2 border rounded" required />
        <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro (Salvador)" className="w-full p-2 border rounded" required />
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observações" className="w-full p-2 border rounded h-24" />
        <button type="submit" disabled={loading} className="w-full bg-[#7FA9D1] text-white p-3 rounded-lg font-bold">
          {loading ? "Salvando..." : "Cadastrar Lead"}
        </button>
      </form>
    </div>
  );
};
