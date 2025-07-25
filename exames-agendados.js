function formatarData(dataISO) {
  const dataObj = new Date(dataISO);
  const dia = String(dataObj.getDate()).padStart(2, '0');
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
  const ano = dataObj.getFullYear();
  return `${dia}/${mes}/${ano}`;
}


// Aguarda o DOM carregar
document.addEventListener("DOMContentLoaded", async () => {
  const examesGrid = document.querySelector(".exames-grid");
  const UID_FIXO = "75e520b3-d0de-4656-a293-bc0d2afcfdf0";

  try {
    // Busca os agendamentos do usuário fixo
    const { data: agendamentos, error } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("uid_assinante", UID_FIXO);

    if (error) throw error;

    // Limpa os cards existentes
    examesGrid.innerHTML = "";

    // Itera por cada agendamento
    for (const agendamento of agendamentos) {
      const {
        exame,
        data,
        hora,
        aceito,
        mensagem_para_o_paciente,
        pagamento,
        paciente,
        uid_clinica_associada,
        uid_assinante
      } = agendamento;

      // Busca o nome do titular do assinante
      const { data: assinanteData } = await supabase
        .from("usuario_assinante")
        .select("titular_assinatura")
        .eq("uid", uid_assinante)
        .single();

      // Busca o nome da clínica associada
      const { data: clinicaData } = await supabase
        .from("clinicas")
        .select("nome")
        .eq("uid", uid_clinica_associada)
        .single();

      const statusClass = aceito === true ? "confirmed" : "pending";
      const statusLabel = aceito === true ? "Confirmado" : "Pendente";
      const pagamentoLabel = pagamento ? pagamento : "Não informado";

      const card = `
        <div class="exame-card ${statusClass}">
          <div class="exame-header">
              <div class="exame-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
              </div>
              <h3>${exame}</h3>
              <div class="exame-status">${statusLabel}</div>
          </div>

          <div class="exame-details">
              <div class="detail-item">
                  <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  <span><strong>Paciente:</strong> ${assinanteData?.titular_assinatura || "Desconhecido"}</span>
              </div>
              <div class="detail-item">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
<span><strong>Data:</strong> ${formatarData(data)}</span>
              </div>
              <div class="detail-item">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span><strong>Hora:</strong> ${hora}</span>
              </div>
              <div class="detail-item">
                  <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  <span><strong>Pagamento:</strong> ${pagamentoLabel}</span>
              </div>
              <div class="detail-item full-width">
                  <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="10" y1="13" x2="16" y2="13"/><line x1="10" y1="17" x2="12" y2="17"/></svg>
                  <span><strong>Clínica:</strong> ${clinicaData?.nome || "Não encontrada"}</span>
              </div>
              ${mensagem_para_o_paciente ? `
              <div class="detail-item full-width">
                  <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>
                  <span><strong>Observação:</strong> ${mensagem_para_o_paciente}</span>
              </div>` : ""}
          </div>

          
        </div>
      `;

      examesGrid.insertAdjacentHTML("beforeend", card);
    }

    if (agendamentos.length === 0) {
      examesGrid.innerHTML = `<p>Nenhum exame agendado encontrado.</p>`;
    }

  } catch (err) {
    console.error("Erro ao buscar exames agendados:", err.message);
    examesGrid.innerHTML = `<p class="error">Erro ao carregar exames. Tente novamente mais tarde.</p>`;
  }
});
