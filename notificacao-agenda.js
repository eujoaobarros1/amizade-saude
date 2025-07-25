document.addEventListener("DOMContentLoaded", async () => {
  const uidClinica = "user_9zXy3LkA7PQ6vRt";

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("uid_clinica_associada", uidClinica)
    .is("aceito", null);

  if (error) {
    console.error("Erro ao verificar pendências:", error);
    return;
  }

  if (agendamentos.length > 0) {
    const aviso = document.getElementById("aviso-pendentes");
    if (aviso) aviso.classList.remove("hidden");
  }
});
