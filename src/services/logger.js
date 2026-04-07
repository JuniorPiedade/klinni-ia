// 🛡️ Sistema de Auditoria Klinni IA
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const registrarAcao = async (usuarioNome, acaoRealizada, leadAfetado = "N/A") => {
  try {
    await addDoc(collection(db, "activity_logs"), {
      admin_check: true, // Tag para facilitar o filtro do dono
      usuario: usuarioNome,
      acao: acaoRealizada,
      detalhes: `Alteração no lead: ${leadAfetado}`,
      data_hora: serverTimestamp() // Hora oficial do servidor (não do PC da vendedora)
    });
  } catch (error) {
    console.error("Erro ao gravar log de segurança", error);
  }
};
