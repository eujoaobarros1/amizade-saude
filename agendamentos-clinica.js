document.addEventListener('DOMContentLoaded', async () => {
  const uid_clinica_associada = 'user_9zXy3LkA7PQ6vRt';

  // Buscar assinantes
  const { data: assinantes } = await supabase
    .from('usuario_assinante')
    .select('uid, titular_assinatura');

  const mapaNomes = {};
  assinantes.forEach(ass => {
    mapaNomes[ass.uid] = ass.titular_assinatura;
  });

  // Buscar agendamentos da clínica
  const { data: agendamentos, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('uid_clinica_associada', uid_clinica_associada)
    .order('data', { ascending: true });

  if (error) {
    console.error('Erro ao buscar agendamentos:', error.message);
    return;
  }

  // Preencher lista de agendamentos
  const agendaList = document.getElementById('todayAgenda');
  agendaList.innerHTML = '';

  const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let examesHoje = 0;
  let aguardandoResultado = 0;
  let pacientesAtendidos = 0;

  agendamentos.forEach(item => {
const dataFormatada = item.data.split('-').reverse().join('/');
  const criadoEmFormatado = new Date(item.criado_em).toLocaleString('pt-BR');
  const nomeSolicitante = mapaNomes[item.uid_assinante] || 'Desconhecido';

  // Verifica se é hoje
  const dataItem = new Date(item.data).toISOString().split('T')[0];
  if (dataItem === hoje) examesHoje++;

  // Status pendente
  if (item.aceito === null || item.aceito === '' || item.aceito === undefined) aguardandoResultado++;

  // Exames aceitos
  if (item.aceito === true) pacientesAtendidos++;

  const agendamentoDiv = document.createElement('div');
  agendamentoDiv.className = 'agenda-item';
  agendamentoDiv.innerHTML = `
    <div>
      <strong>${item.exame}</strong>
      <div class="agenda-meta">
        <span class="meta-item"><b>Data:</b> ${dataFormatada}</span>
        <span class="meta-item"><b>Solicitado por:</b> ${nomeSolicitante}</span>
        <span class="meta-item"><b>Criado em:</b> ${criadoEmFormatado}</span>
      </div>
    </div>
  `;
  agendaList.appendChild(agendamentoDiv);
});



  // Atualizar os cards
  document.getElementById('card-exames-hoje').textContent = examesHoje;
  document.getElementById('card-aguardando').textContent = aguardandoResultado;
  document.getElementById('card-pacientes').textContent = pacientesAtendidos;
  document.getElementById('card-faturamento').textContent = '—'; // Atualize depois
});
