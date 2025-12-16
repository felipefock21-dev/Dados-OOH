// Estado da aplicação
let dados = [];
let registroEmEdicao = null;
// API_BASE será definido dinamicamente baseado no ambiente
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : 'https://seu-worker.seu-dominio.workers.dev/api'; // Mude para seu worker URL

// Elementos do DOM
const modal = document.getElementById('modalFormulario');
const modalConfirmacao = document.getElementById('modalConfirmacao');
const btnNovoRegistro = document.getElementById('btnNovoRegistro');
const btnCancelar = document.getElementById('btnCancelar');
const btnCancelarDelete = document.getElementById('btnCancelarDelete');
const btnConfirmarDelete = document.getElementById('btnConfirmarDelete');
const formulario = document.getElementById('formularioDados');
const tabelaDadosBody = document.getElementById('tabelaDadosBody');
const searchInput = document.getElementById('searchInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
btnNovoRegistro.addEventListener('click', abrirModalNovoRegistro);
btnCancelar.addEventListener('click', fecharModal);
document.querySelector('.close').addEventListener('click', fecharModal);
formulario.addEventListener('submit', salvarRegistro);
searchInput.addEventListener('input', filtrarTabela);

// Inicializar
window.addEventListener('load', carregarDados);

// ===== FUNÇÕES PRINCIPAIS =====

async function carregarDados() {
  try {
    loadingSpinner.style.display = 'block';
    errorMessage.classList.remove('active');
    
    const response = await fetch(`${API_BASE}/dados`);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }
    
    dados = await response.json();
    
    if (dados.length === 0) {
      dados = obterDadosExemplo();
    }
    
    atualizarTabela();
    loadingSpinner.style.display = 'none';
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    mostrarErro('Erro ao carregar dados. Usando dados de exemplo.');
    dados = obterDadosExemplo();
    atualizarTabela();
    loadingSpinner.style.display = 'none';
  }
}

function atualizarTabela() {
  tabelaDadosBody.innerHTML = '';
  
  if (dados.length === 0) {
    tabelaDadosBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">Nenhum registro encontrado</td></tr>';
    return;
  }
  
  dados.forEach((registro, index) => {
    const linha = document.createElement('tr');
    
    const cliente = registro['Cliente'] || '-';
    const campanha = registro['Campanha'] || '-';
    const tipoOOH = registro['Tipo de OOH'] || '-';
    const statusCliente = registro['Status Cliente'] || '-';
    const cidade = (registro['Cidade'] || '').split(',')[0];
    const investimento = registro['Investimento'] || 'R$ 0,00';
    const impactos = formatarNumero(registro['Impactos Total'] || 0);
    
    linha.innerHTML = `
      <td><strong>${cliente}</strong></td>
      <td>${campanha}</td>
      <td>${tipoOOH}</td>
      <td><span class="status ${statusCliente.toLowerCase()}">${statusCliente}</span></td>
      <td>${cidade}</td>
      <td>${investimento}</td>
      <td>${impactos}</td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="abrirModalEditar(${index})">✏️ Editar</button>
          <button class="btn-delete" onclick="confirmarDeletar(${index})">🗑️ Deletar</button>
        </div>
      </td>
    `;
    
    tabelaDadosBody.appendChild(linha);
  });
}

function filtrarTabela() {
  const termo = searchInput.value.toLowerCase();
  const linhas = tabelaDadosBody.querySelectorAll('tr');
  
  linhas.forEach(linha => {
    const texto = linha.textContent.toLowerCase();
    if (texto.includes(termo)) {
      linha.style.display = '';
    } else {
      linha.style.display = 'none';
    }
  });
}

// ===== MODAL =====

function abrirModalNovoRegistro() {
  registroEmEdicao = null;
  formulario.reset();
  document.getElementById('modalTitulo').textContent = 'Novo Registro';
  modal.classList.add('active');
}

function abrirModalEditar(index) {
  registroEmEdicao = index;
  const registro = dados[index];
  
  document.getElementById('modalTitulo').textContent = 'Editar Registro';
  
  // Preencher formulário
  Object.keys(registro).forEach(chave => {
    const elemento = document.querySelector(`[name="${chave}"]`);
    if (elemento) {
      elemento.value = registro[chave];
    }
  });
  
  modal.classList.add('active');
}

function fecharModal() {
  modal.classList.remove('active');
  registroEmEdicao = null;
  formulario.reset();
}

function confirmarDeletar(index) {
  const registro = dados[index];
  const cliente = registro['Cliente'] || 'Registro';
  
  document.getElementById('msgConfirmacao').textContent = 
    `Tem certeza que deseja deletar o registro de "${cliente}"? Esta ação não pode ser desfeita.`;
  
  btnConfirmarDelete.onclick = () => deletarRegistro(index);
  modalConfirmacao.classList.add('active');
}

document.addEventListener('click', (e) => {
  if (e.target === modalConfirmacao) {
    modalConfirmacao.classList.remove('active');
  }
});

btnCancelarDelete.addEventListener('click', () => {
  modalConfirmacao.classList.remove('active');
});

// ===== CRUD OPERATIONS =====

async function salvarRegistro(e) {
  e.preventDefault();
  
  try {
    const formData = new FormData(formulario);
    const registro = Object.fromEntries(formData);
    
    if (registroEmEdicao !== null) {
      // UPDATE
      const response = await fetch(`${API_BASE}/dados/${registroEmEdicao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar registro');
      }
      
      dados[registroEmEdicao] = registro;
      mostrarSucesso('Registro atualizado com sucesso!');
    } else {
      // CREATE
      const response = await fetch(`${API_BASE}/dados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar registro');
      }
      
      dados.push(registro);
      mostrarSucesso('Registro criado com sucesso!');
    }
    
    atualizarTabela();
    fecharModal();
  } catch (error) {
    console.error('Erro ao salvar:', error);
    mostrarErro(error.message || 'Erro ao salvar registro');
  }
}

async function deletarRegistro(index) {
  try {
    const response = await fetch(`${API_BASE}/dados/${index}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao deletar registro');
    }
    
    dados.splice(index, 1);
    atualizarTabela();
    modalConfirmacao.classList.remove('active');
    mostrarSucesso('Registro deletado com sucesso!');
  } catch (error) {
    console.error('Erro ao deletar:', error);
    mostrarErro(error.message || 'Erro ao deletar registro');
  }
}

// ===== NOTIFICAÇÕES =====

function mostrarErro(mensagem) {
  errorMessage.textContent = '❌ ' + mensagem;
  errorMessage.classList.add('active');
  setTimeout(() => {
    errorMessage.classList.remove('active');
  }, 5000);
}

function mostrarSucesso(mensagem) {
  // Criar notificação temporária
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 2000;
    animation: slideInRight 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  notif.textContent = '✓ ' + mensagem;
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.remove();
  }, 3000);
}

// ===== UTILITÁRIOS =====

function formatarNumero(num) {
  return new Intl.NumberFormat('pt-BR').format(num);
}

function obterDadosExemplo() {
  return [
    {
      'Cliente': 'Madeira Madeira',
      'Status Cliente': 'Ativo',
      'Campanha': 'julho 2025',
      'Tipo de OOH': 'Dooh',
      'Status Campanha': 'Ativa',
      'Região': 'Sudeste',
      'Estado': 'SP',
      'Cidade': 'São Paulo, SP',
      'Exibidora': 'Helloo',
      'URL logo exibidora': '',
      'Mês de exibição': 'Julho',
      'Início da campanha': '07/07',
      'Término da campanha': '06/08',
      'Impactos Total': '179712',
      'Investimento': 'R$ 5.700,00',
      'Mídia Coin': '40714.29',
      '(NOTA) Bonificação': '10',
      '(NOTA) Flexibilidade em Negociação': '5',
      '(NOTA) Atendimento': '9',
      '(NOTA) Processos ADM e FIN': '10'
    },
    {
      'Cliente': 'Cruzeiro do Sul',
      'Status Cliente': 'Ativo',
      'Campanha': 'dezembro',
      'Tipo de OOH': 'Outdoor',
      'Status Campanha': 'Ativa',
      'Região': 'Sul',
      'Estado': 'PR',
      'Cidade': 'Pato Branco, PR',
      'Exibidora': 'Outdoor Publicidade',
      'URL logo exibidora': '',
      'Mês de exibição': 'Novembro',
      'Início da campanha': '17/11',
      'Término da campanha': '25/12',
      'Impactos Total': '388528',
      'Investimento': 'R$ 3.840,00',
      'Mídia Coin': '27428.57',
      '(NOTA) Bonificação': '9',
      '(NOTA) Flexibilidade em Negociação': '9',
      '(NOTA) Atendimento': '9',
      '(NOTA) Processos ADM e FIN': '9'
    }
  ];
}

// Adicionar estilo para o CSS do spinner
const style = document.createElement('style');
style.textContent = `
  .status {
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85em;
  }
  
  .status.ativo {
    background: #c8e6c9;
    color: #2e7d32;
  }
  
  .status.inativo {
    background: #ffcdd2;
    color: #c62828;
  }
  
  .status.ativa {
    background: #c8e6c9;
    color: #2e7d32;
  }
  
  .status.inativa {
    background: #ffcdd2;
    color: #c62828;
  }
`;
document.head.appendChild(style);
