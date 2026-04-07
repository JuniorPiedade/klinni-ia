import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export const ListaLeads = () => {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    // 📡 Escuta em tempo real: se a vendedora cadastrar, aparece aqui na hora!
    const q = query(collection(db, "leads"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-[#F4F7F6] min-h-screen p-8 font-inter">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-[#9BB8CD] text-2xl font-bold mb-8">Gestão de Oportunidades</h2>
        
        <div className="grid gap-4">
          {leads.map((lead) => (
            <div 
              key={lead.id} 
              className={`p-6 rounded-[16px] bg-white shadow-sm border-l-4 transition-all hover:shadow-md ${
                lead.categoria === 'HIGH TICKET' ? 'border-[#7FA9D1]' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-lg">{lead.nome}</h3>
                    {lead.categoria === 'HIGH TICKET' && (
                      <span className="text-[10px] bg-[#E8F0F7] text-[#7FA9D1] px-2 py-1 rounded-full font-bold">
                        💎 ALTO PADRÃO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{lead.bairro} • {lead.whatsapp}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-300 uppercase">{lead.status}</span>
              </div>

              {/* O Script da IA que o Gemini gerou fica escondido num "box" elegante */}
              <div className="mt-4 p-4 bg-[#F9FBFA] rounded-lg border border-dashed border-gray-200">
                <p className="text-[11px] font-bold text-[#9BB8CD] uppercase mb-2">Sugestão de Abordagem (IA):</p>
                <p className="text-sm text-gray-600 italic">"{lead.scriptSugerido || 'Processando inteligência...'}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
