document.addEventListener("DOMContentLoaded", async () => {
  const uidClinica = "user_9zXy3LkA7PQ6vRt";

  try {
    // Busca dados da clínica com base no UID
    const { data, error } = await supabase
      .from("clinicas")
      .select("*")
      .eq("uid", uidClinica)
      .single();

    if (error || !data) throw error || new Error("Clínica não encontrada.");

    const clinicaId = data.id; // UUID real da clínica

    const grid = document.getElementById("clinicaInfoGrid");
    grid.innerHTML = `
      <div class="info-group">
        <label>Nome da Clínica</label>
        <p>${data.nome || "—"}</p>
      </div>
      <div class="info-group">
        <label>CNPJ</label>
        <p>${data.cnpj || "—"}</p>
      </div>
      <div class="info-group">
        <label>Status</label>
        <p><span class="badge ${data.ativo ? "active" : "inactive"}">${data.ativo ? "Ativo" : "Inativo"}</span></p>
      </div>
      <div class="info-group">
        <label>Data Ativação</label>
        <p>${data.criado_em ? new Date(data.criado_em).toLocaleDateString("pt-BR") : "—"}</p>
      </div>
      <div class="info-group">
        <label>Endereço</label>
        <p>${data.endereco || "—"}</p>
      </div>
      <div class="info-group">
        <label>Telefone</label>
        <p>${data.telefone || "—"}</p>
      </div>
      <div class="info-group">
        <label>E-mail</label>
        <p>${data.email || "—"}</p>
      </div>
      <div class="info-group">
        <label>Site</label>
        <p>${data.site || "—"}</p>
      </div>
      
      </div>
    `;

    console.log("✅ Chamando carregarExamesDaClinica...");
    await carregarExamesDaClinica(clinicaId);

  } catch (err) {
    console.error("❌ Erro ao carregar dados da clínica:", err.message);
  }
});

async function carregarExamesDaClinica(clinicaId) {
  console.log("🔍 Carregando exames para clínica UUID:", clinicaId);

  const { data: exames, error: err1 } = await supabase
    .from("valores_exames")
    .select("*");

  if (err1 || !exames) {
    console.error("❌ Erro ao buscar exames:", err1?.message);
    return;
  }

  const { data: ativos, error: err2 } = await supabase
    .from("exames_clinica")
    .select("exame_id, ativo, id")
    .eq("clinica_id", clinicaId);

  if (err2 || !ativos) {
    console.error("❌ Erro ao buscar exames da clínica:", err2?.message);
    return;
  }

  const ativosMap = new Map(ativos.map(e => [e.exame_id, { ativo: e.ativo, id: e.id }]));

  const container = document.getElementById("lista-exames");
  container.innerHTML = "";

  exames.forEach(exame => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("exame-item");

    const label = document.createElement("span");
    label.innerText = `${exame.nome_exame} — R$ ${exame.valor_amizade_saude}`;

    const botao = document.createElement("button");
    const ativoAtual = ativosMap.get(exame.id)?.ativo ?? false;

    botao.innerText = ativoAtual ? "Desativar" : "Ativar";
    botao.className = ativoAtual ? "btn-desativar" : "btn-ativar";

    botao.addEventListener("click", async () => {
      const novoEstado = !ativoAtual;
      await toggleExame(clinicaId, exame.id, novoEstado);
      carregarExamesDaClinica(clinicaId); // recarrega interface
    });

    wrapper.appendChild(label);
    wrapper.appendChild(botao);
    container.appendChild(wrapper);
  });
}


// Ativa ou desativa o exame para a clínica no Supabase
async function toggleExame(clinicaId, exameId, ativo) {
  const { data: existente } = await supabase
    .from("exames_clinica")
    .select("*")
    .eq("clinica_id", clinicaId)
    .eq("exame_id", exameId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("exames_clinica")
      .update({ ativo })
      .eq("id", existente.id);
  } else {
    await supabase
      .from("exames_clinica")
      .insert([{ clinica_id: clinicaId, exame_id: exameId, ativo }]);
  }
}
