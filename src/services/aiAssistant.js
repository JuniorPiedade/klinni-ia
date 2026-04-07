// 🧠 Cérebro de Vendas do Klinni IA (Integração Gemini)
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa a IA usando a chave que protegeremos depois
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_KEY);

export const gerarSugestaoVenda = async (nome, objecao, notas, categoria) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    Aja como um Especialista em Neuromarketing para Clínicas de Luxo.
    Paciente: ${nome} (Categoria: ${categoria})
    Objeção principal: ${objecao}
    Contexto das notas: ${notas}
    
    Diretrizes:
    1. Foque na tecnologia de Tomografia 3D do Dr. Leonardo e no conforto absoluto.
    2. Para leads HIGH TICKET, seja extremamente exclusivo e não fale de preço.
    3. Para leads TICKET PLUS, foque na segurança do resultado e autoridade.
    
    Retorne em 3 partes: 
    1. Análise do Medo Oculto.
    2. Script de WhatsApp pronto para copiar.
    3. Dica de Ouro tática para a vendedora (CRC).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return "Erro ao gerar dica da IA. Verifique a conexão.";
  }
};
