const UID_ASSINANTE = "75e520b3-d0de-4656-a293-bc0d2afcfdf0";

document.addEventListener("DOMContentLoaded", () => {
    // Carrega os dados do perfil
    carregarPerfil();

    // Configura o modal de edição
    const modalEditar = document.getElementById("modalEditarPerfil");
    const btnEditar = document.getElementById("btnEditarPerfil");
    const fecharModal = document.getElementById("fecharModalEditar");
    const btnCancelar = document.getElementById("cancelarEdicao");

    btnEditar.addEventListener("click", () => modalEditar.classList.remove("hidden"));
    fecharModal.addEventListener("click", () => modalEditar.classList.add("hidden"));
    btnCancelar.addEventListener("click", () => modalEditar.classList.add("hidden"));
    window.addEventListener("click", (e) => {
        if (e.target === modalEditar) modalEditar.classList.add("hidden");
    });
});

// Função para formatar data no formato dd/mm/aaaa
function formatarData(dataISO) {
    if (!dataISO) return '--';
    const [ano, mes, dia] = dataISO.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para formatar CPF
function formatarCPF(cpf) {
    if (!cpf) return '--';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para processar os arrays de beneficiários
function processarBeneficiarios(beneficiariosStr, cpfsStr, nascimentosStr) {
    if (!beneficiariosStr) return [];
    
    const nomes = beneficiariosStr.split(',');
    const cpfs = cpfsStr ? cpfsStr.split(',') : Array(nomes.length).fill('--');
    const nascimentos = nascimentosStr ? nascimentosStr.split(',') : Array(nomes.length).fill('--');
    
    return nomes.map((nome, index) => ({
        nome: nome.trim(),
        cpf: cpfs[index] ? formatarCPF(cpfs[index].trim()) : '--',
        nascimento: nascimentos[index] ? formatarData(nascimentos[index].trim()) : '--'
    }));
}

// Função principal para carregar os dados do perfil
async function carregarPerfil() {
    const { data, error } = await supabase
        .from('usuario_assinante')
        .select('*')
        .eq('uid', UID_ASSINANTE)
        .single();

    if (error) {
        console.error('Erro ao carregar perfil:', error);
        alert('Erro ao carregar dados do perfil');
        return;
    }

    // Preenche os dados do titular
    preencherDadosTitular(data);
    
    // Preenche os dados do plano
    preencherDadosPlano(data);
    
    // Preenche a lista de beneficiários
    preencherBeneficiarios(data);
    
    // Configura o link do contrato
    if (data.link_contrato_assinado) {
        document.getElementById('linkContrato').href = data.link_contrato_assinado;
    }
}

function preencherDadosTitular(dados) {
    const container = document.getElementById('dadosTitular');
    
    const html = `
        <div class="profile-row">
            <span class="profile-label">Nome Completo:</span>
            <span class="profile-value">${dados.titular_assinatura || '--'}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">CPF:</span>
            <span class="profile-value">${formatarCPF(dados.cpf_titular) || '--'}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Data de Nascimento:</span>
            <span class="profile-value">${formatarData(dados.nascimento_titular) || '--'}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Telefone:</span>
            <span class="profile-value">${dados.telefone || '--'}</span>
        </div>
    `;
    
    container.innerHTML = html;
}

function preencherDadosPlano(dados) {
    const container = document.getElementById('dadosPlano');
    
    const statusPlano = dados.ativo ? 'Ativo' : 'Inativo';
    const statusClass = dados.ativo ? 'status-active' : 'status-inactive';
    
    const html = `
        <div class="profile-row">
            <span class="profile-label">Tipo de Plano:</span>
            <span class="profile-value">${dados.tipo_plano || '--'}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Forma de Pagamento:</span>
            <span class="profile-value">${dados.forma_pagamento || '--'}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Data de Assinatura:</span>
            <span class="profile-value">${formatarData(dados.data_assinatura) || '--'}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Próximo Vencimento:</span>
            <span class="profile-value">${formatarData(dados.data_vencimento) || '--'}</span>
        </div>
        <div class="profile-row">
            <span class="profile-label">Status do Plano:</span>
            <span class="profile-value ${statusClass}">${statusPlano}</span>
        </div>
    `;
    
    container.innerHTML = html;
}

function preencherBeneficiarios(dados) {
    const container = document.getElementById('listaBeneficiarios');
    const beneficiariosCard = document.getElementById('beneficiariosCard');
    
    if (!dados.beneficiarios || dados.beneficiarios.trim() === '') {
        beneficiariosCard.classList.add('hidden');
        return;
    }
    
    const beneficiarios = processarBeneficiarios(
        dados.beneficiarios,
        dados.cpf_beneficiarios,
        dados.nascimento_beneficiarios
    );
    
    let html = '';
    
    beneficiarios.forEach((beneficiario, index) => {
        html += `
            <div class="beneficiary-item">
                <h3>Beneficiário ${index + 1}</h3>
                <div class="profile-row">
                    <span class="profile-label">Nome:</span>
                    <span class="profile-value">${beneficiario.nome}</span>
                </div>
                <div class="profile-row">
                    <span class="profile-label">CPF:</span>
                    <span class="profile-value">${beneficiario.cpf}</span>
                </div>
                <div class="profile-row">
                    <span class="profile-label">Data de Nascimento:</span>
                    <span class="profile-value">${beneficiario.nascimento}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    beneficiariosCard.classList.remove('hidden');
}

// Função de logout
function logout() {
    // Implemente a lógica de logout aqui
    console.log("Usuário deslogado");
    window.location.href = "login.html";
}