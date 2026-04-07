// Interface de Cadastro de Leads - Klinni IA (Versão Completa com IA)
export const NovoLeadForm = () => {
  return (
    <div className="bg-[#F4F7F6] p-8 min-h-screen font-inter flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-[16px] shadow-sm border border-[#E5EAE9]">
        
        {/* Cabeçalho Minimalista */}
        <div className="mb-8">
          <h2 className="text-[#9BB8CD] text-2xl font-bold">Klinni IA</h2>
          <p className="text-gray-400 text-sm">Novo Lead de Alto Padrão</p>
        </div>
        
        <div className="space-y-4">
          {/* Dados Básicos */}
          <input type="text" placeholder="Nome Completo" className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#7FA9D1] outline-none" />
          <input type="text" placeholder="WhatsApp (com DDD)" className="w-full p-3 rounded-lg border border-gray-200 outline-none" />
          <input type="text" placeholder="Bairro em Salvador" className="w-full p-3 rounded-lg border border-gray-200 outline-none" />
          
          {/* Filtro de Procedimento */}
          <select className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-600 outline-none">
            <option>Selecione o Procedimento</option>
            <option>Lentes de Porcelana</option>
            <option>Implantes Suíços</option>
            <option>Harmonização Facial</option>
            <option>Protocolo Full Mouth</option>
          </select>

          {/* O Campo de Neuromarketing */}
          <div className="pt-2">
            <label className="text-[10px] font-bold text-[#7FA9D1] uppercase tracking-wider">Perfil Psicológico & Objeções</label>
            <textarea 
              placeholder="Ex: Paciente busca naturalidade extrema. Tem medo de dor mas preza por tecnologia. Achou o valor acima do esperado." 
              className="w-full p-3 mt-1 rounded-lg border border-gray-200 h-32 text-sm outline-none focus:border-[#7FA9D1]"
            ></textarea>
          </div>
          
          {/* Botão Principal com Degradê */}
          <button className="w-full bg-gradient-to-r from-[#7FA9D1] to-[#9BB8CD] text-white p-4 rounded-lg font-bold shadow-md hover:opacity-90 transition-all">
            ✨ Gerar Dica de Venda (IA)
          </button>

          <p className="text-center text-[10px] text-gray-400 mt-4">
            A IA analisará o bairro e as notas para sugerir o melhor roteiro.
          </p>
        </div>
      </div>
    </div>
  );
}
