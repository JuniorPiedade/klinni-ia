// 🚪 Portal de Acesso - Klinni IA
import React from 'react';

export const Login = () => {
  return (
    <div className="bg-[#F4F7F6] min-h-screen font-inter flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[24px] shadow-xl border border-gray-100">
        
        {/* Branding Boutique */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7FA9D1] to-[#9BB8CD] bg-clip-text text-transparent">
            Klinni IA
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-light">Sistemas de Gestão de Alto Padrão</p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">E-mail Profissional</label>
            <input 
              type="email" 
              placeholder="exemplo@clinica.com" 
              className="w-full p-4 mt-1 rounded-xl bg-gray-50 border border-transparent focus:border-[#7FA9D1] focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 mt-1 rounded-xl bg-gray-50 border border-transparent focus:border-[#7FA9D1] focus:bg-white outline-none transition-all"
            />
          </div>

          <button className="w-full bg-gradient-to-r from-[#7FA9D1] to-[#9BB8CD] text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Acessar Sistema
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-300">
            Acesso restrito a colaboradores autorizados.<br/>
            Dr. Leonardo • Tecnologia & Conforto
          </p>
        </div>
      </div>
    </div>
  );
};
