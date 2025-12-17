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
      if (response.status === 401) {
        mostrarErro('❌ Não autenticado. Redirecionando para autenticação...');
        setTimeout(() => {
          window.location.href = 'http://localhost:3001/auth';
        }, 2000);
        return;
      }
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }
    
    dados = await response.json();
    
    // Garantir que é um array
    if (!Array.isArray(dados)) {
      dados = [];
    }
    
    atualizarTabela();
    loadingSpinner.style.display = 'none';
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    mostrarErro('❌ Erro ao carregar dados. Verifique se o servidor está rodando em http://localhost:3001');
    dados = [];
    atualizarTabela();
    loadingSpinner.style.display = 'none';
  }
}

function atualizarTabela() {
  tabelaDadosBody.innerHTML = '';
  
  // Obter clientes únicos
  const clientesUnicos = {};
  dados.forEach((registro) => {
    const cliente = registro['Cliente'] || '-';
    if (!clientesUnicos[cliente]) {
      clientesUnicos[cliente] = {
        nome: cliente,
        status: registro['Status Cliente'],
        campanhas: 0,
        investimento: 0,
        registros: []
      };
    }
    clientesUnicos[cliente].campanhas += 1;
    
    const investimento = parseFloat(
      (registro['Investimento'] || 'R$ 0,00').replace(/[^\d,]/g, '').replace(',', '.')
    );
    clientesUnicos[cliente].investimento += isNaN(investimento) ? 0 : investimento;
    clientesUnicos[cliente].registros.push(registro);
  });
  
  const clientes = Object.values(clientesUnicos).sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );
  
  if (clientes.length === 0) {
    tabelaDadosBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Nenhum cliente encontrado</td></tr>';
    return;
  }
  
  clientes.forEach((cliente, index) => {
    const linha = document.createElement('tr');
    const investimentoFormatado = `R$ ${cliente.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    linha.innerHTML = `
      <td><strong>${cliente.nome}</strong></td>
      <td><span class="status ${cliente.status.toLowerCase()}">${cliente.status}</span></td>
      <td>${cliente.campanhas}</td>
      <td>${investimentoFormatado}</td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="abrirModalEditar('${cliente.nome}')">✏️ Editar</button>
          <button class="btn-delete" onclick="confirmarDeletar('${cliente.nome}')">🗑️ Deletar</button>
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

function abrirModalEditar(nomeCliente) {
  registroEmEdicao = nomeCliente;
  
  // Encontrar primeiro registro do cliente
  const primeiroRegistro = dados.find(d => d['Cliente'] === nomeCliente);
  
  if (!primeiroRegistro) {
    mostrarErro('Cliente não encontrado');
    return;
  }
  
  document.getElementById('modalTitulo').textContent = 'Editar Cliente: ' + nomeCliente;
  
  // Preencher formulário com dados do primeiro registro
  Object.keys(primeiroRegistro).forEach(chave => {
    const elemento = document.querySelector(`[name="${chave}"]`);
    if (elemento) {
      elemento.value = primeiroRegistro[chave];
    }
  });
  
  modal.classList.add('active');
}

function fecharModal() {
  modal.classList.remove('active');
  registroEmEdicao = null;
  formulario.reset();
}

function confirmarDeletar(nomeCliente) {
  document.getElementById('msgConfirmacao').textContent = 
    `Tem certeza que deseja deletar TODOS os registros do cliente "${nomeCliente}"? Esta ação não pode ser desfeita.`;
  
  btnConfirmarDelete.onclick = () => deletarCliente(nomeCliente);
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

async function deletarCliente(nomeCliente) {
  try {
    // Encontrar todos os índices deste cliente
    const indicesParaDeletar = dados
      .map((d, idx) => d['Cliente'] === nomeCliente ? idx : -1)
      .filter(idx => idx !== -1)
      .sort((a, b) => b - a); // Ordenar em reverso para não quebrar índices
    
    // Deletar cada registro
    for (const idx of indicesParaDeletar) {
      const response = await fetch(`${API_BASE}/dados/${idx}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao deletar registro');
      }
    }
    
    // Atualizar dados locais
    dados = dados.filter(d => d['Cliente'] !== nomeCliente);
    
    atualizarTabela();
    modalConfirmacao.classList.remove('active');
    mostrarSucesso(`Cliente "${nomeCliente}" deletado com sucesso!`);
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    mostrarErro(error.message || 'Erro ao deletar cliente');
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
