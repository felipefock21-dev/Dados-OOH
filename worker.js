/**
 * Cloudflare Worker para gerenciar dados OOH via Google Sheets API
 * Deploy: wrangler deploy
 */

const SHEETS_API_KEY = env.GOOGLE_SHEETS_API_KEY || '';
const SHEET_ID = env.GOOGLE_SHEETS_ID || '';
const SHEET_NAME = env.GOOGLE_SHEET_NAME || 'Sheet1';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Função para listar dados
async function getDados(env) {
  try {
    // Busca TODAS as linhas da planilha (até 100 mil linhas)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:Z?key=${env.GOOGLE_SHEETS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      return { dados: [], headers: [] };
    }

    const headers = data.values[0];
    const dados = data.values.slice(1).map((row, index) => {
      const obj = { _id: index };
      headers.forEach((header, idx) => {
        obj[header.trim()] = row[idx] || '';
      });
      return obj;
    });

    return { dados, headers };
  } catch (error) {
    throw new Error(`Erro ao buscar dados: ${error.message}`);
  }
}

// Função para adicionar registro
async function addDado(env, novoRegistro) {
  try {
    const { dados, headers } = await getDados(env);
    
    const novaLinha = headers.map(h => novoRegistro[h] || '');
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${env.GOOGLE_SHEETS_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [novaLinha] }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    return { sucesso: true, mensagem: 'Registro adicionado' };
  } catch (error) {
    throw new Error(`Erro ao adicionar: ${error.message}`);
  }
}

// Função para atualizar registro
async function updateDado(env, id, registroAtualizado) {
  try {
    const { dados, headers } = await getDados(env);
    
    if (id < 0 || id >= dados.length) {
      throw new Error('Registro não encontrado');
    }

    const linhaAtualizada = headers.map(h => registroAtualizado[h] || '');
    
    // Linha real na planilha (id + 2 porque linha 1 é cabeçalho)
    const linhaReal = id + 2;
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A${linhaReal}:T${linhaReal}?valueInputOption=USER_ENTERED&key=${env.GOOGLE_SHEETS_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [linhaAtualizada] }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    return { sucesso: true, mensagem: 'Registro atualizado' };
  } catch (error) {
    throw new Error(`Erro ao atualizar: ${error.message}`);
  }
}

// Função para deletar registro
async function deleteDado(env, id) {
  try {
    const { dados, headers } = await getDados(env);
    
    if (id < 0 || id >= dados.length) {
      throw new Error('Registro não encontrado');
    }

    const linhaReal = id + 2;
    const linhaVazia = new Array(headers.length).fill('');
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A${linhaReal}:T${linhaReal}?valueInputOption=USER_ENTERED&key=${env.GOOGLE_SHEETS_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [linhaVazia] }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    return { sucesso: true, mensagem: 'Registro deletado' };
  } catch (error) {
    throw new Error(`Erro ao deletar: ${error.message}`);
  }
}

// Handler principal
export default {
  async fetch(request, env) {
    // Lidar com OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // GET /api/dados - Listar todos
      if (pathname === '/api/dados' && request.method === 'GET') {
        const { dados } = await getDados(env);
        return new Response(JSON.stringify(dados), { headers: corsHeaders });
      }

      // GET /api/dados/:id - Obter um específico
      if (pathname.match(/^\/api\/dados\/\d+$/) && request.method === 'GET') {
        const id = parseInt(pathname.split('/').pop());
        const { dados } = await getDados(env);
        
        if (id < 0 || id >= dados.length) {
          return new Response(
            JSON.stringify({ erro: 'Registro não encontrado' }),
            { status: 404, headers: corsHeaders }
          );
        }

        return new Response(JSON.stringify(dados[id]), { headers: corsHeaders });
      }

      // POST /api/dados - Criar novo
      if (pathname === '/api/dados' && request.method === 'POST') {
        const novoRegistro = await request.json();
        const resultado = await addDado(env, novoRegistro);
        return new Response(JSON.stringify(resultado), { 
          status: 201, 
          headers: corsHeaders 
        });
      }

      // PUT /api/dados/:id - Atualizar
      if (pathname.match(/^\/api\/dados\/\d+$/) && request.method === 'PUT') {
        const id = parseInt(pathname.split('/').pop());
        const registroAtualizado = await request.json();
        const resultado = await updateDado(env, id, registroAtualizado);
        return new Response(JSON.stringify(resultado), { headers: corsHeaders });
      }

      // DELETE /api/dados/:id - Deletar
      if (pathname.match(/^\/api\/dados\/\d+$/) && request.method === 'DELETE') {
        const id = parseInt(pathname.split('/').pop());
        const resultado = await deleteDado(env, id);
        return new Response(JSON.stringify(resultado), { headers: corsHeaders });
      }

      // Health check
      if (pathname === '/api/health') {
        return new Response(
          JSON.stringify({ status: 'OK', timestamp: new Date() }),
          { headers: corsHeaders }
        );
      }

      // Servir frontend (se existir)
      return new Response(JSON.stringify({ erro: 'Rota não encontrada' }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ erro: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
