import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { classificarPorBairro } from '../utils/geoClassifier';
import { gerarSugestaoVenda } from '../services/aiAssistant';

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
      // 1. Classificação Geográfica Automática (Salvador)
      const infoGeo = classificarPorBairro(bairro);

      // 2. Inteligência de Vendas (Gemini)
     const scriptIA = "Script temporário (IA desativada)";

      // 3. Salvando no Banco de Dados (Firebase)
      await addDoc(collection(db, "leads"), {
        nome,
        whatsapp,
        bairro,
        notas,
        categoria: infoGeo.categoria, // HIGH TICKET, TICKET PLUS, etc
        scriptSugerido: scriptIA,
        status: 'NOVO LEAD',
        criadoEm: serverTimestamp()
      });

      alert(`✅ Sucesso! Lead ${infoGeo.categoria} cadastrado.`);
      // Limpar formulário
      setNome(''); setBairro(''); setNotas('');
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar. Verifique se o Firebase está conectado.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#F4F7F6] p-8 min-h-screen font-inter flex items-center justify-center">
      <form onSubmit={salvarLead} className="max-w-md w-full bg-white p-8 rounded-[16px] shadow-sm border border-[#E5EAE9]">
        <h2 className="text-[#9BB8CD] text-2xl font-bold mb-6">Klinni IA - Cadastro</h2>
        
        <div className="space-y-4">
          <input value={nome} onChange={(e) => setNome(e.target.value)} type="text" placeholder="Nome do Paciente" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-[#7FA9D1]" required />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} type="text" placeholder="WhatsApp" className="w-full p-3 rounded-lg border border-gray-200 outline-none" required />
          <input value={bairro} onChange={(e) => setBairro(e.target.value)} type="text" placeholder="Bairro (Salvador)" className="w-full p-3 rounded-lg border border-gray-200 outline-none" required />
          
          <textarea 
            value={notas} 
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Perfil do Paciente (Ex: Medo de dor, pressa, busca estética natural...)" 
            className="w-full p-3 rounded-lg border border-gray-200 h-32 outline-none"
          ></textarea>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#7FA9D1] to-[#9BB8CD] text-white p-4 rounded-lg font-bold shadow-md hover:opacity-90 disabled:bg-gray-300"
          >
            {loading ? "Processando Inteligência..." : "✨ Cadastrar & Gerar Script"}
          </button>
        </div>
      </form>
    </div>
  );
};
