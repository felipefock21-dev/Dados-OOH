import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const TOKEN_FILE = path.join(process.cwd(), '.token.json');

// Middleware
app.use(cors());
app.use(express.json());

// Carregar token salvo se existir
let accessToken = null;
if (fs.existsSync(TOKEN_FILE)) {
  try {
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    accessToken = tokenData.access_token;
  } catch (e) {
    console.log('Token inválido ou corrompido');
  }
}

// Configurar Google Sheets API
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:${PORT}/oauth2callback`
);

const sheets = google.sheets({ version: 'v4', auth });

// OAuth callback
app.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await auth.getToken(code);
    
    accessToken = tokens.access_token;
    auth.setCredentials(tokens);
    
    // Salvar token em arquivo
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    
    res.send('✓ Autenticação bem-sucedida! Você pode fechar esta janela.');
  } catch (error) {
    console.error('Erro OAuth:', error);
    res.status(500).send(`Erro na autenticação: ${error.message}`);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Rota de autenticação
app.get('/auth', (req, res) => {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  res.redirect(authUrl);
});

// GET /api/dados - Listar todos
app.get('/api/dados', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(401).json({ erro: 'Não autenticado. Acesse http://localhost:3001/auth primeiro.' });
    }
    
    // Se tem token, configura as credenciais
    auth.setCredentials({ access_token: accessToken });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `'${process.env.GOOGLE_SHEET_NAME}'!A:AE`,
    });

    const values = response.data.values || [];
    
    if (values.length === 0) {
      return res.json([]);
    }

    const headers = values[0];
    const dados = values.slice(1).map((row, index) => {
      const obj = { _id: index };
      headers.forEach((header, idx) => {
        obj[header.trim()] = row[idx] || '';
      });
      return obj;
    });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/dados/:id - Obter um específico
app.get('/api/dados/:id', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }

    auth.setCredentials({ access_token: accessToken });
    
    const id = parseInt(req.params.id);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `'${process.env.GOOGLE_SHEET_NAME}'!A:AE`,
    });

    const values = response.data.values || [];
    const headers = values[0];
    
    if (id < 0 || id >= values.length - 1) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    const row = values[id + 1];
    const obj = { _id: id };
    headers.forEach((header, idx) => {
      obj[header.trim()] = row[idx] || '';
    });

    res.json(obj);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/dados - Criar novo
app.post('/api/dados', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }

    auth.setCredentials({ access_token: accessToken });
    
    const novoRegistro = req.body;

    // Buscar headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `'${process.env.GOOGLE_SHEET_NAME}'!A1:AE1`,
    });

    const headers = response.data.values?.[0] || [];
    const novaLinha = headers.map(h => novoRegistro[h.trim()] || '');

    // Adicionar nova linha
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${process.env.GOOGLE_SHEET_NAME}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [novaLinha] },
    });

    res.status(201).json({ sucesso: true, mensagem: 'Registro adicionado' });
  } catch (error) {
    console.error('Erro ao criar:', error);
    res.status(500).json({ erro: error.message });
  }
});

// PUT /api/dados/:id - Atualizar
app.put('/api/dados/:id', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }

    auth.setCredentials({ access_token: accessToken });
    
    const id = parseInt(req.params.id);
    const registroAtualizado = req.body;

    // Buscar headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `'${process.env.GOOGLE_SHEET_NAME}'!A:AE`,
    });

    const values = response.data.values || [];
    const headers = values[0];

    if (id < 0 || id >= values.length - 1) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    const linhaAtualizada = headers.map(h => registroAtualizado[h.trim()] || '');
    const linhaReal = id + 2; // +2 porque linha 1 é cabeçalho

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `'${process.env.GOOGLE_SHEET_NAME}'!A${linhaReal}:AE${linhaReal}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [linhaAtualizada] },
    });

    res.json({ sucesso: true, mensagem: 'Registro atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    res.status(500).json({ erro: error.message });
  }
});

// DELETE /api/dados/:id - Deletar
app.delete('/api/dados/:id', async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }

    auth.setCredentials({ access_token: accessToken });
    
    const id = parseInt(req.params.id);

    // Buscar headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `'${process.env.GOOGLE_SHEET_NAME}'!A:AE`,
    });

    const values = response.data.values || [];
    const headers = values[0];

    if (id < 0 || id >= values.length - 1) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    const linhaVazia = new Array(headers.length).fill('');
    const linhaReal = id + 2;

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `'${process.env.GOOGLE_SHEET_NAME}'!A${linhaReal}:AE${linhaReal}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [linhaVazia] },
    });

    res.json({ sucesso: true, mensagem: 'Registro deletado' });
  } catch (error) {
    console.error('Erro ao deletar:', error);
    res.status(500).json({ erro: error.message });
  }
});

// Iniciar servidor
app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✓ Servidor rodando em http://localhost:${PORT}`);
  console.log(`\n📝 Para autenticar com Google Sheets, acesse:`);
  console.log(`   http://localhost:${PORT}/auth\n`);
});
