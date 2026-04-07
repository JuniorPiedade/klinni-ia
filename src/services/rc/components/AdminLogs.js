// 📊 Painel de Auditoria e Gestão (Acesso Restrito: ADMIN)
export const AdminLogs = () => {
  return (
    <div className="bg-[#F4F7F6] p-10 min-h-screen font-inter">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-[#9BB8CD]">Painel de Controle</h1>
            <p className="text-gray-500">Histórico de Atividade e Auditoria</p>
          </div>
          
          {/* Botão de Exportação que você pediu */}
          <button className="bg-white border-2 border-[#7FA9D1] text-[#7FA9D1] px-6 py-2 rounded-lg font-bold hover:bg-[#7FA9D1] hover:text-white transition-all">
            📥 Baixar Relatório CSV
          </button>
        </div>

        {/* Tabela de Logs */}
        <div className="bg-white rounded-[16px] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-[#7FA9D1] font-bold text-xs uppercase">Usuário</th>
                <th className="p-4 text-[#7FA9D1] font-bold text-xs uppercase">Ação</th>
                <th className="p-4 text-[#7FA9D1] font-bold text-xs uppercase">Lead</th>
                <th className="p-4 text-[#7FA9D1] font-bold text-xs uppercase">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Exemplo de como os dados aparecerão */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm font-semibold">Vendedora Maria</td>
                <td className="p-4 text-sm text-gray-600">Alterou status para 'EM TRATAMENTO'</td>
                <td className="p-4 text-sm text-gray-600">João da Silva (Horto Florestal)</td>
                <td className="p-4 text-sm text-gray-400">07/04/2026 - 11:20</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
