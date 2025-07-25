document.addEventListener('DOMContentLoaded', function () {

    let beneficiarioCount = 0;

    document.getElementById('addBeneficiario').addEventListener('click', function () {
        beneficiarioCount++;
        const container = document.getElementById('beneficiariosContainer');

        const beneficiarioDiv = document.createElement('div');
        beneficiarioDiv.className = 'beneficiario-card';
        beneficiarioDiv.innerHTML = `
            <button type="button" class="remove-beneficiario" data-index="${beneficiarioCount}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <h4>Beneficiário ${beneficiarioCount}</h4>
            <div class="form-group">
                <label for="beneficiario_nome_${beneficiarioCount}">Nome Completo</label>
                <input type="text" id="beneficiario_nome_${beneficiarioCount}" name="beneficiarios[${beneficiarioCount}][nome]" required>
            </div>
            <div class="form-group">
                <label for="beneficiario_cpf_${beneficiarioCount}">CPF</label>
                <input type="text" id="beneficiario_cpf_${beneficiarioCount}" name="beneficiarios[${beneficiarioCount}][cpf]" required>
            </div>
            <div class="form-group">
                <label for="beneficiario_nascimento_${beneficiarioCount}">Data de Nascimento</label>
                <input type="date" id="beneficiario_nascimento_${beneficiarioCount}" name="beneficiarios[${beneficiarioCount}][nascimento]" required>
            </div>
        `;

        container.appendChild(beneficiarioDiv);

        beneficiarioDiv.querySelector('.remove-beneficiario').addEventListener('click', function () {
            container.removeChild(beneficiarioDiv);
        });

        document.getElementById('tipo_plano').addEventListener('change', function () {
    const addButton = document.getElementById('addBeneficiario');
    const beneficiariosContainer = document.getElementById('beneficiariosContainer');

    if (this.value === 'familiar' || this.value === 'empresarial') {
        addButton.style.display = 'inline-flex'; // Mostra o botão
        beneficiariosContainer.style.display = 'block'; // Mostra o container
    } else {
        addButton.style.display = 'none'; // Oculta o botão
        beneficiariosContainer.style.display = 'none'; // Oculta os beneficiários
        beneficiariosContainer.innerHTML = ''; // Limpa os beneficiários adicionados
        beneficiarioCount = 0; // Zera o contador
    }
});

    });

    document.getElementById('cpf_titular').addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 3) value = value.replace(/^(\d{3})/, '$1.');
        if (value.length > 7) value = value.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
        if (value.length > 11) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
        e.target.value = value.substring(0, 14);
    });

    document.getElementById('telefone').addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) value = '(' + value;
        if (value.length > 3) value = value.substring(0, 3) + ') ' + value.substring(3);
        if (value.length > 10) value = value.substring(0, 10) + '-' + value.substring(10);
        e.target.value = value.substring(0, 15);
    });

    document.getElementById('assinaturaForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        const nomesBeneficiarios = [];
        const cpfsBeneficiarios = [];
        const nascimentosBeneficiarios = [];

        const beneficiariosCards = document.querySelectorAll('#beneficiariosContainer .beneficiario-card');
        beneficiariosCards.forEach((card) => {
            const nome = card.querySelector(`input[name^="beneficiarios"][name$="[nome]"]`)?.value;
            const cpf = card.querySelector(`input[name^="beneficiarios"][name$="[cpf]"]`)?.value;
            const nasc = card.querySelector(`input[name^="beneficiarios"][name$="[nascimento]"]`)?.value;

            if (nome && cpf && nasc) {
                nomesBeneficiarios.push(nome);
                cpfsBeneficiarios.push(cpf.replace(/\D/g, ''));
                nascimentosBeneficiarios.push(nasc);
            }
        });

        const senhaPadrao = data.cpf_titular.replace(/\D/g, '');

        const assinanteData = {
            uid: crypto.randomUUID(),
            titular_assinatura: data.titular_assinatura,
            cpf_titular: data.cpf_titular.replace(/\D/g, ''),
            nascimento_titular: data.nascimento_titular,
            telefone: data.telefone.replace(/\D/g, ''),
            email: data.email,
            tipo_plano: data.tipo_plano,
            forma_pagamento: data.forma_pagamento,
            data_assinatura: data.data_assinatura,
            data_vencimento: data.data_vencimento,
            ativo: true,
            canal_cadastro: data.canal_cadastro,
            criado_em: new Date().toISOString(),
            senha_login: senhaPadrao,
            beneficiarios: nomesBeneficiarios.join(','),
            cpf_beneficiarios: cpfsBeneficiarios.join(','),
            nascimento_beneficiarios: nascimentosBeneficiarios.join(',')
        };

        try {
            const { data: insertedData, error } = await supabase
                .from('usuario_assinante')
                .insert([assinanteData]);

            if (error) throw error;

            alert('Assinante cadastrado com sucesso! A senha inicial é o CPF do titular.');
            window.location.href = 'pacientes.html';
        } catch (error) {
            console.error('Erro ao cadastrar assinante:', error);
            alert(`Erro ao cadastrar assinante: ${error.message || 'Verifique os dados.'}`);
        }
    });

    document.getElementById('cancelarCadastro').addEventListener('click', function () {
        if (confirm('Deseja realmente cancelar o cadastro? Todos os dados serão perdidos.')) {
            window.location.href = 'pacientes.html';
        }
    });

    document.getElementById('beneficiariosContainer').addEventListener('input', function (e) {
        if (e.target.id.includes('beneficiario_cpf_')) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 3) value = value.replace(/^(\d{3})/, '$1.');
            if (value.length > 7) value = value.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
            if (value.length > 11) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
            e.target.value = value.substring(0, 14);
        }
    });
});

// Logout compartilhado
function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        sessionStorage.removeItem('clinica_token');
        window.location.href = 'login.html';
    }
}
