// ... (mantenha os imports e configs iguais)

  // ✅ Correção na Inicialização do Recaptcha
  useEffect(() => {
    if (!user && step === "phone") {
      const timer = setTimeout(() => {
        if (!window.recaptchaVerifier) {
          try {
            const container = document.getElementById("recaptcha-container");
            if (!container) return;

            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
              size: "invisible",
              'callback': (response) => {
                // recaptcha resolvido
              }
            });
          } catch (e) {
            console.error("Erro ao iniciar Recaptcha:", e);
          }
        }
      }, 500); // Aguarda o DOM assentar
      return () => clearTimeout(timer);
    }
  }, [user, step]);

  // ✅ Função de Envio com Reset de Segurança
  const handleSendCode = async () => {
    if (!phone.startsWith('+')) {
      setAuthError("Use o formato: +5571999999999");
      return;
    }
    
    setAuthLoading(true);
    setAuthError("");

    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setStep("code");
    } catch (error) {
      console.error("Erro SMS:", error.code);
      
      // Resetar o recaptcha para permitir nova tentativa sem refresh
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          window.grecaptcha.reset(widgetId);
        }).catch(() => {
          // Fallback se o render falhar
          window.recaptchaVerifier = null; 
        });
      }

      if (error.code === 'auth/invalid-phone-number') {
        setAuthError("Número inválido. Use +55 + DDD + Número.");
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError("Muitas tentativas. Tente novamente mais tarde.");
      } else {
        setAuthError("Erro ao enviar SMS. Verifique se o número existe.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

// ... (resto do código igual)
