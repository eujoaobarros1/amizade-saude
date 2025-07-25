document.addEventListener('DOMContentLoaded', async () => {
  const uid_clinica_associada = 'user_9zXy3LkA7PQ6vRt';

  const { data, error } = await supabase
    .from('clinicas')
    .select('*')
    .eq('uid', uid_clinica_associada)
    .single();

  if (error) {
    console.error('Erro ao buscar dados da clínica:', error.message);
    return;
  }

  // Preencher título e subtítulo
  const title = document.getElementById('clinicTitle');
  const subtitle = document.getElementById('clinicSub');
  if (title) title.textContent = `Dashboard da Clínica - ${data.nome}`;
  if (subtitle) subtitle.innerHTML = `Bem-vindo(a), <strong>${data.nome}</strong>!`;

  // Exibir exames + valores
  const exames = data.exames?.split(',') || [];
  const valores = data.valores_exames?.split(',') || [];
  const agendaList = document.getElementById('todayAgenda');
  agendaList.innerHTML = '';

  exames.forEach((exame, index) => {
    const valor = valores[index] ? `R$ ${valores[index].trim()}` : 'Valor não informado';
    const item = document.createElement('div');
    item.className = 'agenda-item';
    item.innerHTML = `
      <div><strong>${exame.trim()}</strong></div>
      <div>${valor}</div>
    `;
    agendaList.appendChild(item);
  });

  // Agora vamos buscar os dados na tabela de agendamentos
  const hoje = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

  const { data: agendamentos, error: errAg } = await supabase
    .from('usuario_assinante')
    .select('*')
    .eq('uid', uid_clinica_associada);

  if (errAg) {
    console.error('Erro ao buscar agendamentos:', errAg.message);
    return;
  }

  // Contadores
  const examesHoje = agendamentos.filter(a => a.data_agendamento === hoje).length;
  const aguardandoResultado = agendamentos.filter(a => a.resultado_pronto === false).length;
  const pacientesAtivos = agendamentos.filter(a => a.aceito === true).length;

  // Atualiza os cards no DOM
  document.getElementById('card-exames-hoje').textContent = examesHoje;
  document.getElementById('card-aguardando').textContent = aguardandoResultado;
  document.getElementById('card-pacientes').textContent = pacientesAtivos;
  document.getElementById('card-faturamento').textContent = ''; // vazio
});
