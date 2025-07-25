document.addEventListener("DOMContentLoaded", async () => {
  try {
    const uidClinica = "user_9zXy3LkA7PQ6vRt"; // UID fixo da clínica

    const { data: agendamentos, error } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("uid_clinica_associada", uidClinica);

    if (error) throw error;

    const uids = [...new Set(agendamentos.map(a => a.uid_assinante))];

    const { data: assinantes, error: errorAssinantes } = await supabase
      .from("usuario_assinante")
      .select("uid, titular_assinatura")
      .in("uid", uids);

    if (errorAssinantes) throw errorAssinantes;

    window.mapaNomes = {};
    assinantes.forEach(a => {
      mapaNomes[a.uid] = a.titular_assinatura;
    });

    renderizarTabela(agendamentos);

    // Aplicar filtros
    // Aplicar filtros
document.getElementById("apply-filters").addEventListener("click", aplicarFiltros);

// Botão de busca (lupa)
document.getElementById("search-btn")?.addEventListener("click", aplicarFiltros);

// Ativar busca com Enter no campo de pesquisa
document.getElementById("agenda-search")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") aplicarFiltros();
});

// Função de filtro e renderização
async function aplicarFiltros() {
  const filtroData = document.getElementById("date-filter").value;
  const filtroStatus = document.getElementById("status-filter").value;
  const filtroTipo = document.getElementById("type-filter").value;
  const termoBusca = document.getElementById("agenda-search").value.toLowerCase();

  let { data: agendamentosFiltrados, error } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("uid_clinica_associada", uidClinica);

  if (error) return alert("Erro ao filtrar dados.");

  agendamentosFiltrados = agendamentosFiltrados.filter((ag) => {
    const dataMatch = !filtroData || ag.data?.startsWith(filtroData);
    const statusMatch =
      filtroStatus === "all" ||
      (filtroStatus === "confirmed" && ag.aceito === true) ||
      (filtroStatus === "pending" && ag.aceito === null) ||
      (filtroStatus === "canceled" && ag.aceito === false);
    const tipoMatch =
      filtroTipo === "all" ||
      (filtroTipo === "consultation" && ag.tipo === "Consulta") ||
      (filtroTipo === "exam" && ag.tipo === "Exame") ||
      (filtroTipo === "procedure" && ag.tipo === "Procedimento");
    const nomePaciente = mapaNomes[ag.uid_assinante]?.toLowerCase() || "";
    const buscaMatch = nomePaciente.includes(termoBusca);

    return dataMatch && statusMatch && tipoMatch && buscaMatch;
  });

  renderizarTabela(agendamentosFiltrados);
}


  } catch (err) {
    console.error("Erro ao carregar agendamentos:", err.message);
  }
});

function renderizarTabela(agendamentos) {
  const tbody = document.getElementById("agendaTableBody");
  tbody.innerHTML = "";

  document.getElementById("total-count").textContent = agendamentos.length;
  document.getElementById("confirmed-count").textContent = agendamentos.filter(a => a.aceito === true).length;
  document.getElementById("pending-count").textContent = agendamentos.filter(a => a.aceito === null).length;

  agendamentos.forEach(ag => {
    const tr = document.createElement("tr");

    let statusText = "Pendente";
    let statusClass = "pending";
    if (ag.aceito === true) {
      statusText = "Confirmado";
      statusClass = "confirmed";
    } else if (ag.aceito === false) {
      statusText = "Cancelado";
      statusClass = "canceled";
    }

    const paciente = mapaNomes[ag.uid_assinante] || "Desconhecido";
    const exame = ag.exame || "-";
const data = ag.data ? ag.data.split('-').reverse().join('/') : "-";
    const hora = ag.hora
      ? new Date(`1970-01-01T${ag.hora}`).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "-";
    const observacao = ag.observacao || "-";

    const pagamento = ag.pagamento || "—";
let pagamentoClass = "";

switch (pagamento) {
  case "online pendente":
    pagamentoClass = "pagamento-online-pendente";
    break;
  case "online realizado":
    pagamentoClass = "pagamento-online-realizado";
    break;
  case "na clinica pendente":
    pagamentoClass = "pagamento-clinica-pendente";
    break;
  case "na clinica realizado":
    pagamentoClass = "pagamento-clinica-realizado";
    break;
  default:
    pagamentoClass = "pagamento-desconhecido";
}

tr.innerHTML = `
  <td>${paciente}</td>
  <td>${exame}</td>
  <td>${data}</td>
  <td>${hora}</td>
  <td><span class="status-badge ${statusClass}">${statusText}</span></td>
  <td><span class="pagamento-badge ${pagamentoClass}">${pagamento}</span></td>
  <td>${observacao}</td>
  <td><button class="btn-editar" data-id="${ag.id}">Editar</button></td>
`;


    const editarBtn = tr.querySelector('.btn-editar');
    editarBtn.addEventListener('click', async () => {
      const agendamentoId = editarBtn.dataset.id;
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', agendamentoId)
        .single();

      if (error) {
        alert("Erro ao buscar agendamento.");
        return;
      }

      window.agendamentoSelecionado = data;
      document.getElementById('editarData').value = data.data?.split('T')[0] || '';
      document.getElementById('editarHora').value = data.hora || '';
      document.getElementById('editarStatus').value = data.aceito === null ? '' : String(data.aceito);
      document.getElementById('editarObservacao').value = data.observacao || '';
      document.getElementById('modalEditar').classList.remove('hidden');
    });

    tbody.appendChild(tr);
  });
}

// Cancelar edição
document.getElementById('cancelarEditar').addEventListener('click', () => {
  document.getElementById('modalEditar').classList.add('hidden');
  agendamentoSelecionado = null;
});

// Abrir modal de confirmação
document.getElementById('salvarEditar').addEventListener('click', () => {
  document.getElementById('modalConfirmar').classList.remove('hidden');
});

// Cancelar confirmação
document.getElementById('cancelarConfirmar').addEventListener('click', () => {
  document.getElementById('modalConfirmar').classList.add('hidden');
});

// Confirmar e salvar
document.getElementById('confirmarSalvar').addEventListener('click', async () => {
  const novaData = document.getElementById('editarData').value;
  const novaHora = document.getElementById('editarHora').value;
  const novoStatus = document.getElementById('editarStatus').value;
  const novaObs = document.getElementById('editarObservacao').value;

  const { error } = await supabase
    .from('agendamentos')
    .update({
      data: novaData,
      hora: novaHora,
      aceito: novoStatus === '' ? null : (novoStatus === 'true'),
      observacao: novaObs
    })
    .eq('id', agendamentoSelecionado.id);

  if (error) {
    alert("Erro ao salvar alterações.");
    console.error(error);
  } else {
    alert("Alterações salvas com sucesso!");
    location.reload();
  }
});
