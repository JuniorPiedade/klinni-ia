// ... (imports iguais)

const THEME = {
  primary: '#f97316',
  secondary: '#09090b',
  bg: '#fafafa',
  border: '#e4e4e7',
  white: '#ffffff',
  text: '#09090b', // ✅ FIX
  font: 'Inter, -apple-system, system-ui, sans-serif'
};

export default function App() {
  // ... (states iguais)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsub();
  }, []);

  // ✅ FIX RECAPTCHA (principal correção)
  useEffect(() => {
    if (!user && step === "phone") {
      setTimeout(() => {
        if (!window.recaptchaVerifier) {
          try {
            const container = document.getElementById("recaptcha-container");
            if (!container) return;

            window.recaptchaVerifier = new RecaptchaVerifier(
              auth,
              container,
              { size: "invisible" }
            );
          } catch (e) {
            console.error("Erro recaptcha:", e);
          }
        }
      }, 500);
    }
  }, [user, step]);

  // ... (firestore igual)

  const handleSendCode = async () => {
    if (!phone.startsWith('+')) {
      setAuthError("Use o formato internacional: +5571999999999");
      return;
    }

    if (!window.recaptchaVerifier) {
      setAuthError("Erro ao inicializar verificação. Recarregue a página.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      const result = await signInWithPhoneNumber(
        auth, 
        phone, 
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setStep("code");
    } catch (error) {
      console.error(error);
      setAuthError("Erro ao enviar código. Verifique o número.");
    }

    setAuthLoading(false);
  };

  const handleConfirmCode = async () => {
    if (!confirmationResult) {
      setAuthError("Solicite o código primeiro.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      await confirmationResult.confirm(code);
    } catch (error) {
      console.error(error);
      setAuthError("Código inválido ou expirado.");
    }

    setAuthLoading(false);
  };

  // ... (resto igual até render)

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.font }}>
      
      {/* resto igual */}

      <span style={{ fontSize: '16px', fontWeight: '800' }}>
        R$ {(l.valorOrcamento || 0).toLocaleString('pt-BR')}
      </span>

    </div>
  );
}
