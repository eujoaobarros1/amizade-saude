document.addEventListener("DOMContentLoaded", async () => {
  const uidClinica = "user_9zXy3LkA7PQ6vRt";

  const tbody = document.getElementById("patientsTableBody");
  const editModal = document.getElementById("editModal");
  const editContent = document.getElementById("editPacienteDados");
  const closeEditModal = document.getElementById("closeEditModal");

  closeEditModal.onclick = () => editModal.classList.add("hidden");

  try {
    const { data: agendamentos, error: errorAg } = await supabase
      .from("agendamentos")
      .select("uid_assinante, data")
      .eq("uid_clinica_associada", uidClinica);
    if (errorAg) throw errorAg;
    if (!agendamentos?.length) return;

    const uidsPacientes = [...new Set(agendamentos.map(ag => ag.uid_assinante))];

    const { data: pacientes, error: errorPac } = await supabase
      .from("usuario_assinante")
      .select("*")
      .in("uid", uidsPacientes);
    if (errorPac) throw errorPac;

    tbody.innerHTML = "";

    pacientes.forEach((paciente) => {
      const nome = paciente.titular_assinatura || "—";
      const cpf = paciente.cpf_titular || "—";
      const telefone = paciente.telefone || "—";
      const nascimento = paciente.nascimento_titular
        ? new Date(paciente.nascimento_titular).toLocaleDateString("pt-BR")
        : "—";

      let beneficiariosHTML = "<span>—</span>";
      if (
        paciente.beneficiarios &&
        paciente.cpf_beneficiarios &&
        paciente.nascimento_beneficiarios
      ) {
        const nomes = paciente.beneficiarios.split(",");
        const cpfs = paciente.cpf_beneficiarios.split(",");
        const nascimentos = paciente.nascimento_beneficiarios.split(",");

        beneficiariosHTML = nomes.map((nomeB, i) => {
          const cpfB = cpfs[i]?.trim() || "—";
          const nascB = nascimentos[i]
            ? new Date(nascimentos[i].trim()).toLocaleDateString("pt-BR")
            : "—";
          return `
            <div class="beneficiario-card">
              <strong>${nomeB.trim()}</strong><br>
              <span>CPF: ${cpfB}</span><br>
              <span>Nasc.: ${nascB}</span>
            </div>
          `;
        }).join("");
      }

      const agendamentosPaciente = agendamentos
        .filter(a => a.uid_assinante === paciente.uid)
        .map(a => new Date(a.data));

      const ultimaConsulta = agendamentosPaciente.length
        ? new Date(Math.max(...agendamentosPaciente)).toLocaleDateString("pt-BR")
        : "—";

      const status = paciente.ativo ? "Ativo" : "Inativo";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="patient-avatar">
            <img src="assets/user.png" alt="Avatar">
            <span>${nome}</span>
          </div>
        </td>
        <td>${cpf}</td>
        <td>${nascimento}</td>
        <td>${telefone}</td>
        <td>${beneficiariosHTML}</td>
        <td>${ultimaConsulta}</td>
        <td><span class="status-badge ${status === "Ativo" ? "active" : "inactive"}">${status}</span></td>
        <td>
          <button class="btn-action edit-btn"
            data-uid="${paciente.uid}"
            data-nome="${nome}"
            data-cpf="${cpf}"
            data-telefone="${telefone}"
            data-beneficiarios='${JSON.stringify({
              nomes: paciente.beneficiarios || "",
              cpfs: paciente.cpf_beneficiarios || "",
              nascimentos: paciente.nascimento_beneficiarios || ""
            })}'
          >Editar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Delegar evento para os botões de editar
    tbody.addEventListener("click", (e) => {
      if (e.target.classList.contains("edit-btn")) {
        const uid = e.target.dataset.uid;
        const nome = e.target.dataset.nome;
        const cpf = e.target.dataset.cpf;
        const telefone = e.target.dataset.telefone;
        const beneficiariosData = JSON.parse(e.target.dataset.beneficiarios);

        // Montar beneficiários formatados
        let beneficiariosBloco = "<span>—</span>";
        if (
          beneficiariosData.nomes &&
          beneficiariosData.cpfs &&
          beneficiariosData.nascimentos
        ) {
          const nomes = beneficiariosData.nomes.split(",");
          const cpfs = beneficiariosData.cpfs.split(",");
          const nascimentos = beneficiariosData.nascimentos.split(",");

          beneficiariosBloco = nomes.map((nomeB, i) => {
            const cpfB = cpfs[i]?.trim() || "—";
            const nascB = nascimentos[i]
              ? new Date(nascimentos[i].trim()).toLocaleDateString("pt-BR")
              : "—";
            return `
              <div class="beneficiario-card" style="margin-bottom: 10px;">
                <strong>${nomeB.trim()}</strong><br>
                <span>CPF: ${cpfB}</span><br>
                <span>Nasc.: ${nascB}</span>
              </div>
            `;
          }).join("");
        }

        editContent.innerHTML = `
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>CPF:</strong> ${cpf}</p>
          <label for="editTelefone">Telefone:</label>
          <input type="text" id="editTelefone" value="${telefone}" style="width: 100%; margin-top: 4px; margin-bottom: 12px; padding: 6px;">
          <button id="btnSalvarTelefone" class="btn-primary" style="font-size: 14px; padding: 6px 12px;">Salvar</button>

          <hr style="margin: 20px 0;">

          <h4>Beneficiários:</h4>
          ${beneficiariosBloco}
        `;

        editModal.classList.remove("hidden");

        document.getElementById("btnSalvarTelefone").onclick = async () => {
          const novoTelefone = document.getElementById("editTelefone").value.trim();
          if (!novoTelefone) return alert("Informe um telefone válido.");

          const { error } = await supabase
            .from("usuario_assinante")
            .update({ telefone: novoTelefone })
            .eq("uid", uid);

          if (error) {
            alert("Erro ao atualizar telefone.");
            console.error(error);
          } else {
            alert("Telefone atualizado com sucesso!");
            location.reload();
          }
        };
      }
    });

  } catch (err) {
    console.error("Erro ao carregar pacientes:", err.message);
  }
});
// Filtro de pacientes pelo campo de busca
const searchInput = document.getElementById("patientSearch");
const searchBtn = document.querySelector(".search-btn");

function filtrarPacientes() {
  const termo = searchInput.value.toLowerCase();
  const linhas = document.querySelectorAll("#patientsTableBody tr");

  linhas.forEach((linha) => {
    const nome = linha.querySelector(".patient-avatar span")?.textContent.toLowerCase() || "";
    linha.style.display = nome.includes(termo) ? "" : "none";
  });
}

searchInput.addEventListener("input", filtrarPacientes);
searchBtn.addEventListener("click", filtrarPacientes);
