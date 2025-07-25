// login.js
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se o Supabase está carregado
    if (typeof supabase === 'undefined') {
        console.error('Supabase não está carregado! Verifique se supabase-config.js foi importado corretamente.');
        return;
    }

    const loginForm = document.querySelector('form');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!email || !password) {
            showAlert('Por favor, preencha todos os campos', 'error');
            return;
        }

        // Mostra loading
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Entrando...';

        try {
            // Consulta a tabela clinicas no Supabase
            const { data, error } = await supabase
                .from('clinicas')
                .select('*')
                .eq('email', email)
                .eq('senha_login', password)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Login bem-sucedido
                sessionStorage.setItem('clinicaData', JSON.stringify({
                    id: data.id,
                    nome: data.nome,
                    email: data.email,
                    ativo: data.ativo
                }));
                
                // Redireciona para o dashboard
                window.location.href = 'dashboardclinica.html';
            } else {
                // Credenciais inválidas
                showAlert('E-mail ou senha incorretos', 'error');
            }
        } catch (err) {
            console.error('Erro ao fazer login:', err);
            showAlert('Erro ao fazer login. Por favor, tente novamente.', 'error');
        } finally {
            // Restaura o botão
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Função para mostrar alertas estilizados
    function showAlert(message, type = 'success') {
        // Remove alertas anteriores
        const existingAlert = document.querySelector('.login-alert');
        if (existingAlert) existingAlert.remove();

        const alertDiv = document.createElement('div');
        alertDiv.className = `login-alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Insere antes do formulário
        loginForm.parentNode.insertBefore(alertDiv, loginForm);
        
        // Remove após 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
});

document.addEventListener('DOMContentLoaded', () => {
  // Elementos da modal
  const forgotPasswordLink = document.querySelector('.forgot-password');
  const modal = document.getElementById('forgotPasswordModal');
  const closeBtn = document.querySelector('.close-modal');
  const recoveryForm = document.getElementById('recoveryForm');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const passwordResetStep = document.getElementById('passwordResetStep');
  const recoveryMessage = document.getElementById('recoveryMessage');
  
  // Variável para armazenar o e-mail verificado
  let verifiedEmail = null;

  // Abrir modal
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
    resetForms();
  });

  // Fechar modal
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Fechar ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Formulário de recuperação (etapa 1)
  recoveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('recoveryEmail').value.trim();
    
    try {
      // Verifica se o e-mail existe na tabela clinicas
      const { data, error } = await supabase
        .from('clinicas')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // E-mail encontrado, mostra a etapa 2
        verifiedEmail = email;
        recoveryForm.style.display = 'none';
        passwordResetStep.style.display = 'block';
      } else {
        showMessage('E-mail não encontrado em nosso sistema.', 'error');
      }
    } catch (err) {
      console.error('Erro ao verificar e-mail:', err);
      showMessage('Erro ao verificar e-mail. Tente novamente.', 'error');
    }
  });

  // Formulário de redefinição de senha (etapa 2)
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validação
    if (newPassword !== confirmPassword) {
      showMessage('As senhas não coincidem.', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    try {
      // Atualiza a senha no Supabase
      const { error } = await supabase
        .from('clinicas')
        .update({ senha_login: newPassword })
        .eq('email', verifiedEmail);

      if (error) throw error;

      // Sucesso
      showMessage('Senha alterada com sucesso!', 'success');
      resetPasswordForm.reset();
      
      // Fecha a modal após 2 segundos
      setTimeout(() => {
        modal.style.display = 'none';
      }, 2000);
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      showMessage('Erro ao atualizar senha. Tente novamente.', 'error');
    }
  });

  // Funções auxiliares
  function resetForms() {
    recoveryForm.style.display = 'block';
    recoveryForm.reset();
    passwordResetStep.style.display = 'none';
    resetPasswordForm.reset();
    recoveryMessage.style.display = 'none';
    verifiedEmail = null;
  }

  function showMessage(message, type) {
    recoveryMessage.textContent = message;
    recoveryMessage.className = type + '-message';
    recoveryMessage.style.display = 'block';
  }
});