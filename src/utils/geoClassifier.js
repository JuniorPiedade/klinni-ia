// 📍 Inteligência Geográfica Klinni IA - Salvador/BA

export const classificarPorBairro = (bairroInformado) => {
  // Padroniza o texto para evitar erros de digitação (ex: "pituba" vira "PITUBA")
  const bairro = bairroInformado.toUpperCase().trim();

  // 1. ZONA DIAMANTE (High Ticket - Foco em Exclusividade)
  const highTicket = [
    'CORREDOR DA VITORIA', 'VITORIA', 'HORTO FLORESTAL', 
    'CAMINHO DAS ARVORES', 'LOTEAMENTO AQUARIUS', 'AQUARIUS',
    'ITAIGARA', 'PATAMARES', 'GREENVILLE', 'COLINA A'
  ];

  // 2. ZONA OURO (Ticket Plus - Foco em Volume Qualificado)
  const ticketPlus = [
    'PITUBA', 'RIO VERMELHO', 'GRACA', 'BARRA', 
    'LADEIRA DA BARRA', 'STIEP', 'IMBUI'
  ];

  // Lógica de Classificação
  if (highTicket.some(b => bairro.includes(b))) {
    return { 
      categoria: 'HIGH TICKET', 
      cor: '#7FA9D1', 
      prioridade: 1,
      mensagem: '💎 Lead de Altíssimo Padrão - Prioridade Máxima' 
    };
  }

  if (ticketPlus.some(b => bairro.includes(b))) {
    return { 
      categoria: 'TICKET PLUS', 
      cor: '#9BB8CD', 
      prioridade: 2,
      mensagem: '⭐ Lead Qualificado - Foco em Conversão' 
    };
  }

  // Padrão para os demais bairros
  return { 
    categoria: 'TICKET MÉDIO', 
    cor: '#E5EAE9', 
    prioridade: 3,
    mensagem: '✅ Lead Padrão' 
  };
};
