// Interface de Cadastro de Leads - Estilo Boutique
export const NovoLeadForm = () => {
  return (
    <div className="bg-ice-gray p-8 min-h-screen font-inter">
      <div className="max-w-md mx-auto bg-clinic-white p-6 rounded-clinic shadow-sm border border-gray-100">
        <h2 className="text-deep-blue text-xl font-semibold mb-6">Cadastrar Novo Lead</h2>
        
        <div className="space-y-4">
          <input type="text" placeholder="Nome Completo" className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-soft-blue" />
          <input type="text" placeholder="WhatsApp" className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none" />
          <input type="text" placeholder="Bairro (Salvador)" className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none" />
          
          <button className="w-full bg-gradient-to-r from-soft-blue to-deep-blue text-white p-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Verificar Potencial (IA)
          </button>
        </div>
      </div>
    </div>
  );
}
