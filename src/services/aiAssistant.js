import { GoogleGenerativeAI } from "@google/generative-ai";

// A chave virá do arquivo .env no Vercel
const API_KEY = process.env.REACT_APP_GEMINI_KEY || "";

export const gerarSugestaoVenda = async (nome, notas, categoria) => {
  if (!API_KEY) return "Configure a chave da IA para receber sugestões.";

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Aja como Especialista em Neuromarketing para Clínicas de Luxo.
      Paciente: ${nome} (Categoria: ${categoria})
      Contexto: ${notas}
      
      Diretrizes:
      1. Foque na tecnologia de Tomografia 3D e conforto do Dr. Leonardo.
      2. Se for HIGH TICKET: Seja exclusivo, não fale de preço.
      3. Se for TICKET PLUS: Foque em segurança e autoridade.
      
      Retorne um script curto para WhatsApp e uma dica tática.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "IA offline. Use o script padrão de atendimento.";
  }
};
