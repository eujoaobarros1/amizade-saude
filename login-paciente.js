document.addEventListener('DOMContentLoaded', () => {
    // Verifica se Supabase está carregado
    if (typeof supabase === 'undefined') {
        console.error('Supabase não está disponível');
        showAlert('Erro de conexão com o servidor. Por favor, recarregue a página.', 'error');
        return;
    }

    // Elementos principais
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.querySelector('.btn-login');
    const cpfInput = document.getElementById('cpf');
    const passwordInput = document.getElementById('password');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    
    // Elementos da modal de recuperação
    const modal = document.getElementById('forgotPasswordModal');
    const closeBtn = document.querySelector('.close-modal');
    const recoveryForm = document.getElementById('recoveryForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const displayCpf = document.getElementById('displayCpf');
    const recoveryMessage = document.getElementById('recoveryMessage');
    const passwordMatchMessage = document.getElementById('passwordMatchMessage');

    // Variável para armazenar o CPF validado
    let verifiedCpf = null;

    // Configura máscara de CPF para ambos os formulários
    if (cpfInput) {
        cpfInput.addEventListener('input', formatarCPF);
    }
    
    const recoveryCpfInput = document.getElementById('recoveryCpf');
    if (recoveryCpfInput) {
        recoveryCpfInput.addEventListener('input', formatarCPF);
    }

    // Evento de login
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Eventos da modal de recuperação
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            resetRecoveryProcess();
            modal.style.display = 'block';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (e) => e.target === modal && closeModal());

    if (recoveryForm) {
        recoveryForm.addEventListener('submit', handleRecoveryStep1);
    }

    // Validação de senha em tempo real
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handlePasswordReset);
    }

    // ========== FUNÇÕES PRINCIPAIS ========== //

    async function handleLogin(e) {
        e.preventDefault();
        
const cpf = cpfInput ? cpfInput.value.trim() : '';
        const password = passwordInput?.value.trim() || '';

        // Validações
        if (!validarCPF(cpf)) {
            showAlert('Por favor, insira um CPF válido', 'error');
            return;
        }

        if (!password) {
            showAlert('Por favor, insira sua senha', 'error');
            return;
        }

        setLoadingState(loginButton, true);

        try {
            const { data, error } = await supabase
                .from('usuario_assinante')
                .select('*')
                .eq('cpf_titular', cpf)
                .eq('senha_login', password)
                .maybeSingle();

            if (error) throw error;

            console.log("Dados retornados:", data);

            if (data) {
                sessionStorage.setItem('userData', JSON.stringify({
                    id: data.id,
                    nome: data.nome_titular,
                    cpf: data.cpf_titular
                }));
                
                window.location.href = 'dashboardpaciente.html';
            } else {
                showAlert('CPF ou senha incorretos', 'error');
            }
        } catch (err) {
            console.error('Erro na autenticação:', err);
            showAlert('Erro ao fazer login. Tente novamente.', 'error');
        } finally {
            setLoadingState(loginButton, false);
        }
    }

    async function handleRecoveryStep1(e) {
        e.preventDefault();
        const cpf = document.getElementById('recoveryCpf').value.replace(/\D/g, '');
        
        if (!validarCPF(cpf)) {
            showRecoveryMessage('Por favor, insira um CPF válido', 'error');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('usuario_assinante')
                .select('cpf_titular')
                .eq('cpf_titular', cpf)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                verifiedCpf = cpf;
                displayCpf.textContent = formatCpf(cpf);
                step1.style.display = 'none';
                step2.style.display = 'block';
            } else {
                showRecoveryMessage('CPF não encontrado em nosso sistema', 'error');
            }
        } catch (err) {
            console.error('Erro ao verificar CPF:', err);
            showRecoveryMessage('Erro ao verificar CPF. Tente novamente.', 'error');
        }
    }

    async function handlePasswordReset(e) {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!checkPasswordMatch() || newPassword.length < 6) {
            return;
        }

        try {
            const { error } = await supabase
                .from('usuario_assinante')
                .update({ senha_login: newPassword })
                .eq('cpf_titular', verifiedCpf);

            if (error) throw error;

            showRecoveryMessage('Senha alterada com sucesso!', 'success');
            
            setTimeout(() => {
                closeModal();
            }, 2000);
        } catch (err) {
            console.error('Erro ao atualizar senha:', err);
            showRecoveryMessage('Erro ao atualizar senha. Tente novamente.', 'error');
        }
    }

    // ========== FUNÇÕES AUXILIARES ========== //

    function formatarCPF(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 3) value = value.replace(/^(\d{3})/, '$1.');
        if (value.length > 7) value = value.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
        if (value.length > 11) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
        e.target.value = value.substring(0, 14);
    }

    function validarCPF(cpf) {
    if (!cpf) return false;

    // Verifica se está no formato XXX.XXX.XXX-XX
    const regex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!regex.test(cpf)) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{2}\.\1{3}\.\1{3}-\1{2}$/.test(cpf)) return false;

    return true;
}


    function setLoadingState(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="login-spinner"></span> Processando...';
        } else {
            button.disabled = false;
            button.innerHTML = '<span class="btn-text">Entrar</span>';
        }
    }

    function showAlert(message, type = 'error') {
        const existingAlert = document.querySelector('.login-alert');
        if (existingAlert) existingAlert.remove();

        const alertDiv = document.createElement('div');
        alertDiv.className = `login-alert ${type}`;
        alertDiv.textContent = message;
        
        if (loginForm) {
            loginForm.insertAdjacentElement('afterend', alertDiv);
        } else {
            document.body.appendChild(alertDiv);
        }
        
        setTimeout(() => alertDiv.remove(), 5000);
    }

    function showRecoveryMessage(message, type) {
        if (!recoveryMessage) return;
        
        recoveryMessage.textContent = message;
        recoveryMessage.className = `recovery-message ${type}`;
        recoveryMessage.style.display = 'block';
    }

    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
            resetRecoveryProcess();
        }
    }

    function resetRecoveryProcess() {
        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
        if (recoveryForm) recoveryForm.reset();
        if (resetPasswordForm) resetPasswordForm.reset();
        if (recoveryMessage) recoveryMessage.style.display = 'none';
        verifiedCpf = null;
    }

    function formatCpf(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    function checkPasswordMatch() {
        if (!passwordMatchMessage) return false;
        
        const newPassword = document.getElementById('newPassword')?.value || '';
        const confirmPassword = document.getElementById('confirmPassword')?.value || '';
        
        if (!newPassword || !confirmPassword) {
            passwordMatchMessage.textContent = '';
            passwordMatchMessage.className = 'password-match';
            return false;
        }
        
        if (newPassword === confirmPassword) {
            passwordMatchMessage.textContent = 'Senhas coincidem';
            passwordMatchMessage.className = 'password-match valid';
            return true;
        } else {
            passwordMatchMessage.textContent = 'Senhas não coincidem';
            passwordMatchMessage.className = 'password-match invalid';
            return false;
        }
    }
});