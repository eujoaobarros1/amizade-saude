const UID_ASSINANTE = "75e520b3-d0de-4656-a293-bc0d2afcfdf0";

// Gera um UUID aleatório compatível com navegadores modernos
function gerarUID() {
  return crypto.randomUUID();
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalAgendamento");
  const btnAbrir = document.getElementById("btnAbrirModal");
  const fechar = document.getElementById("fecharModal");
  const form = document.getElementById("formAgendamento");

  const selectClinica = document.getElementById("selectClinica");
  const selectExame = document.getElementById("selectExame");
  const selectPaciente = document.getElementById("selectPaciente");

  // Abrir e fechar modal
  btnAbrir.addEventListener("click", () => modal.classList.remove("hidden"));
  fechar.addEventListener("click", () => modal.classList.add("hidden"));
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  // Carregar dropdowns
  carregarClinicas();
  carregarExames();
  carregarPacientes();

  // Listar agendamentos na tela
  listarAgendamentos();

  // Submissão do agendamento
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedExameOption = selectExame.options[selectExame.selectedIndex];
    const nomeExame = selectedExameOption.getAttribute("data-nome-exame");

    const novoAgendamento = {
      uid: gerarUID(),
      uid_assinante: UID_ASSINANTE,
      uid_clinica_associada: selectClinica.value,
      exame: selectExame.value,
      data: document.getElementById("dataExame").value,
      hora: document.getElementById("horaExame").value,
      paciente: selectPaciente.value,
      pagamento: document.getElementById("pagamento").value,
      criado_em: new Date().toISOString()
    };

    const { error } = await supabase.from("agendamentos").insert(novoAgendamento);

    if (error) {
      alert("Erro ao agendar: " + error.message);
    } else {
      alert("Exame agendado com sucesso!");
      modal.classList.add("hidden");
      form.reset();
      listarAgendamentos(); // atualizar a lista após agendar
    }
  });
});

// Carregar todas as clínicas
async function carregarClinicas() {
  const { data, error } = await supabase
    .from("clinicas")
    .select("uid, nome, endereco");

  const select = document.getElementById("selectClinica");
  select.innerHTML = "<option value='' disabled selected>Selecione uma clínica</option>";

  if (error) {
    console.error("Erro ao buscar clínicas:", error.message);
    return;
  }

  data.forEach(clinica => {
    const option = document.createElement("option");
    option.value = clinica.uid;
    option.textContent = `${clinica.nome} – ${clinica.endereco}`;
    select.appendChild(option);
  });
}

// Carregar todos os exames disponíveis
async function carregarExames() {
  const select = document.getElementById("selectExame");

  const { data, error } = await supabase
    .from("valores_exames")
    .select("nome_exame, valor_cheio");

  if (error || !data || data.length === 0) {
    console.error("Erro ao buscar exames:", error?.message || "Nenhum exame encontrado");
    select.innerHTML = "<option disabled selected>Nenhum exame encontrado</option>";
    return;
  }

  select.innerHTML = "<option value='' disabled selected>Selecione um exame</option>";

  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.nome_exame;
    option.setAttribute("data-nome-exame", item.nome_exame);
    const preco = item.valor_cheio ? `R$ ${Number(item.valor_cheio).toFixed(2).replace('.', ',')}` : "R$ --";
    option.textContent = `${item.nome_exame} • ${preco}`;
    select.appendChild(option);
  });
}

// Carregar titular e beneficiários
async function carregarPacientes() {
  const { data, error } = await supabase
    .from("usuario_assinante")
    .select("titular_assinatura, beneficiarios")
    .eq("uid", UID_ASSINANTE)
    .single();

  const select = document.getElementById("selectPaciente");
  select.innerHTML = "<option value='' disabled selected>Selecione o paciente</option>";

  if (error) {
    console.error("Erro ao buscar paciente:", error.message);
    return;
  }

  const { titular_assinatura, beneficiarios } = data;
  const nomes = [titular_assinatura];

  if (beneficiarios) {
    const lista = beneficiarios.split(",").map(b => b.trim()).filter(Boolean);
    nomes.push(...lista);
  }

  nomes.forEach(nome => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });
}

// Exibir opções de pagamento online
document.getElementById("pagamento").addEventListener("change", function () {
  const opcoesOnline = document.getElementById("opcoesOnline");
  if (this.value === "Pagar Online") {
    opcoesOnline.classList.remove("hidden");
  } else {
    opcoesOnline.classList.add("hidden");
  }
});

// Formatar data no formato dd/mm
function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}

// Listar agendamentos na tela
async function listarAgendamentos() {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("paciente, exame, data, hora, pagamento")
    .eq("uid_assinante", UID_ASSINANTE)
    .order("data", { ascending: false });

  const container = document.getElementById("listaAgendamentos");
  container.innerHTML = "";

  if (error) {
    console.error("Erro ao buscar agendamentos:", error.message);
    return;
  }

  data.forEach(agendamento => {
    const card = document.createElement("div");
    card.className = "card-agendamento";

    card.innerHTML = `
      <strong>Paciente:</strong> ${agendamento.paciente}<br>
      <strong>Exame:</strong> ${agendamento.exame}<br>
      <strong>Data:</strong> ${formatarData(agendamento.data)}<br>
      <strong>Hora:</strong> ${agendamento.hora}<br>
      <strong>Pagamento:</strong> ${agendamento.pagamento}
    `;

    container.appendChild(card);
  });
}
