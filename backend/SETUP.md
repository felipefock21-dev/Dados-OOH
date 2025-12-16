# 🔐 Configurar Google OAuth 2.0

## Passo 1: Criar Credenciais no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto (ou use um existente)
3. Ative a **Google Sheets API** (APIs & Services → Library → Google Sheets API → Enable)
4. Vá em **APIs & Services → Credentials**
5. Clique em **Create Credentials → OAuth 2.0 Client ID**
6. Escolha **Desktop application** (ou Web application se preferir)
7. Adicione redirect URI: `http://localhost:3001/oauth2callback`
8. Copie o **Client ID** e **Client Secret**

## Passo 2: Configurar .env

Edite `backend/.env` e adicione:

```
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_SHEETS_ID=1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4
GOOGLE_SHEET_NAME=Sheet1
PORT=3001
```

## Passo 3: Iniciar o servidor

```bash
cd backend
npm start
```

## Passo 4: Autenticar

1. Abra o navegador em: `http://localhost:3001/auth`
2. Faça login com sua conta Google
3. Autorize o acesso à planilha
4. Pronto! Agora pode usar o CRUD

## Passo 5: Usar a API

```bash
# Listar todos os dados
curl http://localhost:3001/api/dados

# Criar novo registro
curl -X POST http://localhost:3001/api/dados \
  -H "Content-Type: application/json" \
  -d '{"Cliente":"Novo Cliente","Campanha":"Fev 2025"...}'

# Editar registro
curl -X PUT http://localhost:3001/api/dados/0 \
  -H "Content-Type: application/json" \
  -d '{"Cliente":"Cliente Atualizado"...}'

# Deletar registro
curl -X DELETE http://localhost:3001/api/dados/0
```

## Frontend

O `script.js` já está configurado para usar `http://localhost:3001/api` automaticamente.
