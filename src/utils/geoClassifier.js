// 📍 Inteligência Geográfica Klinni IA - Salvador/BA

export const classificarPorBairro = (bairroInformado) => {
  if (!bairroInformado) return { categoria: 'TICKET MÉDIO', prioridade: 3 };

  const bairro = bairroInformado.toUpperCase().trim();

  // 1. ZONA DIAMANTE (High Ticket)
  const highTicket = [
    'CORREDOR DA VITORIA', 'VITORIA', 'HORTO FLORESTAL', 
    'CAMINHO DAS ARVORES', 'LOTEAMENTO AQUARIUS', 'AQUARIUS',
    'ITAIGARA', 'PATAMARES', 'GREENVILLE', 'COLINA A', 'ALPHAVILLE'
  ];

  // 2. ZONA OURO (Ticket Plus)
  const ticketPlus = [
    'PITUBA', 'RIO VERMELHO', 'GRACA', 'BARRA', 
    'LADEIRA DA BARRA', 'STIEP', 'IMBUI', 'COSTA AZUL'
  ];

  if (highTicket.some(b => bairro.includes(b))) {
    return { 
      categoria: 'HIGH TICKET', 
      prioridade: 1,
      mensagem: '💎 Lead de Altíssimo Padrão - Prioridade Máxima' 
    };
  }

  if (ticketPlus.some(b => bairro.includes(b))) {
    return { 
      categoria: 'TICKET PLUS', 
      prioridade: 2,
      mensagem: '⭐ Lead Qualificado - Foco em Conversão' 
    };
  }

  return { 
    categoria: 'TICKET MÉDIO', 
    prioridade: 3,
    mensagem: '✅ Lead Padrão' 
  };
};
